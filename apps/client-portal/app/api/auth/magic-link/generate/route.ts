import { NextRequest, NextResponse } from 'next/server';

/**
 * Generate Magic Link API Route
 * Calls Monday Code function to generate a magic link
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Call Monday Code function
    // NOTE: Update this URL after deploying to Monday Code
    const MONDAY_CODE_URL = process.env.MONDAY_CODE_GENERATE_MAGIC_LINK_URL;
    
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
      body: JSON.stringify({ email })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to generate magic link');
    }

    return NextResponse.json({ 
      success: true,
      message: 'Magic link sent successfully'
    });
  } catch (error) {
    console.error('Magic link generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
