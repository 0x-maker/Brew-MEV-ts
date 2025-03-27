import { NextResponse } from 'next/server';
import { getActiveWallet, getAllWallets } from '../../lib/wallet-service';
// Import libs using require for compatibility
const solanaWeb3 = require('@solana/web3.js');
const Connection = solanaWeb3.Connection;
const PublicKey = solanaWeb3.PublicKey;
const clusterApiUrl = solanaWeb3.clusterApiUrl;

// Only enable this endpoint in development mode
export async function GET() {
  // Don't run in production
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Debug endpoint is only available in development environment' },
      { status: 403 }
    );
  }

  // Check if we're in a browser environment
  const isBrowser = typeof window !== 'undefined';

  try {
    // Get wallet information
    const allWallets = getAllWallets();
    const activeWallet = getActiveWallet();
    
    // Check Solana RPC connections
    const devnetStatus = await checkConnection('devnet');
    const mainnetStatus = await checkConnection('mainnet-beta');
    
    // Return debug information
    return NextResponse.json({
      environment: {
        nodeEnv: process.env.NODE_ENV,
        isBrowser,
        isServer: !isBrowser,
      },
      wallets: {
        count: allWallets.length,
        addresses: allWallets.map(w => w.address),
        activeWalletAddress: activeWallet?.address || null,
      },
      connections: {
        devnet: devnetStatus,
        mainnet: mainnetStatus,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in debug API:', error);
    return NextResponse.json({
      error: 'Error in debug endpoint',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

// Check connection to a Solana cluster
async function checkConnection(network: 'devnet' | 'mainnet-beta') {
  try {
    const endpoint = clusterApiUrl(network);
    const connection = new Connection(endpoint, 'confirmed');
    
    // Try to get the version as a simple check
    const version = await Promise.race([
      connection.getVersion(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 5000))
    ]);
    
    return {
      status: 'ok',
      endpoint,
      version,
    };
  } catch (error) {
    return {
      status: 'error',
      endpoint: clusterApiUrl(network),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
} 