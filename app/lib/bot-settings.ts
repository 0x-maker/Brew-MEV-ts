// Define the bot settings interface
export interface BotSettings {
  marketCapFilter: number;
  stopLoss: number;
  takeProfit: number;
  preferredDex: 'raydium' | 'orca' | 'jupiter' | 'auto';
  autoBuy: boolean;
  autoBuyAmount: number;
  maxBuyAmount: number;
  defaultSlippage: number;
}

// Default settings
const DEFAULT_SETTINGS: BotSettings = {
  marketCapFilter: 1000000,  // 1M USD
  stopLoss: 5,               // 5%
  takeProfit: 15,            // 15%
  preferredDex: 'auto',
  autoBuy: false,
  autoBuyAmount: 0.1,        // 0.1 SOL
  maxBuyAmount: 1,           // 1 SOL
  defaultSlippage: 0.5       // 0.5%
};

// Storage key for settings
const SETTINGS_STORAGE_KEY = 'mev-bot-settings';

/**
 * Check if we're running in a browser environment
 */
const isBrowser = (): boolean => {
  return typeof window !== 'undefined';
};

/**
 * Save bot settings to local storage
 */
export function saveBotSettings(settings: BotSettings): void {
  if (!isBrowser()) return;
  
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

/**
 * Get bot settings from local storage
 * Returns default settings if none are stored
 */
export function getBotSettings(): BotSettings {
  if (!isBrowser()) return DEFAULT_SETTINGS;
  
  const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
  if (!storedSettings) {
    // If no settings exist, save and return default settings
    saveBotSettings(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }
  
  try {
    const settings = JSON.parse(storedSettings);
    // Merge with default settings in case the stored settings are missing some properties
    return { ...DEFAULT_SETTINGS, ...settings };
  } catch (error) {
    console.error('Error parsing stored settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Update bot settings with partial updates
 */
export function updateBotSettings(partialSettings: Partial<BotSettings>): BotSettings {
  const currentSettings = getBotSettings();
  const updatedSettings = { ...currentSettings, ...partialSettings };
  saveBotSettings(updatedSettings);
  return updatedSettings;
}

/**
 * Reset bot settings to default
 */
export function resetBotSettings(): BotSettings {
  saveBotSettings(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

/**
 * Validate settings values
 */
export function validateSettings(settings: Partial<BotSettings>): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  
  if (settings.marketCapFilter !== undefined && settings.marketCapFilter <= 0) {
    errors.marketCapFilter = 'Market cap filter must be greater than 0';
  }
  
  if (settings.stopLoss !== undefined && (settings.stopLoss <= 0 || settings.stopLoss > 100)) {
    errors.stopLoss = 'Stop loss must be between 0 and 100';
  }
  
  if (settings.takeProfit !== undefined && (settings.takeProfit <= 0 || settings.takeProfit > 1000)) {
    errors.takeProfit = 'Take profit must be between 0 and 1000';
  }
  
  if (settings.autoBuyAmount !== undefined && settings.autoBuyAmount <= 0) {
    errors.autoBuyAmount = 'Auto buy amount must be greater than 0';
  }
  
  if (settings.maxBuyAmount !== undefined && settings.maxBuyAmount <= 0) {
    errors.maxBuyAmount = 'Max buy amount must be greater than 0';
  }
  
  if (settings.defaultSlippage !== undefined && (settings.defaultSlippage < 0.1 || settings.defaultSlippage > 100)) {
    errors.defaultSlippage = 'Slippage must be between 0.1 and 100';
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Get settings as environment variables format for the bot
 */
export function getSettingsAsEnvVars(): Record<string, string> {
  const settings = getBotSettings();
  
  return {
    MARKET_CAP_FILTER: settings.marketCapFilter.toString(),
    STOP_LOSS_PERCENTAGE: settings.stopLoss.toString(),
    TAKE_PROFIT_PERCENTAGE: settings.takeProfit.toString(),
    PREFERRED_DEX: settings.preferredDex,
    AUTO_BUY: settings.autoBuy ? 'true' : 'false',
    AUTO_BUY_AMOUNT: settings.autoBuyAmount.toString(),
    MAX_BUY_AMOUNT: settings.maxBuyAmount.toString(),
    DEFAULT_SLIPPAGE: settings.defaultSlippage.toString(),
  };
} 