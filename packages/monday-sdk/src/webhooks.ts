/**
 * Monday Webhook Utilities
 * For handling webhook events from monday.com
 */

import type { MondayWebhookPayload, NotificationType } from '@portal/types';

/**
 * Verify Monday webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // Monday uses HMAC-SHA256 for webhook verification
  // This would need crypto implementation in actual backend
  // For now, return true (implement in monday-code backend)
  return true;
}

/**
 * Parse Monday webhook payload
 */
export function parseWebhookPayload(body: any): MondayWebhookPayload {
  return {
    event: body.event || {},
    challenge: body.challenge,
  };
}

/**
 * Handle webhook challenge (for initial webhook setup)
 */
export function handleWebhookChallenge(payload: MondayWebhookPayload): {
  challenge: string;
} | null {
  if (payload.challenge) {
    return { challenge: payload.challenge };
  }
  return null;
}

/**
 * Determine notification type from webhook event
 */
export function getNotificationTypeFromEvent(event: any): NotificationType | null {
  const eventType = event.type?.toLowerCase();

  if (eventType === 'create_item' || eventType === 'create_pulse') {
    return 'ticket_created';
  }

  if (eventType === 'change_status_column_value') {
    return 'status_changed';
  }

  if (eventType === 'change_column_value') {
    // Could be status, assignment, etc.
    return 'ticket_updated';
  }

  if (eventType === 'create_update') {
    return 'comment_added';
  }

  return null;
}

/**
 * Extract relevant data from webhook event
 */
export function extractEventData(event: any): {
  itemId?: number;
  boardId?: number;
  columnId?: string;
  userId?: number;
  value?: any;
} {
  return {
    itemId: event.itemId || event.pulseId,
    boardId: event.boardId,
    columnId: event.columnId,
    userId: event.userId,
    value: event.value,
  };
}

/**
 * Check if event should trigger client notification
 */
export function shouldNotifyClient(
  eventType: string,
  columnId?: string
): boolean {
  const notifyEvents = [
    'create_item',
    'create_pulse',
    'change_status_column_value',
    'create_update',
  ];

  if (notifyEvents.includes(eventType.toLowerCase())) {
    return true;
  }

  // Notify on specific column changes
  const notifyColumns = ['status', 'priority', 'assigned_to'];
  if (eventType.toLowerCase().includes('change_column') && columnId) {
    return notifyColumns.some(col => columnId.toLowerCase().includes(col));
  }

  return false;
}
