import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { COLORS } from '../utils/constants';
import {
  scanForPrinters,
  connectToPrinter,
  disconnectPrinter,
  isBluetoothEnabled,
  getActivePrinter,
} from '../utils/printer';

export default function BluetoothStatus({
  onPrinterSelected,
  translations,
  style,
}) {
  const [isScanning, setIsScanning] = useState(false);
  const [printers, setPrinters] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [bluetoothEnabled, setBluetoothEnabled] = useState(true);
  const [checkingBluetooth, setCheckingBluetooth] = useState(false);
  const [error, setError] = useState(null);

  const t = translations || {};

  // Check Bluetooth status
  const checkBluetoothStatus = useCallback(async () => {
    if (checkingBluetooth) return;

    setCheckingBluetooth(true);
    try {
      const enabled = await isBluetoothEnabled();
      setBluetoothEnabled(enabled);
      setError(null);

      // If Bluetooth was turned off while connected, disconnect
      if (!enabled && isConnected) {
        setIsConnected(false);
        setSelectedPrinter(null);
        setError('Bluetooth was disabled');
      }
    } catch (err) {
      console.error('Bluetooth check error:', err);
      setError('Failed to check Bluetooth status');
    } finally {
      setCheckingBluetooth(false);
    }
  }, [isConnected, checkingBluetooth]);

  // Periodic Bluetooth check
  useEffect(() => {
    checkBluetoothStatus();
    const interval = setInterval(checkBluetoothStatus, 5000);
    return () => clearInterval(interval);
  }, [checkBluetoothStatus]);

  // Scan for printers
  const handleScanPrinters = useCallback(async () => {
    setIsScanning(true);
    setError(null);
    setPrinters([]);

    if (!isConnected) {
      setSelectedPrinter(null);
    }

    try {
      const result = await scanForPrinters();

      if (!result.permissionGranted) {
        setError('Bluetooth permission required');
        Alert.alert(
          'Permission Required',
          'Please grant Bluetooth permissions in app settings.'
        );
        setIsScanning(false);
        return;
      }

      setBluetoothEnabled(result.bluetoothEnabled);

      if (!result.bluetoothEnabled) {
        setError('Bluetooth is disabled');
        Alert.alert('Bluetooth Disabled', 'Please enable Bluetooth to scan for printers.');
        setIsScanning(false);
        return;
      }

      if (result.error) {
        setError('Scan failed');
        Alert.alert('Scan Error', 'Unable to scan for printers. Please try again.');
        setIsScanning(false);
        return;
      }

      const printerList = result.printers || [];
      setPrinters(printerList);
      setError(null);

      if (printerList.length > 0) {
        Alert.alert(
          'Printers Found',
          `Found ${printerList.length} printer(s). Tap to connect.`
        );
      } else {
        setError('No printers found');
        Alert.alert(
          'No Printers Found',
          'Make sure your printer is on and in pairing mode.'
        );
      }
    } catch (err) {
      console.error('Scan error:', err);
      setError('Scan error occurred');
      Alert.alert('Scan Error', 'Failed to scan for printers.');
    } finally {
      setIsScanning(false);
    }
  }, [isConnected]);

  // Connect to printer
  const handleConnectPrinter = useCallback(
    async (printer) => {
      setIsConnecting(true);
      setSelectedPrinter(printer);
      setError(null);

      try {
        const connected = await connectToPrinter(printer);

        if (connected) {
          setIsConnected(true);
          setSelectedPrinter(connected);
          setError(null);

          if (onPrinterSelected) {
            onPrinterSelected(connected);
          }

          Alert.alert('Success', `Connected to ${connected.name}`);
        } else {
          setSelectedPrinter(null);
          setError('Failed to connect');
          Alert.alert('Connection Failed', 'Unable to connect to printer.');
        }
      } catch (err) {
        console.error('Connection error:', err);
        setSelectedPrinter(null);
        setError(err.message || 'Connection failed');
        Alert.alert(
          'Connection Failed',
          err.message || 'Unable to connect to printer. Try again.'
        );
      } finally {
        setIsConnecting(false);
      }
    },
    [onPrinterSelected]
  );

  // Disconnect from printer
  const handleDisconnect = useCallback(async () => {
    try {
      await disconnectPrinter();
      setIsConnected(false);
      setSelectedPrinter(null);
      setError(null);
      Alert.alert('Disconnected', 'Printer disconnected successfully.');
    } catch (err) {
      console.error('Disconnect error:', err);
      setError('Disconnect failed');
      Alert.alert('Error', 'Failed to disconnect printer.');
    }
  }, []);

  // Get status color and text
  const getStatusColor = () => {
    if (!bluetoothEnabled) return COLORS.error;
    if (isConnected) return COLORS.success;
    if (isConnecting) return COLORS.primary;
    return COLORS.textLight;
  };

  const getStatusText = () => {
    if (!bluetoothEnabled) {
      return '📵 Bluetooth is OFF';
    }
    if (isConnected && selectedPrinter) {
      return `✅ Connected: ${selectedPrinter.name}`;
    }
    if (isConnecting) {
      return '🔄 Connecting...';
    }
    return '⚪ No Printer Connected';
  };

  return (
    <View style={[styles.container, style]}>
      {/* Status Header */}
      <View style={styles.statusHeader}>
        <View style={styles.statusInfo}>
          <View
            style={[styles.statusDot, { backgroundColor: getStatusColor() }]}
          />
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>

        {isConnected && (
          <TouchableOpacity
            style={styles.disconnectButton}
            onPress={handleDisconnect}
          >
            <Text style={styles.disconnectButtonText}>Disconnect</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}

      {/* Scan Controls */}
      {!isConnected && (
        <View style={styles.scanControls}>
          {!bluetoothEnabled ? (
            <View style={styles.bluetoothOffContainer}>
              <Text style={styles.bluetoothOffText}>
                📱 Please enable Bluetooth to scan for printers
              </Text>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={checkBluetoothStatus}
                disabled={checkingBluetooth}
              >
                <Text style={styles.refreshButtonText}>
                  {checkingBluetooth ? '⟳ Checking...' : '🔄 Check Again'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.scanButton, isScanning && styles.scanButtonDisabled]}
              onPress={handleScanPrinters}
              disabled={isScanning}
            >
              {isScanning ? (
                <>
                  <ActivityIndicator
                    size="small"
                    color={COLORS.surface}
                    style={styles.spinner}
                  />
                  <Text style={styles.scanButtonText}>Scanning...</Text>
                </>
              ) : (
                <Text style={styles.scanButtonText}>🔍 Scan for Printers</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Printer List */}
      {printers.length > 0 && (
        <View style={styles.printerList}>
          <Text style={styles.printerListTitle}>Available Printers:</Text>
          {printers.map((printer, index) => (
            <TouchableOpacity
              key={printer.address || index}
              style={[
                styles.printerItem,
                selectedPrinter?.address === printer.address &&
                  styles.selectedPrinter,
              ]}
              onPress={() => handleConnectPrinter(printer)}
              disabled={isConnecting}
            >
              <View style={styles.printerInfo}>
                <Text style={styles.printerName}>
                  {printer.name || 'Unknown Printer'}
                </Text>
                <Text style={styles.printerAddress}>
                  {printer.address || 'Unknown Address'}
                </Text>
              </View>

              {isConnecting && selectedPrinter?.address === printer.address ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Text style={styles.connectText}>Connect</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  disconnectButton: {
    backgroundColor: COLORS.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  disconnectButtonText: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: COLORS.error + '15',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.error,
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 13,
    color: COLORS.error,
    fontWeight: '500',
  },
  scanControls: {
    marginBottom: 12,
  },
  scanButton: {
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  scanButtonDisabled: {
    backgroundColor: COLORS.primary + '80',
  },
  scanButtonText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: '600',
  },
  spinner: {
    marginRight: 8,
  },
  bluetoothOffContainer: {
    padding: 16,
    backgroundColor: COLORS.error + '10',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.error,
    alignItems: 'center',
  },
  bluetoothOffText: {
    fontSize: 14,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '600',
  },
  refreshButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  refreshButtonText: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  printerList: {
    marginTop: 8,
  },
  printerListTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  printerItem: {
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
  selectedPrinter: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  printerInfo: {
    flex: 1,
  },
  printerName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  printerAddress: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  connectText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
});