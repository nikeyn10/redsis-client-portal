import { NextRequest, NextResponse } from 'next/server';

const MONDAY_API_TOKEN = process.env.NEXT_PUBLIC_MONDAY_API_TOKEN || process.env.MONDAY_API_TOKEN || '';
const USER_BOARD_ID = '18379351659';

async function executeMondayQuery(query: string, variables?: Record<string, any>) {
  if (!MONDAY_API_TOKEN) {
    throw new Error('Monday API token is not configured');
  }

  const response = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': MONDAY_API_TOKEN,
      'API-Version': '2023-10'
    },
    body: JSON.stringify({ query, variables })
  });

  const result = await response.json();
  
  if (result.errors) {
    console.error('Monday API errors:', result.errors);
    throw new Error(result.errors[0]?.message || 'Monday API error');
  }
  
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Query User board to find user by email
    const query = `
      query GetUsers($boardId: [ID!]!) {
        boards(ids: $boardId) {
          items_page(limit: 100) {
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

    const response = await executeMondayQuery(query, {
      boardId: [USER_BOARD_ID]
    });

    if (!response.data?.boards?.[0]?.items_page?.items) {
      return NextResponse.json(
        { error: 'Unable to authenticate. Please try again.' },
        { status: 500 }
      );
    }

    const users = response.data.boards[0].items_page.items;
    
    // Find user by email
    const user = users.find((item: any) => {
      const cols = item.column_values.reduce((acc: any, col: any) => {
        acc[col.id] = col.text || col.value;
        return acc;
      }, {});
      
      const userEmail = cols.email_mkxpm2m0 || '';
      return userEmail.toLowerCase() === email.toLowerCase();
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Email not found' },
        { status: 401 }
      );
    }

    // Get user data
    const userCols = user.column_values.reduce((acc: any, col: any) => {
      acc[col.id] = col.text || col.value;
      return acc;
    }, {});

    // Use Management Portal board as default ticket board for now
    // In production, this would be determined by user's sites/projects
    const ticketBoardId = '18379040651'; // Management Portal board

    // Return authentication data
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: email,
        ticketBoardId: ticketBoardId,
        token: `user-${user.id}-${Date.now()}`
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}
