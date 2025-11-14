/**
 * Get Tickets
 * Monday Code Function
 * 
 * Retrieves all tickets for a specific client
 * Supports multi-board aggregation
 */

import { createMondayGraphQL, createMondayStorage } from '@portal/monday-sdk';
import type { ApiResponse, Ticket, TicketStatus, TicketPriority } from '@portal/types';
import jwt from 'jsonwebtoken';

interface GetTicketsRequest {
  board_ids?: string[]; // Optional: specific boards
  status?: TicketStatus;
  limit?: number;
}

/**
 * Extract client ID from JWT
 */
function extractClientId(authHeader: string): string | null {
  try {
    const token = authHeader.replace('Bearer ', '');
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-this';
    const decoded = jwt.verify(token, jwtSecret) as any;
    return decoded.sub;
  } catch (error) {
    return null;
  }
}

/**
 * Parse monday item to Ticket type
 */
function parseItemToTicket(item: any): Ticket {
  const columns = item.column_values || [];
  
  const getColumnValue = (id: string) => {
    const col = columns.find((c: any) => c.id === id);
    return col?.text || col?.value || '';
  };

  const getColumnJson = (id: string) => {
    const col = columns.find((c: any) => c.id === id);
    try {
      return col?.value ? JSON.parse(col.value) : null;
    } catch {
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
    status: (statusCol?.label?.toLowerCase().replace(' ', '_') || 'open') as TicketStatus,
    priority: (priorityCol?.label?.toLowerCase() || 'medium') as TicketPriority,
    client_id: getColumnValue('client') || getColumnValue('person'),
    client_name: getColumnValue('client_name'),
    company_id: getColumnValue('company'),
    assigned_to: getColumnValue('assigned_to') || getColumnValue('person'),
    created_at: item.created_at,
    updated_at: item.updated_at,
    tags: getColumnValue('tags')?.split(',').map((t: string) => t.trim()),
  };
}

/**
 * Main handler
 */
export async function handler(req: any): Promise<ApiResponse<Ticket[]>> {
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

    const body: GetTicketsRequest = req.body ? JSON.parse(req.body) : {};
    const { board_ids, status, limit = 100 } = body;

    // Get monday API token
    const apiToken = process.env.MONDAY_API_TOKEN;
    if (!apiToken) {
      throw new Error('MONDAY_API_TOKEN not configured');
    }

    const gql = createMondayGraphQL(apiToken);
    const storage = createMondayStorage(apiToken);

    // Get boards to query
    let boardIds: number[];
    if (board_ids) {
      boardIds = board_ids.map(id => parseInt(id));
    } else {
      // Get company's boards
      const companyId = await storage.getClientCompany(clientId);
      if (companyId) {
        const companyBoards = await storage.getCompanyBoards(companyId);
        boardIds = companyBoards.map(id => parseInt(id));
      } else {
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
      .filter((item: any) => {
        const clientCol = item.column_values.find(
          (col: any) => col.id === 'client' || col.id === 'person'
        );
        return clientCol?.text === clientId;
      })
      .map(parseItemToTicket);

    // Filter by status if requested
    const filteredTickets = status
      ? tickets.filter(t => t.status === status)
      : tickets;

    // Sort by created date (newest first)
    filteredTickets.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return {
      success: true,
      data: filteredTickets,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
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
