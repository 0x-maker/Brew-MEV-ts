import * as crypto from 'crypto';
import { EncryptionResult } from '../types';

/**
 * Default encryption key based on app name
 * The user's unique fingerprint will be combined with this for better security
 */
const BASE_ENCRYPTION_KEY = 'Brew-MEV-SOLANA-AppSecurity';

/**
 * Generate a unique encryption key
 * @returns {string} The encryption key
 */
export function getEncryptionKey(): string {
  // In a CLI environment, we'll use a more basic approach
  // In production, consider a more secure key management approach
  const osInfo = process.platform + process.arch;
  const userInfo = process.env.USER || process.env.USERNAME || '';
  return `${BASE_ENCRYPTION_KEY}-${osInfo}-${userInfo}`;
}

/**
 * Get the default encryption key (alias for compatibility)
 * @returns {string} The encryption key
 */
export function getDefaultEncryptionKey(): string {
  return getEncryptionKey();
}

/**
 * Encrypt sensitive data
 * @param {string} data - Data to encrypt
 * @returns {EncryptionResult} Object containing IV and encrypted data
 */
export function encryptData(data: string): EncryptionResult {
  try {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(getEncryptionKey(), 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return {
      iv: iv.toString('hex'),
      encryptedData: encrypted
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Encrypt a private key (alias for compatibility)
 * @param {string} privateKey - Private key to encrypt
 * @returns {EncryptionResult} Object containing IV and encrypted data
 */
export function encryptPrivateKey(privateKey: string): EncryptionResult {
  return encryptData(privateKey);
}

/**
 * Decrypt sensitive data
 * @param {string} encryptedData - The encrypted data
 * @param {string} iv - The initialization vector
 * @returns {string} The decrypted data
 */
export function decryptData(encryptedData: string, iv: string): string {
  try {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(getEncryptionKey(), 'salt', 32);
    const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Decrypt a private key (alias for compatibility)
 * @param {string} encryptedPrivateKey - The encrypted private key
 * @param {string} iv - The initialization vector
 * @returns {string} The decrypted private key
 */
export function decryptPrivateKey(encryptedPrivateKey: string, iv: string): string {
  return decryptData(encryptedPrivateKey, iv);
}

/**
 * Check if a string is already encrypted
 * @param {string} data - The data to check
 * @returns {boolean} Whether the data is already encrypted
 */
export function isEncrypted(data: string): boolean {
  // AES encrypted strings are typically longer and contain specific characters
  if (!data || typeof data !== 'string') return false;
  return data.length > 50 && data.match(/^[A-Za-z0-9+/=]+$/) !== null;
} 