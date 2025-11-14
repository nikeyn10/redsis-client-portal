/**
 * Monday Storage API Wrapper
 * Uses monday.com's secure storage for persisting app data
 */

import { STORAGE_KEYS } from '@portal/types';

export interface StorageResponse<T = any> {
  success: boolean;
  value?: T;
  error?: string;
}

export class MondayStorage {
  private apiToken: string;
  private apiUrl: string = 'https://api.monday.com/v2/storage';

  constructor(apiToken: string) {
    this.apiToken = apiToken;
  }

  /**
   * Set value in storage
   */
  async set(key: string, value: any): Promise<StorageResponse> {
    try {
      const response = await fetch(`${this.apiUrl}/set`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.apiToken,
        },
        body: JSON.stringify({
          key,
          value: JSON.stringify(value),
        }),
      });

      if (!response.ok) {
        throw new Error(`Storage error: ${response.statusText}`);
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get value from storage
   */
  async get<T = any>(key: string): Promise<StorageResponse<T>> {
    try {
      const response = await fetch(`${this.apiUrl}/get?key=${encodeURIComponent(key)}`, {
        method: 'GET',
        headers: {
          'Authorization': this.apiToken,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return { success: true, value: undefined };
        }
        throw new Error(`Storage error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        value: data.value ? JSON.parse(data.value) : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Delete value from storage
   */
  async delete(key: string): Promise<StorageResponse> {
    try {
      const response = await fetch(`${this.apiUrl}/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.apiToken,
        },
        body: JSON.stringify({ key }),
      });

      if (!response.ok) {
        throw new Error(`Storage error: ${response.statusText}`);
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ============================================
  // CONVENIENCE METHODS
  // ============================================

  /**
   * Store magic link token
   */
  async storeMagicLink(token: string, clientId: string, email: string, expiresInHours: number = 24): Promise<boolean> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    const result = await this.set(STORAGE_KEYS.MAGIC_LINK(token), {
      clientId,
      email,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
    });

    return result.success;
  }

  /**
   * Get magic link data
   */
  async getMagicLink(token: string): Promise<{ clientId: string; email: string; expiresAt: string } | null> {
    const result = await this.get(STORAGE_KEYS.MAGIC_LINK(token));
    
    if (!result.success || !result.value) {
      return null;
    }

    // Check if expired
    const expiresAt = new Date(result.value.expiresAt);
    if (expiresAt < new Date()) {
      // Expired - delete it
      await this.delete(STORAGE_KEYS.MAGIC_LINK(token));
      return null;
    }

    return result.value;
  }

  /**
   * Store client's current token
   */
  async storeClientToken(clientId: string, token: string): Promise<boolean> {
    const result = await this.set(STORAGE_KEYS.CLIENT_TOKEN(clientId), token);
    return result.success;
  }

  /**
   * Get client's current token
   */
  async getClientToken(clientId: string): Promise<string | null> {
    const result = await this.get<string>(STORAGE_KEYS.CLIENT_TOKEN(clientId));
    return result.value || null;
  }

  /**
   * Store portal configuration
   */
  async storePortalConfig(companyId: string, config: any): Promise<boolean> {
    const result = await this.set(STORAGE_KEYS.PORTAL_CONFIG(companyId), config);
    return result.success;
  }

  /**
   * Get portal configuration
   */
  async getPortalConfig(companyId: string): Promise<any | null> {
    const result = await this.get(STORAGE_KEYS.PORTAL_CONFIG(companyId));
    return result.value || null;
  }

  /**
   * Store company board associations
   */
  async storeCompanyBoards(companyId: string, boardIds: string[]): Promise<boolean> {
    const result = await this.set(STORAGE_KEYS.COMPANY_BOARDS(companyId), boardIds);
    return result.success;
  }

  /**
   * Get company board associations
   */
  async getCompanyBoards(companyId: string): Promise<string[]> {
    const result = await this.get<string[]>(STORAGE_KEYS.COMPANY_BOARDS(companyId));
    return result.value || [];
  }

  /**
   * Link client to company
   */
  async linkClientToCompany(clientId: string, companyId: string): Promise<boolean> {
    const result = await this.set(STORAGE_KEYS.CLIENT_COMPANY(clientId), companyId);
    return result.success;
  }

  /**
   * Get client's company
   */
  async getClientCompany(clientId: string): Promise<string | null> {
    const result = await this.get<string>(STORAGE_KEYS.CLIENT_COMPANY(clientId));
    return result.value || null;
  }
}

/**
 * Create authenticated storage client
 */
export function createMondayStorage(apiToken: string): MondayStorage {
  return new MondayStorage(apiToken);
}
