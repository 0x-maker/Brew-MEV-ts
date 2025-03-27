// Define PublicKey type for compatibility
type PublicKey = any;

/**
 * Bot transaction type definition
 */
export interface BotTransaction {
  id: string;
  type: 'buy' | 'sell';
  tokenAddress: string;
  tokenSymbol: string;
  amount: number;
  price: number;
  timestamp: number;
  isSuccessful: boolean;
  txHash?: string;
}

/**
 * Bot status type definition
 */
export interface BotStatus {
  running: boolean;
  startTime?: number;
  uptime?: number;
  transactionsCount: number;
  lastTransaction?: BotTransaction;
}

/**
 * Token data type definition
 */
export interface TokenData {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  totalSupply: number;
  marketCap?: number;
  price?: number;
  holder24hChange?: number;
  volume24h?: number;
  liquidity?: number;
  publicKey?: PublicKey;
  scamScore?: number;
}

/**
 * Trading parameters type definition
 */
export interface TradingParams {
  tokenAddress: string;
  amount: number; // In SOL
  slippage: number; // Percentage
  stopLoss?: number; // Percentage
  takeProfit?: number; // Percentage
}

/**
 * Bot operation result type
 */
export interface BotOperationResult {
  success: boolean;
  message: string;
  status?: BotStatus;
  data?: any;
} 