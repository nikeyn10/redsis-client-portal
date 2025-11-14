/**
 * Monday Context Utilities
 * For accessing monday context in embedded views
 */

import mondaySdk from 'monday-sdk-js';
import type { MondayContext } from '@portal/types';

const monday = mondaySdk();

/**
 * Get Monday.com context (user, board, item, etc.)
 */
export async function getMondayContext(): Promise<MondayContext | null> {
  try {
    const response = await monday.get('context');
    return response?.data || null;
  } catch (error) {
    console.error('Failed to get Monday context:', error);
    return null;
  }
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
  type: 'success' | 'error' | 'info' = 'info',
  timeout: number = 3000
): void {
  monday.execute('notice', {
    message,
    type,
    timeout,
  });
}

/**
 * Open Monday item modal
 */
export function openItemModal(itemId: number): void {
  monday.execute('openItemCard', { itemId });
}

/**
 * Confirm dialog
 */
export async function confirmDialog(
  message: string,
  confirmText: string = 'Confirm',
  cancelText: string = 'Cancel'
): Promise<boolean> {
  try {
    const response = await monday.execute('confirm', {
      message,
      confirmButton: confirmText,
      cancelButton: cancelText,
      excludeCancelButton: false,
    });
    return response?.data === true;
  } catch (error) {
    return false;
  }
}

/**
 * Check if running inside Monday iframe
 */
export function isInsideMonday(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    return window.self !== window.top;
  } catch (e) {
    return true; // If we can't check, assume we're in iframe
  }
}

/**
 * Listen for context changes
 */
export function listenToContext(
  callback: (context: MondayContext) => void
): () => void {
  const unsubscribe = monday.listen('context', (res) => {
    if (res.data) {
      callback(res.data);
    }
  });

  return () => {
    if (typeof unsubscribe === 'function') {
      unsubscribe();
    }
  };
}

/**
 * Listen for settings changes
 */
export function listenToSettings(
  callback: (settings: Record<string, any>) => void
): () => void {
  const unsubscribe = monday.listen('settings', (res) => {
    if (res.data) {
      callback(res.data);
    }
  });

  return () => {
    if (typeof unsubscribe === 'function') {
      unsubscribe();
    }
  };
}

export { monday };
