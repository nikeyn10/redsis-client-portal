/**
 * Simplified Magic Link Generator for Monday Code
 * Works directly with Users board (18379351659)
 * 
 * Environment variables required:
 * - PORTAL_BASE_URL: Base URL of client portal (e.g., https://portal.redsis.com)
 */

import crypto from 'crypto';

const USERS_BOARD_ID = '18379351659';

interface MagicLinkRequest {
  email: string;
  expiresInHours?: number;
}

/**
 * Store magic link token in monday.com storage
 */
async function storeMagicLink(
  mondayContext: any,
  token: string,
  userId: string,
  email: string,
  expiresInHours: number
): Promise<boolean> {
  try {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    const data = {
      userId,
      email,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
    };

    await mondayContext.storage.set(`magic_link:${token}`, data);
    return true;
  } catch (error) {
    console.error('Storage error:', error);
    return false;
  }
}

/**
 * Find user by email in Users board
 */
async function findUserByEmail(monday: any, email: string): Promise<any> {
  try {
    const query = `
      query {
        boards(ids: [${USERS_BOARD_ID}]) {
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

    const response = await monday.api(query);
    const items = response.data?.boards?.[0]?.items_page?.items || [];

    // Find user with matching email
    for (const item of items) {
      const emailColumn = item.column_values.find((col: any) => 
        col.text?.toLowerCase() === email.toLowerCase()
      );
      
      if (emailColumn) {
        return item;
      }
    }

    return null;
  } catch (error) {
    console.error('User lookup error:', error);
    return null;
  }
}

/**
 * Main handler
 */
export async function handler(req: any, context: any) {
  try {
    const { email, expiresInHours = 24 } = req.payload as MagicLinkRequest;

    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Email is required',
        }),
      };
    }

    // Find user in Monday
    const user = await findUserByEmail(context.monday, email);

    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: 'User not found',
        }),
      };
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');

    // Store magic link
    const stored = await storeMagicLink(
      context,
      token,
      user.id,
      email,
      expiresInHours
    );

    if (!stored) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Failed to generate magic link',
        }),
      };
    }

    // Build magic link URL
    const portalBaseUrl = process.env.PORTAL_BASE_URL || 'https://portal.redsis.com';
    const magicLink = `${portalBaseUrl}/auth/magic?token=${token}`;

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    return {
      statusCode: 200,
      body: JSON.stringify({
        magic_link: magicLink,
        expires_at: expiresAt.toISOString(),
        user_id: user.id,
        email: email,
      }),
    };
  } catch (error) {
    console.error('Magic link generation error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
}
