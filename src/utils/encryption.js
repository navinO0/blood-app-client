// Client-side Encryption Utility using Web Crypto API (AES-GCM)
// Compatible with Node.js crypto.createCipheriv('aes-256-gcm')

const getEncryptionKeyHex = () => {
    return process.env.NEXT_PUBLIC_ENCRYPTION_KEY_HEX;
};

const getEncryptedFields = () => {
    try {
        return JSON.parse(process.env.NEXT_PUBLIC_ENCRYPTED_FIELDS || '[]');
    } catch (e) {
        console.error("Failed to parse ENCRYPTED_FIELDS", e);
        return [];
    }
};

const hexToBytes = (hex) => {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes;
};

const base64ToBytes = (base64) => {
    const binaryValidation = atob(base64);
    const len = binaryValidation.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryValidation.charCodeAt(i);
    }
    return bytes;
};

const bytesToBase64 = (bytes) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
};

// Import key for Web Crypto
const importKey = async (keyHex) => {
    const keyBytes = hexToBytes(keyHex);
    return await window.crypto.subtle.importKey(
        "raw",
        keyBytes,
        { name: "AES-GCM" },
        false,
        ["encrypt", "decrypt"]
    );
};

export const encryptData = async (text) => {
    if (text === null || text === undefined) return text;
    try {
        const keyHex = getEncryptionKeyHex();
        if (!keyHex) throw new Error("Encryption key missing");

        const key = await importKey(keyHex);
        const encodedText = new TextEncoder().encode(text);
        
        // Generate 12-byte IV
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        
        const encryptedBuffer = await window.crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv },
            key,
            encodedText
        );
        
        // Web Crypto encrypt returns Ciphertext + AuthTag appended
        const encryptedBytes = new Uint8Array(encryptedBuffer);
        
        return bytesToBase64(iv) + ":" + bytesToBase64(encryptedBytes);
    } catch (error) {
        console.error("Encryption failed:", error);
        return text; // Return original on failure to avoid UI breakage
    }
};

export const decryptData = async (encryptedString) => {
    if (encryptedString === null || encryptedString === undefined) return encryptedString;
    try {
        const keyHex = getEncryptionKeyHex();
        if (!keyHex) return encryptedString;

        if (typeof encryptedString !== 'string') return encryptedString;

        const parts = encryptedString.split(":");
        if (parts.length !== 2) return encryptedString;

        const [ivBase64, dataBase64] = parts;
        const iv = base64ToBytes(ivBase64);
        const data = base64ToBytes(dataBase64);

        const key = await importKey(keyHex);
        
        const decryptedBuffer = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv },
            key,
            data
        );

        return new TextDecoder().decode(decryptedBuffer);
    } catch (error) {
        console.error("Decryption failed:", error);
        return encryptedString;
    }
};

// Recursive Object Encryption
export const encryptObject = async (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    const encKeys = getEncryptedFields();

    if (Array.isArray(obj)) {
        return Promise.all(obj.map(item => encryptObject(item)));
    }

    const newObj = { ...obj };
    
    for (let key in newObj) {
        if (!newObj.hasOwnProperty(key)) continue;

        if (encKeys.includes(key) && typeof newObj[key] === "string") {
            newObj[key] = await encryptData(newObj[key]);
        } else if (newObj[key] && typeof newObj[key] === "object") {
            newObj[key] = await encryptObject(newObj[key]);
        }
    }
    return newObj;
};

// Recursive Object Decryption
export const decryptObject = async (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    const decKeys = getEncryptedFields();

    if (Array.isArray(obj)) {
        return Promise.all(obj.map(item => decryptObject(item)));
    }

    const newObj = { ...obj };

    for (let key in newObj) {
        if (!newObj.hasOwnProperty(key)) continue;

        if (decKeys.includes(key) && typeof newObj[key] === "string") {
            newObj[key] = await decryptData(newObj[key]);
        } else if (newObj[key] && typeof newObj[key] === "object") {
            newObj[key] = await decryptObject(newObj[key]);
        }
    }
    return newObj;
};
