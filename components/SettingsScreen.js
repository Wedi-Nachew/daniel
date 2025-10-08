import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Alert,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, LICENSE_CONFIG } from '../utils/constants';
import AdminLicenseScreen from './AdminLicenseScreen';

export default function SettingsScreen({ 
  business, 
  setBusiness, 
  lang, 
  setLang, 
  translations 
}) {
  const t = translations;
  const [localBusiness, setLocalBusiness] = useState(business);
  const [adminTapCount, setAdminTapCount] = useState(0);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [isEditingBusiness, setIsEditingBusiness] = useState(false);

  useEffect(() => {
    setLocalBusiness(business);
  }, [business]);

  useEffect(() => {
    loadDeviceId();
  }, []);

  const loadDeviceId = async () => {
    const { getDeviceId } = require('../utils/license');
    const id = await getDeviceId();
    setDeviceId(id || 'Loading...');
  };

  const handleVersionTap = () => {
    const newCount = adminTapCount + 1;
    setAdminTapCount(newCount);
    
    if (newCount >= 7) {
      setShowPasswordPrompt(true);
      setAdminTapCount(0);
    }
    
    // Reset counter after 3 seconds
    setTimeout(() => setAdminTapCount(0), 3000);
  };

  const handlePasswordSubmit = () => {
    if (adminPassword === LICENSE_CONFIG.ADMIN_PASSWORD) {
      setShowPasswordPrompt(false);
      setShowAdminPanel(true);
      setAdminPassword('');
    } else {
      Alert.alert(t.error, 'Incorrect admin password');
      setAdminPassword('');
    }
  };

  const handleBusinessChange = (field, value) => {
    const updated = { ...localBusiness, [field]: value };
    setLocalBusiness(updated);
  };

  const handleSaveBusiness = () => {
    setBusiness(localBusiness);
    setIsEditingBusiness(false);
    Alert.alert(t.success, 'Business information saved successfully');
  };

  const handleCancelEdit = () => {
    setLocalBusiness(business);
    setIsEditingBusiness(false);
  };

  const copyDeviceId = async () => {
    const Clipboard = require('expo-clipboard');
    await Clipboard.setStringAsync(deviceId);
    Alert.alert(t.success, t.deviceIdCopied);
  };

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert(t.error, t.galleryPermissionRequired);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      handleBusinessChange('logo', result.assets[0].uri);
    }
  };

  const handleRemoveLogo = () => {
    handleBusinessChange('logo', null);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Language Selection */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🌐 {t.language}</Text>
        
        <View style={styles.languageRow}>
          <TouchableOpacity
            style={[
              styles.languageButton,
              lang === 'ti' && styles.languageButtonActive,
            ]}
            onPress={() => setLang('ti')}
          >
            <Text
              style={[
                styles.languageButtonText,
                lang === 'ti' && styles.languageButtonTextActive,
              ]}
            >
              ትግርኛ
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.languageButton,
              lang === 'en' && styles.languageButtonActive,
            ]}
            onPress={() => setLang('en')}
          >
            <Text
              style={[
                styles.languageButtonText,
                lang === 'en' && styles.languageButtonTextActive,
              ]}
            >
              English
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Business Logo */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📷 {t.businessLogo}</Text>
        
        {localBusiness.logo ? (
          <View style={styles.logoContainer}>
            <Image source={{ uri: localBusiness.logo }} style={styles.logo} />
            <TouchableOpacity 
              style={styles.removeLogoButton}
              onPress={handleRemoveLogo}
            >
              <Text style={styles.removeLogoButtonText}>{t.removeLogo}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.uploadButton}
            onPress={handlePickImage}
          >
            <Text style={styles.uploadButtonEmoji}>📷</Text>
            <Text style={styles.uploadButtonText}>{t.uploadLogo}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Device ID Display */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📱 {t.deviceId}</Text>
        <Text style={styles.cardSubtitle}>Your unique device identifier</Text>
        
        <View style={styles.deviceIdBox}>
          <Text style={styles.deviceIdText}>{deviceId}</Text>
        </View>
        
        <TouchableOpacity style={styles.copyDeviceButton} onPress={copyDeviceId}>
          <Text style={styles.copyDeviceButtonText}>📋 {t.copyDeviceId}</Text>
        </TouchableOpacity>
      </View>

      {/* Business Information */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>🏢 {t.businessInfo}</Text>
          {!isEditingBusiness && (
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => setIsEditingBusiness(true)}
            >
              <Text style={styles.editButtonText}>✏️ {t.edit}</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {isEditingBusiness ? (
          <>
            <Text style={styles.label}>{t.businessName}</Text>
            <TextInput
              style={styles.input}
              placeholder={t.businessName}
              value={localBusiness.name}
              onChangeText={(value) => handleBusinessChange('name', value)}
              placeholderTextColor={COLORS.textLight}
            />
            
            <Text style={styles.label}>{t.businessPhone}</Text>
            <TextInput
              style={styles.input}
              placeholder={t.businessPhone}
              value={localBusiness.phone}
              onChangeText={(value) => handleBusinessChange('phone', value)}
              keyboardType="phone-pad"
              placeholderTextColor={COLORS.textLight}
            />
            
            <Text style={styles.label}>{t.businessAddress}</Text>
            <TextInput
              style={styles.input}
              placeholder={t.businessAddress}
              value={localBusiness.address}
              onChangeText={(value) => handleBusinessChange('address', value)}
              placeholderTextColor={COLORS.textLight}
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.saveButton]}
                onPress={handleSaveBusiness}
              >
                <Text style={styles.saveButtonText}>✓ {t.save}</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionButton, styles.cancelButton]}
                onPress={handleCancelEdit}
              >
                <Text style={styles.cancelButtonText}>✕ {t.cancel}</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            {localBusiness.name ? (
              <View style={styles.infoDisplay}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t.businessName}:</Text>
                  <Text style={styles.infoValue}>{localBusiness.name}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t.businessPhone}:</Text>
                  <Text style={styles.infoValue}>{localBusiness.phone || 'Not set'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t.businessAddress}:</Text>
                  <Text style={styles.infoValue}>{localBusiness.address || 'Not set'}</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.emptyText}>No business information set. Tap Edit to add.</Text>
            )}
          </>
        )}
      </View>

      {/* Developer Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>👨‍💻 {t.developerInfo}</Text>
        
        <View style={styles.developerSection}>
          <Text style={styles.developerLabel}>{t.developedBy}:</Text>
          <Text style={styles.developerText}>{t.developedByTeam}</Text>
        </View>

        <View style={styles.developerSection}>
          <Text style={styles.developerLabel}>{t.contact}:</Text>
          <Text style={styles.developerText}>{t.developerEmail}</Text>
          <Text style={styles.developerText}>{t.developerPhone}</Text>
          <Text style={styles.developerText}>{t.developerWebsite}</Text>
        </View>

        <TouchableOpacity 
          style={styles.developerSection}
          onPress={handleVersionTap}
          activeOpacity={0.8}
        >
          <Text style={styles.developerLabel}>{t.version}:</Text>
          <Text style={styles.developerText}>{t.appVersion}</Text>
        </TouchableOpacity>

        <View style={styles.developerSection}>
          <Text style={styles.developerLabel}>{t.support}:</Text>
          <Text style={styles.developerText}>{t.supportMessage}</Text>
        </View>
      </View>

      {/* Admin Password Prompt Modal */}
      <Modal visible={showPasswordPrompt} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🔐 Admin Access</Text>
            <Text style={styles.modalSubtitle}>Enter admin password to continue</Text>
            
            <TextInput
              style={styles.passwordInput}
              placeholder="Admin Password"
              value={adminPassword}
              onChangeText={setAdminPassword}
              secureTextEntry
              placeholderTextColor={COLORS.textLight}
              autoFocus
            />

            <TouchableOpacity 
              style={styles.submitButton} 
              onPress={handlePasswordSubmit}
            >
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.cancelModalButton} 
              onPress={() => {
                setShowPasswordPrompt(false);
                setAdminPassword('');
              }}
            >
              <Text style={styles.cancelModalText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Admin License Generator Modal */}
      <Modal visible={showAdminPanel} animationType="slide">
        <AdminLicenseScreen 
          translations={t}
          onClose={() => setShowAdminPanel(false)}
        />
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  card: {
    backgroundColor: COLORS.surface,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  languageRow: {
    flexDirection: 'row',
    gap: 12,
  },
  languageButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  languageButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  languageButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  languageButtonTextActive: {
    color: COLORS.surface,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 16,
    marginBottom: 16,
  },
  removeLogoButton: {
    backgroundColor: COLORS.error,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  removeLogoButtonText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: '600',
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  uploadButtonEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
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
  developerSection: {
    marginBottom: 16,
  },
  developerLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  developerText: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 4,
    lineHeight: 20,
  },
  cardSubtitle: {
    fontSize: 13,
    color: COLORS.textLight,
    marginBottom: 16,
  },
  deviceIdBox: {
    backgroundColor: COLORS.primary + '10',
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  deviceIdText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    letterSpacing: 2,
  },
  copyDeviceButton: {
    backgroundColor: COLORS.primary + '15',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  copyDeviceButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  editButton: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: COLORS.success,
  },
  saveButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  infoDisplay: {
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 8,
  },
  infoRow: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 4,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    padding: 20,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 20,
  },
  passwordInput: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    textAlign: 'center',
    letterSpacing: 2,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  submitButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelModalButton: {
    padding: 12,
    alignItems: 'center',
  },
  cancelModalText: {
    color: COLORS.textLight,
    fontSize: 14,
    fontWeight: '600',
  },
});
