/**
 * Monday.com API Helper Functions
 * Centralized API calls for the client portal
 */

import { MONDAY_CONFIG, BOARD_IDS } from './monday-config';

const MONDAY_API_URL = 'https://api.monday.com/v2';
const API_VERSION = '2023-10';

interface MondayAPIOptions {
  token?: string;
}

/**
 * Execute a Monday.com GraphQL query
 */
export async function mondayQuery<T = any>(
  query: string,
  options?: MondayAPIOptions
): Promise<T> {
  const token = options?.token || process.env.NEXT_PUBLIC_MONDAY_API_TOKEN || '';
  
  const response = await fetch(MONDAY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
      'API-Version': API_VERSION
    },
    body: JSON.stringify({ query })
  });

  const data = await response.json();
  
  if (data.errors) {
    throw new Error(data.errors[0].message);
  }

  return data.data;
}

/**
 * Fetch all sites
 */
export async function fetchSites(options?: MondayAPIOptions) {
  const query = `
    query {
      boards(ids: [${BOARD_IDS.SITES}]) {
        items_page(limit: 500) {
          items {
            id
            name
            column_values {
              id
              text
              value
            }
          }
        }
      }
    }
  `;

  const data = await mondayQuery(query, options);
  return data.boards[0].items_page.items;
}

/**
 * Fetch all projects, optionally filtered by site
 */
export async function fetchProjects(siteId?: string, options?: MondayAPIOptions) {
  const query = `
    query {
      boards(ids: [${BOARD_IDS.PROJECTS}]) {
        items_page(limit: 500) {
          items {
            id
            name
            column_values {
              id
              text
              value
            }
          }
        }
      }
    }
  `;

  const data = await mondayQuery(query, options);
  let projects = data.boards[0].items_page.items;

  // Filter by site if provided
  if (siteId) {
    projects = projects.filter((project: any) => {
      const siteCol = project.column_values.find((col: any) => 
        col.id === MONDAY_CONFIG.boards.projects.columns.site
      );
      if (siteCol?.value) {
        try {
          const parsed = JSON.parse(siteCol.value);
          return parsed.linkedPulseIds?.includes(parseInt(siteId));
        } catch {
          return false;
        }
      }
      return false;
    });
  }

  return projects;
}

/**
 * Fetch tickets from Management Portal board (Master Tickets)
 * Filtered by user email
 */
export async function fetchTicketsByEmail(email: string, options?: MondayAPIOptions) {
  const query = `
    query {
      boards(ids: [${BOARD_IDS.MANAGEMENT_PORTAL}]) {
        items_page(limit: 500) {
          items {
            id
            name
            column_values {
              id
              text
              value
            }
          }
        }
      }
    }
  `;

  const data = await mondayQuery(query, options);
  let tickets = data.boards[0].items_page.items;

  // Filter by email
  tickets = tickets.filter((ticket: any) => {
    const emailCol = ticket.column_values.find((col: any) => 
      col.text?.toLowerCase() === email.toLowerCase()
    );
    return !!emailCol;
  });

  return tickets;
}

/**
 * Fetch tickets for a specific project (hybrid routing)
 */
export async function fetchProjectTickets(projectId: string, options?: MondayAPIOptions) {
  // First, get the project to determine ticket board type
  const projectQuery = `
    query {
      items(ids: [${projectId}]) {
        id
        name
        column_values {
          id
          text
          value
        }
      }
    }
  `;

  const projectData = await mondayQuery(projectQuery, options);
  const project = projectData.items[0];

  const ticketBoardTypeCol = project.column_values.find((col: any) =>
    col.id === MONDAY_CONFIG.boards.projects.columns.ticket_board_type
  );

  const ticketBoardIdCol = project.column_values.find((col: any) =>
    col.id === MONDAY_CONFIG.boards.projects.columns.ticket_board_id
  );

  const ticketBoardType = ticketBoardTypeCol?.text || 'master_tickets';
  const ticketBoardId = ticketBoardType === 'dedicated_board' 
    ? ticketBoardIdCol?.text 
    : BOARD_IDS.MANAGEMENT_PORTAL;

  if (!ticketBoardId) {
    return [];
  }

  // Fetch tickets from appropriate board
  const ticketsQuery = `
    query {
      boards(ids: [${ticketBoardId}]) {
        items_page(limit: 500) {
          items {
            id
            name
            column_values {
              id
              text
              value
            }
          }
        }
      }
    }
  `;

  const ticketsData = await mondayQuery(ticketsQuery, options);
  let tickets = ticketsData.boards[0].items_page.items;

  // If using master tickets board, filter by project relation
  if (ticketBoardType === 'master_tickets') {
    tickets = tickets.filter((ticket: any) => {
      const projectCol = ticket.column_values.find((col: any) => {
        if (col.value) {
          try {
            const parsed = JSON.parse(col.value);
            return parsed.linkedPulseIds?.includes(parseInt(projectId));
          } catch {
            return false;
          }
        }
        return false;
      });
      return !!projectCol;
    });
  }

  return tickets;
}

/**
 * Create a new ticket (hybrid routing)
 */
export async function createTicket(
  projectId: string,
  ticketData: {
    title: string;
    description: string;
    priority?: string;
    email: string;
  },
  options?: MondayAPIOptions
) {
  // First, get project details to determine routing
  const projectQuery = `
    query {
      items(ids: [${projectId}]) {
        id
        column_values {
          id
          text
          value
        }
      }
    }
  `;

  const projectData = await mondayQuery(projectQuery, options);
  const project = projectData.items[0];

  const ticketBoardTypeCol = project.column_values.find((col: any) =>
    col.id === MONDAY_CONFIG.boards.projects.columns.ticket_board_type
  );

  const ticketBoardIdCol = project.column_values.find((col: any) =>
    col.id === MONDAY_CONFIG.boards.projects.columns.ticket_board_id
  );

  const ticketBoardType = ticketBoardTypeCol?.text || 'master_tickets';
  const targetBoardId = ticketBoardType === 'dedicated_board' 
    ? ticketBoardIdCol?.text 
    : BOARD_IDS.MANAGEMENT_PORTAL;

  if (!targetBoardId) {
    throw new Error('Invalid ticket board configuration for project');
  }

  // Create ticket on appropriate board
  const mutation = `
    mutation {
      create_item(
        board_id: ${targetBoardId},
        item_name: "${ticketData.title}",
        column_values: ${JSON.stringify(JSON.stringify({
          description: ticketData.description,
          priority: ticketData.priority || 'medium',
          email: { email: ticketData.email, text: ticketData.email },
          project: { item_ids: [parseInt(projectId)] }
        }))}
      ) {
        id
      }
    }
  `;

  const result = await mondayQuery(mutation, options);
  return result.create_item;
}

/**
 * Fetch user details by email
 */
export async function fetchUserByEmail(email: string, options?: MondayAPIOptions) {
  const query = `
    query {
      boards(ids: [${BOARD_IDS.USERS}]) {
        items_page(limit: 500) {
          items {
            id
            name
            column_values {
              id
              text
              value
            }
          }
        }
      }
    }
  `;

  const data = await mondayQuery(query, options);
  const users = data.boards[0].items_page.items;

  // Find user by email (name field typically contains email)
  const user = users.find((u: any) => 
    u.name.toLowerCase() === email.toLowerCase()
  );

  return user || null;
}

/**
 * Get user's accessible sites
 */
export async function fetchUserSites(userId: string, options?: MondayAPIOptions) {
  const query = `
    query {
      boards(ids: [${BOARD_IDS.SITES}]) {
        items_page(limit: 500) {
          items {
            id
            name
            column_values {
              id
              text
              value
            }
          }
        }
      }
    }
  `;

  const data = await mondayQuery(query, options);
  const sites = data.boards[0].items_page.items;

  // Filter sites where user is site manager or linked
  const userSites = sites.filter((site: any) => {
    const managerCol = site.column_values.find((col: any) =>
      col.id === MONDAY_CONFIG.boards.sites.columns.site_manager
    );
    if (managerCol?.value) {
      try {
        const parsed = JSON.parse(managerCol.value);
        return parsed.linkedPulseIds?.includes(parseInt(userId));
      } catch {
        return false;
      }
    }
    return false;
  });

  return userSites;
}
