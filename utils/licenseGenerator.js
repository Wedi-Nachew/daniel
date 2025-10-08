/**
 * LICENSE KEY GENERATOR TOOL
 * 
 * This is for the APP OWNER ONLY to generate license keys for customers.
 * 
 * HOW TO USE:
 * 1. Customer installs the app and gets their Device ID
 * 2. Customer sends you their Device ID and Business Name
 * 3. Run this script to generate a license key for them
 * 4. Send the license key to the customer
 * 5. Customer enters the key in the app to activate
 */

import * as Crypto from 'expo-crypto';

const MASTER_KEY = 'MRP2024_MASTER_KEY_SECURE';

/**
 * Generate a license key for a customer
 * @param {string} deviceId - The customer's device ID
 * @param {string} businessName - The customer's business name (optional)
 * @returns {Promise<string>} The generated license key
 */
export const generateLicenseKeyForCustomer = async (deviceId, businessName = '') => {
  try {
    const timestamp = Date.now();
    const data = `${deviceId}-${businessName}-${timestamp}-${MASTER_KEY}`;
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      data
    );
    
    // Format: XXXX-XXXX-XXXX-XXXX
    const key = hash.substring(0, 16).toUpperCase();
    const formattedKey = `${key.substring(0, 4)}-${key.substring(4, 8)}-${key.substring(8, 12)}-${key.substring(12, 16)}`;
    
    console.log('='.repeat(60));
    console.log('LICENSE KEY GENERATED');
    console.log('='.repeat(60));
    console.log(`Device ID:     ${deviceId}`);
    console.log(`Business Name: ${businessName || 'N/A'}`);
    console.log(`License Key:   ${formattedKey}`);
    console.log(`Generated:     ${new Date().toLocaleString()}`);
    console.log('='.repeat(60));
    
    return formattedKey;
  } catch (error) {
    console.error('Error generating license key:', error);
    return null;
  }
};

/**
 * Example usage - uncomment and modify to generate keys
 */
/*
// Example 1: Generate key for a specific customer
const customerDeviceId = 'A1B2C3D4E5F6G7H8';
const customerBusinessName = 'ABC Mill House';
generateLicenseKeyForCustomer(customerDeviceId, customerBusinessName);

// Example 2: Generate multiple keys
const customers = [
  { deviceId: 'DEVICE123456789A', businessName: 'Mill House A' },
  { deviceId: 'DEVICE987654321B', businessName: 'Mill House B' },
];

customers.forEach(customer => {
  generateLicenseKeyForCustomer(customer.deviceId, customer.businessName);
});
*/

// For Node.js usage (if you want to run this outside the app)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { generateLicenseKeyForCustomer };
}
