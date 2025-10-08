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