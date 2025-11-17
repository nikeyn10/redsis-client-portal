import { NextRequest, NextResponse } from 'next/server';
import { BOARD_IDS, COLUMN_IDS } from '@/lib/monday-config';

/**
 * Get PIN Users API Route
 * Fetches all users configured for PIN authentication
 */
export async function GET(request: NextRequest) {
  try {
    const query = `
      query {
        boards(ids: [${BOARD_IDS.USERS}]) {
          items_page(limit: 500) {
            items {
              id
              name
              column_values {
                id
                text
                value
              }
            }
          }
        }
      }
    `;

    const response = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': process.env.NEXT_PUBLIC_MONDAY_API_TOKEN || '',
        'API-Version': '2023-10'
      },
      body: JSON.stringify({ query })
    });

    const data = await response.json();

    if (data.errors) {
      throw new Error(data.errors[0].message);
    }

    const users = data.data.boards[0].items_page.items;

    return NextResponse.json({ 
      success: true,
      users
    });
  } catch (error) {
    console.error('PIN users fetch error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
