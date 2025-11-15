'use client';

import { useEffect, useState } from 'react';
import { useMondayContext, executeMondayQuery, showMondayNotification } from '@/lib/monday-context';
import TicketDetail from '@/components/TicketDetail';
import { Loader } from '@/components/ui/Loader';
import { Ticket, Comment } from '@/types';

export default function EmbeddedTicketView() {
  const { context, loading: contextLoading, monday } = useMondayContext();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noContext, setNoContext] = useState(false);

  useEffect(() => {
    // Add timeout to detect if we're not in Monday context
    const timeout = setTimeout(() => {
      if (!context?.item?.id && !contextLoading) {
        setNoContext(true);
        setLoading(false);
      }
    }, 5000);

    if (context?.item?.id) {
      clearTimeout(timeout);
      fetchTicket();
    }

    return () => clearTimeout(timeout);
  }, [context?.item?.id, contextLoading]);

  const fetchTicket = async () => {
    if (!context?.item?.id) return;

    try {
      setLoading(true);
      setError(null);

      const query = `
        query GetItem($itemId: [ID!]!) {
          items(ids: $itemId) {
            id
            name
            column_values {
              id
              text
              value
            }
            created_at
            updated_at
            updates {
              id
              body
              creator {
                name
                email
              }
              created_at
            }
          }
        }
      `;

      const response = await executeMondayQuery(query, {
        itemId: [context.item.id.toString()]
      });

      if (response.data?.items?.[0]) {
        const item = response.data.items[0];
        
        // Transform Monday item to ticket format
        const columnValues = item.column_values.reduce((acc: any, col: any) => {
          acc[col.id] = col.text || '';
          return acc;
        }, {});

        const transformedTicket: Ticket = {
          id: item.id,
          title: item.name,
          description: columnValues.description || columnValues.long_text || '',
          status: mapStatus(columnValues.status),
          priority: mapPriority(columnValues.priority),
          client_id: columnValues.portal_id || 'demo',
          created_at: item.created_at,
          updated_at: item.updated_at,
        };

        setTicket(transformedTicket);

        // Transform updates to comments
        const transformedComments: Comment[] = (item.updates || []).map((update: any) => ({
          id: update.id,
          ticket_id: item.id,
          author: update.creator?.name || 'Unknown',
          author_type: 'client' as const,
          text: update.body || '',
          created_at: update.created_at,
        }));

        setComments(transformedComments);
      } else {
        setError('Ticket not found');
      }
    } catch (err) {
      console.error('Failed to fetch ticket:', err);
      setError('Failed to load ticket');
      showMondayNotification('Failed to load ticket', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (comment: string) => {
    if (!context?.item?.id) return;

    try {
      const mutation = `
        mutation AddUpdate($itemId: ID!, $body: String!) {
          create_update(item_id: $itemId, body: $body) {
            id
          }
        }
      `;

      await executeMondayQuery(mutation, {
        itemId: context.item.id.toString(),
        body: comment
      });

      showMondayNotification('Comment added successfully', 'success');
      
      // Refresh ticket to show new comment
      fetchTicket();
    } catch (err) {
      console.error('Failed to add comment:', err);
      showMondayNotification('Failed to add comment', 'error');
    }
  };

  const handleCommentAdded = (newComment: Comment) => {
    setComments(prev => [...prev, newComment]);
  };

  if (noContext) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Not Embedded in Monday.com
          </h2>
          <p className="text-gray-600 mb-6">
            This page is designed to be embedded inside Monday.com as an Item View.
            Please access it by clicking on an item in your Monday.com board.
          </p>
          <div className="text-sm text-gray-500 space-y-2">
            <p><strong>To use this view:</strong></p>
            <ol className="text-left list-decimal list-inside space-y-1">
              <li>Install the REDSIS Client Portal app</li>
              <li>Open an item in your board</li>
              <li>Look for "Ticket Details" tab in the item panel</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  if (contextLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader />
        <p className="text-gray-600 mt-4">Loading ticket data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error}</p>
          <button
            onClick={fetchTicket}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">No ticket selected</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <TicketDetail 
        ticket={ticket} 
        comments={comments}
        onCommentAdded={handleCommentAdded}
      />
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
