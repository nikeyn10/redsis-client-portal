/**
 * Webhook Handler
 * Monday Code Function
 * 
 * Processes webhook events from monday.com
 * Triggers notifications and updates
 */

import { 
  createMondayGraphQL,
  createMondayStorage,
  parseWebhookPayload,
  handleWebhookChallenge,
  getNotificationTypeFromEvent,
  extractEventData,
  shouldNotifyClient,
} from '@portal/monday-sdk';
import type { ApiResponse, NotificationPayload } from '@portal/types';

/**
 * Main webhook handler
 */
export async function handler(req: any): Promise<any> {
  try {
    // Parse webhook payload
    const payload = parseWebhookPayload(JSON.parse(req.body));

    // Handle webhook challenge (initial setup)
    const challengeResponse = handleWebhookChallenge(payload);
    if (challengeResponse) {
      return {
        statusCode: 200,
        body: JSON.stringify(challengeResponse),
      };
    }

    const { event } = payload;
    
    // Extract event data
    const eventData = extractEventData(event);
    const { itemId, boardId, columnId } = eventData;

    if (!itemId || !boardId) {
      console.log('Webhook event missing required data');
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    // Check if this event should trigger notification
    if (!shouldNotifyClient(event.type, columnId)) {
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    // Get monday API token
    const apiToken = process.env.MONDAY_API_TOKEN;
    if (!apiToken) {
      throw new Error('MONDAY_API_TOKEN not configured');
    }

    // Get item details
    const gql = createMondayGraphQL(apiToken);
    const item = await gql.getItem(itemId);
    
    if (!item) {
      console.log('Item not found:', itemId);
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    // Extract client ID from item columns
    const clientIdColumn = item.column_values.find(
      (col: any) => col.id === 'client_id' || col.id === 'person'
    );

    if (!clientIdColumn || !clientIdColumn.text) {
      console.log('No client associated with item');
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    const clientId = clientIdColumn.text;

    // Get client email
    const storage = createMondayStorage(apiToken);
    const client = await gql.getItem(parseInt(clientId));
    
    if (!client) {
      console.log('Client not found:', clientId);
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    const emailColumn = client.column_values.find(
      (col: any) => col.id === 'email' || col.type === 'email'
    );

    const clientEmail = emailColumn?.text || '';
    
    if (!clientEmail) {
      console.log('No email found for client');
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    // Determine notification type
    const notificationType = getNotificationTypeFromEvent(event);
    if (!notificationType) {
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    // Build notification payload
    const notification: NotificationPayload = {
      type: notificationType,
      ticket_id: itemId.toString(),
      client_id: clientId,
      client_email: clientEmail,
      data: {
        ticket_title: item.name,
        ...eventData,
      },
    };

    // Send notification (call notification function)
    await sendNotification(notification, apiToken);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error('Webhook handler error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
}

/**
 * Send notification via email
 */
async function sendNotification(
  notification: NotificationPayload,
  apiToken: string
): Promise<void> {
  // This would call the send-notification function
  // For now, just log
  console.log('Sending notification:', notification);
  
  // In production, make HTTP request to send-notification function
  // or directly integrate SendGrid/SES here
}
