/**
 * Monday Code Backend - Main Entry Point
 * 
 * This file exports all serverless functions for Monday Code deployment
 */

// Authentication functions
export { handler as generateMagicLink } from './generate-magic-link';
export { handler as verifyMagicLink } from './verify-magic-link';

// Webhook handler
export { handler as webhookHandler } from './webhook-handler';

// Ticket management
export { handler as getTickets } from './get-tickets';
export { handler as createTicket } from './create-ticket';

// Notifications
export { handler as sendNotification } from './send-notification';
