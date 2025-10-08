import React, { useState } from 'react';
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
import { generateLicenseKey } from '../utils/license';

export default function AdminLicenseScreen({ translations, onClose }) {
  const t = translations;
  const [customerDeviceId, setCustomerDeviceId] = useState('');
  const [customerBusinessName, setCustomerBusinessName] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');

  const handleGenerate = async () => {
    if (!customerDeviceId.trim()) {
      Alert.alert(t.error, 'Please enter customer Device ID');
      return;
    }

    const key = await generateLicenseKey(customerDeviceId.trim(), customerBusinessName.trim());
    
    if (key) {
      setGeneratedKey(key);
      Alert.alert(t.success, 'License key generated successfully!');
    } else {
      Alert.alert(t.error, 'Failed to generate license key');
    }
  };

  const copyLicenseKey = async () => {
    if (generatedKey) {
      await Clipboard.setStringAsync(generatedKey);
      Alert.alert(t.success, 'License key copied to clipboard');
    }
  };

  const handleReset = () => {
    setCustomerDeviceId('');
    setCustomerBusinessName('');
    setGeneratedKey('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🔧 Admin: License Generator</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.warningCard}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningTitle}>OWNER ACCESS ONLY</Text>
          <Text style={styles.warningText}>
            This tool is for generating license keys for customers. Keep this secure and never share generated keys publicly.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Generate License Key</Text>
          
          <Text style={styles.label}>Customer Device ID *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., A1B2C3D4E5F6G7H8"
            value={customerDeviceId}
            onChangeText={(text) => setCustomerDeviceId(text.toUpperCase())}
            autoCapitalize="characters"
            placeholderTextColor={COLORS.textLight}
          />

          <Text style={styles.label}>Customer Business Name (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., ABC Mill House"
            value={customerBusinessName}
            onChangeText={setCustomerBusinessName}
            placeholderTextColor={COLORS.textLight}
          />

          <TouchableOpacity style={styles.generateButton} onPress={handleGenerate}>
            <Text style={styles.generateButtonText}>🔑 Generate License Key</Text>
          </TouchableOpacity>
        </View>

        {generatedKey && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>✓ Generated License Key</Text>
            
            <View style={styles.keyContainer}>
              <Text style={styles.keyText}>{generatedKey}</Text>
            </View>

            <TouchableOpacity style={styles.copyButton} onPress={copyLicenseKey}>
              <Text style={styles.copyButtonText}>📋 Copy License Key</Text>
            </TouchableOpacity>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                <Text style={styles.infoBold}>Device ID:</Text> {customerDeviceId}
              </Text>
              {customerBusinessName && (
                <Text style={styles.infoText}>
                  <Text style={styles.infoBold}>Business:</Text> {customerBusinessName}
                </Text>
              )}
              <Text style={styles.infoText}>
                <Text style={styles.infoBold}>Generated:</Text> {new Date().toLocaleString()}
              </Text>
            </View>

            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetButtonText}>Generate Another</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📝 Instructions</Text>
          <Text style={styles.instructionText}>
            <Text style={styles.infoBold}>For Customers:</Text>
            {'\n'}1. Customer opens the app and sees their Device ID
            {'\n'}2. Customer contacts you with their Device ID and business name
            {'\n'}3. You generate a license key using this tool
            {'\n'}4. Send the license key to the customer
            {'\n'}5. Customer enters the key in the app to activate
            {'\n\n'}
            <Text style={styles.infoBold}>Security:</Text>
            {'\n'}• Each license key is unique to a specific device
            {'\n'}• Keys cannot be shared between devices
            {'\n'}• You control who can use the app
            {'\n'}• Trial period: 7 days before activation required
          </Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.primary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.surface,
  },
  closeButton: {
    fontSize: 28,
    color: COLORS.surface,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
  warningCard: {
    backgroundColor: COLORS.error + '10',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.error,
    alignItems: 'center',
  },
  warningIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.error,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 20,
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
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: COLORS.surface,
    color: COLORS.text,
  },
  generateButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  generateButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: 'bold',
  },
  keyContainer: {
    backgroundColor: COLORS.success + '10',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.success,
  },
  keyText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.success,
    textAlign: 'center',
    letterSpacing: 2,
  },
  copyButton: {
    backgroundColor: COLORS.success + '15',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  copyButtonText: {
    color: COLORS.success,
    fontSize: 14,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.text,
    marginBottom: 6,
    lineHeight: 20,
  },
  infoBold: {
    fontWeight: 'bold',
    color: COLORS.text,
  },
  resetButton: {
    backgroundColor: COLORS.background,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  resetButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  instructionText: {
    fontSize: 13,
    color: COLORS.textLight,
    lineHeight: 22,
  },
});
