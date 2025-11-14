"use strict";
/**
 * Get Tickets
 * Monday Code Function
 *
 * Retrieves all tickets for a specific client
 * Supports multi-board aggregation
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
 * Parse monday item to Ticket type
 */
function parseItemToTicket(item) {
    const columns = item.column_values || [];
    const getColumnValue = (id) => {
        const col = columns.find((c) => c.id === id);
        return col?.text || col?.value || '';
    };
    const getColumnJson = (id) => {
        const col = columns.find((c) => c.id === id);
        try {
            return col?.value ? JSON.parse(col.value) : null;
        }
        catch {
            return null;
        }
    };
    const statusCol = getColumnJson('status');
    const priorityCol = getColumnJson('priority');
    return {
        id: item.id,
        board_id: item.board.id,
        title: item.name,
        description: getColumnValue('description') || getColumnValue('long_text'),
        status: (statusCol?.label?.toLowerCase().replace(' ', '_') || 'open'),
        priority: (priorityCol?.label?.toLowerCase() || 'medium'),
        client_id: getColumnValue('client') || getColumnValue('person'),
        client_name: getColumnValue('client_name'),
        company_id: getColumnValue('company'),
        assigned_to: getColumnValue('assigned_to') || getColumnValue('person'),
        created_at: item.created_at,
        updated_at: item.updated_at,
        tags: getColumnValue('tags')?.split(',').map((t) => t.trim()),
    };
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
        const body = req.body ? JSON.parse(req.body) : {};
        const { board_ids, status, limit = 100 } = body;
        // Get monday API token
        const apiToken = process.env.MONDAY_API_TOKEN;
        if (!apiToken) {
            throw new Error('MONDAY_API_TOKEN not configured');
        }
        const gql = (0, monday_sdk_1.createMondayGraphQL)(apiToken);
        const storage = (0, monday_sdk_1.createMondayStorage)(apiToken);
        // Get boards to query
        let boardIds;
        if (board_ids) {
            boardIds = board_ids.map(id => parseInt(id));
        }
        else {
            // Get company's boards
            const companyId = await storage.getClientCompany(clientId);
            if (companyId) {
                const companyBoards = await storage.getCompanyBoards(companyId);
                boardIds = companyBoards.map(id => parseInt(id));
            }
            else {
                // Fallback to default board (from env or config)
                const defaultBoard = process.env.DEFAULT_BOARD_ID;
                if (!defaultBoard) {
                    return {
                        success: false,
                        error: {
                            code: 'CONFIGURATION_ERROR',
                            message: 'No boards configured for client',
                        },
                    };
                }
                boardIds = [parseInt(defaultBoard)];
            }
        }
        // Fetch items from all boards
        const items = await gql.getItems(boardIds, limit);
        // Filter for this client and parse to tickets
        const tickets = items
            .filter((item) => {
            const clientCol = item.column_values.find((col) => col.id === 'client' || col.id === 'person');
            return clientCol?.text === clientId;
        })
            .map(parseItemToTicket);
        // Filter by status if requested
        const filteredTickets = status
            ? tickets.filter(t => t.status === status)
            : tickets;
        // Sort by created date (newest first)
        filteredTickets.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return {
            success: true,
            data: filteredTickets,
            meta: {
                timestamp: new Date().toISOString(),
            },
        };
    }
    catch (error) {
        console.error('Get tickets error:', error);
        return {
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: error instanceof Error ? error.message : 'Unknown error',
            },
        };
    }
}
