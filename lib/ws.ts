import { io, Socket } from 'socket.io-client';
import { getAuthToken } from './api/client';

const WS_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:8000';

let socket: Socket | null = null;

export interface TicketUpdateEvent {
  type: 'ticket_created' | 'ticket_updated' | 'comment_added';
  ticket_id: string;
  data: any;
}

/**
 * Initialize WebSocket connection
 */
export function initializeWebSocket(): Socket {
  if (socket && socket.connected) {
    return socket;
  }

  const token = getAuthToken();
  
  socket = io(WS_URL, {
    auth: {
      token: token,
    },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('WebSocket connected');
  });

  socket.on('disconnect', () => {
    console.log('WebSocket disconnected');
  });

  socket.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  return socket;
}

/**
 * Subscribe to ticket updates
 */
export function subscribeToTicketUpdates(
  callback: (event: TicketUpdateEvent) => void
): () => void {
  const ws = initializeWebSocket();
  
  ws.on('ticket_update', callback);
  
  // Return unsubscribe function
  return () => {
    ws.off('ticket_update', callback);
  };
}

/**
 * Disconnect WebSocket
 */
export function disconnectWebSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}