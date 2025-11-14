"use strict";
/**
 * Verify Magic Link
 * Monday Code Function
 *
 * Verifies magic link token and issues JWT for portal access
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = handler;
const monday_sdk_1 = require("@portal/monday-sdk");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * Main handler for magic link verification
 */
async function handler(req) {
    try {
        const body = JSON.parse(req.body);
        const { token } = body;
        if (!token) {
            return {
                success: false,
                error: {
                    code: 'BAD_REQUEST',
                    message: 'Token is required',
                },
            };
        }
        // Get monday API token from environment
        const apiToken = process.env.MONDAY_API_TOKEN;
        if (!apiToken) {
            throw new Error('MONDAY_API_TOKEN not configured');
        }
        // Verify magic link token
        const storage = (0, monday_sdk_1.createMondayStorage)(apiToken);
        const magicLinkData = await storage.getMagicLink(token);
        if (!magicLinkData) {
            return {
                success: false,
                error: {
                    code: 'INVALID_TOKEN',
                    message: 'Invalid or expired magic link',
                },
            };
        }
        const { clientId, email } = magicLinkData;
        // Get client details from monday
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
        // Get company ID from client
        const companyId = await storage.getClientCompany(clientId);
        // Generate JWT
        const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-this';
        const expiresIn = 24 * 60 * 60; // 24 hours
        const accessToken = jsonwebtoken_1.default.sign({
            sub: clientId,
            email,
            company_id: companyId || undefined,
        }, jwtSecret, {
            expiresIn,
        });
        // Store active token for client
        await storage.storeClientToken(clientId, accessToken);
        // Delete used magic link
        await storage.delete(`magic_link:${token}`);
        return {
            success: true,
            data: {
                access_token: accessToken,
                token_type: 'Bearer',
                client_id: clientId,
                email,
                expires_in: expiresIn,
            },
            meta: {
                timestamp: new Date().toISOString(),
            },
        };
    }
    catch (error) {
        console.error('Magic link verification error:', error);
        return {
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: error instanceof Error ? error.message : 'Unknown error',
            },
        };
    }
}
