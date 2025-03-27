import { NextResponse } from 'next/server';
import { loadWalletInfo, withdrawFromBot } from '@/app/lib/wallet-service';

export async function POST(request: Request) {
  try {
    const wallet = await loadWalletInfo();
    
    if (!wallet) {
      return NextResponse.json(
        { error: 'No wallet found' },
        { status: 404 }
      );
    }
    
    // Get the withdrawal address and amount from the request
    const body = await request.json();
    const { withdrawalAddress, amount } = body;
    
    if (!withdrawalAddress || !amount) {
      return NextResponse.json(
        { error: 'Withdrawal address and amount are required' },
        { status: 400 }
      );
    }
    
    // Withdraw funds from the bot (this effectively stops it)
    const success = await withdrawFromBot(withdrawalAddress, parseFloat(amount));
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to withdraw funds and stop the MEV bot' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'MEV Bot stopped successfully'
    });
  } catch (error) {
    console.error('Error stopping MEV bot:', error);
    return NextResponse.json(
      { error: 'Failed to stop the MEV bot' },
      { status: 500 }
    );
  }
} 