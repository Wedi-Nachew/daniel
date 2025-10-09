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
let scanInProgress = false;

const DEBUG_MODE = true;

export const getModuleStatus = () => ({
  available: !!BluetoothManager && !!BLEPrinter,
  message: !!BluetoothManager && !!BLEPrinter
    ? 'Thermal printer module ready'
    : 'Thermal printer module not available',
});

const getDeviceType = (device) => {
  if (!device) return 'UNKNOWN';

  const deviceClass = device.device_class || device.class || device.deviceClass || 0;
  const name = (device.device_name || device.name || '').toLowerCase();

  // More permissive printer detection
  if (name.includes('print') || name.includes('thermal') || name.includes('receipt')) return 'PRINTER';
  if (name.includes('pos') || name.includes('cashier')) return 'PRINTER';
  if (name.includes('bluetooth') && (name.includes('printer') || deviceClass === 1664)) return 'PRINTER';

  if (name.includes('headphone') || name.includes('earbud') || name.includes('buds')) return 'AUDIO';
  if (name.includes('watch') || name.includes('wearable')) return 'WEARABLE';
  if (name.includes('speaker')) return 'SPEAKER';
  if (name.includes('phone') || name.includes('samsung')) return 'PHONE';

  return 'DEVICE';
};

const normalizeDevice = (device) => {
  if (!device) {
    return null;
  }

  const address =
    device.inner_mac_address ||
    device.address ||
    device.target ||
    device.macAddress ||
    device.id ||
    null;

  if (!address) {
    if (DEBUG_MODE) {
      console.log('[DEBUG] Device has no address, skipping:', JSON.stringify(device));
    }
    return null;
  }

  const name =
    device.device_name ||
    device.name ||
    device.deviceName ||
    device.model ||
    'Unknown Device';

  const deviceType = getDeviceType(device);

  return {
    id: device.id || address,
    name,
    address,
    type: 'bluetooth',
    deviceType,
    deviceClass: device.device_class || device.class || device.deviceClass || null,
    raw: device,
  };
};

const parseScanResult = (result) => {
  if (!result) {
    if (DEBUG_MODE) {
      console.log('[DEBUG] Scan result is empty');
    }
    return [];
  }

  let data = result;

  // Handle string response
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
      if (DEBUG_MODE) {
        console.log('[DEBUG] Parsed JSON from string');
      }
    } catch (error) {
      console.warn('[DEBUG] Failed to parse JSON:', error);
      return [];
    }
  }

  // Handle array response
  if (Array.isArray(data)) {
    if (DEBUG_MODE) {
      console.log('[DEBUG] Scan result is array with', data.length, 'items');
    }
    return data;
  }

  // Handle object response with found/paired properties
  if (typeof data === 'object' && data !== null) {
    const found = Array.isArray(data.found) ? data.found : [];
    const paired = Array.isArray(data.paired) ? data.paired : [];
    
    if (DEBUG_MODE) {
      console.log('[DEBUG] Scan result object - Found:', found.length, 'Paired:', paired.length);
    }
    
    return [...found, ...paired];
  }

  if (DEBUG_MODE) {
    console.log('[DEBUG] Unknown scan result type:', typeof data);
  }

  return [];
};

const ensureBleInitialized = async () => {
  if (bleInitialized) {
    if (DEBUG_MODE) {
      console.log('[DEBUG] BLE already initialized');
    }
    return true;
  }

  if (!BLEPrinter || !BLEPrinter.init) {
    console.error('[ERROR] BLEPrinter module is not available');
    throw new Error('BLEPrinter module is not available. Please check if the library is properly installed and linked.');
  }

  try {
    if (DEBUG_MODE) {
      console.log('[DEBUG] Initializing BLEPrinter...');
    }
    await BLEPrinter.init();
    bleInitialized = true;
    if (DEBUG_MODE) {
      console.log('[DEBUG] BLEPrinter initialized successfully');
    }
    return true;
  } catch (error) {
    bleInitialized = false;
    console.error('[ERROR] BLEPrinter init failed:', error.message);
    if (DEBUG_MODE) {
      console.log('[DEBUG] BLEPrinter init error:', error.message);
    }
    throw new Error(`Failed to initialize Bluetooth printer: ${error.message}`);
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

// CRITICAL: This function MUST request permissions with Alert.alert
export const requestBluetoothPermissions = async () => {
  if (Platform.OS !== 'android') {
    if (DEBUG_MODE) {
      console.log('[DEBUG] Non-Android platform');
    }
    return true;
  }

  try {
    const apiLevel = Platform.Version;
    if (DEBUG_MODE) {
      console.log('[DEBUG] Android API Level:', apiLevel);
    }

    if (apiLevel >= 31) {
      // Android 12+: Need BLUETOOTH_SCAN and BLUETOOTH_CONNECT
      if (DEBUG_MODE) {
        console.log('[DEBUG] Android 12+ - Requesting BLUETOOTH_SCAN, BLUETOOTH_CONNECT, LOCATION');
      }

      const result = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);

      if (DEBUG_MODE) {
        console.log('[DEBUG] Permission results:', result);
        console.log('[DEBUG] BLUETOOTH_SCAN:', result['android.permission.BLUETOOTH_SCAN']);
        console.log('[DEBUG] BLUETOOTH_CONNECT:', result['android.permission.BLUETOOTH_CONNECT']);
        console.log('[DEBUG] ACCESS_FINE_LOCATION:', result['android.permission.ACCESS_FINE_LOCATION']);
      }

      const scanGranted = result['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED;
      const connectGranted = result['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED;

      if (!scanGranted || !connectGranted) {
        if (DEBUG_MODE) {
          console.log('[DEBUG] Bluetooth permissions DENIED');
        }
        Alert.alert(
          'Bluetooth Permissions Required',
          'This app needs Bluetooth permissions to scan and connect to devices. Please enable them in Settings → Apps → Permissions.'
        );
        return false;
      }

      if (DEBUG_MODE) {
        console.log('[DEBUG] Bluetooth permissions GRANTED');
      }
      return true;
    } else {
      // Android 11 and below
      if (DEBUG_MODE) {
        console.log('[DEBUG] Android 11 and below - Requesting BLUETOOTH, BLUETOOTH_ADMIN, LOCATION');
      }

      const result = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADMIN,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);

      if (DEBUG_MODE) {
        console.log('[DEBUG] Permission results:', result);
        console.log('[DEBUG] BLUETOOTH:', result['android.permission.BLUETOOTH']);
        console.log('[DEBUG] BLUETOOTH_ADMIN:', result['android.permission.BLUETOOTH_ADMIN']);
        console.log('[DEBUG] ACCESS_FINE_LOCATION:', result['android.permission.ACCESS_FINE_LOCATION']);
      }

      const bluetoothGranted = result['android.permission.BLUETOOTH'] === PermissionsAndroid.RESULTS.GRANTED;
      const adminGranted = result['android.permission.BLUETOOTH_ADMIN'] === PermissionsAndroid.RESULTS.GRANTED;

      if (!bluetoothGranted || !adminGranted) {
        if (DEBUG_MODE) {
          console.log('[DEBUG] Bluetooth permissions DENIED');
        }
        Alert.alert(
          'Bluetooth Permissions Required',
          'This app needs Bluetooth permissions to scan and connect to devices. Please enable them in Settings → Apps → Permissions.'
        );
        return false;
      }

      if (DEBUG_MODE) {
        console.log('[DEBUG] Bluetooth permissions GRANTED');
      }
      return true;
    }
  } catch (error) {
    console.error('[DEBUG] Permission request error:', error);
    return false;
  }
};

// Diagnostic function to help identify issues
export const diagnoseBluetooth = async () => {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    platform: Platform.OS,
    reactNativeVersion: require('react-native').version || 'unknown',
    issues: [],
    recommendations: []
  };

  try {
    // Check if modules are available
    if (!BluetoothManager) {
      diagnostics.issues.push('BluetoothManager not available');
      diagnostics.recommendations.push('Check if @conodene/react-native-thermal-receipt-printer-image-qr is properly installed');
    }

    if (!BLEPrinter) {
      diagnostics.issues.push('BLEPrinter not available');
      diagnostics.recommendations.push('Check if @conodene/react-native-thermal-receipt-printer-image-qr is properly installed');
    }

    // Check Bluetooth status
    try {
      const btEnabled = await isBluetoothEnabled();
      if (!btEnabled) {
        diagnostics.issues.push('Bluetooth is disabled');
        diagnostics.recommendations.push('Enable Bluetooth in device settings');
      }
    } catch (error) {
      diagnostics.issues.push(`Bluetooth status check failed: ${error.message}`);
    }

    // Check permissions
    try {
      const permGranted = await requestBluetoothPermissions();
      if (!permGranted) {
        diagnostics.issues.push('Bluetooth permissions not granted');
        diagnostics.recommendations.push('Grant Bluetooth permissions in app settings');
      }
    } catch (error) {
      diagnostics.issues.push(`Permission check failed: ${error.message}`);
    }

    // Check BLE initialization
    try {
      await ensureBleInitialized();
    } catch (error) {
      diagnostics.issues.push(`BLE initialization failed: ${error.message}`);
      diagnostics.recommendations.push('Check if device supports BLE or if library is compatible');
    }

  } catch (error) {
    diagnostics.issues.push(`Diagnostic error: ${error.message}`);
  }

  console.log('[DIAGNOSTIC]', JSON.stringify(diagnostics, null, 2));
  return diagnostics;
};

export const isBluetoothEnabled = async () => {
  try {
    if (DEBUG_MODE) {
      console.log('[DEBUG] Checking if Bluetooth is enabled...');
    }

    if (!BluetoothManager) {
      if (DEBUG_MODE) {
        console.log('[DEBUG] BluetoothManager not available');
      }
      return false;
    }

    const enabled = await BluetoothManager.isBluetoothEnabled();
    const result = toBoolean(enabled);

    if (DEBUG_MODE) {
      console.log('[DEBUG] Bluetooth enabled:', result, '| Raw value:', enabled);
    }

    return result;
  } catch (error) {
    if (DEBUG_MODE) {
      console.log('[DEBUG] Error checking Bluetooth:', error.message);
    }
    return false;
  }
};

export const scanForPrinters = async () => {
  if (DEBUG_MODE) {
    console.log('\n[DEBUG] ========================================');
    console.log('[DEBUG]      SCAN FOR PRINTERS START');
    console.log('[DEBUG] ========================================');
  }

  if (scanInProgress) {
    if (DEBUG_MODE) {
      console.log('[DEBUG] Scan already in progress - rejecting');
    }
    return {
      printers: [],
      bluetoothEnabled: true,
      permissionGranted: true,
      error: 'Scan already in progress',
    };
  }

  scanInProgress = true;

  const baseResult = {
    printers: [],
    bluetoothEnabled: true,
    permissionGranted: true,
    error: null,
  };

  try {
    // STEP 1: Request Permissions (this will show dialog to user)
    if (DEBUG_MODE) {
      console.log('[DEBUG] STEP 1: Requesting Bluetooth permissions...');
    }
    
    const permGranted = await requestBluetoothPermissions();
    if (!permGranted) {
      if (DEBUG_MODE) {
        console.log('[DEBUG] User denied Bluetooth permissions');
      }
      scanInProgress = false;
      return { ...baseResult, permissionGranted: false, error: 'Permissions denied' };
    }

    if (DEBUG_MODE) {
      console.log('[DEBUG] ✓ Permissions granted');
    }

    // STEP 2: Check if Bluetooth is enabled
    if (DEBUG_MODE) {
      console.log('[DEBUG] STEP 2: Checking if Bluetooth is enabled...');
    }

    const btEnabled = await isBluetoothEnabled();
    if (!btEnabled) {
      if (DEBUG_MODE) {
        console.log('[DEBUG] Bluetooth is OFF');
      }
      scanInProgress = false;
      Alert.alert(
        'Bluetooth Disabled',
        'Please enable Bluetooth in your device settings and try again.'
      );
      return { ...baseResult, bluetoothEnabled: false, error: 'Bluetooth is disabled' };
    }

    if (DEBUG_MODE) {
      console.log('[DEBUG] ✓ Bluetooth is enabled');
    }

    // STEP 3: Initialize BLE
    if (DEBUG_MODE) {
      console.log('[DEBUG] STEP 3: Initializing BLE...');
    }

    await ensureBleInitialized();

    if (DEBUG_MODE) {
      console.log('[DEBUG] ✓ BLE initialized');
    }

    // STEP 4: Perform scan
    if (DEBUG_MODE) {
      console.log('[DEBUG] STEP 4: Starting device scan (10 second timeout)...');
    }

    let scanResult;
    try {
      const scanPromise = BluetoothManager.scanDevices();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Scan timeout - no devices found within 10 seconds')), 10000)
      );

      scanResult = await Promise.race([scanPromise, timeoutPromise]);
      if (DEBUG_MODE) {
        console.log('[DEBUG] ✓ Scan completed');
      }
    } catch (scanError) {
      if (DEBUG_MODE) {
        console.log('[DEBUG] Scan error:', scanError.message);
      }
      scanInProgress = false;

      // Provide more specific error messages
      let errorMessage = 'Failed to scan for Bluetooth devices.';
      if (scanError.message.includes('timeout')) {
        errorMessage += ' Try moving closer to the printer or check if the printer is in pairing mode.';
      } else if (scanError.message.includes('permission')) {
        errorMessage += ' Please check Bluetooth permissions.';
      } else {
        errorMessage += ' ' + scanError.message;
      }

      Alert.alert('Scan Failed', errorMessage);
      return { ...baseResult, error: scanError.message };
    }

    // STEP 5: Parse results
    if (DEBUG_MODE) {
      console.log('[DEBUG] STEP 5: Parsing scan results...');
      console.log('[DEBUG] Raw scan result type:', typeof scanResult);
      console.log('[DEBUG] Raw scan result:', JSON.stringify(scanResult, null, 2));
    }

    const devices = parseScanResult(scanResult);

    if (DEBUG_MODE) {
      console.log('[DEBUG] Parsed devices count:', devices.length);
      devices.forEach((device, idx) => {
        console.log(`[DEBUG] Raw Device ${idx}:`, JSON.stringify(device, null, 2));
      });
    }

    // STEP 6: Normalize devices
    if (DEBUG_MODE) {
      console.log('[DEBUG] STEP 6: Normalizing devices...');
    }

    const normalized = devices
      .map((device) => normalizeDevice(device))
      .filter((device) => device !== null);

    if (DEBUG_MODE) {
      console.log('[DEBUG] Normalized devices count:', normalized.length);
      normalized.forEach((device, idx) => {
        console.log(`[DEBUG] Device ${idx}: ${device.name} [${device.deviceType}] @ ${device.address}`);
      });
    }

    // STEP 7: Deduplicate
    if (DEBUG_MODE) {
      console.log('[DEBUG] STEP 7: Deduplicating devices...');
    }

    const seen = new Set();
    const uniqueDevices = [];

    for (const device of normalized) {
      if (!seen.has(device.address)) {
        seen.add(device.address);
        uniqueDevices.push(device);
      }
    }

    if (DEBUG_MODE) {
      console.log('[DEBUG] Unique devices:', uniqueDevices.length);
      uniqueDevices.forEach((device, idx) => {
        console.log(`[DEBUG] ${idx + 1}. ${device.name} [${device.deviceType}]`);
        console.log(`       Address: ${device.address}`);
      });
      console.log('[DEBUG] ========================================');
      console.log('[DEBUG]      SCAN FOR PRINTERS END');
      console.log('[DEBUG] ========================================\n');
    }

    scanInProgress = false;
    return { ...baseResult, printers: uniqueDevices };
  } catch (error) {
    console.error('[DEBUG] Unexpected scan error:', error);
    if (DEBUG_MODE) {
      console.log('[DEBUG] Error stack:', error.stack);
      console.log('[DEBUG] ========================================');
      console.log('[DEBUG]      SCAN FOR PRINTERS END (ERROR)');
      console.log('[DEBUG] ========================================\n');
    }
    scanInProgress = false;
    return { ...baseResult, error: error.message || 'Unknown error' };
  }
};

export const connectToPrinter = async (printer) => {
  if (DEBUG_MODE) {
    console.log('\n[DEBUG] ========================================');
    console.log('[DEBUG]      CONNECT TO PRINTER START');
    console.log('[DEBUG] ========================================');
    console.log('[DEBUG] Device:', JSON.stringify(printer, null, 2));
  }

  clearConnectionTimeout();

  try {
    const normalized = normalizeDevice(printer);

    if (!normalized || !normalized.address) {
      if (DEBUG_MODE) {
        console.log('[DEBUG] ERROR: Invalid device or no address');
      }
      throw new Error('Invalid device - no address found');
    }

    if (DEBUG_MODE) {
      console.log(`[DEBUG] Connecting to: ${normalized.name} (${normalized.deviceType}) @ ${normalized.address}`);
    }

    // Check Bluetooth
    const btEnabled = await isBluetoothEnabled();
    if (!btEnabled) {
      if (DEBUG_MODE) {
        console.log('[DEBUG] Bluetooth is not enabled');
      }
      throw new Error('Bluetooth is disabled');
    }

    // Initialize BLE
    await ensureBleInitialized();

    // Connect with timeout
    if (DEBUG_MODE) {
      console.log('[DEBUG] Attempting connection (10 second timeout)...');
    }

    const connectPromise = BLEPrinter.connectPrinter(normalized.address);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Connection timeout - unable to connect to printer within 10 seconds')), 10000)
    );

    await Promise.race([connectPromise, timeoutPromise]);

    // Save
    activePrinter = normalized;
    await saveSavedPrinter(activePrinter);

    if (DEBUG_MODE) {
      console.log(`[DEBUG] ✓ Successfully connected to: ${normalized.name}`);
      console.log('[DEBUG] ========================================');
      console.log('[DEBUG]      CONNECT TO PRINTER END');
      console.log('[DEBUG] ========================================\n');
    }

    return activePrinter;
  } catch (error) {
    if (DEBUG_MODE) {
      console.log('[DEBUG] Connection failed:', error.message);
      console.log('[DEBUG] ========================================');
      console.log('[DEBUG]      CONNECT TO PRINTER END (ERROR)');
      console.log('[DEBUG] ========================================\n');
    }
    activePrinter = null;
    await clearSavedPrinter();
    throw error;
  }
};

export const disconnectPrinter = async () => {
  if (DEBUG_MODE) {
    console.log('[DEBUG] Disconnecting printer...');
  }

  clearConnectionTimeout();

  try {
    if (BLEPrinter && BLEPrinter.closeConn) {
      await BLEPrinter.closeConn();
    }
    if (DEBUG_MODE) {
      console.log('[DEBUG] ✓ Disconnected from printer');
    }
    activePrinter = null;
    await clearSavedPrinter();
    return true;
  } catch (error) {
    if (DEBUG_MODE) {
      console.log('[DEBUG] Disconnect error:', error.message);
    }
    activePrinter = null;
    return false;
  }
};

export const autoConnectSavedPrinter = async () => {
  try {
    const saved = await loadSavedPrinter();

    if (!saved) {
      if (DEBUG_MODE) {
        console.log('[DEBUG] No saved printer found');
      }
      return { connected: false, reason: 'no_saved_printer' };
    }

    if (DEBUG_MODE) {
      console.log('[DEBUG] Found saved printer:', saved.name);
    }

    const connected = await connectToPrinter(saved);
    if (connected) {
      return { connected: true, printer: connected };
    }

    await clearSavedPrinter();
    return { connected: false, reason: 'failed_to_connect' };
  } catch (error) {
    if (DEBUG_MODE) {
      console.log('[DEBUG] Auto-connect error:', error.message);
    }
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

const clearConnectionTimeout = () => {
  if (connectionTimeout) {
    clearTimeout(connectionTimeout);
    connectionTimeout = null;
  }
};

const escapeText = (text) => {
  if (!text) return '';
  return String(text).replace(/[^\x20-\x7E\n]/g, '?').trim();
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
    receiptText += `[L]Date: ${formattedDate}\n`;
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

    if (!BLEPrinter || !BLEPrinter.printText) {
      throw new Error('BLEPrinter.printText not available');
    }

    await BLEPrinter.printText(receiptText);
    if (DEBUG_MODE) {
      console.log('[DEBUG] Receipt printed successfully');
    }
    return true;
  } catch (error) {
    console.error('Print error:', error);
    Alert.alert('Print Error', error.message || 'Failed to print receipt.');
    return false;
  }
};

export const getActivePrinter = () => {
  return activePrinter;
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
    text += `[L]Address: ${escapeText(printer?.address || 'N/A')}\n`;
    text += `[L]Status: CONNECTION VERIFIED\n`;
    text += `[C]==============================\n`;
    text += `[C]Thank you!\n\n`;

    if (!BLEPrinter || !BLEPrinter.printText) {
      throw new Error('BLEPrinter.printText not available');
    }

    await BLEPrinter.printText(text);
    if (DEBUG_MODE) {
      console.log('[DEBUG] Test page printed successfully');
    }
    return true;
  } catch (error) {
    console.error('Test print error:', error);
    Alert.alert('Test Print Failed', error.message || 'Unable to print test page.');
    return false;
  }
};