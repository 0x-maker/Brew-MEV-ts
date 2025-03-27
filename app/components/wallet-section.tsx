"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import WalletManager from './wallet-manager'
import { getActiveWallet, initializeWallets, getAllWallets, setActiveWallet, generateNewWallet } from '../lib/wallet-service'
import { AlertCircle, Copy, ExternalLink, Wallet, RefreshCw, Beaker } from 'lucide-react'
import { WalletInfo } from '../lib/wallet-service'

export default function WalletSection() {
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null)
  const [wallets, setWallets] = useState<WalletInfo[]>([])
  const [balance, setBalance] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isWalletManagerOpen, setIsWalletManagerOpen] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isBalanceLoading, setIsBalanceLoading] = useState(false)
  const [isDevelopment, setIsDevelopment] = useState(false)
  const [isSimulationMode, setIsSimulationMode] = useState(false)
  const [isAirdropLoading, setIsAirdropLoading] = useState(false)
  const [airdropSuccess, setAirdropSuccess] = useState<string | null>(null)

  // Fetch balance from API
  const fetchBalance = useCallback(async () => {
    const activeWallet = getActiveWallet()
    if (!activeWallet) {
      console.log('No active wallet found, skipping balance fetch')
      return
    }
    
    setIsBalanceLoading(true)
    try {
      const response = await fetch('/api/wallet')
      if (response.ok) {
        const data = await response.json()
        
        // Check if the API returned a "no wallet" status
        if (data.status === 'no-wallet') {
          console.log('API reported no wallet, retrying initialization')
          // Try to initialize wallets again
          initializeWallets()
          setWalletInfo(getActiveWallet())
          return
        }
        
        // Set balance from API response
        setBalance(data.balance !== null ? data.balance : 0)
        
        // Check if simulation mode was forced due to errors
        if (data.devModeForced) {
          setIsSimulationMode(true)
        }
        
        // If there's an error message but the request was successful
        if (data.error) {
          setErrorMessage(data.error)
          // Clear error after 5 seconds
          setTimeout(() => setErrorMessage(null), 5000)
        } else {
          setErrorMessage(null)
        }
      } else {
        console.error('Failed to fetch wallet balance')
        // In development, set a simulated balance to avoid empty state
        if (process.env.NODE_ENV === 'development') {
          const simBalance = Math.random() * 9.5 + 0.5
          setBalance(simBalance)
          setErrorMessage('API error - showing simulated balance')
          // Clear error after 5 seconds
          setTimeout(() => setErrorMessage(null), 5000)
        } else {
          setErrorMessage('Failed to fetch wallet balance')
          setBalance(null)
        }
      }
    } catch (error) {
      console.error('Error fetching balance:', error)
      // In development, set a simulated balance to avoid empty state
      if (process.env.NODE_ENV === 'development') {
        const simBalance = Math.random() * 9.5 + 0.5
        setBalance(simBalance)
        setErrorMessage('Network error - showing simulated balance')
        // Clear error after 5 seconds
        setTimeout(() => setErrorMessage(null), 5000)
      } else {
        setErrorMessage('Network error while fetching balance')
        setBalance(null)
      }
    } finally {
      setIsBalanceLoading(false)
    }
  }, []);

  // Load wallet info
  const loadWalletInfo = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      // Load all wallets and active wallet info
      const allWallets = getAllWallets()
      
      // If we have no wallets, ensure one is created
      if (allWallets.length === 0) {
        console.log('No wallets found, generating a new one')
        const newWallet = generateNewWallet()
        setActiveWallet(0)
        setWalletInfo(newWallet)
        // Reload wallets after creating a new one
        setWallets(getAllWallets())
      } else {
        // Get active wallet
        const activeWallet = getActiveWallet()
        
        // If no active wallet is set but we have wallets, set the first one as active
        if (!activeWallet && allWallets.length > 0) {
          console.log('No active wallet set, setting the first wallet as active')
          setActiveWallet(0)
          setWalletInfo(allWallets[0])
        } else {
          setWalletInfo(activeWallet)
        }
      }

      // Fetch balance from API after ensuring wallet exists
      await fetchBalance()
    } catch (error) {
      console.error('Error loading wallet info:', error)
      setErrorMessage('Failed to load wallet information')
    } finally {
      setIsLoading(false)
    }
  }, [fetchBalance]);

  // Make sure a wallet exists and is properly set up
  const ensureWalletExists = useCallback(() => {
    try {
      console.log('Ensuring wallet exists...')
      
      // Initialize the wallet system
      initializeWallets()
      
      // Get all wallets
      const allWallets = getAllWallets()
      console.log(`Found ${allWallets.length} existing wallets`)
      
      if (allWallets.length === 0) {
        // Create a new wallet if none exist
        console.log('No wallets found, creating a new one')
        const newWallet = generateNewWallet()
        console.log('New wallet created with address:', newWallet.address)
        
        // Set the new wallet as active
        setActiveWallet(0)
      } else {
        // Check if an active wallet is set
        const activeWallet = getActiveWallet()
        if (!activeWallet) {
          console.log('No active wallet set, selecting the first wallet')
          setActiveWallet(0)
        }
      }
      
      // Load wallet info after ensuring a wallet exists
      loadWalletInfo()
    } catch (error) {
      console.error('Error ensuring wallet exists:', error)
      
      // Try again with a delay if there was an error
      setTimeout(() => {
        console.log('Retrying wallet initialization...')
        loadWalletInfo()
      }, 1000)
    }
  }, [loadWalletInfo]);  // Add loadWalletInfo as a dependency

  // Check dev mode from the API
  const checkDevMode = useCallback(async () => {
    try {
      const response = await fetch('/api/wallet/dev-mode')
      if (response.ok) {
        const data = await response.json()
        setIsSimulationMode(data.devMode)
      }
    } catch (error) {
      console.error('Error checking dev mode:', error)
    }
  }, []);

  useEffect(() => {
    // Check if we're in development mode
    setIsDevelopment(process.env.NODE_ENV === 'development')
    
    // Initialize wallets on client side with more aggressive checking
    ensureWalletExists()
    
    // If in development, check the current simulation mode
    if (process.env.NODE_ENV === 'development') {
      checkDevMode()
    }
  }, [ensureWalletExists, checkDevMode])

  const toggleDevMode = async () => {
    try {
      const response = await fetch('/api/wallet/dev-mode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ useSimulation: !isSimulationMode })
      })
      
      if (response.ok) {
        const data = await response.json()
        setIsSimulationMode(data.devMode)
        
        // Refresh the balance to show the effect
        if (walletInfo) {
          await fetchBalance()
        }
      }
    } catch (error) {
      console.error('Error toggling dev mode:', error)
    }
  }

  const runWalletDebug = async () => {
    try {
      setErrorMessage('Running diagnostics...')
      
      // Get debug info from API
      const response = await fetch('/api/debug')
      if (response.ok) {
        const data = await response.json()
        console.log('Wallet Debug Info:', data)
        
        // Check wallet encryption
        const securityResponse = await fetch('/api/debug/wallet-security')
        if (securityResponse.ok) {
          const securityData = await securityResponse.json()
          console.log('Wallet Security Info:', securityData)
          
          // Display a summary of the debug info with encryption status
          setErrorMessage(
            `Debug: Found ${data.wallets.count} wallet(s). ` +
            `Active: ${data.wallets.activeWalletAddress ? 'Yes' : 'No'}. ` +
            `Devnet: ${data.connections.devnet.status}. ` +
            `Wallet Security: ${securityData.walletsEncrypted ? '✓ Encrypted' : '⚠️ Not encrypted!'}`
          )
        } else {
          // Display a summary of the debug info without encryption status
          setErrorMessage(
            `Debug: Found ${data.wallets.count} wallet(s). ` +
            `Active: ${data.wallets.activeWalletAddress ? 'Yes' : 'No'}. ` +
            `Devnet: ${data.connections.devnet.status}. ` +
            `Mainnet: ${data.connections.mainnet.status}.`
          )
        }
        
        // Trigger wallet reload
        await loadWalletInfo()
        
        // Clear message after 10 seconds
        setTimeout(() => setErrorMessage(null), 10000)
      } else {
        setErrorMessage('Debug API error')
      }
    } catch (error) {
      console.error('Error running wallet debug:', error)
      setErrorMessage('Error running diagnostics')
    }
  }

  const requestAirdrop = async () => {
    if (!walletInfo) return
    
    setIsAirdropLoading(true)
    setAirdropSuccess(null)
    
    try {
      const response = await fetch('/api/wallet/airdrop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ address: walletInfo.address, amount: 1 })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setAirdropSuccess(`Received 1 SOL! Refreshing balance...`)
        // Refresh balance after successful airdrop
        await fetchBalance()
        
        // Clear success message after 5 seconds
        setTimeout(() => setAirdropSuccess(null), 5000)
      } else {
        setErrorMessage(data.error || 'Failed to request airdrop')
        // Clear error message after 5 seconds
        setTimeout(() => setErrorMessage(null), 5000)
      }
    } catch (error) {
      console.error('Error requesting airdrop:', error)
      setErrorMessage('Network error while requesting airdrop')
      // Clear error message after 5 seconds
      setTimeout(() => setErrorMessage(null), 5000)
    } finally {
      setIsAirdropLoading(false)
    }
  }

  const handleWalletChange = () => {
    // Reload wallet info after changes in wallet manager
    loadWalletInfo()
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const formatAddress = (address: string) => {
    if (!address) return ''
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  const refreshBalance = async () => {
    if (!walletInfo) return
    await fetchBalance()
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wallet className="mr-2 h-5 w-5" />
            Wallet
          </CardTitle>
          <CardDescription>Manage your Solana wallet</CardDescription>
        </CardHeader>
        <CardContent>
          {errorMessage && (
            <div className="mb-4 p-3 text-sm border rounded bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200">
              <p>{errorMessage}</p>
            </div>
          )}
          
          {/* Dev mode indicator (only in development) */}
          {isDevelopment && (
            <div className="mb-4 flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Beaker className="h-4 w-4 mr-2 text-purple-500" />
                  <span className="text-xs text-purple-600 font-medium">
                    Development Mode: {isSimulationMode ? 'Using simulated balance' : 'Using Devnet'}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={toggleDevMode}
                  >
                    {isSimulationMode ? 'Use Devnet' : 'Use Simulated Balance'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={runWalletDebug}
                  >
                    Run Diagnostics
                  </Button>
                </div>
              </div>
              
              {/* Airdrop button (only visible in development with devnet) */}
              {!isSimulationMode && walletInfo && (
                <div className="flex justify-between items-center bg-blue-50 p-2 rounded-md dark:bg-blue-900/20">
                  <div className="text-xs text-blue-700 dark:text-blue-300">
                    {airdropSuccess ? (
                      <span className="text-green-600 dark:text-green-400">{airdropSuccess}</span>
                    ) : (
                      <span>Need SOL for testing? Request a Devnet airdrop.</span>
                    )}
                  </div>
                  <Button 
                    variant="secondary"
                    size="sm" 
                    className="h-7 text-xs"
                    onClick={requestAirdrop}
                    disabled={isAirdropLoading}
                  >
                    {isAirdropLoading ? 'Requesting...' : 'Request 1 SOL'}
                  </Button>
                </div>
              )}
            </div>
          )}
          
          {walletInfo ? (
            <div className="space-y-4">
              <div className="flex flex-col space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Active Wallet</span>
                </div>
                
                <div className="flex items-center space-x-2 bg-muted/40 p-2 rounded-md">
                  <div className="h-2 w-2 rounded-full bg-green-500 flex-shrink-0 mr-1" />
                  <span className="font-mono text-sm">
                    {formatAddress(walletInfo.address)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => copyToClipboard(walletInfo.address)}
                  >
                    {isCopied ? (
                      <span className="text-green-500 text-xs">Copied!</span>
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    <span className="sr-only">Copy address</span>
                  </Button>
                  <a
                    href={walletInfo.addressLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span className="sr-only">View on Solscan</span>
                  </a>
                </div>
              </div>
              
              <div className="flex flex-col space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Balance</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={refreshBalance}
                    disabled={isBalanceLoading}
                  >
                    <RefreshCw className={`h-3 w-3 ${isBalanceLoading ? 'animate-spin' : ''}`} />
                    <span className="sr-only">Refresh balance</span>
                  </Button>
                </div>
                <span className="text-2xl font-bold">
                  {isLoading || isBalanceLoading ? (
                    <span className="animate-pulse">Loading...</span>
                  ) : balance !== null ? (
                    `${balance.toFixed(4)} SOL`
                  ) : (
                    <span className="text-base text-muted-foreground">
                      Balance unavailable
                    </span>
                  )}
                </span>
              </div>
              
              <div className="text-xs text-muted-foreground mt-2">
                <p>This wallet will be used for all MEV bot transactions.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center p-4 text-sm border rounded bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
                <AlertCircle className="h-4 w-4 mr-2" />
                <p>No wallet connected. Create a new wallet or import an existing one.</p>
              </div>
              
              <div className="flex justify-center space-x-4 mt-4">
                <Button
                  onClick={() => {
                    const newWallet = generateNewWallet()
                    setActiveWallet(0)
                    setWalletInfo(newWallet)
                    loadWalletInfo()
                  }}
                >
                  Create New Wallet
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsWalletManagerOpen(true)}
                >
                  Import Wallet
                </Button>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setIsWalletManagerOpen(true)}
          >
            Manage Wallets
          </Button>
          <Button
            onClick={loadWalletInfo}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Refresh All'}
          </Button>
        </CardFooter>
      </Card>

      <WalletManager
        isOpen={isWalletManagerOpen}
        onClose={() => setIsWalletManagerOpen(false)}
        onWalletChange={handleWalletChange}
      />
    </>
  )
} 