/**
 * Magic Link Generator
 * Monday Code Function
 * 
 * Generates magic links for client portal access
 * Stores token mapping in monday storage
 */

import { createMondayGraphQL, createMondayStorage } from '@portal/monday-sdk';
import type { ApiResponse } from '@portal/types';
import crypto from 'crypto';

interface MagicLinkRequest {
  clientId: string;
  email: string;
  expiresInHours?: number;
}

interface MagicLinkResponse {
  magic_link: string;
  expires_at: string;
}

/**
 * Main handler for magic link generation
 */
export async function handler(req: any): Promise<ApiResponse<MagicLinkResponse>> {
  try {
    const apiToken = req.headers['authorization'];
    if (!apiToken) {
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing authorization token',
        },
      };
    }

    const body: MagicLinkRequest = JSON.parse(req.body);
    const { clientId, email, expiresInHours = 24 } = body;

    if (!clientId || !email) {
      return {
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'clientId and email are required',
        },
      };
    }

    // Verify client exists in monday
    const gql = createMondayGraphQL(apiToken);
    const client = await gql.getItem(parseInt(clientId));
    
    if (!client) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Client not found',
        },
      };
    }

    // Generate secure random token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Store in monday storage
    const storage = createMondayStorage(apiToken);
    const stored = await storage.storeMagicLink(token, clientId, email, expiresInHours);
    
    if (!stored) {
      return {
        success: false,
        error: {
          code: 'STORAGE_ERROR',
          message: 'Failed to store magic link',
        },
      };
    }

    // Build magic link URL
    const portalBaseUrl = process.env.PORTAL_BASE_URL || 'https://portal.yourcompany.com';
    const magicLink = `${portalBaseUrl}/auth/magic?token=${token}`;

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    return {
      success: true,
      data: {
        magic_link: magicLink,
        expires_at: expiresAt.toISOString(),
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('Magic link generation error:', error);
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}
