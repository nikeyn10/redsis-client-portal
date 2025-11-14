"use strict";
/**
 * Create Ticket
 * Monday Code Function
 *
 * Creates a new support ticket for a client
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = handler;
const monday_sdk_1 = require("@portal/monday-sdk");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * Extract client ID from JWT
 */
function extractClientId(authHeader) {
    try {
        const token = authHeader.replace('Bearer ', '');
        const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-this';
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        return decoded.sub;
    }
    catch (error) {
        return null;
    }
}
/**
 * Main handler
 */
async function handler(req) {
    try {
        // Extract and verify JWT
        const authHeader = req.headers['authorization'];
        const clientId = extractClientId(authHeader);
        if (!clientId) {
            return {
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Invalid or missing authorization token',
                },
            };
        }
        const body = JSON.parse(req.body);
        const { title, description, priority, board_id } = body;
        if (!title || !description) {
            return {
                success: false,
                error: {
                    code: 'BAD_REQUEST',
                    message: 'Title and description are required',
                },
            };
        }
        // Get monday API token
        const apiToken = process.env.MONDAY_API_TOKEN;
        if (!apiToken) {
            throw new Error('MONDAY_API_TOKEN not configured');
        }
        const gql = (0, monday_sdk_1.createMondayGraphQL)(apiToken);
        const storage = (0, monday_sdk_1.createMondayStorage)(apiToken);
        // Determine target board
        let targetBoardId;
        if (board_id) {
            targetBoardId = parseInt(board_id);
        }
        else {
            // Use company's default board or env default
            const companyId = await storage.getClientCompany(clientId);
            if (companyId) {
                const companyBoards = await storage.getCompanyBoards(companyId);
                targetBoardId = parseInt(companyBoards[0] || process.env.DEFAULT_BOARD_ID || '');
            }
            else {
                targetBoardId = parseInt(process.env.DEFAULT_BOARD_ID || '');
            }
        }
        if (!targetBoardId) {
            return {
                success: false,
                error: {
                    code: 'CONFIGURATION_ERROR',
                    message: 'No board configured for ticket creation',
                },
            };
        }
        // Build column values
        const columnValues = {
            description: description,
            client: { personsAndTeams: [{ id: parseInt(clientId), kind: 'person' }] },
            status: { label: 'Open' },
            priority: { label: priority.charAt(0).toUpperCase() + priority.slice(1) },
        };
        // Create item
        const item = await gql.createItem(targetBoardId, title, columnValues);
        // Parse to Ticket type
        const ticket = {
            id: item.id,
            board_id: item.board.id,
            title: item.name,
            description,
            status: 'open',
            priority,
            client_id: clientId,
            created_at: item.created_at,
            updated_at: item.updated_at,
        };
        // Send notification (optional)
        // TODO: Trigger email notification
        return {
            success: true,
            data: ticket,
            meta: {
                timestamp: new Date().toISOString(),
            },
        };
    }
    catch (error) {
        console.error('Create ticket error:', error);
        return {
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: error instanceof Error ? error.message : 'Unknown error',
            },
        };
    }
}
