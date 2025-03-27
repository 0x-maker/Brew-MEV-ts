import { NextResponse } from 'next/server';
import { getActiveWallet } from '../../lib/wallet-service';
import { getBotSettings, getSettingsAsEnvVars } from '../../lib/bot-settings';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Track bot status
let botRunning = false;
const botProcess: any = null;

// GET bot status
export async function GET() {
  try {
    const activeWallet = getActiveWallet();
    
    return NextResponse.json({
      running: botRunning,
      walletConnected: !!activeWallet,
      address: activeWallet ? activeWallet.address : null
    });
  } catch (error) {
    console.error('Error getting bot status:', error);
    return NextResponse.json(
      { error: 'Failed to get bot status' },
      { status: 500 }
    );
  }
}

// POST to control the bot
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;
    
    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }
    
    const activeWallet = getActiveWallet();
    if (!activeWallet) {
      return NextResponse.json(
        { error: 'No active wallet found' },
        { status: 400 }
      );
    }
    
    switch (action) {
      case 'start':
        if (botRunning) {
          return NextResponse.json(
            { error: 'Bot is already running' },
            { status: 400 }
          );
        }
        
        try {
          // Get bot settings
          const settings = getBotSettings();
          const envVars = getSettingsAsEnvVars();
          
          // Add wallet private key to env vars
          const allEnvVars: Record<string, string> = {
            ...Object.entries(envVars).reduce((acc, [key, val]) => ({
              ...acc,
              [key]: String(val)
            }), {}),
            PRIVATE_KEY: activeWallet.privateKey
          };
          
          // Convert env vars to string for the command
          const envVarsString = Object.entries(allEnvVars)
            .map(([key, value]) => `${key}=${value}`)
            .join(' ');
          
          // Use the TypeScript version instead of the JavaScript version
          const { stdout, stderr } = await execAsync(`${envVarsString} npx ts-node cli/src/brew.ts`);
          
          botRunning = true;
          
          return NextResponse.json({
            success: true,
            message: 'Bot started successfully',
            output: stdout,
            errors: stderr
          });
        } catch (err) {
          console.error('Error starting bot:', err);
          return NextResponse.json(
            { error: 'Failed to start bot' },
            { status: 500 }
          );
        }
      
      case 'stop':
        if (!botRunning) {
          return NextResponse.json(
            { error: 'Bot is not running' },
            { status: 400 }
          );
        }
        
        try {
          // Update the command to stop the TypeScript version
          await execAsync('pkill -f "npx ts-node cli/src/brew.ts"').catch(() => {
            // Ignore errors if process not found
          });
          
          botRunning = false;
          
          return NextResponse.json({
            success: true,
            message: 'Bot stopped successfully'
          });
        } catch (err) {
          console.error('Error stopping bot:', err);
          return NextResponse.json(
            { error: 'Failed to stop bot' },
            { status: 500 }
          );
        }
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error controlling bot:', error);
    return NextResponse.json(
      { error: 'Failed to control bot' },
      { status: 500 }
    );
  }
} 