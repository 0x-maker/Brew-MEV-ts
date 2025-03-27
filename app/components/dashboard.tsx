"use client"

import React, { useState, useEffect } from 'react';
import { Wallet, Settings, BarChart3, Play, TrendingUp, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { ThemeSwitcher } from './theme-switcher';
import Image from 'next/image';
import { BotSettings, getBotSettings } from '../lib/bot-settings';
import WalletSection from './wallet-section';
import { Toaster } from './ui/toaster';
import SettingsFallback from './settings-fallback';

interface WalletData {
  address: string;
  balance: number;
  solscanLink: string;
}

export default function Dashboard() {
  const [settings, setSettings] = useState<BotSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [botRunning, setBotRunning] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [transactions, setTransactions] = useState<Array<{id: number, time: string, amount: number, isPositive: boolean}>>([]);
  const [error, setError] = useState<string | null>(null);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

  // Set isClient to true when component mounts and load data (client-side only)
  useEffect(() => {
    setIsClient(true);
    fetchSettings();
    fetchBotStatus();

    // Fallback to default settings if needed
    if (!settings) {
      const defaultSettings = getBotSettings();
      console.log('Using default settings:', defaultSettings);
      setSettings(defaultSettings);
    }

    // Mock transactions for demo
    setTransactions([
      { id: 1, time: '2 minutes ago', amount: 0.25, isPositive: true },
      { id: 2, time: '15 minutes ago', amount: 0.35, isPositive: true },
      { id: 3, time: '45 minutes ago', amount: 0.1, isPositive: false },
      { id: 4, time: '2 hours ago', amount: 0.75, isPositive: true },
    ]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch settings from API
  const fetchSettings = async () => {
    try {
      setError(null);
      const response = await fetch('/api/settings');
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch settings');
      }
      
      const data = await response.json();
      console.log('Settings loaded from API:', data);
      setSettings(data);
    } catch (err) {
      console.error('Error fetching settings:', err);
      // Fallback to default settings
      const defaultSettings = getBotSettings();
      console.log('Using default settings due to API error:', defaultSettings);
      setSettings(defaultSettings);
      setError(err instanceof Error ? err.message : 'Failed to fetch settings');
    }
  };

  // Fetch bot status
  const fetchBotStatus = async () => {
    try {
      const response = await fetch('/api/bot');
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch bot status');
      }
      
      const data = await response.json();
      setBotRunning(data.running);
    } catch (err) {
      console.error('Error fetching bot status:', err);
    }
  };

  // Start the bot
  const startBot = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/bot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'start' }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to start bot');
      }
      
      setBotRunning(true);
      console.log('Bot started successfully:', data.message);
    } catch (err) {
      console.error('Error starting bot:', err);
      setError(err instanceof Error ? err.message : 'Failed to start bot');
    } finally {
      setIsLoading(false);
    }
  };

  // Stop the bot
  const stopBot = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/bot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'stop' }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to stop bot');
      }
      
      setBotRunning(false);
      console.log('Bot stopped successfully:', data.message);
    } catch (err) {
      console.error('Error stopping bot:', err);
      setError(err instanceof Error ? err.message : 'Failed to stop bot');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle settings change
  const handleSettingsChange = async (newSettings: BotSettings) => {
    setSettings(newSettings);
    
    try {
      // Update the settings on the server
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update',
          settings: newSettings
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update settings');
      }
      
      console.log('Settings updated successfully');
    } catch (err) {
      console.error('Error updating settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to update settings');
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background">
        <div className="container flex h-14 items-center px-4">
          <div className="flex-1 flex items-center gap-2">
            <Image src="https://storage.verity.dev/storage/brew-mev.png" alt="Brew MEV" width={32} height={32} />
            <h1 className="font-bold">Brew MEV</h1>
          </div>
          
          <div>
            <ThemeSwitcher />
          </div>
        </div>
      </header>
      <main className="flex-1 space-y-6 p-6">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{error}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Wallet Section */}
          <div className="md:col-span-2">
            <WalletSection />
          </div>

          {/* Bot Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" /> Bot Status
              </CardTitle>
              <CardDescription>Control your MEV bot</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Status:</span>
                <span className={botRunning ? 'text-green-500' : 'text-yellow-500'}>
                  {botRunning ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Bot Uptime</span>
                  <span>{botRunning ? '1h 23m' : 'Not running'}</span>
                </div>
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 transition-all" 
                    style={{ width: botRunning ? '75%' : '0%' }}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              {botRunning ? (
                <Button 
                  variant="destructive"
                  className="w-full"
                  onClick={stopBot}
                  disabled={isLoading}
                >
                  Stop Bot
                </Button>
              ) : (
                <Button 
                  className="w-full"
                  onClick={startBot}
                  disabled={isLoading}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Bot
                </Button>
              )}
            </CardFooter>
          </Card>

          {/* Settings Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" /> Settings
              </CardTitle>
              <CardDescription>Configure bot parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings && (
                <>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Market Cap Filter:</div>
                    <div className="font-medium">${settings.marketCapFilter}</div>
                    
                    <div>Stop Loss:</div>
                    <div className="font-medium">{settings.stopLoss}%</div>
                    
                    <div>Take Profit:</div>
                    <div className="font-medium">{settings.takeProfit}%</div>
                    
                    <div>Auto-Buy:</div>
                    <div className="font-medium">{settings.autoBuy ? 'Enabled' : 'Disabled'}</div>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  console.log('Button clicked, current settingsDialogOpen state:', settingsDialogOpen);
                  setSettingsDialogOpen(true);
                  console.log('State after update:', true);
                }}
              >
                Edit Settings
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        {/* Recent Transactions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your bot's recent trading activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Placeholder notice */}
              <div className="p-2 mb-4 border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <span className="font-medium">Demo UI:</span> Transaction data will be fetched from Solana blockchain in the live version.
                </p>
              </div>
              
              {/* Placeholder transactions */}
              {[
                { id: 1, time: '2 minutes ago', amount: 0.25, tokenName: 'BONK', tokenSymbol: 'BONK', isPositive: true },
                { id: 2, time: '15 minutes ago', amount: 0.35, tokenName: 'Helium', tokenSymbol: 'HNT', isPositive: true },
                { id: 3, time: '45 minutes ago', amount: 0.1, tokenName: 'Raydium', tokenSymbol: 'RAY', isPositive: false },
                { id: 4, time: '2 hours ago', amount: 0.75, tokenName: 'Solend', tokenSymbol: 'SLND', isPositive: true }
              ].map(transaction => (
                <div key={transaction.id} className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
                  <div className="flex items-center space-x-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${transaction.isPositive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'} dark:bg-opacity-20`}>
                      {transaction.isPositive ? (
                        <ArrowUpFromLine className="h-4 w-4" />
                      ) : (
                        <ArrowDownToLine className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-medium">{transaction.isPositive ? 'Buy' : 'Sell'}</p>
                        <span className="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                          {transaction.tokenSymbol}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{transaction.time}</p>
                    </div>
                  </div>
                  <div>
                    <div className={transaction.isPositive ? 'text-green-600' : 'text-red-600'}>
                      {transaction.isPositive ? '+' : '-'}
                      {transaction.amount.toFixed(4)} SOL
                    </div>
                    <div className="text-xs text-right text-muted-foreground">
                      ~${(transaction.amount * 150).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button variant="outline" className="w-full">View All Transactions</Button>
            <p className="text-xs text-center text-muted-foreground">
              Transaction history will be available when connected to Solana blockchain
            </p>
          </CardFooter>
        </Card>
      </main>
      
      <SettingsFallback
        open={settingsDialogOpen}
        onOpenChange={(open) => {
          console.log('Settings dialog open state changed to:', open);
          setSettingsDialogOpen(open);
        }}
        initialSettings={settings}
        onSave={handleSettingsChange}
      />
      
      {/* Toast notifications */}
      <Toaster />
    </div>
  );
}