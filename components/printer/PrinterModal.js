import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { COLORS } from '../../utils/constants';
import { BLEPrinter } from 'react-native-thermal-receipt-printer-image-qr';
import { printTestPage } from '../../utils/print';

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

export default function PrinterModal({ visible, onClose, onConnected, onDisconnected, business, translations }) {
  const t = translations || {};
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState([]);
  const [selected, setSelected] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!visible) return;
    (async () => {
      try { await BLEPrinter.init(); } catch {}
    })();
  }, [visible]);

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
      await BLEPrinter.init();
      let result;
      if (BLEPrinter && typeof BLEPrinter.scanDevices === 'function') {
        result = await BLEPrinter.scanDevices();
      } else if (BLEPrinter && typeof BLEPrinter.getDeviceList === 'function') {
        result = await BLEPrinter.getDeviceList();
      } else {
        throw new Error(t.scanNotSupported || 'Scan not supported by printer module');
      }
      let list = [];
      if (typeof result === 'string') {
        try {
          const parsed = JSON.parse(result);
          list = [
            ...(Array.isArray(parsed.found) ? parsed.found : []),
            ...(Array.isArray(parsed.paired) ? parsed.paired : []),
          ];
        } catch {
          list = [];
        }
      } else if (Array.isArray(result)) {
        list = result;
      } else if (result && typeof result === 'object') {
        list = [
          ...(Array.isArray(result.found) ? result.found : []),
          ...(Array.isArray(result.paired) ? result.paired : []),
        ];
      }
      const normalized = list.map(normalizeDevice).filter(Boolean);
      const dedup = Array.from(new Map(normalized.map(d => [d.address, d])).values());
      setDevices(dedup);
      if (dedup.length === 0) setError('No devices found');
    } catch (e) {
      setError(e?.message || 'Scan failed');
    } finally {
      setIsScanning(false);
    }
  }, [t]);

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
        throw new Error(t.connectNotSupported || 'Connect not supported by printer module');
      }
      setConnected(true);
      if (onConnected) onConnected(device);
      Alert.alert(t.success || 'Success', `${t.connectedTo || 'Connected to'} ${device.name}`);
    } catch (e) {
      setSelected(null);
      setConnected(false);
      setError(e?.message || 'Connection failed');
      Alert.alert(t.connectionFailed || 'Connection Failed', e?.message || 'Unable to connect to printer.');
    } finally {
      setIsConnecting(false);
    }
  }, [onConnected, t]);

  const disconnect = useCallback(async () => {
    try { if (BLEPrinter && BLEPrinter.closeConn) await BLEPrinter.closeConn(); } catch {}
    setConnected(false);
    setSelected(null);
    if (onDisconnected) onDisconnected();
  }, [onDisconnected]);

  const handleTestPrint = useCallback(async () => {
    if (!connected) {
      Alert.alert(t.error || 'Error', t.connectPrinterFirst || 'Connect to a printer first.');
      return;
    }
    await printTestPage(business || {});
  }, [connected, business, t]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>🖨️ {t.connectPrinter || 'Connect Printer'}</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeText}>{t.close || 'Close'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statusRow}>
            <View style={[styles.dot, { backgroundColor: connected ? COLORS.success : COLORS.error }]} />
            <Text style={styles.statusText}>
              {connected && selected ? `${t.connected || 'Connected'}: ${selected.name}` : (t.notConnected || 'Not Connected')}
            </Text>
            {connected && (
              <TouchableOpacity style={styles.disconnectBtn} onPress={disconnect}>
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
                <Text style={styles.scanText}>🔍 {t.scanDevices || t.scanPrinters || 'Scan for Devices'}</Text>
              )}
            </TouchableOpacity>
          )}

          {devices.length > 0 && (
            <ScrollView style={styles.list}>
              {devices.map((d) => (
                <TouchableOpacity
                  key={d.address}
                  style={[styles.item, selected?.address === d.address && styles.itemSelected]}
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
            </ScrollView>
          )}

          <TouchableOpacity style={styles.testButton} onPress={handleTestPrint}>
            <Text style={styles.testText}>🧪 {t.testPrint || 'Print Test Page'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
  },
  closeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: COLORS.background,
  },
  closeText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  statusText: {
    flex: 1,
    color: COLORS.text,
    fontWeight: '600',
  },
  disconnectBtn: {
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
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  scanButtonDisabled: {
    backgroundColor: COLORS.primary + '80',
  },
  scanText: {
    color: COLORS.surface,
    fontSize: 15,
    fontWeight: '600',
  },
  list: {
    maxHeight: 300,
    marginBottom: 16,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  itemAddr: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  connectText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  testButton: {
    backgroundColor: COLORS.success,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  testText: {
    color: COLORS.surface,
    fontWeight: '700',
  },
});


