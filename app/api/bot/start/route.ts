import { NextResponse } from 'next/server';
import { loadWalletInfo } from '@/app/lib/wallet-service';
import { hasMinimumBalance } from '@/app/lib/balance-service';
import { startBot } from '@/app/lib/wallet-service';

export async function POST() {
  try {
    const wallet = await loadWalletInfo();
    
    if (!wallet) {
      return NextResponse.json(
        { error: 'No wallet found' },
        { status: 404 }
      );
    }
    
    // Check if the wallet has the minimum required balance
    const hasSufficientBalance = await hasMinimumBalance(wallet.address);
    
    if (!hasSufficientBalance) {
      return NextResponse.json(
        { error: 'Insufficient funds. A minimum balance of 3 SOL is required to start.' },
        { status: 400 }
      );
    }
    
    // Start the bot
    const started = await startBot();
    
    if (!started) {
      return NextResponse.json(
        { error: 'Failed to start the MEV bot' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'MEV Bot started successfully'
    });
  } catch (error) {
    console.error('Error starting MEV bot:', error);
    return NextResponse.json(
      { error: 'Failed to start the MEV bot' },
      { status: 500 }
    );
  }
} 