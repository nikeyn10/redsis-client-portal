/**
 * Monday GraphQL API Wrapper
 * Handles all GraphQL queries and mutations
 */

import type { Ticket, Client, Company, Comment, MondayItem, MondayColumnValue } from '@portal/types';

export interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{ message: string; locations?: any[]; path?: string[] }>;
  account_id?: number;
}

export class MondayGraphQL {
  private apiToken: string;
  private apiUrl: string = 'https://api.monday.com/v2';

  constructor(apiToken: string) {
    this.apiToken = apiToken;
  }

  /**
   * Execute GraphQL query
   */
  async query<T = any>(query: string, variables?: Record<string, any>): Promise<GraphQLResponse<T>> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.apiToken,
        'API-Version': '2024-01',
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`Monday API error: ${response.statusText}`);
    }

    return response.json();
  }

  // ============================================
  // BOARDS
  // ============================================

  /**
   * Get boards by IDs
   */
  async getBoards(boardIds: number[]): Promise<any[]> {
    const query = `
      query ($ids: [ID!]!) {
        boards(ids: $ids) {
          id
          name
          description
          state
          board_kind
          columns {
            id
            title
            type
            settings_str
          }
        }
      }
    `;

    const result = await this.query(query, { ids: boardIds });
    return result.data?.boards || [];
  }

  /**
   * Get board columns configuration
   */
  async getBoardColumns(boardId: number): Promise<any[]> {
    const query = `
      query ($boardId: ID!) {
        boards(ids: [$boardId]) {
          columns {
            id
            title
            type
            settings_str
          }
        }
      }
    `;

    const result = await this.query(query, { boardId });
    return result.data?.boards?.[0]?.columns || [];
  }

  // ============================================
  // ITEMS (TICKETS)
  // ============================================

  /**
   * Get items from board(s) with filtering
   */
  async getItems(boardIds: number[], limit: number = 100): Promise<MondayItem[]> {
    const query = `
      query ($boardIds: [ID!]!, $limit: Int) {
        boards(ids: $boardIds) {
          items_page(limit: $limit) {
            items {
              id
              name
              created_at
              updated_at
              board {
                id
              }
              column_values {
                id
                title
                type
                text
                value
              }
            }
          }
        }
      }
    `;

    const result = await this.query(query, { boardIds, limit });
    const boards = result.data?.boards || [];
    
    // Flatten items from all boards
    return boards.flatMap((board: any) => board.items_page?.items || []);
  }

  /**
   * Get single item by ID
   */
  async getItem(itemId: number): Promise<MondayItem | null> {
    const query = `
      query ($itemId: ID!) {
        items(ids: [$itemId]) {
          id
          name
          created_at
          updated_at
          board {
            id
          }
          column_values {
            id
            title
            type
            text
            value
          }
        }
      }
    `;

    const result = await this.query(query, { itemId });
    return result.data?.items?.[0] || null;
  }

  /**
   * Create new item (ticket)
   */
  async createItem(
    boardId: number,
    itemName: string,
    columnValues?: Record<string, any>
  ): Promise<MondayItem> {
    const query = `
      mutation ($boardId: ID!, $itemName: String!, $columnValues: JSON) {
        create_item(
          board_id: $boardId
          item_name: $itemName
          column_values: $columnValues
        ) {
          id
          name
          created_at
          updated_at
          board {
            id
          }
          column_values {
            id
            title
            type
            text
            value
          }
        }
      }
    `;

    const result = await this.query(query, {
      boardId,
      itemName,
      columnValues: columnValues ? JSON.stringify(columnValues) : undefined,
    });

    return result.data?.create_item;
  }

  /**
   * Update item column values
   */
  async updateItem(
    itemId: number,
    columnValues: Record<string, any>
  ): Promise<MondayItem> {
    const query = `
      mutation ($itemId: ID!, $columnValues: JSON!) {
        change_multiple_column_values(
          item_id: $itemId
          column_values: $columnValues
        ) {
          id
          name
          column_values {
            id
            title
            type
            text
            value
          }
        }
      }
    `;

    const result = await this.query(query, {
      itemId,
      columnValues: JSON.stringify(columnValues),
    });

    return result.data?.change_multiple_column_values;
  }

  // ============================================
  // UPDATES (COMMENTS)
  // ============================================

  /**
   * Get updates for an item
   */
  async getItemUpdates(itemId: number, limit: number = 50): Promise<any[]> {
    const query = `
      query ($itemId: ID!, $limit: Int) {
        items(ids: [$itemId]) {
          updates(limit: $limit) {
            id
            body
            text_body
            created_at
            updated_at
            creator {
              id
              name
              email
            }
            replies {
              id
              body
              text_body
              created_at
              creator {
                id
                name
                email
              }
            }
          }
        }
      }
    `;

    const result = await this.query(query, { itemId, limit });
    return result.data?.items?.[0]?.updates || [];
  }

  /**
   * Create update (comment) on item
   */
  async createUpdate(itemId: number, body: string): Promise<any> {
    const query = `
      mutation ($itemId: ID!, $body: String!) {
        create_update(item_id: $itemId, body: $body) {
          id
          body
          text_body
          created_at
          creator {
            id
            name
            email
          }
        }
      }
    `;

    const result = await this.query(query, { itemId, body });
    return result.data?.create_update;
  }

  /**
   * Reply to update
   */
  async replyToUpdate(updateId: number, body: string): Promise<any> {
    const query = `
      mutation ($updateId: ID!, $body: String!) {
        create_update(update_id: $updateId, body: $body) {
          id
          body
          text_body
          created_at
        }
      }
    `;

    const result = await this.query(query, { updateId, body });
    return result.data?.create_update;
  }

  // ============================================
  // FILES & ASSETS
  // ============================================

  /**
   * Get item files/assets
   */
  async getItemAssets(itemId: number): Promise<any[]> {
    const query = `
      query ($itemId: ID!) {
        items(ids: [$itemId]) {
          assets {
            id
            name
            url
            public_url
            file_extension
            file_size
            uploaded_by {
              id
              name
            }
            created_at
          }
        }
      }
    `;

    const result = await this.query(query, { itemId });
    return result.data?.items?.[0]?.assets || [];
  }

  /**
   * Add file to item (requires file column)
   */
  async addFileToItem(itemId: number, columnId: string, fileUrl: string): Promise<any> {
    const query = `
      mutation ($itemId: ID!, $columnId: String!, $value: JSON!) {
        change_column_value(
          item_id: $itemId
          column_id: $columnId
          value: $value
        ) {
          id
        }
      }
    `;

    const result = await this.query(query, {
      itemId,
      columnId,
      value: JSON.stringify({ url: fileUrl }),
    });

    return result.data?.change_column_value;
  }

  // ============================================
  // USERS
  // ============================================

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<any> {
    const query = `
      query {
        me {
          id
          name
          email
          is_admin
          is_guest
          account {
            id
            name
          }
        }
      }
    `;

    const result = await this.query(query);
    return result.data?.me;
  }

  /**
   * Get users by IDs
   */
  async getUsers(userIds: number[]): Promise<any[]> {
    const query = `
      query ($ids: [ID!]!) {
        users(ids: $ids) {
          id
          name
          email
          photo_thumb
          is_admin
          is_guest
        }
      }
    `;

    const result = await this.query(query, { ids: userIds });
    return result.data?.users || [];
  }
}

/**
 * Create authenticated GraphQL client
 */
export function createMondayGraphQL(apiToken: string): MondayGraphQL {
  return new MondayGraphQL(apiToken);
}
