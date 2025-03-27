// Default settings from brew.js
export interface AutoBuySettings {
  enabled: boolean;
  mode: 'fixed' | 'percentage' | null;
  minAmount: number;
  maxAmount: number;
}

export interface StopLossTakeProfitSettings {
  stopLoss: number;
  takeProfit: number;
}

export interface DexSettings {
  enabled: boolean;
  apiUrl: string;
  feeStructure: {
    takerFee: number;
    makerFee: number;
  };
}

export interface MevBotSettings {
  marketCap: number;
  slTp: StopLossTakeProfitSettings;
  autoBuy: AutoBuySettings;
  selectedDex: string;
  additionalDexes: {
    Raydium: DexSettings;
    Jupiter: DexSettings;
  };
}

// Load default settings
export const getDefaultSettings = (): MevBotSettings => {
  return {
    marketCap: 50000,
    slTp: {
      stopLoss: 0,
      takeProfit: 0
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
};

// Persist settings (mock)
export const saveSettings = async (settings: MevBotSettings): Promise<boolean> => {
  try {
    // This would be replaced with actual file storage
    console.log('Saving settings:', settings);
    // Simulate success
    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
};

// Update stop loss and take profit settings
export const updateSlTpSettings = async (stopLoss: number, takeProfit: number): Promise<boolean> => {
  try {
    // Validate inputs
    if (stopLoss < 0 || stopLoss >= 100) {
      throw new Error('Stop Loss must be between 0 and 99%');
    }
    
    if (takeProfit <= 0 || takeProfit > 1000) {
      throw new Error('Take Profit must be between 1 and 1000%');
    }
    
    // This would update the actual settings in brew.js
    // For now, just log the values
    console.log(`Updated SL/TP: Stop Loss - ${stopLoss}%, Take Profit - ${takeProfit}%`);
    return true;
  } catch (error) {
    console.error('Error updating SL/TP settings:', error);
    return false;
  }
};

// Update auto buy settings
export const updateAutoBuySettings = async (
  enabled: boolean,
  mode: 'fixed' | 'percentage' | null,
  minAmount: number,
  maxAmount: number
): Promise<boolean> => {
  try {
    // Validate inputs
    if (enabled && !mode) {
      throw new Error('Mode must be selected when auto buy is enabled');
    }
    
    if (enabled && (minAmount <= 0 || maxAmount <= 0)) {
      throw new Error('Min and max amounts must be greater than 0');
    }
    
    if (enabled && maxAmount <= minAmount) {
      throw new Error('Max amount must be greater than min amount');
    }
    
    // This would update the actual settings in brew.js
    // For now, just log the values
    if (enabled) {
      console.log(`Updated AutoBuy: Enabled, Mode - ${mode}, Min - ${minAmount}, Max - ${maxAmount}`);
    } else {
      console.log('Disabled AutoBuy');
    }
    
    return true;
  } catch (error) {
    console.error('Error updating AutoBuy settings:', error);
    return false;
  }
};

// Update market cap setting
export const updateMarketCapSetting = async (marketCap: number): Promise<boolean> => {
  try {
    // Validate input
    if (marketCap <= 0) {
      throw new Error('Market cap must be greater than 0');
    }
    
    // This would update the actual setting in brew.js
    // For now, just log the value
    console.log(`Updated Market Cap: $${marketCap}`);
    return true;
  } catch (error) {
    console.error('Error updating Market Cap setting:', error);
    return false;
  }
};

// Update selected DEX
export const updateSelectedDex = async (dex: string): Promise<boolean> => {
  try {
    // Validate input
    const validDexes = ['Pump.FUN', 'Raydium', 'Jupiter', 'ALL'];
    if (!validDexes.includes(dex)) {
      throw new Error('Invalid DEX selection');
    }
    
    // This would update the actual setting in brew.js
    // For now, just log the value
    console.log(`Updated Selected DEX: ${dex}`);
    return true;
  } catch (error) {
    console.error('Error updating Selected DEX setting:', error);
    return false;
  }
}; 