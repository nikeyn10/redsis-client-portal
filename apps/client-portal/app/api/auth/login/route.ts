import { NextRequest, NextResponse } from 'next/server';

const MONDAY_API_TOKEN = process.env.MONDAY_API_TOKEN || '';
const USER_BOARD_ID = '18379351659';
const COMPANY_BOARD_ID = '18379404757';

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

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Query User board to authenticate
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
    
    // Find user by email and password
    const user = users.find((item: any) => {
      const cols = item.column_values.reduce((acc: any, col: any) => {
        acc[col.id] = col.text || col.value;
        return acc;
      }, {});
      
      const userEmail = cols.email_mkxpm2m0 || '';
      const userPassword = cols.text_mkxpxyrr || '';
      
      return userEmail.toLowerCase() === email.toLowerCase() && userPassword === password;
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Get user data
    const userCols = user.column_values.reduce((acc: any, col: any) => {
      acc[col.id] = col.text || col.value;
      return acc;
    }, {});

    const companyName = userCols.dropdown_mkxpsjwd || '';

    // Fetch the company's ticket board ID
    let ticketBoardId = '18379040651'; // Default fallback

    if (companyName) {
      try {
        const companyQuery = `
          query GetCompanies($boardId: [ID!]!) {
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

        const companyResponse = await executeMondayQuery(companyQuery, {
          boardId: [COMPANY_BOARD_ID]
        });

        if (companyResponse.data?.boards?.[0]?.items_page?.items) {
          const companies = companyResponse.data.boards[0].items_page.items;
          const company = companies.find((item: any) => item.name === companyName);
          
          if (company) {
            const companyCols = company.column_values.reduce((acc: any, col: any) => {
              acc[col.id] = col.text || col.value;
              return acc;
            }, {});
            
            const boardIdFromCompany = companyCols.dropdown_mkxpakmh;
            
            if (boardIdFromCompany) {
              ticketBoardId = boardIdFromCompany;
              console.log(`✅ Found company ticket board: ${ticketBoardId} for ${companyName}`);
            } else {
              console.warn(`⚠️ Company "${companyName}" has no ticket board ID set`);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch company board ID:', err);
        // Continue with default board ID
      }
    }

    // Return authentication data
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: email,
        company: companyName,
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
