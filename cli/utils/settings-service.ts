import * as fs from 'fs';
import { BotSettings, SettingsOperationResult } from '../types';
import chalk from 'chalk';

// Constants
const SETTINGS_FILE = 'brew-mev-settings.json';

/**
 * Default settings
 */
const DEFAULT_SETTINGS: BotSettings = {
  marketCap: 50000,
  slTp: {
    stopLoss: 5,
    takeProfit: 25
  },
  autoBuy: {
    enabled: false,
    mode: null,
    minAmount: 0,
    maxAmount: 0
  },
  selectedDex: 'Pump.FUN',
  additionalDexes: {
    Raydium: {
      enabled: false,
      apiUrl: 'https://api.raydium.io/',
      feeStructure: {
        takerFee: 0.0025,
        makerFee: 0.0015
      }
    },
    Jupiter: {
      enabled: false,
      apiUrl: 'https://api.jupiter.ag/',
      feeStructure: {
        takerFee: 0.0030,
        makerFee: 0.0020
      }
    }
  }
};

/**
 * Current settings (in-memory)
 */
let currentSettings: BotSettings = { ...DEFAULT_SETTINGS };

/**
 * Load settings (alias for compatibility with brew.js)
 * @returns {any} Current settings
 */
export function loadSettings(): any {
  // Initialize settings if needed
  if (!currentSettings) {
    initSettings();
  }
  return { ...currentSettings };
}

/**
 * Save settings (alias for compatibility with brew.js)
 * @param {any} settings - Settings to save
 * @returns {boolean} Whether the operation succeeded
 */
export function saveSettings(settings: any): boolean {
  try {
    const result = updateSettings(settings);
    return result.success;
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
}

/**
 * Initialize settings
 * Load from file or create default
 */
export function initSettings(): SettingsOperationResult {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      const parsedSettings = JSON.parse(data);
      
      // Merge with defaults to ensure all fields exist
      currentSettings = {
        ...DEFAULT_SETTINGS,
        ...parsedSettings
      };
      
      return {
        success: true,
        message: 'Settings loaded successfully',
        settings: currentSettings
      };
    } else {
      // Create default settings file
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 4), 'utf-8');
      currentSettings = { ...DEFAULT_SETTINGS };
      
      return {
        success: true,
        message: 'Default settings created',
        settings: currentSettings
      };
    }
  } catch (error) {
    console.error('Error initializing settings:', error);
    return {
      success: false,
      message: 'Failed to initialize settings'
    };
  }
}

/**
 * Get current settings
 * @returns {BotSettings} Current settings
 */
export function getSettings(): BotSettings {
  return { ...currentSettings };
}

/**
 * Update settings
 * @param {Partial<BotSettings>} newSettings - Settings to update
 * @returns {SettingsOperationResult} Result of the operation
 */
export function updateSettings(newSettings: Partial<BotSettings>): SettingsOperationResult {
  try {
    // Update current settings
    currentSettings = {
      ...currentSettings,
      ...newSettings
    };
    
    // Save to file
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(currentSettings, null, 4), 'utf-8');
    
    return {
      success: true,
      message: 'Settings updated successfully',
      settings: currentSettings
    };
  } catch (error) {
    console.error('Error updating settings:', error);
    return {
      success: false,
      message: 'Failed to update settings'
    };
  }
}

/**
 * Reset settings to default
 * @returns {SettingsOperationResult} Result of the operation
 */
export function resetSettings(): SettingsOperationResult {
  try {
    currentSettings = { ...DEFAULT_SETTINGS };
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 4), 'utf-8');
    
    return {
      success: true,
      message: 'Settings reset to default',
      settings: currentSettings
    };
  } catch (error) {
    console.error('Error resetting settings:', error);
    return {
      success: false,
      message: 'Failed to reset settings'
    };
  }
}

/**
 * Configure market cap filter
 * @param {number} marketCap - Minimum market cap in USD
 * @returns {SettingsOperationResult} Result of the operation
 */
export function configureMarketCap(marketCap: number): SettingsOperationResult {
  if (isNaN(marketCap) || marketCap <= 0) {
    return {
      success: false,
      message: 'Market cap must be a positive number'
    };
  }
  
  return updateSettings({ marketCap });
}

/**
 * Configure stop-loss and take-profit
 * @param {number} stopLoss - Stop loss percentage
 * @param {number} takeProfit - Take profit percentage
 * @returns {SettingsOperationResult} Result of the operation
 */
export function configureSlTp(
  stopLoss: number, 
  takeProfit: number
): SettingsOperationResult {
  if (isNaN(stopLoss) || stopLoss <= 0 || stopLoss >= 100) {
    return {
      success: false,
      message: 'Stop loss must be between 1 and 99'
    };
  }
  
  if (isNaN(takeProfit) || takeProfit <= 0 || takeProfit > 1000) {
    return {
      success: false,
      message: 'Take profit must be between 1 and 1000'
    };
  }
  
  return updateSettings({
    slTp: {
      stopLoss,
      takeProfit
    }
  });
}

/**
 * Configure auto-buy settings
 * @param {boolean} enabled - Whether auto-buy is enabled
 * @param {'fixed' | 'percentage' | null} mode - Auto-buy mode
 * @param {number} minAmount - Minimum amount
 * @param {number} maxAmount - Maximum amount
 * @returns {SettingsOperationResult} Result of the operation
 */
export function configureAutoBuy(
  enabled: boolean,
  mode: 'fixed' | 'percentage' | null,
  minAmount: number,
  maxAmount: number
): SettingsOperationResult {
  if (!enabled) {
    return updateSettings({
      autoBuy: {
        enabled: false,
        mode: null,
        minAmount: 0,
        maxAmount: 0
      }
    });
  }
  
  if (mode !== 'fixed' && mode !== 'percentage') {
    return {
      success: false,
      message: 'Mode must be "fixed" or "percentage"'
    };
  }
  
  if (isNaN(minAmount) || minAmount <= 0) {
    return {
      success: false,
      message: 'Minimum amount must be greater than 0'
    };
  }
  
  if (isNaN(maxAmount) || maxAmount <= minAmount) {
    return {
      success: false,
      message: 'Maximum amount must be greater than minimum amount'
    };
  }
  
  if (mode === 'percentage' && (minAmount > 100 || maxAmount > 100)) {
    return {
      success: false,
      message: 'Percentage values must be between 1 and 100'
    };
  }
  
  return updateSettings({
    autoBuy: {
      enabled,
      mode,
      minAmount,
      maxAmount
    }
  });
}

/**
 * Select DEX
 * @param {string} dex - DEX name
 * @returns {SettingsOperationResult} Result of the operation
 */
export function selectDex(dex: string): SettingsOperationResult {
  const validDexes = ['Pump.FUN', 'Raydium', 'Jupiter', 'ALL'];
  
  if (!validDexes.includes(dex)) {
    return {
      success: false,
      message: `Invalid DEX. Valid options: ${validDexes.join(', ')}`
    };
  }
  
  return updateSettings({ selectedDex: dex as BotSettings['selectedDex'] });
} 