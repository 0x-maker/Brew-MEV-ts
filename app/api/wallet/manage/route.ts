import { NextResponse } from 'next/server';
import { 
  getAllWallets, 
  getActiveWallet, 
  setActiveWallet, 
  generateNewWallet,
  importWalletFromPrivateKey,
  removeWallet,
  initializeWallets
} from '../../../lib/wallet-service';

// GET wallet list
export async function GET() {
  try {
    initializeWallets();
    const wallets = getAllWallets();
    const activeWallet = getActiveWallet();
    
    return NextResponse.json({
      wallets,
      activeWalletAddress: activeWallet ? activeWallet.address : null
    });
  } catch (error) {
    console.error('Error in wallet management API:', error);
    return NextResponse.json(
      { error: 'Failed to get wallet information' },
      { status: 500 }
    );
  }
}

// POST to manage wallets
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, data } = body;
    
    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }
    
    let result;
    
    switch (action) {
      case 'create':
        // Create a new wallet
        result = generateNewWallet();
        break;
      
      case 'import':
        // Import a wallet from private key
        if (!data || !data.privateKey) {
          return NextResponse.json(
            { error: 'Private key is required' },
            { status: 400 }
          );
        }
        
        try {
          result = importWalletFromPrivateKey(data.privateKey);
        } catch (err) {
          return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Invalid private key' },
            { status: 400 }
          );
        }
        break;
      
      case 'setActive':
        // Set active wallet
        if (data === undefined || data.index === undefined) {
          return NextResponse.json(
            { error: 'Wallet index is required' },
            { status: 400 }
          );
        }
        
        try {
          setActiveWallet(data.index);
          result = getActiveWallet();
        } catch (err) {
          return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Invalid wallet index' },
            { status: 400 }
          );
        }
        break;
      
      case 'remove':
        // Remove a wallet
        if (data === undefined || data.index === undefined) {
          return NextResponse.json(
            { error: 'Wallet index is required' },
            { status: 400 }
          );
        }
        
        try {
          removeWallet(data.index);
          result = getAllWallets();
        } catch (err) {
          return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Invalid wallet index' },
            { status: 400 }
          );
        }
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
    
    return NextResponse.json({
      success: true,
      result,
      message: `Wallet operation '${action}' completed successfully`
    });
  } catch (error) {
    console.error('Error in wallet management API:', error);
    return NextResponse.json(
      { error: 'Failed to perform wallet operation' },
      { status: 500 }
    );
  }
} 