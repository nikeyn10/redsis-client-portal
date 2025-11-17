/**
 * Simplified Magic Link Verification for Monday Code
 * 
 * Validates magic link tokens and returns user session data
 * 
 * Environment variables required:
 * - JWT_SECRET: Secret for signing JWT tokens
 */

import jwt from 'jsonwebtoken';

interface VerifyMagicLinkRequest {
  token: string;
}

/**
 * Get magic link data from storage
 */
async function getMagicLink(mondayContext: any, token: string): Promise<any> {
  try {
    const data = await mondayContext.storage.get(`magic_link:${token}`);
    
    if (!data) {
      return null;
    }

    // Check expiration
    const expiresAt = new Date(data.expiresAt);
    if (expiresAt < new Date()) {
      // Delete expired token
      await mondayContext.storage.delete(`magic_link:${token}`);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Storage retrieval error:', error);
    return null;
  }
}

/**
 * Get user details from Monday
 */
async function getUserDetails(monday: any, userId: string): Promise<any> {
  try {
    const query = `
      query {
        items(ids: [${userId}]) {
          id
          name
          column_values {
            id
            text
            value
          }
        }
      }
    `;

    const response = await monday.api(query);
    return response.data?.items?.[0] || null;
  } catch (error) {
    console.error('User details error:', error);
    return null;
  }
}

/**
 * Main handler
 */
export async function handler(req: any, context: any) {
  try {
    const { token } = req.payload as VerifyMagicLinkRequest;

    if (!token) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Token is required',
        }),
      };
    }

    // Verify magic link token
    const magicLinkData = await getMagicLink(context, token);

    if (!magicLinkData) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          error: 'Invalid or expired magic link',
        }),
      };
    }

    const { userId, email } = magicLinkData;

    // Get user details
    const user = await getUserDetails(context.monday, userId);

    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: 'User not found',
        }),
      };
    }

    // Generate JWT
    const jwtSecret = process.env.JWT_SECRET || 'change-this-secret-key-in-production';
    const expiresIn = 24 * 60 * 60; // 24 hours in seconds

    const accessToken = jwt.sign(
      {
        sub: userId,
        email: email,
        name: user.name,
        type: 'user',
      },
      jwtSecret,
      {
        expiresIn,
      }
    );

    // Delete used magic link
    await context.storage.delete(`magic_link:${token}`);

    // Store active session
    await context.storage.set(`session:${userId}`, {
      accessToken,
      email,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: expiresIn,
        user: {
          id: userId,
          email: email,
          name: user.name,
        },
      }),
    };
  } catch (error) {
    console.error('Magic link verification error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
}
