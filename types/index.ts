/**
 * Central Type Definitions for Brew-MEV
 */

// Wallet Types
export interface Wallet {
  publicKey: string;
  secretKey: Uint8Array;
}

export interface WalletWithBalance extends Wallet {
  balance: number;
}

// Settings Types
export interface Settings {
  network: NetworkType;
  rpcUrl: string;
  maxGasPrice?: number;
  slippage?: number;
  autoApprove?: boolean;
  walletPath?: string;
}

export type NetworkType = 'mainnet' | 'testnet' | 'devnet' | 'localnet';

// Transaction Types
export interface TransactionDetails {
  signature: string;
  blockTime?: number;
  confirmationStatus?: 'processed' | 'confirmed' | 'finalized';
  fee?: number;
}

export interface TransactionOptions {
  maxRetries?: number;
  skipPreflight?: boolean;
  preflightCommitment?: string;
  maxFee?: number;
}

// Bot Types
export interface BotConfig {
  enabled: boolean;
  walletIndex: number;
  strategy: BotStrategy;
  targetToken?: string;
  minProfitThreshold?: number;
  maxTransactionAmount?: number;
  runIntervalMs?: number;
}

export type BotStrategy = 
  | 'sandwich'
  | 'frontrun'
  | 'backrun'
  | 'arbitrage'
  | 'liquidation'
  | 'custom';

export interface BotStats {
  totalRuns: number;
  successfulTrades: number;
  failedTrades: number;
  totalProfit: number;
  runningTimeMs: number;
  lastRunTimestamp?: number;
}

// CLI Types
export interface CliOptions {
  interactive: boolean;
  verbose: boolean;
  configPath?: string;
}

export interface CliCommand {
  name: string;
  description: string;
  execute: (args: string[]) => Promise<void> | void;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Token Types
export interface Token {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logoURI?: string;
}

export interface TokenBalance {
  token: Token;
  balance: number;
  usdValue?: number;
}

// Exported type utility functions
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
}; 