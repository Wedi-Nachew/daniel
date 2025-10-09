import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../utils/constants';
import { translations } from '../utils/translations';
import {
  loadReceipts,
  saveReceipts,
  loadBusiness,
  saveBusiness,
  loadLanguage,
  saveLanguage,
  loadInventory,
  saveInventory,
} from '../utils/storage';
import {
  scanForPrinters,
  connectToPrinter,
  disconnectPrinter,
  isBluetoothEnabled,
  getActivePrinter,
} from '../utils/printer';
import QuickBillingScreen from '../components/QuickBillingScreenNew';
import AnalyticsScreen from '../components/AnalyticsScreenNew';
import HistoryScreen from '../components/HistoryScreenNew';
import SettingsScreen from '../components/SettingsScreen';
import InventoryScreen from '../components/InventoryScreen';
import InventoryBillingScreen from '../components/InventoryBillingScreen';
import LicenseScreen from '../components/LicenseScreen';
import { checkLicense } from '../utils/license';
import BluetoothTestScreen from '../utils/BluetoothTestScreen';

export default function App() {
  const [activeTab, setActiveTab] = useState('billing');
  const [receipts, setReceiptsState] = useState([]);
  const [business, setBusinessState] = useState({
    name: '',
    phone: '',
    address: '',
    logo: null,
  });
  const [lang, setLangState] = useState('en');
  const [inventory, setInventoryState] = useState([]);
  const [printerStatus, setPrinterStatus] = useState('disconnected');
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [availablePrinters, setAvailablePrinters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLicensed, setIsLicensed] = useState(false);
  const [licenseInfo, setLicenseInfo] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [bluetoothEnabled, setBluetoothEnabled] = useState(true);
  const [printerError, setPrinterError] = useState(null);

  const t = translations[lang];

  useEffect(() => {
    initializeApp();
  }, []);

  // Check Bluetooth status periodically
  useEffect(() => {
    let interval;
    const checkBluetooth = async () => {
      try {
        const enabled = await isBluetoothEnabled();
        setBluetoothEnabled(enabled);
  
        if (!enabled) {
          // Stop scanning immediately if Bluetooth was turned off
          if (isScanning) setIsScanning(false);
  
          // Reset connection state if Bluetooth is off
          if (printerStatus === 'connected') {
            setPrinterStatus('disconnected');
            setSelectedPrinter(null);
            setPrinterError('Bluetooth was disabled');
          }
        }
      } catch (error) {
        console.warn('Bluetooth check error:', error);
      }
    };
  
    // Initial check
    checkBluetooth();
  
    // Re-check every 3 seconds for smoother UI feedback
    interval = setInterval(checkBluetooth, 3000);
  
    return () => clearInterval(interval);
  }, [printerStatus, isScanning]);
  

  const initializeApp = async () => {
    try {
      // Check license first
      const license = await checkLicense();
      setLicenseInfo(license);
      setIsLicensed(license.isLicensed);

      // Load data regardless (for trial period)
      await loadData();

      // Try to reconnect to previously connected printer
      const activePrinter = getActivePrinter();
      if (activePrinter) {
        setPrinterStatus('connected');
        setSelectedPrinter(activePrinter);
      }
    } catch (error) {
      console.error('Initialization error:', error);
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const storedReceipts = await loadReceipts();
      const storedBusiness = await loadBusiness();
      const storedLang = await loadLanguage();
      const storedInventory = await loadInventory();

      setReceiptsState(storedReceipts);
      setBusinessState(storedBusiness);
      setLangState(storedLang);
      setInventoryState(storedInventory);
    } catch (error) {
      console.error('Data loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  const setReceipts = async (newReceipts) => {
    setReceiptsState(newReceipts);
    await saveReceipts(newReceipts);
  };

  const setBusiness = async (newBusiness) => {
    setBusinessState(newBusiness);
    await saveBusiness(newBusiness);
  };

  const setLang = async (newLang) => {
    setLangState(newLang);
    await saveLanguage(newLang);
  };

  const setInventory = async (newInventory) => {
    setInventoryState(newInventory);
    await saveInventory(newInventory);
  };

  const handleScanPrinters = async () => {
    const enabled = await isBluetoothEnabled();
  if (!enabled) {
    Alert.alert('Bluetooth Disabled', 'Please enable Bluetooth to scan for printers.');
    setBluetoothEnabled(false);
    return;
  }

  setIsScanning(true);
  setPrinterError(null);
  setAvailablePrinters([]);

    try {
      const result = await scanForPrinters();

      if (!result.permissionGranted) {
        setPrinterError('Bluetooth permission required');
        Alert.alert(
          t.permissionRequired || 'Permission Required',
          'Please grant Bluetooth permissions in app settings.'
        );
        return;
      }

      setBluetoothEnabled(result.bluetoothEnabled);

      if (!result.bluetoothEnabled) {
        setPrinterError('Bluetooth is disabled');
        Alert.alert(
          t.bluetoothDisabled || 'Bluetooth Disabled',
          'Please turn on Bluetooth to scan for printers.'
        );
        return;
      }

      if (result.error) {
        setPrinterError('Scan failed');
        Alert.alert(
          t.printerError || 'Error',
          'Unable to scan for printers. Please try again.'
        );
        return;
      }

      const printerList = result.printers || [];
      setAvailablePrinters(printerList);
      setPrinterError(null);

      if (printerList.length > 0) {
        Alert.alert(
          t.printersFound || 'Printers Found',
          `Found ${printerList.length} printer(s). Tap one to connect.`
        );
      } else {
        setPrinterError('No printers found');
        Alert.alert(
          t.noPrintersFound || 'No Printers Found',
          'Make sure your printer is on and in pairing mode.'
        );
      }
    } catch (error) {
      console.error('Scan error:', error);
      setPrinterError('Scan error occurred');
      Alert.alert(
        t.scanError || 'Scan Error',
        'Failed to scan for printers. Please try again.'
      );
    } finally {
      setIsScanning(false);
    }
  };

  const handleConnectPrinter = async (printer) => {
    setIsConnecting(true);
    setSelectedPrinter(printer);
    setPrinterError(null);

    try {
      const connected = await connectToPrinter(printer);

      if (connected) {
        setPrinterStatus('connected');
        setSelectedPrinter(connected);
        setPrinterError(null);
        setShowPrinterModal(false);
        Alert.alert(
          t.printerConnected || 'Success',
          `Connected to ${connected.name}`
        );
      } else {
        setSelectedPrinter(null);
        setPrinterError('Failed to connect');
        Alert.alert(
          t.printerError || 'Error',
          'Failed to connect to printer. Please try again.'
        );
      }
    } catch (error) {
      console.error('Connection error:', error);
      setSelectedPrinter(null);
      setPrinterError(error.message || 'Connection failed');
      Alert.alert(
        t.connectionFailed || 'Connection Failed',
        error.message || 'Unable to connect to printer.'
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectPrinter = async () => {
    try {
      await disconnectPrinter();
      setPrinterStatus('disconnected');
      setSelectedPrinter(null);
      setPrinterError(null);
      Alert.alert(
        t.disconnected || 'Disconnected',
        'Printer disconnected successfully.'
      );
    } catch (error) {
      console.error('Disconnect error:', error);
      Alert.alert(
        t.error || 'Error',
        'Failed to disconnect printer.'
      );
    }
  };

  const renderPrinterStatusDot = () => {
    const color =
      printerStatus === 'connected'
        ? COLORS.success
        : !bluetoothEnabled
        ? COLORS.error
        : isScanning || isConnecting
        ? COLORS.warning
        : COLORS.error;

    return <View style={[styles.statusDot, { backgroundColor: color }]} />;
  };

  const getPrinterStatusText = () => {
    if (!bluetoothEnabled) return 'Bluetooth OFF';
    if (printerStatus === 'connected' && selectedPrinter) {
      return selectedPrinter.name;
    }
    if (isScanning) return 'Scanning...';
    if (isConnecting) return 'Connecting...';
    return 'Not Connected';
  };

  const handleLicenseValid = async () => {
    try {
      const license = await checkLicense();
      setLicenseInfo(license);
      setIsLicensed(license.isLicensed);
    } catch (error) {
      console.error('License check error:', error);
    }
  };

  const renderActiveScreen = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>{t.loading || 'Loading...'}</Text>
        </View>
      );
    }

    // Show license screen if not licensed
    if (!isLicensed) {
      return (
        <LicenseScreen
          onLicenseValid={handleLicenseValid}
          translations={t}
        />
      );
    }

    switch (activeTab) {
      case 'billing':
        return (
          <InventoryBillingScreen
            inventory={inventory}
            receipts={receipts}
            setReceipts={setReceipts}
            business={business}
            translations={t}
            printerStatus={printerStatus}
          />
        );
      case 'analytics':
        return <AnalyticsScreen receipts={receipts} translations={t} />;
      case 'inventory':
        return (
          <InventoryScreen
            inventory={inventory}
            setInventory={setInventory}
            translations={t}
          />
        );
      case 'history':
        return (
          <HistoryScreen
            receipts={receipts}
            setReceipts={setReceipts}
            business={business}
            translations={t}
            printerStatus={printerStatus}
          />
        );
      case 'settings':
        return (
          <SettingsScreen
            business={business}
            setBusiness={setBusiness}
            lang={lang}
            setLang={setLang}
            translations={t}
          />
        );
      case 'bluetooth':
        return <BluetoothTestScreen />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primary}
      />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>{t.appName}</Text>
          {licenseInfo?.status === 'trial' && licenseInfo.daysLeft > 0 && (
            <Text style={styles.trialBadge}>
              Trial: {licenseInfo.daysLeft}d left
            </Text>
          )}
        </View>

        {/* Printer Status Button */}
        <TouchableOpacity
          style={styles.printerButton}
          onPress={() => setShowPrinterModal(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.printerEmoji}>🖨️</Text>
          {renderPrinterStatusDot()}
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.content}>{renderActiveScreen()}</View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[
            styles.navItem,
            activeTab === 'billing' && styles.navItemActive,
          ]}
          onPress={() => setActiveTab('billing')}
        >
          <Text style={styles.navIcon}>🧾</Text>
          <Text
            style={[
              styles.navText,
              activeTab === 'billing' && styles.navTextActive,
            ]}
          >
            {t.billing || 'Billing'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navItem,
            activeTab === 'analytics' && styles.navItemActive,
          ]}
          onPress={() => setActiveTab('analytics')}
        >
          <Text style={styles.navIcon}>📊</Text>
          <Text
            style={[
              styles.navText,
              activeTab === 'analytics' && styles.navTextActive,
            ]}
          >
            {t.analytics}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navItem,
            activeTab === 'inventory' && styles.navItemActive,
          ]}
          onPress={() => setActiveTab('inventory')}
        >
          <Text style={styles.navIcon}>📦</Text>
          <Text
            style={[
              styles.navText,
              activeTab === 'inventory' && styles.navTextActive,
            ]}
          >
            {t.inventory}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navItem,
            activeTab === 'bluetooth' && styles.navItemActive,
          ]}
          onPress={() => setActiveTab('bluetooth')}
        >
          <Text style={styles.navIcon}>🛜</Text>
          <Text style={styles.navText}>Bluetooth</Text>
          <Text
            style={[
              styles.navText,
              activeTab === 'bluetooth' && styles.navTextActive,
            ]}
          >
            {t.bluetooth}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === 'history' && styles.navItemActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={styles.navIcon}>📜</Text>
          <Text
            style={[
              styles.navText,
              activeTab === 'history' && styles.navTextActive,
            ]}
          >
            {t.history}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navItem,
            activeTab === 'settings' && styles.navItemActive,
          ]}
          onPress={() => setActiveTab('settings')}
        >
          <Text style={styles.navIcon}>⚙️</Text>
          <Text
            style={[
              styles.navText,
              activeTab === 'settings' && styles.navTextActive,
            ]}
          >
            {t.settings}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Printer Modal */}
      <Modal
        visible={showPrinterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPrinterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🖨️ {t.connectPrinter}</Text>
              {printerStatus === 'connected' && selectedPrinter && (
                <TouchableOpacity
                  style={styles.disconnectPrinterButton}
                  onPress={handleDisconnectPrinter}
                >
                  <Text style={styles.disconnectPrinterText}>Disconnect</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Status Info */}
            <View style={styles.statusInfoContainer}>
              <View
                style={[
                  styles.statusIndicator,
                  {
                    backgroundColor:
                      printerStatus === 'connected'
                        ? COLORS.success
                        : COLORS.error,
                  },
                ]}
              />
              <Text style={styles.statusInfoText}>
                {getPrinterStatusText()}
              </Text>
            </View>

            {/* Error Display */}
            {printerError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>⚠️ {printerError}</Text>
              </View>
            )}

            {/* Scan Button */}
            {printerStatus !== 'connected' && (
              <TouchableOpacity
                style={[
                  styles.scanButton,
                  isScanning && styles.scanButtonDisabled,
                ]}
                onPress={handleScanPrinters}
                disabled={isScanning}
              >
                {isScanning ? (
                  <>
                    <ActivityIndicator
                      size="small"
                      color={COLORS.surface}
                      style={styles.scanSpinner}
                    />
                    <Text style={styles.scanButtonText}>
                      {t.scanning || 'Scanning...'}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.scanButtonText}>
                    🔍 {t.scanPrinters || 'Scan for Printers'}
                  </Text>
                )}
              </TouchableOpacity>
            )}

            {/* Printer List */}
            <ScrollView style={styles.printerList}>
              {availablePrinters.length === 0 ? (
                <Text style={styles.emptyText}>
                  {isScanning
                    ? (t.searching || 'Searching') + '...'
                    : t.noPrintersFound || 'No printers found'}
                </Text>
              ) : (
                availablePrinters.map((printer, index) => (
                  <TouchableOpacity
                    key={printer.address || index}
                    style={[
                      styles.printerItem,
                      selectedPrinter?.address === printer.address &&
                        styles.printerItemSelected,
                    ]}
                    onPress={() => handleConnectPrinter(printer)}
                    disabled={isConnecting}
                  >
                    <View style={styles.printerItemContent}>
                      <Text style={styles.printerName}>
                        {printer.name || 'Unknown Printer'}
                      </Text>
                      <Text style={styles.printerAddress}>
                        {printer.address || 'Unknown Address'}
                      </Text>
                    </View>
                    {isConnecting &&
                    selectedPrinter?.address === printer.address ? (
                      <ActivityIndicator
                        size="small"
                        color={COLORS.primary}
                      />
                    ) : (
                      <Text style={styles.printerItemConnect}>→</Text>
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowPrinterModal(false)}
            >
              <Text style={styles.closeButtonText}>
                {t.close || 'Close'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    backgroundColor: COLORS.primary,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.surface,
  },
  trialBadge: {
    fontSize: 11,
    color: COLORS.warning,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
    fontWeight: '600',
  },
  printerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  printerEmoji: {
    fontSize: 24,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textLight,
    marginTop: 12,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  navItemActive: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    marginHorizontal: 4,
    marginVertical: 4,
  },
  navIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  navText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textLight,
    textAlign: 'center',
  },
  navTextActive: {
    color: COLORS.surface,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    padding: 0,
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
  disconnectPrinterButton: {
    backgroundColor: COLORS.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  disconnectPrinterText: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  statusInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  statusInfoText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  errorBanner: {
    backgroundColor: COLORS.error + '15',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.error,
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  errorBannerText: {
    fontSize: 13,
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
  scanSpinner: {
    marginRight: 8,
  },
  scanButtonText: {
    color: COLORS.surface,
    fontSize: 15,
    fontWeight: '600',
  },
  printerList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  printerItem: {
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
  printerItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  printerItemContent: {
    flex: 1,
  },
  printerName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  printerAddress: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  printerItemConnect: {
    fontSize: 18,
    color: COLORS.primary,
    marginLeft: 12,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 15,
    color: COLORS.textLight,
    paddingVertical: 40,
  },
  closeButton: {
    paddingVertical: 14,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginHorizontal: -20,
    marginBottom: -20,
    paddingHorizontal: 20,
  },
  closeButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});