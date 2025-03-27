import { AES, enc } from 'crypto-js';

// Default encryption key based on app name (in production should use a more secure approach)
// The user's unique fingerprint will be combined with this for better security
const BASE_ENCRYPTION_KEY = 'MeV-BoT-SOLANA-AppSecurity';

/**
 * Generate a unique encryption key for the user
 * Combines BASE_ENCRYPTION_KEY with user-specific factors for improved security
 */
export function getEncryptionKey(): string {
  if (typeof window === 'undefined') {
    return BASE_ENCRYPTION_KEY; // Fallback for server-side
  }

  // Use a combination of factors to create a unique encryption key
  // This isn't perfect security but better than plaintext
  const userAgent = window.navigator.userAgent;
  const language = window.navigator.language;
  const screenWidth = window.screen.width.toString();
  const screenHeight = window.screen.height.toString();
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  
  // Combine with app key
  return `${BASE_ENCRYPTION_KEY}-${userAgent}-${language}-${screenWidth}x${screenHeight}-${timeZone}`;
}

/**
 * Encrypt sensitive data
 */
export function encryptData(data: string): string {
  try {
    const key = getEncryptionKey();
    return AES.encrypt(data, key).toString();
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt sensitive data
 */
export function decryptData(encryptedData: string): string {
  try {
    const key = getEncryptionKey();
    const bytes = AES.decrypt(encryptedData, key);
    return bytes.toString(enc.Utf8);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Check if a string is already encrypted
 * Basic check to prevent double encryption
 */
export function isEncrypted(data: string): boolean {
  // AES encrypted strings by crypto-js are typically longer and contain specific characters
  if (!data || typeof data !== 'string') return false;
  return data.length > 50 && data.match(/^[A-Za-z0-9+/=]+$/) !== null;
}

/**
 * Migrate unencrypted data to encrypted format
 * Used for upgrading existing wallets
 */
export function migrateToEncrypted(data: any[]): any[] {
  if (!Array.isArray(data)) return [];
  
  return data.map(item => {
    // If the item has a privateKey property that's not encrypted
    if (item && item.privateKey && !isEncrypted(item.privateKey)) {
      return {
        ...item,
        privateKey: encryptData(item.privateKey)
      };
    }
    return item;
  });
} 