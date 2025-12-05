import axios from 'axios';
import { encryptData, decryptData } from './crypto';

// Toggle via env (default true for backward compatibility)
const enableEncryption = process.env.NEXT_PUBLIC_ENABLE_ENCRYPTION !== 'false';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api` : 'http://localhost:5000/api',
});

import { getSession } from 'next-auth/react';

api.interceptors.request.use(async (config) => {
  const session = await getSession();
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  } else {
    // Fallback to localStorage for legacy or if session is missing but token exists (unlikely in this flow)
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
  }

  if (enableEncryption && config.data) {
    // Support optional encryptFields array to encrypt specific fields separately
    // Support encryptionKeyId to specify which key to use (default, sensitive, critical)
    const { encryptFields = [], encryptionKeyId = 'default', ...rest } = config.data;
    
    // Set the key ID in a custom header so the server knows which key to use for decryption
    config.headers['X-Encryption-Key-Id'] = encryptionKeyId;
    
    // Encrypt the values recursively while keeping the object structure intact
    // This satisfies "api are failing keep schema same" & "only encrypt the values"
    config.data = encryptObjectValues(rest, encryptionKeyId);

    // We no longer need to check for encryptFields since we are encrypting everything recursively as per "encrypt values in the payload" request
    // If selective field encryption is absolutely required later, we can modify encryptObjectValues to accept a whitelist.
  }
  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use((response) => {
  if (enableEncryption && response.data) {
    // Check header for keyId, or default
    const keyId = response.headers['x-encryption-key-id'] || 'default';
    
    // Decrypt the values recursively
    response.data = decryptObjectValues(response.data, keyId);
    
    // Handle the legacy case where response might be { data: "ciphertext" } (if we just switched server)
    // Actually, decryptObjectValues handles objects, so if response.data IS the object wrapper, it will decrypt values inside. 
    // If response.data is just the data object (as per "keep schema same"), it will walk it.
    // If response.data was { data: ... } previously, that structure is gone now.
  }
  return response;
}, (error) => Promise.reject(error));

export default api;
