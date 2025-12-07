import axios from 'axios';
import { encryptObject, decryptObject } from './encryption';
import { getSession } from 'next-auth/react';

// Toggle via env
const enableEncryption = process.env.NEXT_PUBLIC_ENABLE_ENCRYPTION === 'true';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api` : 'http://localhost:5000/api',
});

api.interceptors.request.use(async (config) => {
  const session = await getSession();
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  } else {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
  }

  if (enableEncryption && config.data) {
     console.log('API Request - Encrypting:', { enableEncryption, data: config.data }); // Debug Log
     try {
         // Encrypt specific fields in the body
         config.data = await encryptObject(config.data);
         console.log('API Request - Encrypted Data:', config.data); // Debug Log
     } catch (err) {
         console.error("Encryption in interceptor failed", err);
     }
  }
  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use(async (response) => {
  if (enableEncryption && response.data) {
    console.log('API Response - Decrypting:', { enableEncryption }); // Debug Log
    try {
        // Decrypt specific fields in the response
        response.data = await decryptObject(response.data);
    } catch (err) {
        console.error("Decryption in interceptor failed", err);
    }
  }
  return response;
}, (error) => Promise.reject(error));

export default api;
