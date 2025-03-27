import { NextResponse } from 'next/server';
import { 
  getBotSettings, 
  updateBotSettings,
  validateSettings,
  resetBotSettings,
  BotSettings
} from '../../lib/bot-settings';

// GET settings
export async function GET() {
  try {
    // Get current settings
    const settings = getBotSettings();
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error getting settings:', error);
    return NextResponse.json(
      { error: 'Failed to get settings' },
      { status: 500 }
    );
  }
}

// POST to update settings
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, settings } = body;
    
    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }
    
    let result;
    
    switch (action) {
      case 'update':
        if (!settings || typeof settings !== 'object') {
          return NextResponse.json(
            { error: 'Settings object is required' },
            { status: 400 }
          );
        }
        
        // Validate settings
        const validation = validateSettings(settings);
        if (!validation.valid) {
          return NextResponse.json(
            { error: 'Invalid settings', validationErrors: validation.errors },
            { status: 400 }
          );
        }
        
        // Update settings
        result = updateBotSettings(settings);
        break;
      
      case 'reset':
        // Reset to default settings
        result = resetBotSettings();
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
    
    return NextResponse.json({
      success: true,
      settings: result,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
} 