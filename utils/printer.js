import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { format } from 'date-fns';
import {
  BLEPrinter,
  BluetoothManager,
} from '@conodene/react-native-thermal-receipt-printer-image-qr';
import {
  loadSavedPrinter,
  saveSavedPrinter,
  clearSavedPrinter,
} from './storage';

let bleInitialized = false;
let activePrinter = null;
let connectionTimeout = null;

export const getModuleStatus = () => ({
  available: !!BluetoothManager && !!BLEPrinter,
  message: !!BluetoothManager && !!BLEPrinter
    ? 'Thermal printer module ready'
    : 'Thermal printer module not available. Ensure react-native-thermal-receipt-printer-image-qr is installed and linked.',
});

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
    printer.inner_mac_address ||
    printer.address ||
    printer.target ||
    printer.macAddress ||
    printer.id ||
    null;

  const name =
    printer.device_name ||
    printer.name ||
    printer.deviceName ||
    printer.model ||
    'Unknown Printer';

  return {
    id: printer.id || address || printer.target || printer.inner_mac_address || null,
    name,
    address,
    type: 'bluetooth',
    raw: printer,
  };
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

const ensureBleInitialized = async () => {
  if (bleInitialized) {
    return true;
  }

  if (!BLEPrinter || !BLEPrinter.init) {
    throw new Error('BLEPrinter module is not available');
  }

  try {
    await BLEPrinter.init();
    bleInitialized = true;
    return true;
  } catch (error) {
    bleInitialized = false;
    throw error;
  }
};

const toBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return ['true', '1', 'on', 'enabled', 'yes'].includes(normalized);
  }

  return false;
};

const requestBluetoothPermissions = async () => {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    const apiLevel = Platform.Version;

    if (apiLevel >= 31) {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);

      return (
        granted['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
        granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED
      );
    }

    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADMIN,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ]);

    return (
      granted['android.permission.BLUETOOTH'] === PermissionsAndroid.RESULTS.GRANTED &&
      granted['android.permission.BLUETOOTH_ADMIN'] === PermissionsAndroid.RESULTS.GRANTED
    );
  } catch (error) {
    console.warn('Permission error:', error);
    return false;
  }
};

const clearConnectionTimeout = () => {
  if (connectionTimeout) {
    clearTimeout(connectionTimeout);
    connectionTimeout = null;
  }
};

export const getActivePrinter = () => activePrinter;

export const isBluetoothEnabled = async () => {
  try {
    const permissionGranted = await requestBluetoothPermissions();
    if (!permissionGranted) {
      console.warn('Bluetooth permission not granted.');
      return false;
    }

    const enabled = await BluetoothManager.isBluetoothEnabled();
    return toBoolean(enabled);
  } catch (error) {
    console.warn('Bluetooth check failed:', error);

    if (
      error &&
      typeof error.message === 'string' &&
      error.message.includes('android.permission.BLUETOOTH_CONNECT')
    ) {
      try {
        const granted = await requestBluetoothPermissions();
        if (granted) {
          const enabled = await BluetoothManager.isBluetoothEnabled();
          return toBoolean(enabled);
        }
      } catch (retryError) {
        console.warn('Bluetooth retry failed:', retryError);
      }
    }

    return false;
  }
};

const ensureBluetoothEnabled = async () => {
  try {
    const permissionGranted = await requestBluetoothPermissions();
    if (!permissionGranted) {
      console.warn('Bluetooth permissions not granted while ensuring Bluetooth status.');
      return false;
    }

    const enabled = await BluetoothManager.isBluetoothEnabled();
    const isOn = toBoolean(enabled);

    if (isOn) return true;

    // 🚫 On Android 12+, enableBluetooth() no longer works silently.
    // Let the user manually turn it on via prompt instead.
    if (Platform.OS === 'android') {
      Alert.alert(
        'Bluetooth Disabled',
        'Please enable Bluetooth from quick settings and try again.'
      );
    }

    return false;
  } catch (error) {
    console.warn('Bluetooth check error:', error);
    return false;
  }
};

export const scanForPrinters = async () => {
  const baseResult = {
    printers: [],
    bluetoothEnabled: true,
    permissionGranted: true,
    error: null,
  };

  try {
    const hasPermission = await requestBluetoothPermissions();
    if (!hasPermission) {
      return { ...baseResult, permissionGranted: false };
    }

    const enabled = await BluetoothManager.isBluetoothEnabled();
    const bluetoothOn = toBoolean(enabled);

    if (!bluetoothOn) {
      return { ...baseResult, bluetoothEnabled: false };
    }

    await ensureBleInitialized();

    const scanResult = await BluetoothManager.scanDevices();
    const devices = parseScanResult(scanResult);
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


export const connectToPrinter = async (printer) => {
  clearConnectionTimeout();

  try {
    const normalized = normalizePrinter(printer);

    if (!normalized.address) {
      throw new Error('Invalid printer selected');
    }

    const bluetoothOn = await ensureBluetoothEnabled();
    if (!bluetoothOn) {
      throw new Error('Bluetooth is disabled');
    }

    await ensureBleInitialized();

    const connectPromise = BLEPrinter.connectPrinter(normalized.address);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Connection timeout')), 10000)
    );

    await Promise.race([connectPromise, timeoutPromise]);

    activePrinter = normalized;
    await saveSavedPrinter(activePrinter);

    console.log('Connected to printer:', normalized.name);
    return activePrinter;
  } catch (error) {
    console.error('Connection error:', error);
    activePrinter = null;
    await clearSavedPrinter();
    throw error;
  } finally {
    clearConnectionTimeout();
  }
};

export const disconnectPrinter = async () => {
  clearConnectionTimeout();

  try {
    await BLEPrinter.closeConn();
    console.log('Disconnected from printer');
    activePrinter = null;
    await clearSavedPrinter();
    return true;
  } catch (error) {
    console.error('Disconnect error:', error);
    activePrinter = null;
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

const escapeText = (text) => {
  if (!text) return '';
  return String(text).replace(/[^\x20-\x7E\n]/g, '?').trim();
};

const formatLineItem = (item) => {
  const maxNameLen = 24;
  const name = escapeText(item.name || '').slice(0, maxNameLen).padEnd(maxNameLen);
  const qty = escapeText(String(item.qty || '0'));
  const price = escapeText(String(item.price || '0'));
  const total = escapeText(String(item.total || '0'));
  return `${name}\n  ${qty} x ${price}    ${total}`;
};

export const printReceipt = async (receipt, business, isCopy = false) => {
  try {
    const isConnected = await ensurePrinterConnection();
    if (!isConnected) {
      Alert.alert('Print Error', 'No printer connected. Please connect to a printer first.');
      return false;
    }

    const formattedDate = format(new Date(receipt.date), 'MM/dd/yyyy HH:mm');

    let receiptText = '';

    receiptText += `[C]<font size='big'>${escapeText(business.name || 'Mill House')}</font>\n`;
    if (business.phone) receiptText += `[C]${escapeText(business.phone)}\n`;
    if (business.address) receiptText += `[C]${escapeText(business.address)}\n`;
    receiptText += `[C]================================\n\n`;

    receiptText += `[L]Receipt #: ${escapeText((receipt.id || '').slice(-8))}\n`;
    receiptText +=(`[L]Date: ${formattedDate}\n`);
    receiptText += `[C]--------------------------------\n`;

    if (isCopy) {
      receiptText += `[C]<font size='big'>*** COPY ***</font>\n`;
      receiptText += `[C]--------------------------------\n`;
    }

    if (Array.isArray(receipt.lines)) {
      for (const item of receipt.lines) {
        receiptText += `[L]${escapeText(item.name || '')}\n`;
        receiptText += `[L]  ${escapeText(String(item.qty || '0'))} x ${escapeText(String(item.price || '0'))}    ${escapeText(String(item.total || '0'))}\n`;
      }
    }

    receiptText += `[C]================================\n`;
    receiptText += `[L]<font size='big'>Total: ${escapeText(String(receipt.total || '0'))}</font>\n`;
    receiptText += `[C]================================\n`;
    receiptText += `[C]Thank you!\n\n\n`;

    await BLEPrinter.printText(receiptText);
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

    let text = '';
    text += `[C]<font size='big'>${escapeText(business.name || 'Mill Receipt Pro')}</font>\n`;
    text += `[C]==============================\n`;
    text += `[C]Bluetooth Test Print\n`;
    text += `[C]${now}\n`;
    text += `[C]------------------------------\n`;
    text += `[L]Printer: ${escapeText(printer?.name || 'Unknown')}\n`;
    text +=(`[L]Address: ${escapeText(printer?.address || 'N/A')}\n`);
    text += `[L]Status: CONNECTION VERIFIED\n`;
    text += `[C]==============================\n`;
    text += `[C]Thank you!\n\n`;

    await BLEPrinter.printText(text);
    return true;
  } catch (error) {
    console.error('Test print error:', error);
    Alert.alert('Test Print Failed', 'Unable to print test page.');
    return false;
  }
};