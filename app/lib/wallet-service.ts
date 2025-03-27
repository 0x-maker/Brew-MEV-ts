// Import libs using require for compatibility
const bs58 = require('bs58');
const solanaWeb3 = require('@solana/web3.js');
const Keypair = solanaWeb3.Keypair;
import { encryptData, decryptData, isEncrypted, migrateToEncrypted } from './crypto-utils';

// Define wallet info interface
export interface WalletInfo {
  address: string;
  privateKey: string; // Now stores encrypted private key
  addressLink: string;
}

// Keypair type for TypeScript compatibility
type KeypairType = typeof Keypair.prototype;

// Constants
const WALLET_STORAGE_KEY = 'mev-bot-wallets';
const ACTIVE_WALLET_KEY = 'mev-bot-active-wallet';
const EXPLORER_BASE_URL = 'https://solscan.io/account/';

/**
 * Check if we're running in a browser environment
 */
const isBrowser = (): boolean => {
  return typeof window !== 'undefined';
};

/**
 * Initialize wallets if they don't exist
 */
export function initializeWallets(): void {
  if (!isBrowser()) return;
  
  try {
    // Check if we have any wallets stored
    const storedWallets = localStorage.getItem(WALLET_STORAGE_KEY);
    let wallets = storedWallets ? JSON.parse(storedWallets) : [];
    
    // Check if we need to encrypt existing wallets (for existing users)
    if (wallets.length > 0) {
      const needsMigration = wallets.some((w: WalletInfo) => w.privateKey && !isEncrypted(w.privateKey));
      if (needsMigration) {
        console.log('Migrating wallet private keys to encrypted format');
        wallets = migrateToEncrypted(wallets);
        localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(wallets));
      }
    }
    
    if (wallets.length === 0) {
      // If no wallets exist, create one
      console.log('No wallets found, generating a new one');
      const wallet = generateNewWallet();
      
      // Make sure the storage was updated correctly
      const updatedWallets = getAllWallets();
      if (updatedWallets.length > 0) {
        // Set it as active
        setActiveWallet(0);
      }
    } else {
      // Check if an active wallet is set
      const activeWalletIndex = localStorage.getItem(ACTIVE_WALLET_KEY);
      if (!activeWalletIndex && wallets.length > 0) {
        // No active wallet set but we have wallets, set the first one as active
        console.log('No active wallet set, setting the first wallet as active');
        setActiveWallet(0);
      }
    }
  } catch (error) {
    console.error('Error initializing wallets:', error);
    
    // If there was an error parsing the stored wallets, reset and create a new one
    try {
      localStorage.removeItem(WALLET_STORAGE_KEY);
      localStorage.removeItem(ACTIVE_WALLET_KEY);
      
      // Generate a new wallet and set it as active
      const wallet = generateNewWallet();
      setActiveWallet(0);
    } catch (resetError) {
      console.error('Failed to reset wallets after error:', resetError);
    }
  }
}

/**
 * Generate a new Solana wallet
 */
export function generateNewWallet(): WalletInfo {
  try {
    // Generate a new Solana keypair
    const keypair = Keypair.generate();
    
    // Convert the secret key to base58 (private key)
    const privateKeyPlaintext = bs58.encode(keypair.secretKey);
    
    // Encrypt the private key before storing
    const privateKey = encryptData(privateKeyPlaintext);
    
    // Get the public key (address)
    const address = keypair.publicKey.toString();
    
    // Create link to block explorer
    const addressLink = `${EXPLORER_BASE_URL}${address}`;
    
    // Create the wallet info object
    const walletInfo: WalletInfo = {
      address,
      privateKey,
      addressLink
    };
    
    // Save to storage
    saveWallet(walletInfo);
    
    return walletInfo;
  } catch (error) {
    console.error('Error generating wallet:', error);
    throw new Error('Failed to generate new wallet');
  }
}

/**
 * Import a wallet from a private key
 */
export function importWalletFromPrivateKey(privateKeyPlaintext: string): WalletInfo {
  try {
    // Decode the base58 private key
    const secretKey = bs58.decode(privateKeyPlaintext);
    
    // Create keypair from secret key
    const keypair = Keypair.fromSecretKey(secretKey);
    
    // Get the public key (address)
    const address = keypair.publicKey.toString();
    
    // Create link to block explorer
    const addressLink = `${EXPLORER_BASE_URL}${address}`;
    
    // Encrypt the private key before storing
    const privateKey = encryptData(privateKeyPlaintext);
    
    // Create the wallet info object
    const walletInfo: WalletInfo = {
      address,
      privateKey,
      addressLink
    };
    
    // Check if wallet already exists
    const existingWallets = getAllWallets();
    const exists = existingWallets.some(w => w.address === address);
    
    if (exists) {
      throw new Error('Wallet already exists');
    }
    
    // Save to storage
    saveWallet(walletInfo);
    
    return walletInfo;
  } catch (error) {
    console.error('Error importing wallet:', error);
    throw new Error('Invalid private key or import failed');
  }
}

/**
 * Get wallet keypair for signing transactions
 */
export function getWalletKeypair(walletIndex?: number): any | null {
  if (!isBrowser()) return null;
  
  let wallet: WalletInfo | null;
  
  if (walletIndex !== undefined) {
    const wallets = getAllWallets();
    wallet = wallets[walletIndex] || null;
  } else {
    wallet = getActiveWallet();
  }
  
  if (!wallet) return null;
  
  try {
    // Decrypt the private key
    const decryptedPrivateKey = decryptData(wallet.privateKey);
    
    // Convert from base58 to Uint8Array
    const secretKey = bs58.decode(decryptedPrivateKey);
    
    return Keypair.fromSecretKey(secretKey);
  } catch (error) {
    console.error('Error getting keypair:', error);
    return null;
  }
}

/**
 * Save a wallet to local storage
 */
function saveWallet(wallet: WalletInfo): void {
  if (!isBrowser()) return;
  
  // Get existing wallets
  const wallets = getAllWallets();
  
  // Add new wallet
  wallets.push(wallet);
  
  // Save to storage
  localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(wallets));
}

/**
 * Get all wallets from storage
 */
export function getAllWallets(): WalletInfo[] {
  if (!isBrowser()) {
    // In server context, return an empty array
    // The client will handle wallet creation
    return [];
  }
  
  try {
    const storedWallets = localStorage.getItem(WALLET_STORAGE_KEY);
    return storedWallets ? JSON.parse(storedWallets) : [];
  } catch (error) {
    console.error('Error parsing wallets from localStorage:', error);
    return [];
  }
}

/**
 * Get the active wallet
 */
export function getActiveWallet(): WalletInfo | null {
  if (!isBrowser()) {
    // In server context, return null
    // The client will handle wallet creation
    return null;
  }
  
  try {
    const activeWalletIndex = localStorage.getItem(ACTIVE_WALLET_KEY);
    if (!activeWalletIndex) return null;
    
    const wallets = getAllWallets();
    const index = parseInt(activeWalletIndex, 10);
    
    return wallets[index] || null;
  } catch (error) {
    console.error('Error getting active wallet:', error);
    return null;
  }
}

/**
 * Set the active wallet by index
 */
export function setActiveWallet(index: number): void {
  if (!isBrowser()) return;
  
  const wallets = getAllWallets();
  if (index >= wallets.length) {
    throw new Error('Invalid wallet index');
  }
  
  localStorage.setItem(ACTIVE_WALLET_KEY, index.toString());
}

/**
 * Remove a wallet by index
 */
export function removeWallet(index: number): void {
  if (!isBrowser()) return;
  
  const wallets = getAllWallets();
  
  if (index >= wallets.length) {
    throw new Error('Invalid wallet index');
  }
  
  // Check if this is the active wallet
  const activeWalletIndex = localStorage.getItem(ACTIVE_WALLET_KEY);
  if (activeWalletIndex && parseInt(activeWalletIndex, 10) === index) {
    // If we're removing the active wallet, set a new active wallet
    if (wallets.length > 1) {
      // Set the next wallet as active, or the previous if this is the last wallet
      const newActiveIndex = index === wallets.length - 1 ? index - 1 : index;
      localStorage.setItem(ACTIVE_WALLET_KEY, newActiveIndex.toString());
    } else {
      // If this is the only wallet, clear the active wallet
      localStorage.removeItem(ACTIVE_WALLET_KEY);
    }
  } else if (activeWalletIndex && parseInt(activeWalletIndex, 10) > index) {
    // If we're removing a wallet before the active wallet, decrement the active wallet index
    localStorage.setItem(ACTIVE_WALLET_KEY, (parseInt(activeWalletIndex, 10) - 1).toString());
  }
  
  // Remove the wallet
  wallets.splice(index, 1);
  
  // Save the updated list
  localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(wallets));
}

/**
 * Load wallet info for the API routes
 */
export async function loadWalletInfo(): Promise<WalletInfo | null> {
  // Simply return the active wallet in the client context
  // In server context, this would ideally load from a secure storage or DB
  // But for this implementation, we're returning the active wallet
  return getActiveWallet();
}

/**
 * Start the bot operation (for API route)
 */
export async function startBot(): Promise<boolean> {
  try {
    // This is a placeholder for actual bot starting logic
    // In a real implementation, this would start the bot service
    console.log('Starting bot operation...');
    return true;
  } catch (error) {
    console.error('Error starting bot:', error);
    return false;
  }
}

/**
 * Withdraw from bot (for API route)
 */
export async function withdrawFromBot(
  withdrawalAddress: string,
  amount: number
): Promise<boolean> {
  try {
    // This is a placeholder for actual withdrawal logic
    // In a real implementation, this would send funds to the withdrawal address
    console.log(`Withdrawing ${amount} SOL to ${withdrawalAddress}...`);
    return true;
  } catch (error) {
    console.error('Error withdrawing from bot:', error);
    return false;
  }
} 