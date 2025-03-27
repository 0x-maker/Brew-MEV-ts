"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { 
  generateNewWallet, 
  getAllWallets, 
  getActiveWallet, 
  setActiveWallet, 
  removeWallet,
  importWalletFromPrivateKey,
  initializeWallets,
  WalletInfo
} from '../lib/wallet-service';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { CopyIcon, CheckIcon, PlusIcon, TrashIcon, ImportIcon, KeyIcon, Wallet, AlertCircle, ShieldCheck, Lock } from 'lucide-react';

interface WalletManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onWalletChange: () => void;
}

export default function WalletManager({ isOpen, onClose, onWalletChange }: WalletManagerProps) {
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [activeWalletIndex, setActiveWalletIndex] = useState<number>(-1);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [privateKey, setPrivateKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  // Define loadWalletData function with useCallback
  const loadWalletData = useCallback(() => {
    try {
      // Make sure initialization is proper
      initializeWallets();
      
      // Get all wallets
      const allWallets = getAllWallets();
      setWallets(allWallets);
      
      // Find active wallet
      const activeWallet = getActiveWallet();
      
      if (activeWallet) {
        const index = allWallets.findIndex(w => w.address === activeWallet.address);
        setActiveWalletIndex(index >= 0 ? index : -1);
      } else if (allWallets.length > 0) {
        // If no active wallet but we have wallets, set the first one as active
        setActiveWallet(0);
        setActiveWalletIndex(0);
      } else {
        setActiveWalletIndex(-1);
      }
      
      // Don't automatically create wallet here as it would cause circular reference
    } catch (error) {
      console.error('Error loading wallet data:', error);
      setError('Failed to load wallet data');
    }
  }, []);  // Empty dependency array since it doesn't depend on any props or state

  // Initialize wallet data when component mounts
  useEffect(() => {
    if (isOpen) {
      loadWalletData();
      setError(null);
      setSuccess(null);
      
      // Auto-create wallet if needed, after loadWalletData is called
      const allWallets = getAllWallets();
      if (allWallets.length === 0) {
        console.log('No wallets found, creating a default wallet');
        handleCreateWallet();
      }
    }
  }, [isOpen, loadWalletData]);

  const handleCreateWallet = async () => {
    try {
      setError(null);
      setSuccess(null);
      setLoading(true);
      
      // Generate new wallet
      const newWallet = generateNewWallet();
      
      // Reload wallet data
      const allWallets = getAllWallets();
      setWallets(allWallets);
      
      // Set the newly created wallet as active if it's the only one
      if (allWallets.length === 1) {
        setActiveWallet(0);
        setActiveWalletIndex(0);
      }
      
      // Notify parent
      onWalletChange();
      setSuccess('New wallet created successfully');
    } catch (err) {
      console.error('Error creating wallet:', err);
      setError(err instanceof Error ? err.message : 'Failed to create wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleImportWallet = async () => {
    if (!privateKey.trim()) {
      setError('Please enter a private key');
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      setLoading(true);
      importWalletFromPrivateKey(privateKey);
      setPrivateKey('');
      setIsImporting(false);
      loadWalletData();
      onWalletChange();
      setSuccess('Wallet imported successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveWallet = (index: number) => {
    try {
      setError(null);
      setSuccess(null);
      removeWallet(index);
      loadWalletData();
      onWalletChange();
      setSuccess('Wallet removed successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove wallet');
    }
  };

  const handleSetActiveWallet = (index: number) => {
    try {
      setError(null);
      setSuccess(null);
      setActiveWallet(index);
      setActiveWalletIndex(index);
      onWalletChange();
      setSuccess('Active wallet changed successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set active wallet');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedAddress(text);
      setTimeout(() => setCopiedAddress(null), 2000);
    });
  };

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet Manager
          </DialogTitle>
          <DialogDescription>
            Manage your Solana wallets for the MEV bot. The active wallet will be used for all transactions.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md text-sm border border-blue-200 dark:border-blue-800 mb-4">
          <div className="flex items-start gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <p className="font-medium text-blue-700 dark:text-blue-300">Active Wallet</p>
              <p className="text-blue-600 dark:text-blue-400 mt-1">
                The active wallet is used by the MEV bot for all trading operations. Select a wallet to make it active.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md text-sm border border-green-200 dark:border-green-800 mb-4">
          <div className="flex items-start gap-2">
            <Lock className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium text-green-700 dark:text-green-300">Security Notice</p>
              <p className="text-green-600 dark:text-green-400 mt-1">
                Your wallet private keys are encrypted before being stored on your device. 
                They are only decrypted when needed for transactions and never stored in plain text.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-between my-4">
          <Button onClick={handleCreateWallet} disabled={loading}>
            <PlusIcon className="w-4 h-4 mr-2" />
            Create New Wallet
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setIsImporting(true)} 
            disabled={isImporting || loading}
          >
            <ImportIcon className="w-4 h-4 mr-2" />
            Import Wallet
          </Button>
        </div>

        {isImporting && (
          <div className="flex flex-col space-y-2 p-4 border rounded-md">
            <label htmlFor="privateKey" className="text-sm font-medium">
              Enter Private Key (Base58)
            </label>
            <div className="flex space-x-2">
              <Input
                id="privateKey"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                type="password"
                className="flex-grow"
                placeholder="Enter private key..."
              />
              <Button onClick={handleImportWallet} disabled={loading}>
                Import
              </Button>
              <Button variant="outline" onClick={() => {
                setIsImporting(false);
                setPrivateKey('');
              }}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {error && (
          <div className="text-red-500 text-sm p-3 my-2 border border-red-300 rounded bg-red-50 dark:bg-red-900/20 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="text-green-500 text-sm p-3 my-2 border border-green-300 rounded bg-green-50 dark:bg-green-900/20 flex items-center gap-2">
            <CheckIcon className="h-4 w-4" />
            <span>{success}</span>
          </div>
        )}

        <div className="mt-2 mb-4">
          <h3 className="text-sm font-medium mb-2">Your Wallets</h3>
          <div className="max-h-[300px] overflow-y-auto border rounded-md">
            {wallets.length > 0 ? (
              <div className="divide-y">
                {wallets.map((wallet, index) => (
                  <div
                    key={wallet.address}
                    className={`p-4 ${activeWalletIndex === index ? 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500' : ''}`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        {activeWalletIndex === index && (
                          <span className="bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200 mr-2 text-xs font-medium px-2 py-1 rounded-full">
                            ACTIVE
                          </span>
                        )}
                        <span className="font-mono text-sm truncate max-w-[200px]">
                          {formatAddress(wallet.address)}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(wallet.address)}
                          title="Copy address"
                        >
                          {copiedAddress === wallet.address ? (
                            <CheckIcon className="h-4 w-4 text-green-500" />
                          ) : (
                            <CopyIcon className="h-4 w-4" />
                          )}
                        </Button>
                        {activeWalletIndex !== index && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSetActiveWallet(index)}
                            className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                            title="Set as active wallet"
                          >
                            <KeyIcon className="h-4 w-4 mr-1" />
                            Set Active
                          </Button>
                        )}
                        {wallets.length > 1 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveWallet(index)}
                            className="text-red-500 hover:text-red-700"
                            title="Remove wallet"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex flex-col text-xs text-muted-foreground">
                      <span className="font-medium">Full Address:</span>
                      <span className="font-mono truncate mt-1">{wallet.address}</span>
                      <a
                        href={wallet.addressLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline mt-2 inline-flex items-center"
                      >
                        View on Solscan <span className="ml-1">↗</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                No wallets found. Create a new wallet to get started.
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            {wallets.length} wallet{wallets.length !== 1 ? 's' : ''} available
          </div>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 