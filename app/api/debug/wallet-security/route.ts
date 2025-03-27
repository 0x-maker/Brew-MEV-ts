import { NextResponse } from 'next/server';
import { getAllWallets, getActiveWallet } from '../../../lib/wallet-service';
import { isEncrypted } from '../../../lib/crypto-utils';

// This endpoint is for development testing of encryption only
export async function GET() {
  // Don't run in production
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development environment' },
      { status: 403 }
    );
  }

  try {
    // Get wallet info
    const wallets = getAllWallets();
    const activeWallet = getActiveWallet();
    
    // Check if private keys are encrypted
    const securityInfo = wallets.map(wallet => ({
      address: wallet.address,
      isPrivateKeyEncrypted: isEncrypted(wallet.privateKey),
      privateKeyLength: wallet.privateKey ? wallet.privateKey.length : 0,
      isActive: activeWallet ? wallet.address === activeWallet.address : false,
    }));
    
    return NextResponse.json({
      walletCount: wallets.length,
      walletsEncrypted: wallets.every(w => isEncrypted(w.privateKey)),
      securityInfo,
      message: "This is only for development testing. Do not use in production."
    });
  } catch (error) {
    console.error('Error in wallet security debug endpoint:', error);
    return NextResponse.json({
      error: 'Error checking wallet encryption',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
} 