import { NextResponse } from 'next/server';
import { getActiveWallet } from '../../../lib/wallet-service';
import { requestDevnetAirdrop } from '../../../lib/balance-service';

// POST endpoint to request an airdrop
export async function POST(request: Request) {
  // Only allow in development mode
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Airdrops are only available in development environment' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    
    // Get the wallet address
    let address: string;
    
    if (body.address) {
      // Use address from request body if provided
      address = body.address;
    } else {
      // Otherwise use active wallet
      const wallet = getActiveWallet();
      if (!wallet) {
        return NextResponse.json(
          { error: 'No active wallet found' },
          { status: 404 }
        );
      }
      address = wallet.address;
    }
    
    // Get the airdrop amount (default to 1 SOL if not specified)
    const amount = typeof body.amount === 'number' ? body.amount : 1;
    
    // Request the airdrop
    const success = await requestDevnetAirdrop(address, amount);
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: `Successfully airdropped ${amount} SOL to ${address}`,
        address,
        amount
      });
    } else {
      return NextResponse.json(
        { error: 'Airdrop request failed' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing airdrop request:', error);
    return NextResponse.json(
      { error: 'Failed to process airdrop request' },
      { status: 500 }
    );
  }
} 