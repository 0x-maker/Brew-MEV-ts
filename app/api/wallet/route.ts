import { NextResponse } from 'next/server';
import { getActiveWallet, initializeWallets, getAllWallets } from '../../lib/wallet-service';
import { getSafeBalance, getSimulatedBalance } from '../../lib/balance-service';

// Always use simulation in development mode to avoid RPC issues
function isDevMode(): boolean {
  return process.env.NODE_ENV === 'development';
}

export async function GET() {
  try {
    // We can't reliably initialize wallets from the server side
    // so we'll handle the "no wallet" case more gracefully
    const wallet = getActiveWallet();
    
    if (!wallet) {
      // Instead of returning a 404, return a specific message
      // that the client can handle
      return NextResponse.json({
        status: 'no-wallet',
        message: 'No active wallet found. Please create or import a wallet in the client.',
        error: 'No active wallet found'
      });
    }
    
    // In development, use a simulated balance to avoid RPC endpoint issues
    const useSimulation = isDevMode();
    
    try {
      // Get the balance (always simulate in development)
      const balance = useSimulation 
        ? getSimulatedBalance() 
        : await getSafeBalance(wallet.address, false);
      
      // Return the wallet info and balance
      return NextResponse.json({
        address: wallet.address,
        balance,
        devMode: useSimulation,
        solscanLink: wallet.addressLink
      });
    } catch (balanceError) {
      console.error('Error fetching balance:', balanceError);
      
      // If in development, use simulated balance when real balance fails
      if (isDevMode()) {
        console.log('Using fallback simulated balance due to error');
        const simulatedBalance = getSimulatedBalance();
        
        return NextResponse.json({
          address: wallet.address,
          balance: simulatedBalance,
          devModeForced: true,
          error: 'Using simulated balance due to API error',
          solscanLink: wallet.addressLink
        });
      }
      
      // In production, return error state
      return NextResponse.json({
        address: wallet.address,
        balance: null,
        error: 'Balance fetch failed - displaying wallet information only',
        solscanLink: wallet.addressLink
      });
    }
  } catch (error) {
    console.error('Error in wallet API:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Failed to get wallet information'
    });
  }
} 