import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './constants';

export const loadReceipts = async () => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.RECEIPTS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading receipts:', error);
    return [];
  }
};

export const saveReceipts = async (receipts) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(receipts));
    return true;
  } catch (error) {
    console.error('Error saving receipts:', error);
    return false;
  }
};

export const loadBusiness = async () => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.BUSINESS);
    return stored ? JSON.parse(stored) : { name: '', phone: '', address: '', logo: null };
  } catch (error) {
    console.error('Error loading business:', error);
    return { name: '', phone: '', address: '', logo: null };
  }
};

export const saveBusiness = async (business) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.BUSINESS, JSON.stringify(business));
    return true;
  } catch (error) {
    console.error('Error saving business:', error);
    return false;
  }
};

export const loadLanguage = async () => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.LANG);
    return stored || 'en';
  } catch (error) {
    console.error('Error loading language:', error);
    return 'en';
  }
};

export const saveLanguage = async (lang) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.LANG, lang);
    return true;
  } catch (error) {
    console.error('Error saving language:', error);
    return false;
  }
};

export const loadSecurity = async () => {
  try {
    const pin = await AsyncStorage.getItem(STORAGE_KEYS.OWNER_PIN);
    const question = await AsyncStorage.getItem(STORAGE_KEYS.SECURITY_QUESTION);
    const answer = await AsyncStorage.getItem(STORAGE_KEYS.SECURITY_ANSWER);
    const question2 = await AsyncStorage.getItem(STORAGE_KEYS.SECURITY_QUESTION_2);
    const answer2 = await AsyncStorage.getItem(STORAGE_KEYS.SECURITY_ANSWER_2);
    return { pin, question, answer, question2, answer2 };
  } catch (error) {
    console.error('Error loading security:', error);
    return { pin: null, question: null, answer: null, question2: null, answer2: null };
  }
};

export const saveSecurity = async (pin, question, answer, question2, answer2) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.OWNER_PIN, pin);
    await AsyncStorage.setItem(STORAGE_KEYS.SECURITY_QUESTION, question);
    await AsyncStorage.setItem(STORAGE_KEYS.SECURITY_ANSWER, answer);
    await AsyncStorage.setItem(STORAGE_KEYS.SECURITY_QUESTION_2, question2);
    await AsyncStorage.setItem(STORAGE_KEYS.SECURITY_ANSWER_2, answer2);
    return true;
  } catch (error) {
    console.error('Error saving security:', error);
    return false;
  }
};

export const loadInventory = async () => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.INVENTORY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading inventory:', error);
    return [];
  }
};

export const deleteReceipt = async (receiptId) => {
  try {
    const receipts = await loadReceipts();
    const filteredReceipts = receipts.filter(r => r.id !== receiptId);
    await saveReceipts(filteredReceipts);
    return true;
  } catch (error) {
    console.error('Error deleting receipt:', error);
    return false;
  }
};

export const clearAllReceipts = async () => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify([]));
    return true;
  } catch (error) {
    console.error('Error clearing all receipts:', error);
    return false;
  }
};

export const saveInventory = async (inventory) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
    return true;
  } catch (error) {
    console.error('Error saving inventory:', error);
    return false;
  }
};
