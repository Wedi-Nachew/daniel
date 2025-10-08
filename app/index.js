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
import { scanForPrinters, connectToPrinter } from '../utils/printer';
import QuickBillingScreen from '../components/QuickBillingScreenNew';
import AnalyticsScreen from '../components/AnalyticsScreenNew';
import HistoryScreen from '../components/HistoryScreenNew';
import SettingsScreen from '../components/SettingsScreen';
import InventoryScreen from '../components/InventoryScreen';
import InventoryBillingScreen from '../components/InventoryBillingScreen';
import LicenseScreen from '../components/LicenseScreen';
import { checkLicense } from '../utils/license';

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

  const t = translations[lang];

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    // Check license first
    const license = await checkLicense();
    setLicenseInfo(license);
    setIsLicensed(license.isLicensed);
    
    // Load data regardless (for trial period)
    await loadData();
  };

  const loadData = async () => {
    const storedReceipts = await loadReceipts();
    const storedBusiness = await loadBusiness();
    const storedLang = await loadLanguage();
    const storedInventory = await loadInventory();

    setReceiptsState(storedReceipts);
    setBusinessState(storedBusiness);
    setLangState(storedLang);
    setInventoryState(storedInventory);
    setLoading(false);
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
    setPrinterStatus('searching');
    const result = await scanForPrinters();

    if (!result.permissionGranted) {
      Alert.alert('Permission Required', 'Bluetooth permission is required to scan for printers.');
      setPrinterStatus('disconnected');
      return;
    }

    if (!result.bluetoothEnabled) {
      Alert.alert('Bluetooth Disabled', 'Please turn on Bluetooth to scan for printers.');
      setPrinterStatus('disconnected');
      return;
    }

    if (result.error) {
      Alert.alert(t.printerError || 'Error', 'Unable to scan for printers. Please try again.');
      setPrinterStatus('disconnected');
      return;
    }

    setAvailablePrinters(result.printers);
    
    if (result.printers.length === 0) {
      Alert.alert(t.noPrintersFound || 'No Printers Found', 'No Bluetooth printers were detected.');
      setPrinterStatus('disconnected');
    }
  };

  const handleConnectPrinter = async (printer) => {
    const connected = await connectToPrinter(printer);
    if (connected) {
      setPrinterStatus('connected');
      setShowPrinterModal(false);
      Alert.alert(t.printerConnected || 'Success', `Connected to ${connected.name}`);
    } else {
      setPrinterStatus('disconnected');
      Alert.alert(t.printerError || 'Error', 'Failed to connect to printer');
    }
  };

  const renderPrinterStatusDot = () => {
    const color =
      printerStatus === 'connected'
        ? COLORS.success
        : printerStatus === 'searching'
        ? COLORS.warning
        : COLORS.error;

    return <View style={[styles.statusDot, { backgroundColor: color }]} />;
  };

  const handleLicenseValid = async () => {
    const license = await checkLicense();
    setLicenseInfo(license);
    setIsLicensed(license.isLicensed);
  };

  const renderActiveScreen = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }

    // Show license screen if not licensed
    if (!isLicensed) {
      return <LicenseScreen onLicenseValid={handleLicenseValid} translations={t} />;
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
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
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
        <TouchableOpacity
          style={styles.printerButton}
          onPress={() => setShowPrinterModal(true)}
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
          style={[styles.navItem, activeTab === 'billing' && styles.navItemActive]}
          onPress={() => setActiveTab('billing')}
        >
          <Text style={styles.navIcon}>🧾</Text>
          <Text
            style={[styles.navText, activeTab === 'billing' && styles.navTextActive]}
          >
            Billing
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === 'analytics' && styles.navItemActive]}
          onPress={() => setActiveTab('analytics')}
        >
          <Text style={styles.navIcon}>📊</Text>
          <Text
            style={[styles.navText, activeTab === 'analytics' && styles.navTextActive]}
          >
            {t.analytics}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === 'inventory' && styles.navItemActive]}
          onPress={() => setActiveTab('inventory')}
        >
          <Text style={styles.navIcon}>📦</Text>
          <Text
            style={[styles.navText, activeTab === 'inventory' && styles.navItemActive]}
          >
            {t.inventory}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === 'history' && styles.navItemActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={styles.navIcon}>📜</Text>
          <Text
            style={[styles.navText, activeTab === 'history' && styles.navTextActive]}
          >
            {t.history}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === 'settings' && styles.navItemActive]}
          onPress={() => setActiveTab('settings')}
        >
          <Text style={styles.navIcon}>⚙️</Text>
          <Text
            style={[styles.navText, activeTab === 'settings' && styles.navTextActive]}
          >
            {t.settings}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Printer Modal */}
      <Modal visible={showPrinterModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🖨️ {t.connectPrinter}</Text>

            <TouchableOpacity
              style={styles.scanButton}
              onPress={handleScanPrinters}
            >
              <Text style={styles.scanButtonText}>
                {printerStatus === 'searching' ? '🔄 ' : '🔍 '}
                {t.scanPrinters}
              </Text>
            </TouchableOpacity>

            <ScrollView style={styles.printerList}>
              {availablePrinters.length === 0 ? (
                <Text style={styles.emptyText}>
                  {printerStatus === 'searching'
                    ? t.searching + '...'
                    : t.noPrintersFound}
                </Text>
              ) : (
                availablePrinters.map((printer, index) => (
                  <TouchableOpacity
                    key={printer.address || index}
                    style={styles.printerItem}
                    onPress={() => handleConnectPrinter(printer)}
                  >
                    <Text style={styles.printerName}>{printer.name}</Text>
                    <Text style={styles.printerAddress}>{printer.address}</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowPrinterModal(false)}
            >
              <Text style={styles.closeButtonText}>{t.cancel}</Text>
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
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  scanButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  scanButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  printerList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  printerItem: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    marginBottom: 8,
  },
  printerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  printerAddress: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: COLORS.textLight,
    paddingVertical: 40,
  },
  closeButton: {
    padding: 16,
    alignItems: 'center',
  },
  closeButtonText: {
    color: COLORS.textLight,
    fontSize: 16,
    fontWeight: '600',
  },
});
