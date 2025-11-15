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
  client_id?: string;
  client_name?: string;
  clientEmail?: string;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
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