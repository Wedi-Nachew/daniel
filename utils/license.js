import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as Device from 'expo-device';
import { STORAGE_KEYS, LICENSE_CONFIG } from './constants';

/**
 * Generate a unique device ID based on device information
 */
export const getDeviceId = async () => {
  try {
    let storedDeviceId = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID);
    
    if (!storedDeviceId) {
      // Create unique device ID from device info
      const deviceInfo = `${Device.modelName}-${Device.osName}-${Device.osVersion}-${Date.now()}`;
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        deviceInfo
      );
      storedDeviceId = hash.substring(0, 16).toUpperCase();
      await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_ID, storedDeviceId);
    }
    
    return storedDeviceId;
  } catch (error) {
    console.error('Error getting device ID:', error);
    return null;
  }
};

/**
 * Generate a license key for a specific device ID
 * This should be done by you (the owner) and given to the customer
 */
export const generateLicenseKey = async (deviceId, businessName = '') => {
  try {
    const timestamp = Date.now();
    const data = `${deviceId}-${businessName}-${timestamp}-${LICENSE_CONFIG.MASTER_KEY}`;
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      data
    );
    
    // Format: XXXX-XXXX-XXXX-XXXX
    const key = hash.substring(0, 16).toUpperCase();
    return `${key.substring(0, 4)}-${key.substring(4, 8)}-${key.substring(8, 12)}-${key.substring(12, 16)}`;
  } catch (error) {
    console.error('Error generating license key:', error);
    return null;
  }
};

/**
 * Validate a license key against the device ID
 */
export const validateLicenseKey = async (licenseKey, deviceId, businessName = '') => {
  try {
    // Remove dashes from license key
    const cleanKey = licenseKey.replace(/-/g, '');
    
    // Try to validate with current timestamp (within reasonable range)
    // We'll check if the key could have been generated for this device
    const now = Date.now();
    const oneYear = 365 * 24 * 60 * 60 * 1000;
    
    // Check timestamps from 1 year ago to 1 year in future
    for (let offset = -oneYear; offset <= oneYear; offset += 60000) {
      const testTimestamp = now + offset;
      const data = `${deviceId}-${businessName}-${testTimestamp}-${LICENSE_CONFIG.MASTER_KEY}`;
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        data
      );
      
      if (hash.substring(0, 16).toUpperCase() === cleanKey) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error validating license:', error);
    return false;
  }
};

/**
 * Activate the app with a license key
 */
export const activateLicense = async (licenseKey) => {
  try {
    const deviceId = await getDeviceId();
    if (!deviceId) {
      return { success: false, error: 'Could not get device ID' };
    }
    
    const isValid = await validateLicenseKey(licenseKey, deviceId);
    
    if (isValid) {
      await AsyncStorage.setItem(STORAGE_KEYS.LICENSE_KEY, licenseKey);
      await AsyncStorage.setItem(STORAGE_KEYS.LICENSE_STATUS, 'active');
      await AsyncStorage.setItem(STORAGE_KEYS.ACTIVATION_DATE, new Date().toISOString());
      return { success: true, deviceId };
    } else {
      return { success: false, error: 'Invalid license key' };
    }
  } catch (error) {
    console.error('Error activating license:', error);
    return { success: false, error: 'Activation failed' };
  }
};

/**
 * Check if the app is licensed
 */
export const checkLicense = async () => {
  try {
    // If activation is not required, allow usage
    if (!LICENSE_CONFIG.REQUIRE_ACTIVATION) {
      return { isLicensed: true, status: 'active', deviceId: null };
    }
    
    const deviceId = await getDeviceId();
    const licenseKey = await AsyncStorage.getItem(STORAGE_KEYS.LICENSE_KEY);
    const licenseStatus = await AsyncStorage.getItem(STORAGE_KEYS.LICENSE_STATUS);
    const activationDate = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVATION_DATE);
    
    // Check if trial period
    if (!licenseKey && !activationDate) {
      const firstInstall = await AsyncStorage.getItem('firstInstallDate');
      if (!firstInstall) {
        await AsyncStorage.setItem('firstInstallDate', new Date().toISOString());
        return { isLicensed: true, status: 'trial', daysLeft: LICENSE_CONFIG.TRIAL_DAYS, deviceId };
      }
      
      const installDate = new Date(firstInstall);
      const now = new Date();
      const daysElapsed = Math.floor((now - installDate) / (1000 * 60 * 60 * 24));
      const daysLeft = LICENSE_CONFIG.TRIAL_DAYS - daysElapsed;
      
      if (daysLeft > 0) {
        return { isLicensed: true, status: 'trial', daysLeft, deviceId };
      } else {
        return { isLicensed: false, status: 'expired', deviceId };
      }
    }
    
    // Check if license is valid
    if (licenseKey && licenseStatus === 'active') {
      const isValid = await validateLicenseKey(licenseKey, deviceId);
      if (isValid) {
        return { isLicensed: true, status: 'active', deviceId };
      }
    }
    
    return { isLicensed: false, status: 'inactive', deviceId };
  } catch (error) {
    console.error('Error checking license:', error);
    return { isLicensed: false, status: 'error', deviceId: null };
  }
};

/**
 * Deactivate license (for testing or transfer)
 */
export const deactivateLicense = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.LICENSE_KEY);
    await AsyncStorage.removeItem(STORAGE_KEYS.LICENSE_STATUS);
    await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVATION_DATE);
    return true;
  } catch (error) {
    console.error('Error deactivating license:', error);
    return false;
  }
};
