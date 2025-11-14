"use strict";
/**
 * Magic Link Generator
 * Monday Code Function
 *
 * Generates magic links for client portal access
 * Stores token mapping in monday storage
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = handler;
const monday_sdk_1 = require("@portal/monday-sdk");
const crypto_1 = __importDefault(require("crypto"));
/**
 * Main handler for magic link generation
 */
async function handler(req) {
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
        const body = JSON.parse(req.body);
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
        const gql = (0, monday_sdk_1.createMondayGraphQL)(apiToken);
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
        const token = crypto_1.default.randomBytes(32).toString('hex');
        // Store in monday storage
        const storage = (0, monday_sdk_1.createMondayStorage)(apiToken);
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
    }
    catch (error) {
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
