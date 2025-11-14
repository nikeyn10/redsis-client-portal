/**
 * API Client
 * Handles all HTTP requests to FastAPI backend
 */
import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  AuthResponse,
  CurrentUser,
  Client,
  Ticket,
  CreateTicketRequest,
  Comment,
  AddCommentRequest,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      clearAuthToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

// ========= Token Management =========
const TOKEN_KEY = 'portal_auth_token';
const PORTAL_ID_KEY = 'portal_id';

export function setAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
}

export function clearAuthToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PORTAL_ID_KEY);
  }
}

export function setPortalId(portalId: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(PORTAL_ID_KEY, portalId);
  }
}

export function getPortalId(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(PORTAL_ID_KEY);
  }
  return null;
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

// ========= Authentication API =========
export const authApi = {
  /**
   * Authenticate with magic link
   */
  async authenticateWithMagicLink(
    portalId: string,
    token: string
  ): Promise<AuthResponse> {
    const response = await axios.get<AuthResponse>(
      `${API_BASE_URL}/auth/${portalId}/${token}`
    );
    
    // Store token and portal_id
    setAuthToken(response.data.access_token);
    setPortalId(response.data.portal_id);
    
    return response.data;
  },

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<CurrentUser> {
    const response = await apiClient.get<CurrentUser>('/me');
    return response.data;
  },

  /**
   * Refresh token
   */
  async refreshToken(): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/refresh');
    
    // Update stored token
    setAuthToken(response.data.access_token);
    
    return response.data;
  },

  /**
   * Logout
   */
  logout(): void {
    clearAuthToken();
  },
};

// ========= Clients API =========
export const clientsApi = {
  /**
   * Get all active clients
   */
  async getClients(): Promise<Client[]> {
    const response = await apiClient.get<Client[]>('/clients');
    return response.data;
  },
};

// ========= Tickets API =========
export const ticketsApi = {
  /**
   * Get all tickets for current user
   */
  async getTickets(): Promise<Ticket[]> {
    const portalId = getPortalId();
    if (!portalId) {
      throw new Error('No portal ID found');
    }
    
    const response = await apiClient.get<Ticket[]>(`/tickets/${portalId}`);
    return response.data;
  },

  /**
   * Get ticket by ID
   */
  async getTicket(ticketId: string): Promise<Ticket> {
    const portalId = getPortalId();
    if (!portalId) {
      throw new Error('No portal ID found');
    }
    
    // For now, get all tickets and filter
    // TODO: Add single ticket endpoint to backend
    const tickets = await this.getTickets();
    const ticket = tickets.find((t) => t.id === ticketId);
    
    if (!ticket) {
      throw new Error('Ticket not found');
    }
    
    return ticket;
  },

  /**
   * Create new ticket
   */
  async createTicket(data: CreateTicketRequest): Promise<Ticket> {
    const response = await apiClient.post<Ticket>('/ticket', data);
    return response.data;
  },

  /**
   * Add comment to ticket (placeholder - extend backend)
   */
  async addComment(
    ticketId: string,
    comment: AddCommentRequest
  ): Promise<Comment> {
    // TODO: Implement in backend
    // For now, return mock
    return {
      id: Date.now().toString(),
      ticket_id: ticketId,
      author: 'You',
      author_type: 'client',
      text: comment.text,
      created_at: new Date().toISOString(),
    };
  },

  /**
   * Get comments for ticket (placeholder - extend backend)
   */
  async getComments(ticketId: string): Promise<Comment[]> {
    // TODO: Implement in backend
    // For now, return empty array
    return [];
  },
};

// ========= Health Check =========
export async function checkHealth(): Promise<{ status: string; workspace: string }> {
  const response = await axios.get(`${API_BASE_URL}/`);
  return response.data;
}

export default apiClient;