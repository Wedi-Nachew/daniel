import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { COLORS } from '../../utils/constants';
import { BLEPrinter } from 'react-native-thermal-receipt-printer-image-qr';

const DEBUG = false;

const requestBluetoothPermissions = async () => {
  if (Platform.OS !== 'android') return true;
  const api = Platform.Version;
  try {
    if (api >= 31) {
      const result = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
      return (
        result['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
        result['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED
      );
    } else {
      const result = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADMIN,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
      return (
        result['android.permission.BLUETOOTH'] === PermissionsAndroid.RESULTS.GRANTED &&
        result['android.permission.BLUETOOTH_ADMIN'] === PermissionsAndroid.RESULTS.GRANTED
      );
    }
  } catch (e) {
    return false;
  }
};

const normalizeDevice = (device) => {
  if (!device) return null;
  const address =
    device.inner_mac_address || device.address || device.target || device.macAddress || device.id || null;
  if (!address) return null;
  const name = device.device_name || device.name || device.deviceName || device.model || 'Unknown Device';
  return { id: device.id || address, name, address, raw: device };
};

export default function PrinterFinder({ onConnected, onDisconnected, translations }) {
  const t = translations || {};
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState([]);
  const [selected, setSelected] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [bluetoothEnabled, setBluetoothEnabled] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        await BLEPrinter.init();
      } catch (e) {
        // ignore; some devices need Bluetooth on before init
      }
    })();
  }, []);

  const scan = useCallback(async () => {
    setIsScanning(true);
    setError(null);
    setDevices([]);
    try {
      const granted = await requestBluetoothPermissions();
      if (!granted) {
        Alert.alert(t.permissionRequired || 'Permission Required', t.grantBluetooth || 'Grant Bluetooth permissions to scan.');
        setError('Permissions denied');
        return;
      }
      try {
        await BLEPrinter.init();
        setBluetoothEnabled(true);
      } catch (e) {
        setBluetoothEnabled(false);
        Alert.alert(t.bluetoothDisabled || 'Bluetooth Disabled', t.enableBluetoothToScan || 'Please enable Bluetooth to scan for devices.');
        return;
      }
      let result;
      if (BLEPrinter && typeof BLEPrinter.scanDevices === 'function') {
        result = await BLEPrinter.scanDevices();
      } else if (BLEPrinter && typeof BLEPrinter.getDeviceList === 'function') {
        result = await BLEPrinter.getDeviceList();
      } else {
        throw new Error('Scan not supported by printer module');
      }
      let list = [];
      if (typeof result === 'string') {
        try {
          const parsed = JSON.parse(result);
          const merged = [
            ...(Array.isArray(parsed.found) ? parsed.found : []),
            ...(Array.isArray(parsed.paired) ? parsed.paired : []),
          ];
          list = merged;
        } catch (e) {
          list = [];
        }
      } else if (Array.isArray(result)) {
        list = result;
      } else if (result && typeof result === 'object') {
        const merged = [
          ...(Array.isArray(result.found) ? result.found : []),
          ...(Array.isArray(result.paired) ? result.paired : []),
        ];
        list = merged;
      }
      const normalized = list.map(normalizeDevice).filter(Boolean);
      const dedup = Array.from(new Map(normalized.map(d => [d.address, d])).values());
      setDevices(dedup);
      if (dedup.length === 0) setError('No devices found');
    } catch (e) {
      if ((e?.message || '').toLowerCase().includes('bluetooth')) {
        setBluetoothEnabled(false);
        Alert.alert(t.bluetoothDisabled || 'Bluetooth Disabled', t.enableBluetoothToScan || 'Please enable Bluetooth and try again.');
      }
      setError(e?.message || 'Scan failed');
    } finally {
      setIsScanning(false);
    }
  }, []);

  const connect = useCallback(async (device) => {
    setIsConnecting(true);
    setSelected(device);
    setError(null);
    try {
      await BLEPrinter.init();
      if (BLEPrinter && typeof BLEPrinter.connectPrinter === 'function') {
        await BLEPrinter.connectPrinter(device.address);
      } else if (BLEPrinter && typeof BLEPrinter.connect === 'function') {
        await BLEPrinter.connect(device.address);
      } else {
        throw new Error('Connect not supported by printer module');
      }
      setConnected(true);
      if (onConnected) onConnected(device);
      Alert.alert('Connected', `Connected to ${device.name}`);
    } catch (e) {
      setSelected(null);
      setConnected(false);
      setError(e?.message || 'Connection failed');
      Alert.alert('Connection Failed', e?.message || 'Unable to connect to printer.');
    } finally {
      setIsConnecting(false);
    }
  }, [onConnected]);

  const disconnect = useCallback(async () => {
    try {
      if (BLEPrinter && BLEPrinter.closeConn) await BLEPrinter.closeConn();
    } catch {}
    setConnected(false);
    setSelected(null);
    if (onDisconnected) onDisconnected();
  }, [onDisconnected]);

  return (
    <View style={styles.container}>
      <View style={styles.statusHeader}>
        <View style={styles.dot(connected, bluetoothEnabled)} />
        <Text style={styles.statusText}>
          {!bluetoothEnabled
            ? (t.bluetoothOff || 'Bluetooth is OFF')
            : connected && selected
            ? `${t.connected || 'Connected'}: ${selected.name}`
            : (t.noPrinterConnected || 'No Printer Connected')}
        </Text>
        {connected && (
          <TouchableOpacity style={styles.disconnectButton} onPress={disconnect}>
            <Text style={styles.disconnectText}>{t.disconnect || 'Disconnect'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}

      {!connected && (
        <TouchableOpacity
          style={[styles.scanButton, isScanning && styles.scanButtonDisabled]}
          onPress={scan}
          disabled={isScanning}
        >
          {isScanning ? (
            <>
              <ActivityIndicator size="small" color={COLORS.surface} style={{ marginRight: 8 }} />
            <Text style={styles.scanText}>{t.scanning || 'Scanning...'}</Text>
            </>
          ) : (
            <Text style={styles.scanText}>🔍 {t.scanDevices || 'Scan for Devices'}</Text>
          )}
        </TouchableOpacity>
      )}

      {devices.length > 0 && (
        <View style={{ marginTop: 8 }}>
          <Text style={styles.listTitle}>{t.availableDevices || 'Available Devices'}:</Text>
          {devices.map((d) => (
            <TouchableOpacity
              key={d.address}
              style={[
                styles.item,
                selected?.address === d.address && styles.itemSelected,
              ]}
              onPress={() => connect(d)}
              disabled={isConnecting}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{d.name}</Text>
                <Text style={styles.itemAddr}>{d.address}</Text>
              </View>
              {isConnecting && selected?.address === d.address ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Text style={styles.connectText}>{t.connect || 'Connect'}</Text>
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
    margin: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dot: (connected, enabled) => ({
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
    backgroundColor: connected ? COLORS.success : (enabled ? COLORS.textLight : COLORS.error),
  }),
  statusText: {
    flex: 1,
    color: COLORS.text,
    fontWeight: '600',
  },
  disconnectButton: {
    backgroundColor: COLORS.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  disconnectText: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: COLORS.error + '15',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.error,
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  errorText: {
    color: COLORS.error,
    fontWeight: '500',
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
  scanText: {
    color: COLORS.surface,
    fontWeight: '600',
  },
  listTitle: {
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  itemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  itemName: {
    fontWeight: '600',
    color: COLORS.text,
  },
  itemAddr: {
    color: COLORS.textLight,
    fontSize: 12,
  },
  connectText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 12,
  },
});


