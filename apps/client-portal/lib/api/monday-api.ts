/**
 * Monday.com API Client
 * Handles all GraphQL requests to Monday.com
 */
import { executeMondayQuery, getMondaySessionToken } from '@/lib/monday-context';
import type { Ticket, Comment } from '@/types';

/**
 * Map Monday item to Ticket format
 */
function mapItemToTicket(item: any): Ticket {
  const columnValues = item.column_values.reduce((acc: any, col: any) => {
    acc[col.id] = col.text || '';
    return acc;
  }, {});

  return {
    id: item.id,
    title: item.name,
    description: columnValues.description || columnValues.long_text || '',
    status: mapStatus(columnValues.status),
    priority: mapPriority(columnValues.priority),
    client_id: columnValues.client_email || 'unknown',
    client_name: columnValues.client_name || '',
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
}

/**
 * Map Monday status to app status
 */
function mapStatus(mondayStatus: string): 'open' | 'in_progress' | 'resolved' | 'closed' {
  const statusMap: Record<string, 'open' | 'in_progress' | 'resolved' | 'closed'> = {
    'Open': 'open',
    'In Progress': 'in_progress',
    'Working on it': 'in_progress',
    'Resolved': 'resolved',
    'Done': 'resolved',
    'Closed': 'closed',
  };
  return statusMap[mondayStatus] || 'open';
}

/**
 * Map Monday priority to app priority
 */
function mapPriority(mondayPriority: string): 'low' | 'medium' | 'high' | 'urgent' {
  const priorityMap: Record<string, 'low' | 'medium' | 'high' | 'urgent'> = {
    'Low': 'low',
    'Medium': 'medium',
    'High': 'high',
    'Critical': 'urgent',
    'Urgent': 'urgent',
  };
  return priorityMap[mondayPriority] || 'medium';
}

/**
 * Map app priority to Monday label
 */
function priorityToLabel(priority: 'low' | 'medium' | 'high' | 'urgent'): string {
  const map = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    urgent: 'Urgent',
  };
  return map[priority];
}

/**
 * Monday API - Tickets
 */
export const mondayTicketsApi = {
  /**
   * Get all tickets from a board
   */
  async getTickets(boardId: string): Promise<Ticket[]> {
    const query = `
      query GetBoardItems($boardId: [ID!]!) {
        boards(ids: $boardId) {
          items_page(limit: 500) {
            items {
              id
              name
              column_values {
                id
                text
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

    if (!response.data?.boards?.[0]?.items_page?.items) {
      return [];
    }

    return response.data.boards[0].items_page.items.map(mapItemToTicket);
  },

  /**
   * Get single ticket by ID
   */
  async getTicket(itemId: string): Promise<Ticket | null> {
    const query = `
      query GetItem($itemId: [ID!]!) {
        items(ids: $itemId) {
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
    `;

    const response = await executeMondayQuery(query, {
      itemId: [itemId]
    });

    if (!response.data?.items?.[0]) {
      return null;
    }

    return mapItemToTicket(response.data.items[0]);
  },

  /**
   * Create new ticket
   */
  async createTicket(
    boardId: string,
    title: string,
    description: string,
    priority: 'low' | 'medium' | 'high' | 'urgent',
    clientEmail?: string
  ): Promise<Ticket> {
    // Use server-side API route for ticket creation
    const response = await fetch('/api/tickets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        boardId,
        itemName: title,
        columnValues: {
          priority: { label: priorityToLabel(priority) },
          status: { label: 'Open' },
          long_text: description,
          ...(clientEmail && { client_email: { email: clientEmail, text: clientEmail } })
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create ticket');
    }

    const result = await response.json();
    const createdItem = result.data?.create_item;
    
    if (!createdItem) {
      throw new Error('Failed to create ticket');
    }

    return {
      id: createdItem.id,
      title: createdItem.name,
      description,
      status: 'open',
      priority,
      client_id: clientEmail || 'unknown',
      created_at: createdItem.created_at,
      updated_at: createdItem.updated_at,
    };
  },

  /**
   * Get comments (updates) for a ticket
   */
  async getComments(itemId: string): Promise<Comment[]> {
    const query = `
      query GetItemUpdates($itemId: [ID!]!) {
        items(ids: $itemId) {
          updates {
            id
            body
            creator {
              name
              email
              id
            }
            created_at
          }
        }
      }
    `;

    const response = await executeMondayQuery(query, {
      itemId: [itemId]
    });

    if (!response.data?.items?.[0]?.updates) {
      return [];
    }

    return response.data.items[0].updates.map((update: any) => ({
      id: update.id,
      ticket_id: itemId,
      author: update.creator?.name || 'Unknown',
      author_type: 'client' as const,
      text: update.body || '',
      created_at: update.created_at,
    }));
  },

  /**
   * Add comment to ticket
   */
  async addComment(itemId: string, text: string): Promise<Comment> {
    const mutation = `
      mutation AddUpdate($itemId: ID!, $body: String!) {
        create_update(item_id: $itemId, body: $body) {
          id
          body
          created_at
          creator {
            name
            email
          }
        }
      }
    `;

    const response = await executeMondayQuery(mutation, {
      itemId,
      body: text
    });

    const update = response.data?.create_update;
    if (!update) {
      throw new Error('Failed to add comment');
    }

    return {
      id: update.id,
      ticket_id: itemId,
      author: update.creator?.name || 'You',
      author_type: 'client',
      text: update.body,
      created_at: update.created_at,
    };
  },
};

/**
 * Get current Monday board ID from context
 */
export function getCurrentBoardId(): string | null {
  // This will be set by the Monday context
  // For now, return null - components will handle this
  return null;
}
