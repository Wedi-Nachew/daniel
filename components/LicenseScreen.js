import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { COLORS } from '../utils/constants';
import { getDeviceId, activateLicense, checkLicense } from '../utils/license';

export default function LicenseScreen({ onLicenseValid, translations }) {
  const t = translations;
  const [deviceId, setDeviceId] = useState('');
  const [licenseKey, setLicenseKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [licenseInfo, setLicenseInfo] = useState(null);

  useEffect(() => {
    loadLicenseInfo();
  }, []);

  const loadLicenseInfo = async () => {
    const id = await getDeviceId();
    setDeviceId(id);
    
    const info = await checkLicense();
    setLicenseInfo(info);
    setLoading(false);
    
    // If already licensed, notify parent
    if (info.isLicensed && info.status === 'active') {
      onLicenseValid();
    }
  };

  const handleActivate = async () => {
    if (!licenseKey.trim()) {
      Alert.alert(t.error, 'Please enter a license key');
      return;
    }

    const result = await activateLicense(licenseKey);
    
    if (result.success) {
      Alert.alert(t.success, 'App activated successfully!');
      onLicenseValid();
    } else {
      Alert.alert(t.error, result.error || 'Invalid license key');
    }
  };

  const copyDeviceId = async () => {
    await Clipboard.setStringAsync(deviceId);
    Alert.alert(t.success, t.deviceIdCopied);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>{t.loading}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerIcon}>🔐</Text>
          <Text style={styles.headerTitle}>{t.appName}</Text>
          <Text style={styles.headerSubtitle}>License Activation Required</Text>
        </View>

        {/* Trial Info */}
        {licenseInfo?.status === 'trial' && (
          <View style={[styles.card, styles.trialCard]}>
            <Text style={styles.trialIcon}>⏰</Text>
            <Text style={styles.trialTitle}>Trial Period</Text>
            <Text style={styles.trialText}>
              {licenseInfo.daysLeft} days remaining
            </Text>
            <Text style={styles.trialSubtext}>
              Activate now to continue using after trial
            </Text>
          </View>
        )}

        {/* Expired Info */}
        {licenseInfo?.status === 'expired' && (
          <View style={[styles.card, styles.expiredCard]}>
            <Text style={styles.expiredIcon}>⚠️</Text>
            <Text style={styles.expiredTitle}>Trial Expired</Text>
            <Text style={styles.expiredText}>
              Your trial period has ended. Please activate to continue using the app.
            </Text>
          </View>
        )}

        {/* Device ID Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📱 Your Device ID</Text>
          <Text style={styles.cardSubtitle}>
            Send this ID to the developer to receive your license key
          </Text>
          
          <View style={styles.deviceIdContainer}>
            <Text style={styles.deviceIdText}>{deviceId}</Text>
          </View>
          
          <TouchableOpacity style={styles.copyButton} onPress={copyDeviceId}>
            <Text style={styles.copyButtonText}>📋 Copy Device ID</Text>
          </TouchableOpacity>
        </View>

        {/* Activation Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔑 Activate License</Text>
          <Text style={styles.cardSubtitle}>
            Enter the license key provided by the developer
          </Text>
          
          <Text style={styles.label}>License Key</Text>
          <TextInput
            style={styles.input}
            placeholder="XXXX-XXXX-XXXX-XXXX"
            value={licenseKey}
            onChangeText={(text) => setLicenseKey(text.toUpperCase())}
            autoCapitalize="characters"
            placeholderTextColor={COLORS.textLight}
          />

          <TouchableOpacity style={styles.activateButton} onPress={handleActivate}>
            <Text style={styles.activateButtonText}>✓ Activate App</Text>
          </TouchableOpacity>
        </View>

        {/* Contact Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📞 Contact Developer</Text>
          <Text style={styles.contactText}>{t.developerEmail}</Text>
          <Text style={styles.contactText}>{t.developerPhone}</Text>
          <Text style={styles.contactText}>{t.developerWebsite}</Text>
          
          <Text style={styles.instructionText}>
            To activate this app:
            {'\n'}1. Copy your Device ID above
            {'\n'}2. Contact the developer with your Device ID and business name
            {'\n'}3. Receive your unique license key
            {'\n'}4. Enter the license key and activate
          </Text>
        </View>

        {/* Trial Continue Button */}
        {licenseInfo?.status === 'trial' && licenseInfo.daysLeft > 0 && (
          <TouchableOpacity 
            style={styles.continueTrialButton} 
            onPress={onLicenseValid}
          >
            <Text style={styles.continueTrialText}>
              Continue with Trial ({licenseInfo.daysLeft} days left)
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 20,
  },
  headerIcon: {
    fontSize: 72,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  card: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  trialCard: {
    backgroundColor: COLORS.warning + '10',
    borderWidth: 2,
    borderColor: COLORS.warning,
  },
  trialIcon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 12,
  },
  trialTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  trialText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.warning,
    textAlign: 'center',
    marginBottom: 8,
  },
  trialSubtext: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  expiredCard: {
    backgroundColor: COLORS.error + '10',
    borderWidth: 2,
    borderColor: COLORS.error,
  },
  expiredIcon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 12,
  },
  expiredTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: 8,
  },
  expiredText: {
    fontSize: 14,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 16,
    lineHeight: 20,
  },
  deviceIdContainer: {
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  deviceIdText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    letterSpacing: 2,
  },
  copyButton: {
    backgroundColor: COLORS.primary + '15',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  copyButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    letterSpacing: 2,
    textAlign: 'center',
    fontWeight: '600',
  },
  activateButton: {
    backgroundColor: COLORS.success,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  activateButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: 'bold',
  },
  contactText: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 16,
    lineHeight: 22,
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 8,
  },
  continueTrialButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  continueTrialText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    color: COLORS.textLight,
    marginTop: 50,
  },
});
