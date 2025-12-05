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
    const { encryptFields = [], ...rest } = config.data;
    const encrypted = { data: encryptData(rest) };
    encryptFields.forEach((field) => {
      if (rest[field] !== undefined) {
        encrypted[field] = encryptData(rest[field]);
      }
    });
    config.data = encrypted;
  }
  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use((response) => {
  if (enableEncryption && response.data && response.data.data) {
    const keyId = response.data.keyId || 'default';
    response.data = decryptData(response.data.data, keyId);
  }
  return response;
}, (error) => Promise.reject(error));

export default api;
