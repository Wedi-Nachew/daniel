import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { format } from 'date-fns';
import {
  BluetoothManager,
  BluetoothEscposPrinter,
} from 'react-native-bluetooth-escpos-printer';
import {
  loadSavedPrinter,
  saveSavedPrinter,
  clearSavedPrinter,
} from './storage';

// Using react-native-bluetooth-escpos-printer
// This library supports Bluetooth ESC/POS printers

const ESC_POS_OPTIONS = { encoding: 'UTF-8' };

let activePrinter = null;

const normalizePrinter = (printer = {}) => {
  if (!printer) {
    return {
      id: null,
      name: 'Unknown Printer',
      address: null,
      type: 'bluetooth',
      raw: printer,
    };
  }

  const address =
    printer.address ||
    printer.macAddress ||
    printer.deviceAddress ||
    printer.target ||
    printer.inner_mac_address ||
    printer.id ||
    null;

  const name =
    printer.name ||
    printer.device_name ||
    printer.deviceName ||
    printer.model ||
    'Unknown Printer';

  return {
    id: printer.id || address || printer.serialNumber || null,
    name,
    address,
    type: 'bluetooth',
    raw: printer,
  };
};

const toBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  if (typeof value === 'number') return value === 1;
  return false;
};

const ensureBluetoothEnabled = async () => {
  const enabled = await BluetoothManager.isBluetoothEnabled();
  if (enabled) {
    return true;
  }

  try {
    await BluetoothManager.enableBluetooth();
    return true;
  } catch (error) {
    console.warn('Enable Bluetooth failed:', error);
    return false;
  }
};

const parseScanResult = (result) => {
  if (!result) return [];

  let data = result;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch (error) {
      console.warn('Failed to parse scan result:', error);
      return [];
    }
  }

  const found = Array.isArray(data.found) ? data.found : [];
  const paired = Array.isArray(data.paired) ? data.paired : [];
  return [...found, ...paired];
};

export const getActivePrinter = () => activePrinter;

export const isBluetoothEnabled = async () => {
  try {
    const enabled = await BluetoothManager.isBluetoothEnabled();
    return toBoolean(enabled);
  } catch (error) {
    console.warn('Bluetooth check failed:', error);
    return false;
  }
};

export const requestBluetoothPermissions = async () => {
  if (Platform.OS === 'android') {
    try {
      const apiLevel = Platform.Version;
      
      if (apiLevel >= 31) {
        // Android 12+
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        
        return (
          granted['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED
        );
      } else {
        // Android 11 and below
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADMIN,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        
        return (
          granted['android.permission.BLUETOOTH'] === PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.BLUETOOTH_ADMIN'] === PermissionsAndroid.RESULTS.GRANTED
        );
      }
    } catch (err) {
      console.warn('Permission error:', err);
      return false;
    }
  }
  return true; // iOS doesn't need runtime permissions
};

/**
 * Scan for Bluetooth printers
 */
export const scanForPrinters = async () => {
  const baseResult = {
    printers: [],
    bluetoothEnabled: true,
    permissionGranted: true,
    error: null,
  };

  try {
    // Check permissions first
    const hasPermission = await requestBluetoothPermissions();
    if (!hasPermission) {
      return { ...baseResult, permissionGranted: false };
    }

    const bluetoothOn = await ensureBluetoothEnabled();
    if (!bluetoothOn) {
      return { ...baseResult, bluetoothEnabled: false };
    }

    const devicesRaw = await BluetoothManager.scanDevices();
    const devices = parseScanResult(devicesRaw);
    const normalized = devices
      .map((device) => normalizePrinter(device))
      .filter((printer) => !!printer.address);

    const seen = new Set();
    const uniquePrinters = [];

    for (const printer of normalized) {
      if (!seen.has(printer.address)) {
        seen.add(printer.address);
        uniquePrinters.push(printer);
      }
    }

    console.log('Found printers:', uniquePrinters);

    return { ...baseResult, printers: uniquePrinters };
  } catch (error) {
    console.error('Scan error:', error);
    return { ...baseResult, error };
  }
};

/**
 * Connect to a Bluetooth printer
 */
export const connectToPrinter = async (printer) => {
  try {
    const normalized = normalizePrinter(printer);

    if (!normalized.address) {
      Alert.alert('Error', 'Invalid printer selected');
      return null;
    }

    const bluetoothOn = await ensureBluetoothEnabled();
    if (!bluetoothOn) {
      Alert.alert('Bluetooth Disabled', 'Please enable Bluetooth to connect to the printer.');
      return null;
    }

    await BluetoothManager.connect(normalized.address);
    await BluetoothEscposPrinter.printerInit();

    activePrinter = normalized;
    await saveSavedPrinter(activePrinter);

    console.log('Connected to printer:', normalized.name);
    
    return activePrinter;
  } catch (error) {
    console.error('Connection error:', error);
    Alert.alert('Connection Error', 'Unable to connect to printer. Please try again.');
    return null;
  }
};

/**
 * Disconnect from current printer
 */
export const disconnectPrinter = async () => {
  try {
    await BluetoothManager.disconnect();
    console.log('Disconnected from printer');
    activePrinter = null;
    await clearSavedPrinter();
    return true;
  } catch (error) {
    console.error('Disconnect error:', error);
    return false;
  }
};

export const autoConnectSavedPrinter = async () => {
  try {
    const saved = await loadSavedPrinter();

    if (!saved) {
      return { connected: false, reason: 'no_saved_printer' };
    }

    const bluetoothOn = await ensureBluetoothEnabled();
    if (!bluetoothOn) {
      return { connected: false, reason: 'bluetooth_disabled', printer: saved };
    }

    const connected = await connectToPrinter(saved);
    if (connected) {
      return { connected: true, printer: connected };
    }

    await clearSavedPrinter();
    return { connected: false, reason: 'failed_to_connect' };
  } catch (error) {
    console.error('Auto-connect error:', error);
    return { connected: false, reason: 'error', error };
  }
};

const ensurePrinterConnection = async () => {
  if (activePrinter) {
    return true;
  }

  const result = await autoConnectSavedPrinter();
  return result.connected;
};

/**
 * Print a receipt to the connected Bluetooth printer
 */
export const printReceipt = async (receipt, business, isCopy = false) => {
  try {
    const isConnected = await ensurePrinterConnection();
    if (!isConnected) {
      Alert.alert('Print Error', 'No printer connected. Please connect to a printer first.');
      return false;
    }

    const formattedDate = format(new Date(receipt.date), 'MM/dd/yyyy HH:mm');

    await BluetoothEscposPrinter.printerInit();

    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
    await BluetoothEscposPrinter.printText(`${business.name || 'Mill House'}\n`, ESC_POS_OPTIONS);
    if (business.phone) {
      await BluetoothEscposPrinter.printText(`${business.phone}\n`, ESC_POS_OPTIONS);
    }
    if (business.address) {
      await BluetoothEscposPrinter.printText(`${business.address}\n`, ESC_POS_OPTIONS);
    }
    await BluetoothEscposPrinter.printText('==============================\n', ESC_POS_OPTIONS);

    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
    await BluetoothEscposPrinter.printText(`Receipt #: ${receipt.id.slice(-8)}\n`, ESC_POS_OPTIONS);
    await BluetoothEscposPrinter.printText(`Date: ${formattedDate}\n`, ESC_POS_OPTIONS);
    await BluetoothEscposPrinter.printText('------------------------------\n', ESC_POS_OPTIONS);

    if (isCopy) {
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
      await BluetoothEscposPrinter.printText('*** COPY / ቅጂ ***\n', ESC_POS_OPTIONS);
      await BluetoothEscposPrinter.printText('------------------------------\n', ESC_POS_OPTIONS);
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
    }

    for (const item of receipt.lines) {
      const itemName = (item.name || '').slice(0, 24);
      await BluetoothEscposPrinter.printText(`${itemName}\n`, ESC_POS_OPTIONS);
      await BluetoothEscposPrinter.printText(`  ${item.qty} x ${item.price}    ${item.total}\n`, ESC_POS_OPTIONS);
    }

    await BluetoothEscposPrinter.printText('==============================\n', ESC_POS_OPTIONS);
    await BluetoothEscposPrinter.printText(`Total: ${receipt.total}\n`, { ...ESC_POS_OPTIONS, fonttype: 1 });

    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
    await BluetoothEscposPrinter.printText('==============================\n', ESC_POS_OPTIONS);
    await BluetoothEscposPrinter.printText('Thank you! / የቐንየለይ!\n\n\n', ESC_POS_OPTIONS);

    await BluetoothEscposPrinter.printAndFeed(2);

    console.log('Receipt printed successfully');

    return true;
  } catch (error) {
    console.error('Print error:', error);
    Alert.alert('Print Error', 'Failed to print receipt. Please check printer connection.');
    return false;
  }
};

export const printTestPage = async (business = {}) => {
  try {
    const isConnected = await ensurePrinterConnection();
    if (!isConnected) {
      Alert.alert('Test Print Failed', 'Connect to a printer before printing a test page.');
      return false;
    }

    const now = format(new Date(), 'MM/dd/yyyy HH:mm');
    const printer = activePrinter || (await loadSavedPrinter());

    await BluetoothEscposPrinter.printerInit();

    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
    await BluetoothEscposPrinter.printText(`${business.name || 'Mill Receipt Pro'}\n`, ESC_POS_OPTIONS);
    await BluetoothEscposPrinter.printText('==============================\n', ESC_POS_OPTIONS);
    await BluetoothEscposPrinter.printText('Bluetooth Test Print\n', ESC_POS_OPTIONS);
    await BluetoothEscposPrinter.printText(`${now}\n`, ESC_POS_OPTIONS);
    await BluetoothEscposPrinter.printText('------------------------------\n', ESC_POS_OPTIONS);

    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
    await BluetoothEscposPrinter.printText(`Printer: ${printer?.name || 'Unknown'}\n`, ESC_POS_OPTIONS);
    await BluetoothEscposPrinter.printText(`Address: ${printer?.address || 'N/A'}\n`, ESC_POS_OPTIONS);
    await BluetoothEscposPrinter.printText('Status: CONNECTION VERIFIED\n', ESC_POS_OPTIONS);

    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
    await BluetoothEscposPrinter.printText('==============================\n', ESC_POS_OPTIONS);
    await BluetoothEscposPrinter.printText('Thank you!\n\n', ESC_POS_OPTIONS);

    await BluetoothEscposPrinter.printAndFeed(2);
    return true;
  } catch (error) {
    console.error('Test print error:', error);
    Alert.alert('Test Print Failed', 'Unable to print test page.');
    return false;
  }
};