/**
 * Shared TypeScript types for Gorilla Portal
 * Used across client-portal, monday-app, and backend
 */

// ============================================
// AUTHENTICATION & AUTHORIZATION
// ============================================

export interface MagicLinkToken {
  token: string;
  clientId: string;
  email: string;
  expiresAt: string;
  createdAt: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: 'Bearer';
  client_id: string;
  email: string;
  expires_in: number;
}

export interface DecodedJWT {
  sub: string; // client_id
  email: string;
  exp: number;
  iat: number;
  company_id?: string;
}

// ============================================
// CLIENT & COMPANY
// ============================================

export interface Client {
  id: string; // monday item ID
  name: string;
  email: string;
  company_id: string;
  is_active: boolean;
  magic_link_token?: string;
  created_at: string;
  updated_at: string;
  avatar_url?: string;
  phone?: string;
}

export interface Company {
  id: string; // monday item ID
  name: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  board_ids: string[]; // Array of monday board IDs for this company
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// TICKETS
// ============================================

export type TicketStatus = 'open' | 'in_progress' | 'waiting_client' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Ticket {
  id: string; // monday item ID
  board_id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  client_id: string;
  client_name?: string;
  company_id?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  closed_at?: string;
  files?: TicketFile[];
  tags?: string[];
}

export interface CreateTicketRequest {
  title: string;
  description: string;
  priority: TicketPriority;
  board_id?: string; // Optional: use default if not provided
}

export interface UpdateTicketRequest {
  title?: string;
  description?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
}

// ============================================
// FILES & ATTACHMENTS
// ============================================

export interface TicketFile {
  id: string; // monday asset ID
  ticket_id: string;
  name: string;
  url: string;
  public_url?: string;
  size: number; // bytes
  mime_type: string;
  uploaded_by: string; // client_id or user_id
  uploaded_by_type: 'client' | 'admin';
  uploaded_at: string;
}

export interface FileUploadRequest {
  ticket_id: string;
  file: any; // File (browser) or Buffer (Node.js)
  filename: string;
}

export interface FileUploadResponse {
  file: TicketFile;
  success: boolean;
  message?: string;
}

// ============================================
// COMMENTS & UPDATES
// ============================================

export type CommentAuthorType = 'client' | 'admin' | 'system';

export interface Comment {
  id: string; // monday update ID
  ticket_id: string;
  author_id: string;
  author_name: string;
  author_type: CommentAuthorType;
  text: string;
  created_at: string;
  updated_at?: string;
  is_internal?: boolean; // Internal notes not visible to clients
  files?: TicketFile[];
}

export interface CreateCommentRequest {
  ticket_id: string;
  text: string;
  is_internal?: boolean;
}

// ============================================
// NOTIFICATIONS
// ============================================

export type NotificationType = 
  | 'ticket_created'
  | 'ticket_updated'
  | 'status_changed'
  | 'comment_added'
  | 'file_uploaded'
  | 'assigned';

export interface NotificationPayload {
  type: NotificationType;
  ticket_id: string;
  client_id: string;
  client_email: string;
  data: {
    ticket_title?: string;
    old_status?: TicketStatus;
    new_status?: TicketStatus;
    comment_text?: string;
    file_name?: string;
    [key: string]: any;
  };
}

export interface EmailNotification {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// ============================================
// PORTAL CONFIGURATION
// ============================================

export interface PortalConfig {
  company_id: string;
  portal_name: string;
  logo_url?: string;
  favicon_url?: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  support_email: string;
  allow_ticket_creation: boolean;
  allow_file_upload: boolean;
  max_file_size_mb: number;
  allowed_file_types: string[];
  default_board_id: string;
  notification_settings: {
    email_on_ticket_created: boolean;
    email_on_status_change: boolean;
    email_on_comment: boolean;
    email_on_file_upload: boolean;
  };
}

// ============================================
// MONDAY.COM SPECIFIC
// ============================================

export interface MondayContext {
  user?: {
    id: number;
    name?: string;
    email?: string;
    isAdmin?: boolean;
    isGuest?: boolean;
  };
  board?: {
    id: number;
    name?: string;
  };
  item?: {
    id: number;
    name?: string;
  };
  account?: {
    id: number;
    name?: string;
    slug?: string;
  };
  theme?: 'light' | 'dark';
  instanceId?: number;
}

export interface MondayColumnValue {
  id: string;
  title: string;
  value?: string;
  text?: string;
  type: string;
}

export interface MondayItem {
  id: string;
  name: string;
  board: {
    id: string;
  };
  column_values: MondayColumnValue[];
  created_at: string;
  updated_at: string;
}

export interface MondayWebhookPayload {
  event: {
    type: string;
    userId: number;
    boardId: number;
    itemId?: number;
    columnId?: string;
    value?: any;
  };
  challenge?: string;
}

// ============================================
// STORAGE KEYS (for monday storage API)
// ============================================

export const STORAGE_KEYS = {
  MAGIC_LINK: (token: string) => `magic_link:${token}`,
  CLIENT_TOKEN: (clientId: string) => `client:${clientId}:token`,
  PORTAL_CONFIG: (companyId: string) => `portal:${companyId}:config`,
  COMPANY_BOARDS: (companyId: string) => `company:${companyId}:boards`,
  CLIENT_COMPANY: (clientId: string) => `client:${clientId}:company`,
} as const;

// ============================================
// API RESPONSES
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    request_id?: string;
  };
}

export interface PaginatedResponse<T = any> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

// ============================================
// ANALYTICS (Optional feature)
// ============================================

export interface TicketAnalytics {
  total_tickets: number;
  open_tickets: number;
  resolved_tickets: number;
  avg_resolution_time_hours: number;
  by_priority: Record<TicketPriority, number>;
  by_status: Record<TicketStatus, number>;
}

export interface ClientActivity {
  client_id: string;
  action: string;
  ticket_id?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}
