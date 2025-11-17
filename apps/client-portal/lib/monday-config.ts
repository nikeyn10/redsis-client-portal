/**
 * Monday.com Board Configuration
 * Updated: November 16, 2025
 * 
 * This file contains all board IDs and column IDs for the workspace.
 * Use this as the single source of truth for all Monday.com API calls.
 */

export const MONDAY_CONFIG = {
  workspace: {
    id: '13302651',
    name: 'Redix Central Hub',
  },

  boards: {
    // User Management
    users: {
      id: '18379351659',
      name: 'Users',
      columns: {
        name: 'name',
        user_type: 'dropdown_mkxse989', // Email User | PIN User
        pin: 'text_mkxsf3n7', // 4-digit PIN
        // Note: Old password column will be removed after auth migration
      },
    },

    // Service Provider Management
    serviceProviders: {
      id: '18379446736',
      name: 'Service Providers',
      columns: {
        name: 'name',
        user_type: 'dropdown_mkxsseew', // Email User | PIN User
        pin: 'text_mkxs7g6a', // 4-digit PIN
        // Note: Old password column will be removed after auth migration
      },
    },

    // Multi-Tenant Site Management
    sites: {
      id: '18380394514',
      name: 'Sites',
      columns: {
        name: 'name',
        organization: 'text_mkxswbv',
        site_address: 'text_mkxsjsfx',
        site_contact_name: 'text_mkxst5ep',
        site_contact_email: 'email_mkxswdjv',
        site_contact_phone: 'phone_mkxs99q1',
        active_projects: 'numeric_mkxsa648',
        total_tickets: 'numeric_mkxs22sb',
        primary_service_provider: 'board_relation_mkxsga3e', // → Service Providers
        site_manager: 'board_relation_mkxsh83c', // → Users
        status: 'color_mkxsz2q7', // Active | Inactive | Onboarding | Archived
        notes: 'long_text_mkxsrza9',
      },
    },

    // Project Management (Multi-Tenant)
    projects: {
      id: '18380394647',
      name: 'Projects',
      columns: {
        name: 'name',
        site: 'board_relation_mkxs9yb3', // → Sites (CRITICAL for multi-tenant)
        service_type: 'dropdown_mkxs1045', // Maintenance | Installation | Repair | etc.
        assigned_service_provider: 'board_relation_mkxsmj0s', // → Service Providers
        project_manager: 'board_relation_mkxs3vv1', // → Users
        start_date: 'date_mkxsyjsw',
        end_date: 'date_mkxsx81j',
        status: 'color_mkxskekx', // Planning | Active | On Hold | Completed | Cancelled
        ticket_board_type: 'dropdown_mkxsejpm', // Master Tickets | Dedicated Board
        ticket_board_id: 'text_mkxs9wde', // Board ID if dedicated
        total_tickets: 'numeric_mkxs4r9h',
        notes: 'long_text_mkxsycyz',
      },
    },

    // Legacy boards (to be archived or removed)
    projectCreator: {
      id: '18379404757',
      name: 'Project Creator',
      status: 'legacy', // Data migrated to Sites/Projects
    },

    managementPortal: {
      id: '18379040651',
      name: 'Management Portal',
      status: 'active', // Still contains tickets, will be replaced by new ticket system
    },
  },
} as const;

// Helper type to extract board IDs
export type BoardId = typeof MONDAY_CONFIG.boards[keyof typeof MONDAY_CONFIG.boards]['id'];

// Helper type to extract column IDs for a specific board
export type ColumnId<T extends keyof typeof MONDAY_CONFIG.boards> = 
  typeof MONDAY_CONFIG.boards[T] extends { columns: infer C } 
    ? C[keyof C] 
    : never;

// Quick access helpers
export const BOARD_IDS = {
  USERS: MONDAY_CONFIG.boards.users.id,
  SERVICE_PROVIDERS: MONDAY_CONFIG.boards.serviceProviders.id,
  SITES: MONDAY_CONFIG.boards.sites.id,
  PROJECTS: MONDAY_CONFIG.boards.projects.id,
  PROJECT_CREATOR: MONDAY_CONFIG.boards.projectCreator.id,
  MANAGEMENT_PORTAL: MONDAY_CONFIG.boards.managementPortal.id,
} as const;

export const COLUMN_IDS = {
  USERS: {
    USER_TYPE: MONDAY_CONFIG.boards.users.columns.user_type,
    PIN: MONDAY_CONFIG.boards.users.columns.pin,
  },
  SERVICE_PROVIDERS: {
    USER_TYPE: MONDAY_CONFIG.boards.serviceProviders.columns.user_type,
    PIN: MONDAY_CONFIG.boards.serviceProviders.columns.pin,
  },
  SITES: {
    ORGANIZATION: MONDAY_CONFIG.boards.sites.columns.organization,
    SITE_ADDRESS: MONDAY_CONFIG.boards.sites.columns.site_address,
    SITE_CONTACT_NAME: MONDAY_CONFIG.boards.sites.columns.site_contact_name,
    SITE_CONTACT_EMAIL: MONDAY_CONFIG.boards.sites.columns.site_contact_email,
    SITE_CONTACT_PHONE: MONDAY_CONFIG.boards.sites.columns.site_contact_phone,
    ACTIVE_PROJECTS: MONDAY_CONFIG.boards.sites.columns.active_projects,
    TOTAL_TICKETS: MONDAY_CONFIG.boards.sites.columns.total_tickets,
    SERVICE_PROVIDERS: MONDAY_CONFIG.boards.sites.columns.primary_service_provider,
    SITE_MANAGER: MONDAY_CONFIG.boards.sites.columns.site_manager,
    STATUS: MONDAY_CONFIG.boards.sites.columns.status,
    NOTES: MONDAY_CONFIG.boards.sites.columns.notes,
  },
  PROJECTS: {
    SITE: MONDAY_CONFIG.boards.projects.columns.site,
    SERVICE_TYPE: MONDAY_CONFIG.boards.projects.columns.service_type,
    SERVICE_PROVIDERS: MONDAY_CONFIG.boards.projects.columns.assigned_service_provider,
    PROJECT_MANAGER: MONDAY_CONFIG.boards.projects.columns.project_manager,
    START_DATE: MONDAY_CONFIG.boards.projects.columns.start_date,
    END_DATE: MONDAY_CONFIG.boards.projects.columns.end_date,
    STATUS: MONDAY_CONFIG.boards.projects.columns.status,
    TICKET_BOARD_TYPE: MONDAY_CONFIG.boards.projects.columns.ticket_board_type,
    TICKET_BOARD_ID: MONDAY_CONFIG.boards.projects.columns.ticket_board_id,
    TOTAL_TICKETS: MONDAY_CONFIG.boards.projects.columns.total_tickets,
    NOTES: MONDAY_CONFIG.boards.projects.columns.notes,
  },
} as const;

// Status values
export const STATUS_VALUES = {
  // Site status
  SITE_STATUS: {
    ACTIVE: { index: 0, label: 'Active' },
    INACTIVE: { index: 1, label: 'Inactive' },
    ONBOARDING: { index: 2, label: 'Onboarding' },
    ARCHIVED: { index: 3, label: 'Archived' },
  },

  // Project status
  PROJECT_STATUS: {
    PLANNING: { index: 0, label: 'Planning' },
    ACTIVE: { index: 1, label: 'Active' },
    ON_HOLD: { index: 2, label: 'On Hold' },
    COMPLETED: { index: 3, label: 'Completed' },
    CANCELLED: { index: 4, label: 'Cancelled' },
  },

  // User type
  USER_TYPE: {
    EMAIL_USER: { index: 0, label: 'Email User' },
    PIN_USER: { index: 1, label: 'PIN User' },
  },

  // Service type
  SERVICE_TYPE: {
    MAINTENANCE: { index: 0, label: 'Maintenance' },
    INSTALLATION: { index: 1, label: 'Installation' },
    REPAIR: { index: 2, label: 'Repair' },
    INSPECTION: { index: 3, label: 'Inspection' },
    EMERGENCY: { index: 4, label: 'Emergency' },
    CONSULTATION: { index: 5, label: 'Consultation' },
  },

  // Ticket board type
  TICKET_BOARD_TYPE: {
    MASTER_TICKETS: { index: 0, label: 'Master Tickets' },
    DEDICATED_BOARD: { index: 1, label: 'Dedicated Board' },
  },
} as const;

// Export default for convenience
export default MONDAY_CONFIG;
