'use client';

import { useEffect, useState } from 'react';
import { useMondayContext, executeMondayQuery, showMondayNotification, isInsideMonday } from '@/lib/monday-context';
import TicketList from '@/components/TicketList';
import NewTicketForm from '@/components/NewTicketForm';
import { Loader } from '@/components/ui/Loader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Ticket } from '@/types';
import { Plus } from 'lucide-react';

export default function EmbeddedDashboard() {
  const { context, loading: contextLoading, error: contextError } = useMondayContext();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [noContext, setNoContext] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [boardId, setBoardId] = useState<string | null>(null);

  useEffect(() => {
    // Get board ID from URL params (Monday passes it in the URL for Board Views)
    const params = new URLSearchParams(window.location.search);
    const urlBoardId = params.get('boardId');
    
    console.log('Dashboard mounted');
    console.log('URL Board ID:', urlBoardId);
    console.log('Is inside Monday:', isInsideMonday());
    console.log('Context loading:', contextLoading);
    console.log('Context:', context);
    console.log('Context error:', contextError);
    
    if (urlBoardId) {
      setBoardId(urlBoardId);
      console.log('Using board ID from URL:', urlBoardId);
    }
    
    setDebugInfo(`
      Is in iframe: ${isInsideMonday()}
      Context loading: ${contextLoading}
      URL Board ID: ${urlBoardId || 'none'}
      Context Board ID: ${context?.board?.id || 'none'}
      Using Board ID: ${urlBoardId || context?.board?.id || 'none'}
      User: ${context?.user?.email || context?.user?.name || 'none'}
      Account: ${context?.account?.id || 'none'}
    `);

    // Use URL board ID if available, otherwise try context
    const activeBoardId = urlBoardId || context?.board?.id?.toString();

    // Add timeout to detect if we're not getting any board ID
    const timeout = setTimeout(() => {
      if (!activeBoardId && !contextLoading) {
        console.log('No board ID after timeout');
        setNoContext(true);
        setLoading(false);
      }
    }, 8000);

    if (activeBoardId) {
      console.log('Have board ID, fetching tickets...');
      clearTimeout(timeout);
      fetchTickets(activeBoardId);
    }

    return () => clearTimeout(timeout);
  }, [context, contextLoading, contextError]);

    const fetchTickets = async (activeBoardId: string) => {
    try {
      setLoading(true);

      const query = `
        query GetBoardItems($boardId: [ID!]!) {
          boards(ids: $boardId) {
            items_page(limit: 100) {
              items {
                id
                name
                column_values {
                  id
                  text
                }
                created_at
                updated_at
              }
            }
          }
        }
      `;

      const response = await executeMondayQuery(query, {
        boardId: [activeBoardId]
      });

      if (response.data?.boards?.[0]?.items_page?.items) {
        const items = response.data.boards[0].items_page.items;
        
        const transformedTickets: Ticket[] = items.map((item: any) => {
          const cols = item.column_values.reduce((acc: any, col: any) => {
            acc[col.id] = col.text || '';
            return acc;
          }, {});

          return {
            id: item.id,
            title: item.name,
            description: cols.description || cols.long_text || '',
            status: mapStatus(cols.status),
            priority: mapPriority(cols.priority),
            client_id: cols.portal_id || 'demo',
            created_at: item.created_at,
            updated_at: item.updated_at,
          };
        });

        // Filter by client email if not admin
        let filteredTickets = transformedTickets;
        if (context?.user?.email && !context.user?.isAdmin) {
          filteredTickets = transformedTickets.filter(
            (t: any) => {
              const cols = items.find((i: any) => i.id === t.id)?.column_values;
              const clientEmail = cols?.find((c: any) => c.id === 'email_mkxpawg3' || c.id === 'client_email')?.text;
              return clientEmail === context?.user?.email;
            }
          );
        }

        setTickets(filteredTickets);
      }
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
      showMondayNotification('Failed to load tickets', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (ticketData: { title: string; description: string; priority: string }) => {
    const activeBoardId = boardId || context?.board?.id?.toString();
    if (!activeBoardId) return;

    try {
      const mutation = `
        mutation CreateItem($boardId: ID!, $itemName: String!, $columnValues: JSON!) {
          create_item(
            board_id: $boardId,
            item_name: $itemName,
            column_values: $columnValues
          ) {
            id
            created_at
          }
        }
      `;

      const columnValues: any = {
        color_mkxp805g: { label: ticketData.priority.charAt(0).toUpperCase() + ticketData.priority.slice(1) },
        status: { label: 'Open' },
      };

      // Add description if column exists
      if (ticketData.description) {
        columnValues.long_text_mkxpgg6q = ticketData.description;
      }

      // Add client email if available
      if (context?.user?.email) {
        columnValues.email_mkxpawg3 = { email: context.user.email, text: context.user.email };
      }

      const response = await executeMondayQuery(mutation, {
        boardId: activeBoardId,
        itemName: ticketData.title,
        columnValues: JSON.stringify(columnValues)
      });

      const newItem = response.data?.create_item;

      showMondayNotification('Ticket created successfully!', 'success');
      
      // Refresh tickets
      if (activeBoardId) {
        fetchTickets(activeBoardId);
      }
      setShowNewTicket(false);

      // Return new ticket
      return {
        id: newItem?.id || Date.now().toString(),
        title: ticketData.title,
        description: ticketData.description,
        status: 'open' as const,
        priority: ticketData.priority as 'low' | 'medium' | 'high' | 'urgent',
        client_id: 'monday',
        created_at: newItem?.created_at || new Date().toISOString(),
        updated_at: newItem?.created_at || new Date().toISOString(),
      };
    } catch (err) {
      console.error('Failed to create ticket:', err);
      showMondayNotification('Failed to create ticket', 'error');
      throw err;
    }
  };

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
  };

  if (noContext) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <Card className="p-8 max-w-md text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Not Embedded in Monday.com
          </h2>
          <p className="text-gray-600 mb-6">
            This page is designed to be embedded inside Monday.com as a Board View.
            Please access it through your Monday.com workspace.
          </p>
          <div className="text-sm text-gray-500 space-y-2 mb-4">
            <p><strong>To use this view:</strong></p>
            <ol className="text-left list-decimal list-inside space-y-1">
              <li>Install the REDSIS Client Portal app in Monday.com</li>
              <li>Open any board in your workspace</li>
              <li>Click "+ Add View" at the top</li>
              <li>Select "Client Dashboard"</li>
            </ol>
          </div>
          <details className="text-xs text-left bg-gray-100 p-3 rounded">
            <summary className="cursor-pointer font-semibold">Debug Info</summary>
            <pre className="mt-2 whitespace-pre-wrap">{debugInfo}</pre>
          </details>
        </Card>
      </div>
    );
  }

  if (contextLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader />
        <p className="text-gray-600 mt-4">Loading Monday.com context...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Support Tickets</h1>
          <p className="text-gray-600 mt-1">
            {context?.user?.name || context?.user?.email || 'Welcome'}
          </p>
        </div>
        <Button onClick={() => setShowNewTicket(true)}>
          <Plus className="mr-2" size={20} />
          New Ticket
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Total Tickets</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Open</div>
          <div className="text-2xl font-bold text-blue-600">{stats.open}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">In Progress</div>
          <div className="text-2xl font-bold text-yellow-600">{stats.in_progress}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Resolved</div>
          <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
        </Card>
      </div>

      {/* Tickets List */}
      <TicketList tickets={tickets} />

      {/* New Ticket Modal */}
      {showNewTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Create New Ticket</h2>
            <NewTicketForm
              onSuccess={async (ticket) => {
                const activeBoardId = boardId || context?.board?.id?.toString();
                if (activeBoardId) {
                  await fetchTickets(activeBoardId);
                }
                setShowNewTicket(false);
              }}
              onCancel={() => setShowNewTicket(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Map Monday status labels to app status
function mapStatus(mondayStatus: string): 'open' | 'in_progress' | 'resolved' | 'closed' {
  const statusMap: Record<string, 'open' | 'in_progress' | 'resolved' | 'closed'> = {
    'Open': 'open',
    'In Progress': 'in_progress',
    'Working on it': 'in_progress',
    'Resolved': 'resolved',
    'Done': 'resolved',
    'Closed': 'closed',
  };
  
  return statusMap[mondayStatus] || 'open';
}

// Map Monday priority labels to app priority
function mapPriority(mondayPriority: string): 'low' | 'medium' | 'high' | 'urgent' {
  const priorityMap: Record<string, 'low' | 'medium' | 'high' | 'urgent'> = {
    'Low': 'low',
    'Medium': 'medium',
    'High': 'high',
    'Critical': 'urgent',
    'Urgent': 'urgent',
  };
  
  return priorityMap[mondayPriority] || 'medium';
}
