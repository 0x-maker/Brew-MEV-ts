import * as fs from 'fs';
// Import bs58 and solana web3 using require for compatibility
const bs58 = require('bs58');
const solanaWeb3 = require('@solana/web3.js');
const Keypair = solanaWeb3.Keypair;
const Connection = solanaWeb3.Connection;
const clusterApiUrl = solanaWeb3.clusterApiUrl;
const PublicKey = solanaWeb3.PublicKey;
const LAMPORTS_PER_SOL = solanaWeb3.LAMPORTS_PER_SOL;
import { encryptData, decryptData, isEncrypted } from './crypto';
import { WalletInfo, WalletBalance, WalletOperationResult } from '../types';
import chalk from 'chalk';

// Constants
const WALLET_FILE = 'brew-mev-wallet.json';
const IMPORT_WALLET_FILE = 'brew-mev-imported-wallet.json';
const EXPLORER_BASE_URL = 'https://solscan.io/account/';

/**
 * Current wallet info (in-memory)
 */
let currentWallet: WalletInfo | null = null;

/**
 * Interface for legacy wallet format
 */
interface LegacyWalletInfo {
  address: string;
  privateKey: string;
  addressLink: string;
}

/**
 * Create a wallet (alias for compatibility with brew.js)
 * @returns {Promise<any>} Wallet info
 */
export async function createWallet(): Promise<any> {
  const result = generateNewWallet();
  if (result.success && result.data) {
    return {
      address: result.data.address,
      addressLink: result.data.addressLink
    };
  }
  throw new Error(result.message || 'Failed to create wallet');
}

/**
 * Generate a new Solana wallet
 * @returns {WalletOperationResult} Result of the operation
 */
export function generateNewWallet(): WalletOperationResult {
  try {
    // Generate a new Solana keypair
    const keypair = Keypair.generate();
    
    // Convert the secret key to base58 (private key)
    const privateKeyPlaintext = bs58.encode(Buffer.from(keypair.secretKey));
    
    // Encrypt the private key before storing
    const { iv, encryptedData } = encryptData(privateKeyPlaintext);
    
    // Get the public key (address)
    const address = keypair.publicKey.toString();
    
    // Create link to block explorer
    const addressLink = `${EXPLORER_BASE_URL}${address}`;
    
    // Create the wallet info object
    const walletInfo: WalletInfo = {
      address,
      encryptedPrivateKey: encryptedData,
      iv,
      addressLink
    };
    
    // Save to storage
    saveWalletInfo(walletInfo);
    
    // Set as current wallet
    currentWallet = walletInfo;
    
    return {
      success: true,
      message: 'New wallet created successfully',
      data: {
        address,
        addressLink
      }
    };
  } catch (error) {
    console.error('Error generating wallet:', error);
    return {
      success: false,
      message: 'Failed to generate new wallet'
    };
  }
}

/**
 * Import a wallet from a private key
 * @param {string} privateKeyPlaintext - The base58 encoded private key
 * @returns {WalletOperationResult} Result of the operation
 */
export function importWalletFromPrivateKey(privateKeyPlaintext: string): WalletOperationResult {
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
    const { iv, encryptedData } = encryptData(privateKeyPlaintext);
    
    // Create the wallet info object
    const walletInfo: WalletInfo = {
      address,
      encryptedPrivateKey: encryptedData,
      iv,
      addressLink
    };
    
    // Check if wallet already exists
    const existingWallets = loadAllWallets();
    const exists = existingWallets.some(w => w.address === address);
    
    if (exists) {
      return {
        success: false,
        message: 'Wallet already exists'
      };
    }
    
    // Save to storage
    saveImportedWalletInfo(walletInfo);
    
    // Set as current wallet
    currentWallet = walletInfo;
    
    return {
      success: true,
      message: 'Wallet imported successfully',
      data: {
        address,
        addressLink
      }
    };
  } catch (error) {
    console.error('Error importing wallet:', error);
    return {
      success: false,
      message: 'Invalid private key or import failed'
    };
  }
}

/**
 * Get wallet keypair for signing transactions
 * @returns {typeof Keypair | null} The keypair or null if no wallet is loaded
 */
export function getWalletKeypair(): typeof Keypair | null {
  if (!currentWallet) return null;
  
  try {
    // Decrypt the private key
    const decryptedPrivateKey = decryptData(
      currentWallet.encryptedPrivateKey, 
      currentWallet.iv
    );
    
    // Convert from base58 to Uint8Array
    const secretKey = bs58.decode(decryptedPrivateKey);
    
    return Keypair.fromSecretKey(secretKey);
  } catch (error) {
    console.error('Error getting keypair:', error);
    return null;
  }
}

/**
 * Save wallet info to file
 * @param {WalletInfo} wallet - The wallet info to save
 */
function saveWalletInfo(wallet: WalletInfo): void {
  try {
    fs.writeFileSync(WALLET_FILE, JSON.stringify(wallet, null, 4), 'utf-8');
    console.log(chalk.green('Wallet saved to file:'), chalk.blueBright(fs.realpathSync(WALLET_FILE)));
    console.log(chalk.green('Private key is encrypted for security.'));
  } catch (error) {
    console.error('Error saving wallet:', error);
    throw new Error('Failed to save wallet');
  }
}

/**
 * Save imported wallet info to file
 * @param {WalletInfo} wallet - The wallet info to save
 */
function saveImportedWalletInfo(wallet: WalletInfo): void {
  try {
    fs.writeFileSync(IMPORT_WALLET_FILE, JSON.stringify(wallet, null, 4), 'utf-8');
    console.log(chalk.green('Imported wallet saved to file:'), chalk.blueBright(fs.realpathSync(IMPORT_WALLET_FILE)));
    console.log(chalk.green('Private key is encrypted for security.'));
  } catch (error) {
    console.error('Error saving imported wallet:', error);
    throw new Error('Failed to save imported wallet');
  }
}

/**
 * Load wallet file
 * @param {string} filePath - Path to the wallet file
 * @returns {WalletInfo | null} The wallet info or null if file doesn't exist or is invalid
 */
function loadWalletFile(filePath: string): WalletInfo | null {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    const data = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(data);
    
    // Handle legacy format with plaintext private key
    if (parsed && typeof parsed === 'object' && 'address' in parsed) {
      // If it has the old privateKey property instead of encryptedPrivateKey
      if ('privateKey' in parsed && !('encryptedPrivateKey' in parsed)) {
        console.log(chalk.yellow('Converting wallet to encrypted format...'));
        const legacyWallet = parsed as LegacyWalletInfo;
        const { iv, encryptedData } = encryptData(legacyWallet.privateKey);
        
        const updatedWallet: WalletInfo = {
          address: legacyWallet.address,
          encryptedPrivateKey: encryptedData,
          iv: iv,
          addressLink: legacyWallet.addressLink
        };
        
        // Save the updated wallet with encryption
        fs.writeFileSync(filePath, JSON.stringify(updatedWallet, null, 4), 'utf-8');
        return updatedWallet;
      }
      
      return parsed as WalletInfo;
    }
    
    console.log(chalk.red(`Wallet file '${filePath}' is corrupted or invalid.`));
    return null;
  } catch (error) {
    console.error(`Error loading wallet from '${filePath}':`, error);
    return null;
  }
}

/**
 * Load all wallets from storage
 * @returns {WalletInfo[]} Array of wallet infos
 */
export function loadAllWallets(): WalletInfo[] {
  const mainWallet = loadWalletFile(WALLET_FILE);
  const importedWallet = loadWalletFile(IMPORT_WALLET_FILE);
  
  const wallets: WalletInfo[] = [];
  
  if (mainWallet) wallets.push(mainWallet);
  if (importedWallet) wallets.push(importedWallet);
  
  return wallets;
}

/**
 * Choose wallet to use
 * @returns {WalletOperationResult} Result of the operation
 */
export function chooseWallet(index: number): WalletOperationResult {
  const wallets = loadAllWallets();
  
  if (wallets.length === 0) {
    return {
      success: false,
      message: 'No wallets available. Please create or import a wallet first.'
    };
  }
  
  if (index < 0 || index >= wallets.length) {
    return {
      success: false,
      message: `Invalid wallet index. Available wallets: 0-${wallets.length - 1}`
    };
  }
  
  currentWallet = wallets[index];
  
  return {
    success: true,
    message: `Wallet ${currentWallet.address} selected`,
    data: {
      address: currentWallet.address,
      addressLink: currentWallet.addressLink
    }
  };
}

/**
 * Get current wallet info
 * @returns {WalletInfo | null} Current wallet info or null if no wallet is loaded
 */
export function getCurrentWallet(): WalletInfo | null {
  return currentWallet;
}

/**
 * Get wallet balance
 * @returns {Promise<WalletBalance | null>} Wallet balance or null if no wallet is loaded
 */
export async function getWalletBalance(): Promise<WalletBalance | null> {
  if (!currentWallet) return null;
  
  try {
    const publicKey = new PublicKey(currentWallet.address);
    const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');
    const balance = await connection.getBalance(publicKey);
    
    return {
      address: currentWallet.address,
      balance: balance,
      balanceSol: balance / LAMPORTS_PER_SOL
    };
  } catch (error) {
    console.error('Error getting balance:', error);
    return null;
  }
} 