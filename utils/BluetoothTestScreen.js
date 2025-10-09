import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { COLORS } from '../utils/constants';
import {
  requestBluetoothPermissions,
  isBluetoothEnabled,
  scanForPrinters,
  connectToPrinter,
  disconnectPrinter,
  diagnoseBluetooth,
} from '../utils/printer';

export default function BluetoothTestScreen() {
  const [permissionStatus, setPermissionStatus] = useState('unknown');
  const [bluetoothStatus, setBluetoothStatus] = useState('unknown');
  const [devices, setDevices] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [logs, setLogs] = useState([]);

  const addLog = (message) => {
    setLogs((prev) => [message, ...prev.slice(0, 49)]);
    console.log(message);
  };

  const testPermissions = async () => {
    addLog('📋 Testing permissions...');
    try {
      const result = await requestBluetoothPermissions();
      setPermissionStatus(result ? 'granted' : 'denied');
      addLog(result ? '✅ Permissions granted' : '❌ Permissions denied');
    } catch (error) {
      setPermissionStatus('error');
      addLog(`❌ Permission error: ${error.message}`);
    }
  };

  const testBluetooth = async () => {
    addLog('📡 Checking Bluetooth status...');
    try {
      const enabled = await isBluetoothEnabled();
      setBluetoothStatus(enabled ? 'enabled' : 'disabled');
      addLog(enabled ? '✅ Bluetooth is enabled' : '❌ Bluetooth is disabled');
    } catch (error) {
      setBluetoothStatus('error');
      addLog(`❌ Bluetooth error: ${error.message}`);
    }
  };

  const testScan = async () => {
    addLog('🔍 Starting device scan...');
    setScanning(true);
    try {
      const result = await scanForPrinters();
      
      if (result.error) {
        addLog(`❌ Scan error: ${result.error}`);
      } else if (!result.permissionGranted) {
        addLog('❌ Permissions not granted for scan');
      } else if (!result.bluetoothEnabled) {
        addLog('❌ Bluetooth not enabled');
      } else {
        addLog(`✅ Found ${result.printers.length} device(s)`);
        result.printers.forEach((device, idx) => {
          addLog(`  ${idx + 1}. ${device.name} [${device.deviceType}] @ ${device.address}`);
        });
        setDevices(result.printers);
      }
    } catch (error) {
      addLog(`❌ Scan exception: ${error.message}`);
    } finally {
      setScanning(false);
    }
  };

  const testConnect = async (device) => {
    addLog(`🔗 Connecting to ${device.name}...`);
    setConnecting(true);
    try {
      const result = await connectToPrinter(device);
      addLog(`✅ Connected to ${result.name}`);
      setConnectedDevice(result);
    } catch (error) {
      addLog(`❌ Connection failed: ${error.message}`);
    } finally {
      setConnecting(false);
    }
  };

  const testDisconnect = async () => {
    addLog('🔌 Disconnecting...');
    try {
      await disconnectPrinter();
      addLog('✅ Disconnected');
      setConnectedDevice(null);
    } catch (error) {
      addLog(`❌ Disconnect failed: ${error.message}`);
    }
  };

  const runDiagnostics = async () => {
    addLog('🔧 Running comprehensive diagnostics...');
    try {
      const diagnostics = await diagnoseBluetooth();
      addLog(`📊 Found ${diagnostics.issues.length} issues`);
      diagnostics.issues.forEach(issue => addLog(`❌ ${issue}`));
      diagnostics.recommendations.forEach(rec => addLog(`💡 ${rec}`));

      if (diagnostics.issues.length === 0) {
        addLog('✅ All diagnostics passed!');
      }
    } catch (error) {
      addLog(`❌ Diagnostics failed: ${error.message}`);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🔵 Bluetooth Diagnostic</Text>
          <Text style={styles.subtitle}>Test each step manually</Text>
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={runDiagnostics}
          >
            <Text style={[styles.buttonText, { color: COLORS.primary }]}>🔧 Run Diagnostics</Text>
          </TouchableOpacity>
        </View>

        {/* Test Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Step 1: Permissions</Text>
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary]}
            onPress={testPermissions}
          >
            <Text style={styles.buttonText}>Request Permissions</Text>
          </TouchableOpacity>
          <View
            style={[
              styles.statusBadge,
              permissionStatus === 'granted' && styles.statusSuccess,
              permissionStatus === 'denied' && styles.statusError,
            ]}
          >
            <Text style={styles.statusText}>
              {permissionStatus === 'granted' ? '✅ Granted' : permissionStatus === 'denied' ? '❌ Denied' : '⏳ Unknown'}
            </Text>
          </View>
        </View>

        {/* Step 2 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Step 2: Bluetooth Status</Text>
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary]}
            onPress={testBluetooth}
          >
            <Text style={styles.buttonText}>Check Bluetooth</Text>
          </TouchableOpacity>
          <View
            style={[
              styles.statusBadge,
              bluetoothStatus === 'enabled' && styles.statusSuccess,
              bluetoothStatus === 'disabled' && styles.statusError,
            ]}
          >
            <Text style={styles.statusText}>
              {bluetoothStatus === 'enabled' ? '✅ Enabled' : bluetoothStatus === 'disabled' ? '❌ Disabled' : '⏳ Unknown'}
            </Text>
          </View>
        </View>

        {/* Step 3 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Step 3: Scan Devices</Text>
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary, scanning && styles.buttonDisabled]}
            onPress={testScan}
            disabled={scanning}
          >
            {scanning ? (
              <>
                <ActivityIndicator size="small" color={COLORS.surface} style={styles.spinner} />
                <Text style={styles.buttonText}>Scanning...</Text>
              </>
            ) : (
              <Text style={styles.buttonText}>Scan for Devices</Text>
            )}
          </TouchableOpacity>

          {devices.length > 0 && (
            <View style={styles.deviceList}>
              <Text style={styles.deviceListTitle}>Found {devices.length} Device(s):</Text>
              {devices.map((device, idx) => (
                <TouchableOpacity
                  key={device.address}
                  style={[
                    styles.deviceItem,
                    connectedDevice?.address === device.address && styles.deviceItemConnected,
                  ]}
                  onPress={() => testConnect(device)}
                  disabled={connecting}
                >
                  <View style={styles.deviceInfo}>
                    <Text style={styles.deviceName}>{device.name}</Text>
                    <Text style={styles.deviceType}>[{device.deviceType}]</Text>
                    <Text style={styles.deviceAddress}>{device.address}</Text>
                  </View>
                  {connecting && connectedDevice?.address === device.address ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : (
                    <Text style={styles.deviceAction}>→</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Step 4 */}
        {connectedDevice && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Step 4: Connected Device</Text>
            <View style={styles.connectedBox}>
              <Text style={styles.connectedTitle}>✅ Connected to:</Text>
              <Text style={styles.connectedName}>{connectedDevice.name}</Text>
              <Text style={styles.connectedType}>[{connectedDevice.deviceType}]</Text>
              <Text style={styles.connectedAddress}>{connectedDevice.address}</Text>
            </View>
            <TouchableOpacity
              style={[styles.button, styles.buttonDanger]}
              onPress={testDisconnect}
            >
              <Text style={styles.buttonText}>Disconnect</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Logs */}
        <View style={styles.section}>
          <View style={styles.logsHeader}>
            <Text style={styles.sectionTitle}>Logs</Text>
            <TouchableOpacity style={styles.clearButton} onPress={clearLogs}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.logBox}>
            {logs.length === 0 ? (
              <Text style={styles.logEmpty}>Logs will appear here...</Text>
            ) : (
              logs.map((log, idx) => (
                <Text key={idx} style={styles.logLine}>
                  {log}
                </Text>
              ))
            )}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  section: {
    marginBottom: 20,
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: 12,
  },
  buttonPrimary: {
    backgroundColor: COLORS.primary,
  },
  buttonDanger: {
    backgroundColor: COLORS.error,
  },
  buttonSecondary: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: '600',
  },
  spinner: {
    marginRight: 8,
  },
  statusBadge: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  statusSuccess: {
    backgroundColor: '#10B98130',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.success,
  },
  statusError: {
    backgroundColor: '#EF444430',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.error,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  deviceList: {
    marginTop: 12,
  },
  deviceListTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textLight,
    marginBottom: 8,
  },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  deviceItemConnected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  deviceType: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 2,
  },
  deviceAddress: {
    fontSize: 11,
    color: COLORS.textLight,
    fontFamily: 'monospace',
  },
  deviceAction: {
    fontSize: 18,
    color: COLORS.primary,
    marginLeft: 12,
  },
  connectedBox: {
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
    marginBottom: 12,
  },
  connectedTitle: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  connectedName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  connectedType: {
    fontSize: 12,
    color: COLORS.primary,
    marginBottom: 4,
  },
  connectedAddress: {
    fontSize: 11,
    color: COLORS.textLight,
    fontFamily: 'monospace',
  },
  logsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clearButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: COLORS.background,
    borderRadius: 6,
  },
  clearButtonText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  logBox: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    maxHeight: 300,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  logLine: {
    fontSize: 11,
    color: COLORS.text,
    fontFamily: 'monospace',
    marginBottom: 4,
    lineHeight: 16,
  },
  logEmpty: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: 'center',
    paddingVertical: 20,
  },
});