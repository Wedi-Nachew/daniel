import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { format } from 'date-fns';
import {
  loadSavedPrinter,
  saveSavedPrinter,
  clearSavedPrinter,
} from './storage';

// Platform-specific Bluetooth module
let BluetoothManager;
let BluetoothEscposPrinter;

try {
  if (Platform.OS === 'android' || Platform.OS === 'ios') {
    const printerModule = require('react-native-bluetooth-escpos-printer');
    BluetoothManager = printerModule.BluetoothManager;
    BluetoothEscposPrinter = printerModule.BluetoothEscposPrinter;
  }
} catch (error) {
  console.warn('Bluetooth module not available:', error.message);
}

// ESC/POS encoding
const ESC = '\x1B';
const ESC_POS_OPTIONS = { encoding: 'UTF-8' };

let activePrinter = null;
let connectionTimeout = null;

// ============================================
// UTILITY FUNCTIONS
// ============================================

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

const clearConnectionTimeout = () => {
  if (connectionTimeout) {
    clearTimeout(connectionTimeout);
    connectionTimeout = null;
  }
};

// ============================================
// BLUETOOTH STATUS
// ============================================

export const getActivePrinter = () => activePrinter;

export const isBluetoothEnabled = async () => {
  try {
    if (!BluetoothManager) {
      console.warn('BluetoothManager not available');
      return false;
    }
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
          granted['android.permission.BLUETOOTH_SCAN'] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.BLUETOOTH_CONNECT'] ===
            PermissionsAndroid.RESULTS.GRANTED
        );
      } else {
        // Android 11 and below
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADMIN,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);

        return (
          granted['android.permission.BLUETOOTH'] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.BLUETOOTH_ADMIN'] ===
            PermissionsAndroid.RESULTS.GRANTED
        );
      }
    } catch (err) {
      console.warn('Permission error:', err);
      return false;
    }
  }
  return true; // iOS doesn't need runtime permissions
};

const ensureBluetoothEnabled = async () => {
  try {
    if (!BluetoothManager) {
      console.warn('BluetoothManager not available');
      return false;
    }

    const enabled = await BluetoothManager.isBluetoothEnabled();
    if (toBoolean(enabled)) {
      return true;
    }

    try {
      await BluetoothManager.enableBluetooth();
      return true;
    } catch (error) {
      console.warn('Enable Bluetooth failed:', error);
      return false;
    }
  } catch (error) {
    console.warn('Bluetooth check error:', error);
    return false;
  }
};

// ============================================
// SCANNING
// ============================================

export const scanForPrinters = async () => {
  const baseResult = {
    printers: [],
    bluetoothEnabled: true,
    permissionGranted: true,
    error: null,
  };

  try {
    if (!BluetoothManager) {
      return { ...baseResult, error: new Error('BluetoothManager not available') };
    }

    // Check permissions
    const hasPermission = await requestBluetoothPermissions();
    if (!hasPermission) {
      return { ...baseResult, permissionGranted: false };
    }

    // Ensure Bluetooth is on
    const bluetoothOn = await ensureBluetoothEnabled();
    if (!bluetoothOn) {
      return { ...baseResult, bluetoothEnabled: false };
    }

    // Scan for devices
    const devicesRaw = await BluetoothManager.scanDevices();
    const devices = parseScanResult(devicesRaw);
    const normalized = devices
      .map((device) => normalizePrinter(device))
      .filter((printer) => !!printer.address);

    // Remove duplicates
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

// ============================================
// CONNECTION MANAGEMENT
// ============================================

export const connectToPrinter = async (printer) => {
  clearConnectionTimeout();

  try {
    if (!BluetoothManager || !BluetoothEscposPrinter) {
      throw new Error('Bluetooth modules not available');
    }

    const normalized = normalizePrinter(printer);

    if (!normalized.address) {
      throw new Error('Invalid printer selected');
    }

    // Ensure Bluetooth is on
    const bluetoothOn = await ensureBluetoothEnabled();
    if (!bluetoothOn) {
      throw new Error('Bluetooth is disabled');
    }

    // Set connection timeout
    const connectPromise = BluetoothManager.connect(normalized.address);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Connection timeout')), 10000)
    );

    await Promise.race([connectPromise, timeoutPromise]);
    await BluetoothEscposPrinter.printerInit();

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
    if (!BluetoothManager) {
      return false;
    }

    await BluetoothManager.disconnect();
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

// ============================================
// PRINTING FUNCTIONS
// ============================================

const escapeText = (text) => {
  if (!text) return '';
  // Remove special characters that could break ESC/POS
  return String(text).replace(/[^\x20-\x7E]/g, '?');
};

const formatLineItem = (item) => {
  const maxNameLen = 24;
  const name = escapeText(item.name).slice(0, maxNameLen).padEnd(maxNameLen);
  const qty = escapeText(item.qty);
  const price = escapeText(item.price);
  const total = escapeText(item.total);
  return `${name}\n  ${qty} x ${price}    ${total}\n`;
};

export const printReceipt = async (receipt, business, isCopy = false) => {
  try {
    if (!BluetoothEscposPrinter) {
      throw new Error('Printer module not available');
    }

    const isConnected = await ensurePrinterConnection();
    if (!isConnected) {
      throw new Error('No printer connected');
    }

    const formattedDate = format(new Date(receipt.date), 'MM/dd/yyyy HH:mm');
    const businessName = escapeText(business.name || 'Receipt');

    // Initialize printer
    await BluetoothEscposPrinter.printerInit();

    // Header
    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
    await BluetoothEscposPrinter.printText(`${businessName}\n`, ESC_POS_OPTIONS);

    if (business.phone) {
      await BluetoothEscposPrinter.printText(
        `${escapeText(business.phone)}\n`,
        ESC_POS_OPTIONS
      );
    }

    if (business.address) {
      await BluetoothEscposPrinter.printText(
        `${escapeText(business.address)}\n`,
        ESC_POS_OPTIONS
      );
    }

    await BluetoothEscposPrinter.printText('==============================\n', ESC_POS_OPTIONS);

    // Receipt info
    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
    await BluetoothEscposPrinter.printText(
      `Receipt #: ${receipt.id.slice(-8)}\n`,
      ESC_POS_OPTIONS
    );
    await BluetoothEscposPrinter.printText(`Date: ${formattedDate}\n`, ESC_POS_OPTIONS);
    await BluetoothEscposPrinter.printText('------------------------------\n', ESC_POS_OPTIONS);

    // Copy indicator
    if (isCopy) {
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
      await BluetoothEscposPrinter.printText('*** COPY ***\n', ESC_POS_OPTIONS);
      await BluetoothEscposPrinter.printText('------------------------------\n', ESC_POS_OPTIONS);
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
    }

    // Line items
    if (receipt.lines && Array.isArray(receipt.lines)) {
      for (const item of receipt.lines) {
        await BluetoothEscposPrinter.printText(
          formatLineItem(item),
          ESC_POS_OPTIONS
        );
      }
    }

    // Total
    await BluetoothEscposPrinter.printText('==============================\n', ESC_POS_OPTIONS);
    await BluetoothEscposPrinter.printText(
      `Total: ${escapeText(receipt.total)}\n`,
      { ...ESC_POS_OPTIONS, fonttype: 1 }
    );

    // Footer
    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
    await BluetoothEscposPrinter.printText('==============================\n', ESC_POS_OPTIONS);
    await BluetoothEscposPrinter.printText('Thank you!\n\n\n', ESC_POS_OPTIONS);

    await BluetoothEscposPrinter.printAndFeed(2);

    console.log('Receipt printed successfully');
    return true;
  } catch (error) {
    console.error('Print error:', error);
    throw error;
  }
};

export const printTestPage = async (business = {}) => {
  try {
    if (!BluetoothEscposPrinter) {
      throw new Error('Printer module not available');
    }

    const isConnected = await ensurePrinterConnection();
    if (!isConnected) {
      throw new Error('No printer connected');
    }

    const now = format(new Date(), 'MM/dd/yyyy HH:mm');
    const printer = activePrinter || (await loadSavedPrinter());

    await BluetoothEscposPrinter.printerInit();

    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
    await BluetoothEscposPrinter.printText(
      `${escapeText(business.name || 'Mill Receipt Pro')}\n`,
      ESC_POS_OPTIONS
    );
    await BluetoothEscposPrinter.printText('==============================\n', ESC_POS_OPTIONS);
    await BluetoothEscposPrinter.printText('Bluetooth Test Print\n', ESC_POS_OPTIONS);
    await BluetoothEscposPrinter.printText(`${now}\n`, ESC_POS_OPTIONS);
    await BluetoothEscposPrinter.printText('------------------------------\n', ESC_POS_OPTIONS);

    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
    await BluetoothEscposPrinter.printText(
      `Printer: ${escapeText(printer?.name || 'Unknown')}\n`,
      ESC_POS_OPTIONS
    );
    await BluetoothEscposPrinter.printText(
      `Address: ${escapeText(printer?.address || 'N/A')}\n`,
      ESC_POS_OPTIONS
    );
    await BluetoothEscposPrinter.printText('Status: CONNECTION VERIFIED\n', ESC_POS_OPTIONS);

    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
    await BluetoothEscposPrinter.printText('==============================\n', ESC_POS_OPTIONS);
    await BluetoothEscposPrinter.printText('Thank you!\n\n', ESC_POS_OPTIONS);

    await BluetoothEscposPrinter.printAndFeed(2);
    return true;
  } catch (error) {
    console.error('Test print error:', error);
    throw error;
  }
};