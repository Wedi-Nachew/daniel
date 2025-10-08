import * as Crypto from 'expo-crypto';

const SALT = 'salt_2024';

export const hashPin = async (pin) => {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    pin + SALT
  );
};

export const hashAnswer = async (answer) => {
  // Lowercase for case-insensitive comparison
  const normalizedAnswer = answer.toLowerCase().trim();
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    normalizedAnswer + SALT
  );
};
