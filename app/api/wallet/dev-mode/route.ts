import { NextResponse } from 'next/server';

// Global variable to track dev mode state (persist during app runtime)
let useSimulation = process.env.NODE_ENV === 'development';

// GET endpoint to check the current dev mode state
export async function GET() {
  // Only allow in development mode
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Dev mode is only available in development environment' },
      { status: 403 }
    );
  }

  return NextResponse.json({ devMode: useSimulation });
}

// POST endpoint to toggle dev mode
export async function POST(request: Request) {
  // Only allow in development mode
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Dev mode is only available in development environment' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    
    // Update simulation mode based on request
    if (typeof body.useSimulation === 'boolean') {
      useSimulation = body.useSimulation;
    }

    return NextResponse.json({ devMode: useSimulation });
  } catch (error) {
    console.error('Error toggling dev mode:', error);
    return NextResponse.json(
      { error: 'Failed to parse request body' },
      { status: 400 }
    );
  }
}

// Export for use in balance service
export const getDevMode = () => useSimulation; 