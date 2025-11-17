import { NextRequest, NextResponse } from 'next/server';

/**
 * Verify Magic Link API Route
 * Calls Monday Code function to verify a magic link token
 */
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Call Monday Code function
    // NOTE: Update this URL after deploying to Monday Code
    const MONDAY_CODE_URL = process.env.MONDAY_CODE_VERIFY_MAGIC_LINK_URL;
    
    if (!MONDAY_CODE_URL) {
      return NextResponse.json(
        { error: 'Magic link service not configured' },
        { status: 503 }
      );
    }

    const response = await fetch(MONDAY_CODE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': process.env.MONDAY_API_TOKEN || '',
      },
      body: JSON.stringify({ token })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Invalid or expired token');
    }

    return NextResponse.json({ 
      success: true,
      email: data.email,
      userId: data.userId
    });
  } catch (error) {
    console.error('Magic link verification error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
