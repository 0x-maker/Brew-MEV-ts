#!/usr/bin/env node

import chalk from 'chalk';
import figlet from 'figlet';
import inquirer from 'inquirer';
import qrcode from 'qrcode';
// Import solana web3 using require for compatibility
const solanaWeb3 = require('@solana/web3.js');
const LAMPORTS_PER_SOL = solanaWeb3.LAMPORTS_PER_SOL;

// Import utility services
import {
  generateNewWallet,
  importWalletFromPrivateKey,
  getCurrentWallet,
  getWalletBalance,
  loadAllWallets,
  chooseWallet
} from '../utils/wallet-service';

import {
  initSettings,
  getSettings,
  configureMarketCap,
  configureSlTp,
  configureAutoBuy,
  selectDex
} from '../utils/settings-service';

import {
  startBot,
  stopBot,
  getBotStatus,
  getDetectedTokens
} from '../utils/bot-service';

/**
 * Display ASCII art title
 */
function displayTitle(): void {
  console.clear();
  console.log(
    chalk.green(
      figlet.textSync('Brew-MEV', { horizontalLayout: 'full' })
    )
  );
  console.log(chalk.blue('=== Solana MEV Trading Bot ===\n'));
}

/**
 * Initialize the application
 */
async function init(): Promise<void> {
  displayTitle();
  
  // Initialize settings
  initSettings();
  
  // Check for existing wallets and initialize if needed
  const wallets = loadAllWallets();
  
  if (wallets.length === 0) {
    await askFirstRunMenu();
  } else if (wallets.length === 1) {
    // If only one wallet exists, use it
    chooseWallet(0);
    console.log(chalk.green(`Loaded wallet: ${wallets[0].address}`));
  } else {
    // If multiple wallets exist, ask which one to use
    await chooseWhichWalletToLoad();
  }
  
  // Start the main menu
  await showMainMenu();
}

/**
 * First run menu when no wallets exist
 */
async function askFirstRunMenu(): Promise<void> {
  while (true) {
    const { firstRunChoice } = await inquirer.prompt([
      {
        type: 'list',
        name: 'firstRunChoice',
        message: chalk.yellow('No wallets found. What do you want to do?'),
        choices: [
          { name: '🆕  Create New Wallet', value: 'create' },
          { name: '🔑  Import Wallet', value: 'import' },
          { name: '🚪  Exit', value: 'exit' }
        ]
      }
    ]);
    
    if (firstRunChoice === 'create') {
      const result = generateNewWallet();
      if (result.success) {
        console.log(chalk.green(result.message));
        return;
      } else {
        console.log(chalk.red(result.message));
      }
    } else if (firstRunChoice === 'import') {
      await importWallet();
      const wallet = getCurrentWallet();
      if (wallet) return;
    } else if (firstRunChoice === 'exit') {
      console.log(chalk.green('Exiting program.'));
      process.exit(0);
    }
  }
}

/**
 * Choose which wallet to load when multiple exist
 */
async function chooseWhichWalletToLoad(): Promise<void> {
  const wallets = loadAllWallets();
  
  if (wallets.length === 0) {
    await askFirstRunMenu();
    return;
  }
  
  const walletChoices = wallets.map((wallet, index) => ({
    name: `Wallet ${index + 1}: ${wallet.address}`,
    value: index
  }));
  
  const { chosenWalletIndex } = await inquirer.prompt([
    {
      type: 'list',
      name: 'chosenWalletIndex',
      message: chalk.cyan('Which wallet do you want to use?'),
      choices: walletChoices
    }
  ]);
  
  const result = chooseWallet(chosenWalletIndex);
  if (result.success) {
    console.log(chalk.green(result.message));
  } else {
    console.log(chalk.red(result.message));
  }
}

/**
 * Import wallet from private key
 */
async function importWallet(): Promise<void> {
  const { base58Key } = await inquirer.prompt([
    {
      type: 'input',
      name: 'base58Key',
      message: chalk.cyan('Enter your wallet PRIVATE KEY (Base58):')
    }
  ]);
  
  const result = importWalletFromPrivateKey(base58Key);
  
  if (result.success) {
    console.log(chalk.green(result.message));
  } else {
    console.log(chalk.red(result.message));
  }
}

/**
 * Show wallet information
 */
function showWalletInfo(): void {
  const wallet = getCurrentWallet();
  
  if (!wallet) {
    console.log(chalk.red('No wallet loaded. Please create or import a wallet first.'));
    return;
  }
  
  console.log(chalk.magenta('\n=== 🪙 Wallet Information 🪙 ==='));
  console.log(`${chalk.cyan('📍 Address:')} ${chalk.blueBright(wallet.address)}`);
  console.log(`${chalk.cyan('🔗 Explorer:')} ${chalk.blueBright(wallet.addressLink)}`);
  console.log(`${chalk.cyan('🔑 Private Key:')} ${chalk.green('[ENCRYPTED] For security, private key is not displayed')}`);
  console.log(chalk.magenta('==============================\n'));
}

/**
 * Generate and display QR code for deposits
 */
async function generateQRCode(): Promise<void> {
  const wallet = getCurrentWallet();
  
  if (!wallet) {
    console.log(chalk.red('No wallet loaded. Please create or import a wallet first.'));
    return;
  }
  
  const qrCodePath = 'brew-mev-deposit-qr.png';
  
  try {
    await qrcode.toFile(qrCodePath, wallet.address);
    console.log(chalk.green(`QR code generated: ${qrCodePath}`));
    console.log(chalk.blue(`Address: ${wallet.address}`));
    
    // Open the QR code
    const openModule = await import('open');
    const open = openModule.default;
    await open(qrCodePath);
  } catch (error) {
    console.log(chalk.red('Error generating QR code:'), error);
  }
}

/**
 * Display wallet balance
 */
async function showBalance(): Promise<void> {
  const wallet = getCurrentWallet();
  
  if (!wallet) {
    console.log(chalk.red('No wallet loaded. Please create or import a wallet first.'));
    return;
  }
  
  console.log(chalk.blue('Fetching balance...'));
  
  const balance = await getWalletBalance();
  
  if (balance) {
    console.log(chalk.green(`Balance: ${(balance.balanceSol).toFixed(4)} SOL`));
  } else {
    console.log(chalk.red('Failed to fetch balance'));
  }
}

/**
 * Start the bot
 */
async function handleStartBot(): Promise<void> {
  console.log(chalk.blue('Starting bot...'));
  
  const result = await startBot();
  
  if (result.success) {
    console.log(chalk.green(result.message));
  } else {
    console.log(chalk.red(result.message));
  }
}

/**
 * Handle withdrawal
 */
async function handleWithdraw(): Promise<void> {
  // Get wallet and balance
  const wallet = getCurrentWallet();
  if (!wallet) {
    console.log(chalk.red('No wallet loaded. Please create or import a wallet first.'));
    return;
  }
  
  const balance = await getWalletBalance();
  if (!balance || balance.balanceSol <= 0) {
    console.log(chalk.red('Insufficient funds for withdrawal.'));
    return;
  }
  
  // Ask for address
  const { recipientAddress } = await inquirer.prompt([
    {
      type: 'input',
      name: 'recipientAddress',
      message: chalk.cyan('Enter the recipient address:'),
      validate: (input) => {
        if (input.length < 32) {
          return 'Please enter a valid Solana address';
        }
        return true;
      }
    }
  ]);
  
  // Ask for amount
  const maxAmount = Math.max(0, balance.balanceSol - 0.01); // Leave 0.01 SOL for fees
  
  const { amount } = await inquirer.prompt([
    {
      type: 'number',
      name: 'amount',
      message: chalk.cyan(`Enter amount to withdraw (max ${maxAmount.toFixed(4)} SOL):`),
      validate: (input) => {
        const num = parseFloat(input);
        if (isNaN(num) || num <= 0 || num > maxAmount) {
          return `Please enter a valid amount between 0.0001 and ${maxAmount.toFixed(4)} SOL`;
        }
        return true;
      }
    }
  ]);
  
  // Confirm withdrawal
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: chalk.yellow(`Are you sure you want to withdraw ${amount} SOL to ${recipientAddress}?`),
      default: false
    }
  ]);
  
  if (!confirm) {
    console.log(chalk.yellow('Withdrawal cancelled.'));
    return;
  }
  
  // Currently, this is a simulated withdrawal
  console.log(chalk.blue('Processing withdrawal...'));
  console.log(chalk.yellow('Note: This is a simulated withdrawal in the TypeScript version.'));
  console.log(chalk.green('Withdrawal completed successfully.'));
}

/**
 * Settings menu
 */
async function openSettingsMenu(): Promise<void> {
  let backToMain = false;
  
  while (!backToMain) {
    try {
      const settings = getSettings();
      
      const { settingsOption } = await inquirer.prompt([
        {
          type: 'list',
          name: 'settingsOption',
          message: chalk.yellow('Settings:'),
          choices: [
            { name: `📈  Market Cap: $${settings.marketCap}`, value: 'mcap' },
            { name: `📉  SL: ${settings.slTp.stopLoss}% / TP: ${settings.slTp.takeProfit}%`, value: 'sltp' },
            { name: `🛒  AutoBuy: ${settings.autoBuy.enabled ? 'Enabled' : 'Disabled'}`, value: 'autobuy' },
            { name: `📊  DEX: ${settings.selectedDex}`, value: 'dex' },
            { name: '🔙  Back', value: 'back' }
          ]
        }
      ]);
      
      switch (settingsOption) {
        case 'mcap': {
          const { newMarketCap } = await inquirer.prompt([
            {
              type: 'input',
              name: 'newMarketCap',
              message: chalk.cyan('Enter minimum token market cap ($):'),
              default: settings.marketCap,
              validate: (value) => (!isNaN(value) && value > 0 ? true : 'Enter a valid number.')
            }
          ]);
          
          const result = configureMarketCap(parseInt(newMarketCap, 10));
          
          if (result.success) {
            console.log(chalk.green(`Minimum market cap set: $${result.settings?.marketCap}`));
          } else {
            console.log(chalk.red(result.message));
          }
          break;
        }
        
        case 'sltp': {
          const { stopLoss } = await inquirer.prompt([
            {
              type: 'input',
              name: 'stopLoss',
              message: chalk.cyan('Enter Stop Loss (%) from purchase:'),
              default: settings.slTp.stopLoss,
              validate: (value) => {
                const num = parseFloat(value);
                if (isNaN(num) || num <= 0 || num >= 100) {
                  return 'Enter a valid Stop Loss (1-99).';
                }
                return true;
              }
            }
          ]);
          
          const { takeProfit } = await inquirer.prompt([
            {
              type: 'input',
              name: 'takeProfit',
              message: chalk.cyan('Enter Take Profit (%) from purchase:'),
              default: settings.slTp.takeProfit,
              validate: (value) => {
                const num = parseFloat(value);
                if (isNaN(num) || num <= 0 || num > 1000) {
                  return 'Enter a valid Take Profit (1-1000).';
                }
                return true;
              }
            }
          ]);
          
          const result = configureSlTp(parseFloat(stopLoss), parseFloat(takeProfit));
          
          if (result.success) {
            console.log(chalk.green(`SL/TP set: Stop Loss - ${result.settings?.slTp.stopLoss}%, Take Profit - ${result.settings?.slTp.takeProfit}%`));
          } else {
            console.log(chalk.red(result.message));
          }
          break;
        }
        
        case 'autobuy': {
          const { mode } = await inquirer.prompt([
            {
              type: 'list',
              name: 'mode',
              message: chalk.cyan('Select auto-buy mode:'),
              choices: [
                { name: 'Fixed amount (SOL)', value: 'fixed' },
                { name: 'Percentage of balance (%)', value: 'percentage' },
                { name: 'Disable AutoBuy', value: 'disable' }
              ]
            }
          ]);
          
          if (mode === 'disable') {
            const result = configureAutoBuy(false, null, 0, 0);
            
            if (result.success) {
              console.log(chalk.red('Auto-buy disabled.'));
            } else {
              console.log(chalk.red(result.message));
            }
            break;
          }
          
          let minAmount, maxAmount;
          
          if (mode === 'fixed') {
            const { minFixed } = await inquirer.prompt([
              {
                type: 'input',
                name: 'minFixed',
                message: chalk.cyan('Enter minimum purchase amount (in SOL, ≥ 0.1):'),
                validate: (value) => !isNaN(value) && parseFloat(value) >= 0.1 ? true : 'Enter a valid amount (≥ 0.1 SOL).'
              }
            ]);
            
            const { maxFixed } = await inquirer.prompt([
              {
                type: 'input',
                name: 'maxFixed',
                message: chalk.cyan('Enter maximum purchase amount (in SOL):'),
                validate: (value) => {
                  const min = parseFloat(minFixed);
                  const max = parseFloat(value);
                  if (isNaN(max) || max <= min) {
                    return 'Maximum amount must be greater than minimum.';
                  }
                  return true;
                }
              }
            ]);
            
            minAmount = parseFloat(minFixed);
            maxAmount = parseFloat(maxFixed);
          } else {
            const { minPercent } = await inquirer.prompt([
              {
                type: 'input',
                name: 'minPercent',
                message: chalk.cyan('Enter minimum percentage of balance to buy (1-100):'),
                validate: (value) => !isNaN(value) && parseFloat(value) >= 1 && parseFloat(value) <= 100 ? true : 'Enter a valid percentage (1-100).'
              }
            ]);
            
            const { maxPercent } = await inquirer.prompt([
              {
                type: 'input',
                name: 'maxPercent',
                message: chalk.cyan('Enter maximum percentage of balance to buy (from min to 100%):'),
                validate: (value) => {
                  const min = parseFloat(minPercent);
                  const max = parseFloat(value);
                  if (isNaN(max) || max <= min || max > 100) {
                    return `Enter a valid percentage (> ${min}% and ≤ 100).`;
                  }
                  return true;
                }
              }
            ]);
            
            minAmount = parseFloat(minPercent);
            maxAmount = parseFloat(maxPercent);
          }
          
          const result = configureAutoBuy(true, mode as 'fixed' | 'percentage', minAmount, maxAmount);
          
          if (result.success) {
            if (mode === 'fixed') {
              console.log(chalk.green(`AutoBuy configured: from ${minAmount} SOL to ${maxAmount} SOL`));
            } else {
              console.log(chalk.green(`AutoBuy configured: from ${minAmount}% to ${maxAmount}% of balance`));
            }
          } else {
            console.log(chalk.red(result.message));
          }
          break;
        }
        
        case 'dex': {
          const { selectedDex } = await inquirer.prompt([
            {
              type: 'list',
              name: 'selectedDex',
              message: chalk.cyan('Select DEX:'),
              choices: ['Pump.FUN', 'Raydium', 'Jupiter', 'ALL']
            }
          ]);
          
          const result = selectDex(selectedDex);
          
          if (result.success) {
            console.log(chalk.green(`Selected DEX: ${result.settings?.selectedDex}`));
          } else {
            console.log(chalk.red(result.message));
          }
          break;
        }
        
        case 'back':
          backToMain = true;
          break;
      }
    } catch (error) {
      console.log(chalk.red('Error in settings menu:'), error);
      backToMain = true;
    }
  }
}

/**
 * Main menu
 */
async function showMainMenu(): Promise<void> {
  while (true) {
    try {
      const botStatus = getBotStatus();
      const statusIndicator = botStatus.running ? '✅' : '❌';
      
      const choices = [
        '💼  Wallet Info',
        '💰  Deposit QR code',
        '💳  Balance',
        `▶️   Start Bot ${statusIndicator}`,
        '💸  Withdraw',
        '⚙️   Settings',
        '🔄  Create New Wallet',
        '🔑  Import Wallet',
        '🚪  Exit'
      ];
      
      const { mainOption } = await inquirer.prompt([
        {
          type: 'list',
          name: 'mainOption',
          message: chalk.yellow('Select an option:'),
          choices: choices,
          pageSize: choices.length
        }
      ]);
      
      switch (mainOption) {
        case '💼  Wallet Info':
          showWalletInfo();
          break;
          
        case '💰  Deposit QR code':
          await generateQRCode();
          break;
          
        case '💳  Balance':
          await showBalance();
          break;
          
        case `▶️   Start Bot ${statusIndicator}`:
          if (botStatus.running) {
            console.log(chalk.yellow('Bot is already running. Stopping...'));
            const result = stopBot();
            if (result.success) {
              console.log(chalk.green(result.message));
            } else {
              console.log(chalk.red(result.message));
            }
          } else {
            await handleStartBot();
          }
          break;
          
        case '💸  Withdraw':
          await handleWithdraw();
          break;
          
        case '⚙️   Settings':
          await openSettingsMenu();
          break;
          
        case '🔄  Create New Wallet':
          const wallets = loadAllWallets();
          if (wallets.length > 0) {
            const { confirmCreate } = await inquirer.prompt([
              {
                type: 'confirm',
                name: 'confirmCreate',
                message: chalk.yellow('This will create a new wallet. Continue?'),
                default: false
              }
            ]);
            
            if (confirmCreate) {
              const result = generateNewWallet();
              if (result.success) {
                console.log(chalk.green(result.message));
              } else {
                console.log(chalk.red(result.message));
              }
            } else {
              console.log(chalk.yellow('Operation cancelled.'));
            }
          } else {
            const result = generateNewWallet();
            if (result.success) {
              console.log(chalk.green(result.message));
            } else {
              console.log(chalk.red(result.message));
            }
          }
          break;
          
        case '🔑  Import Wallet':
          await importWallet();
          break;
          
        case '🚪  Exit':
          console.log(chalk.green('Exiting program.'));
          process.exit(0);
          
        default:
          console.log(chalk.red('Unknown option.\n'));
      }
    } catch (error) {
      console.log(chalk.red('Error in main menu:'), error);
    }
  }
}

// Start the application
init().catch(error => {
  console.error('Error starting application:', error);
  process.exit(1);
}); 