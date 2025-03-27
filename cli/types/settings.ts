/**
 * Bot settings type definition
 */
export interface BotSettings {
  marketCap: number;
  slTp: {
    stopLoss: number;
    takeProfit: number;
  };
  autoBuy: {
    enabled: boolean;
    mode: 'fixed' | 'percentage' | null;
    minAmount: number;
    maxAmount: number;
  };
  selectedDex: 'Pump.FUN' | 'Raydium' | 'Jupiter' | 'ALL';
  additionalDexes: {
    [key: string]: {
      enabled: boolean;
      apiUrl: string;
      feeStructure: {
        takerFee: number;
        makerFee: number;
      };
    };
  };
}

/**
 * Settings operation result type
 */
export interface SettingsOperationResult {
  success: boolean;
  message: string;
  settings?: BotSettings;
} 