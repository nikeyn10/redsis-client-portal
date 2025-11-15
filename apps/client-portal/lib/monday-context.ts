import mondaySdk from 'monday-sdk-js';
import { useEffect, useState } from 'react';

const monday = mondaySdk();

export interface MondayUser {
  id: number | string;
  name?: string;
  email?: string;
  isAdmin?: boolean;
  isGuest?: boolean;
}

export interface MondayBoard {
  id: number | string;
  name?: string;
}

export interface MondayItem {
  id: number | string;
  name?: string;
}

export interface MondayAccount {
  id: number | string;
  name?: string;
  slug?: string;
}

export interface MondayContext {
  user?: MondayUser;
  board?: MondayBoard;
  item?: MondayItem;
  account?: MondayAccount;
  theme?: string;
  instanceId?: number;
  [key: string]: any; // Allow additional properties from Monday SDK
}

/**
 * Hook to get Monday.com context (user, board, item, etc.)
 * Use this in embedded views to access Monday data
 */
export function useMondayContext() {
  const [context, setContext] = useState<MondayContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    // Set monday SDK options
    monday.setApiVersion("2023-10");
    
    // Listen for context changes
    const unsubscribe = monday.listen('context', (res) => {
      if (!mounted) return;
      console.log('Monday context received:', res);
      if (res.data) {
        setContext(res.data);
        setLoading(false);
      }
    });

    // Request initial context with retry logic
    const getContext = async () => {
      try {
        console.log('Requesting Monday context...');
        const res = await monday.get('context');
        console.log('Monday context response:', res);
        if (mounted && res.data) {
          setContext(res.data);
        }
      } catch (err: any) {
        console.error('Failed to get Monday context:', err);
        if (mounted) {
          setError(err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getContext();

    return () => {
      mounted = false;
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const executeQuery = async (query: string, variables?: Record<string, any>) => {
    try {
      const response = await monday.api(query, { variables });
      return response;
    } catch (error) {
      console.error('Monday API error:', error);
      throw error;
    }
  };

  return { context, loading, error, monday, executeMondayQuery: executeQuery };
}

/**
 * Get Monday session token for API authentication
 */
export async function getMondaySessionToken(): Promise<string | null> {
  try {
    const response = await monday.get('sessionToken');
    return response?.data || null;
  } catch (error) {
    console.error('Failed to get Monday session token:', error);
    return null;
  }
}

/**
 * Execute Monday GraphQL query
 */
export async function executeMondayQuery(query: string, variables?: Record<string, any>) {
  try {
    const response = await monday.api(query, { variables });
    return response;
  } catch (error) {
    console.error('Monday API error:', error);
    throw error;
  }
}

/**
 * Get settings configured for this app instance
 */
export async function getMondaySettings(): Promise<Record<string, any>> {
  try {
    const response = await monday.get('settings');
    return response?.data || {};
  } catch (error) {
    console.error('Failed to get Monday settings:', error);
    return {};
  }
}

/**
 * Show Monday notification
 */
export function showMondayNotification(
  message: string, 
  type: 'success' | 'error' | 'info' = 'info'
) {
  monday.execute('notice', {
    message,
    type,
    timeout: 3000,
  });
}

/**
 * Check if running inside Monday iframe
 */
export function isInsideMonday(): boolean {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true; // If we can't check, assume we're in iframe
  }
}

export { monday };
