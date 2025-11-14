// ============================================
// types/index.ts
// ============================================

export interface AuthResponse {
  access_token: string;
  token_type: string;
  portal_id: string;
}

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  portal_id: string;
  client_name: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  portal_id: string;
  is_active: boolean;
  created_at: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  client_id: string;
  client_name?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export interface CreateTicketRequest {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface Comment {
  id: string;
  ticket_id: string;
  author: string;
  author_type: 'client' | 'admin';
  text: string;
  created_at: string;
}

export interface AddCommentRequest {
  text: string;
}

// ============================================
// lib/api/client.ts
// (Use the provided file from the user)
// ============================================

// ============================================
// lib/auth.ts
// ============================================

import jwt from 'jsonwebtoken';
import { getAuthToken } from './api/client';

export interface DecodedToken {
  sub: string;
  email: string;
  portal_id: string;
  exp: number;
}

/**
 * Decode JWT token (client-side only - no verification)
 */
export function decodeToken(token: string): DecodedToken | null {
  try {
    const decoded = jwt.decode(token) as DecodedToken;
    return decoded;
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  
  const now = Date.now() / 1000;
  return decoded.exp < now;
}

/**
 * Get current user from token
 */
export function getCurrentUserFromToken(): DecodedToken | null {
  const token = getAuthToken();
  if (!token) return null;
  
  if (isTokenExpired(token)) {
    return null;
  }
  
  return decodeToken(token);
}

// ============================================
// lib/ws.ts
// ============================================

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

// ============================================
// app/layout.tsx
// ============================================

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Client Portal - REDSIS',
  description: 'Secure client portal for ticket management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}

// ============================================
// app/globals.css
// ============================================

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 255, 255, 255;
  --background-end-rgb: 255, 255, 255;
}

body {
  color: rgb(var(--foreground-rgb));
  background: rgb(var(--background-start-rgb));
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}

// ============================================
// app/(public)/login/page.tsx
// ============================================

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/api/client';
import { Loader } from '@/components/ui/Loader';
import { Card } from '@/components/ui/Card';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const portalId = searchParams.get('portal_id');
    const token = searchParams.get('token');

    if (!portalId || !token) {
      setStatus('error');
      setError('Invalid magic link. Please check your email for the correct link.');
      return;
    }

    // Authenticate
    authApi
      .authenticateWithMagicLink(portalId, token)
      .then(() => {
        setStatus('success');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      })
      .catch((err) => {
        setStatus('error');
        setError(err.response?.data?.detail || 'Authentication failed. Please try again.');
      });
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            REDSIS Client Portal
          </h1>

          {status === 'loading' && (
            <div className="space-y-4">
              <Loader size="lg" />
              <p className="text-gray-600">Authenticating...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <div className="text-green-600 text-5xl">✓</div>
              <p className="text-gray-900 font-medium">Successfully authenticated!</p>
              <p className="text-gray-600 text-sm">Redirecting to dashboard...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="text-red-600 text-5xl">✕</div>
              <p className="text-gray-900 font-medium">Authentication Failed</p>
              <p className="text-red-600 text-sm">{error}</p>
              <p className="text-gray-500 text-xs mt-4">
                Please contact support if you continue to experience issues.
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}