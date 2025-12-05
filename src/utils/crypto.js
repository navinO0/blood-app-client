import CryptoJS from 'crypto-js';

// Default key (fallback) and optional key map for future extra keys
const defaultKey = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'default_secret_key_for_dev';
const sensitiveKey = process.env.NEXT_PUBLIC_SENSITIVE_KEY || 'sensitive_data_secret_key_123';
const criticalKey = process.env.NEXT_PUBLIC_CRITICAL_KEY || 'critical_financial_key_456';

const keyMap = {
  default: defaultKey,
  sensitive: sensitiveKey,
  critical: criticalKey,
  // Add additional keys here
};

/**
 * Encrypt data using a specific key identifier (default if omitted).
 * @param {any} data - Data to encrypt.
 * @param {string} [keyId='default'] - Identifier of the key to use.
 * @returns {string} Encrypted ciphertext.
 */
export const encryptData = (data, keyId = 'default') => {
  if (!data) return data;
  const key = keyMap[keyId] || defaultKey;
  return CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
};

/**
 * Decrypt data using a specific key identifier (default if omitted).
 * @param {string} ciphertext - Encrypted string.
 * @param {string} [keyId='default'] - Identifier of the key to use.
 * @returns {any} Decrypted object or null on failure.
 */
export const decryptData = (ciphertext, keyId = 'default') => {
  if (!ciphertext) return ciphertext;
  try {
    const key = keyMap[keyId] || defaultKey;
    const bytes = CryptoJS.AES.decrypt(ciphertext, key);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  } catch (error) {
    console.error('Decryption error:', error.message);
    return null;
  }
};

export const encryptObjectValues = (obj, keyId = 'default') => {
  if (obj === null || obj === undefined) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => encryptObjectValues(item, keyId));
  }
  
  if (typeof obj === 'object' && obj !== null) {
    const newObj = {};
    for (const key in obj) {
      if (Object.hasOwn(obj, key)) {
        newObj[key] = encryptObjectValues(obj[key], keyId);
      }
    }
    return newObj;
  }
  
  // Primitives (string, number, boolean)
  return encryptData(obj, keyId);
};

export const decryptObjectValues = (obj, keyId = 'default') => {
  if (obj === null || obj === undefined) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => decryptObjectValues(item, keyId));
  }
  
  if (typeof obj === 'object' && obj !== null) {
    const newObj = {};
    for (const key in obj) {
      if (Object.hasOwn(obj, key)) {
        newObj[key] = decryptObjectValues(obj[key], keyId);
      }
    }
    return newObj;
  }
  
  // Assume it's a primitive encrypted string
  if (typeof obj === 'string') {
     const decrypted = decryptData(obj, keyId);
     return decrypted !== null ? decrypted : obj;
  }
  
  return obj;
};
