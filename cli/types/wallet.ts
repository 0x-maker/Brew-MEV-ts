/**
 * Wallet information type definition
 */
export interface WalletInfo {
  address: string;
  encryptedPrivateKey: string; // Encrypted private key
  iv: string; // Initialization vector for decryption
  addressLink: string;
}

/**
 * Wallet Balance type definition
 */
export interface WalletBalance {
  address: string;
  balance: number; // In lamports
  balanceSol: number; // Formatted SOL value
}

/**
 * Private key encryption result
 */
export interface EncryptionResult {
  iv: string;
  encryptedData: string;
}

/**
 * Wallet operation result type
 */
export interface WalletOperationResult {
  success: boolean;
  message: string;
  data?: any;
} 