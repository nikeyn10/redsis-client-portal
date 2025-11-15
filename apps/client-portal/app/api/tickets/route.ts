import { NextRequest, NextResponse } from 'next/server';

const MONDAY_API_TOKEN = process.env.MONDAY_API_TOKEN || '';

async function executeMondayQuery(query: string, variables?: Record<string, any>) {
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const boardId = searchParams.get('boardId');

    if (!boardId) {
      return NextResponse.json(
        { error: 'Board ID is required' },
        { status: 400 }
      );
    }

    const query = `
      query GetBoardItems($boardId: [ID!]!) {
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
              created_at
              updated_at
            }
          }
        }
      }
    `;

    const response = await executeMondayQuery(query, {
      boardId: [boardId]
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('Failed to fetch tickets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { boardId, itemName, columnValues } = await request.json();

    if (!boardId || !itemName) {
      return NextResponse.json(
        { error: 'Board ID and item name are required' },
        { status: 400 }
      );
    }

    const mutation = `
      mutation CreateItem($boardId: ID!, $itemName: String!, $columnValues: JSON!) {
        create_item(
          board_id: $boardId,
          item_name: $itemName,
          column_values: $columnValues
        ) {
          id
          created_at
        }
      }
    `;

    const response = await executeMondayQuery(mutation, {
      boardId,
      itemName,
      columnValues: JSON.stringify(columnValues)
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('Failed to create ticket:', error);
    return NextResponse.json(
      { error: 'Failed to create ticket: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
