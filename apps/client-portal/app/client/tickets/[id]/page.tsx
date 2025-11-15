'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { Ticket } from '@/types';

// Direct Monday API call for client portal (not embedded in Monday)
async function callMondayAPI(query: string, variables?: Record<string, any>) {
  const response = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': process.env.NEXT_PUBLIC_MONDAY_API_TOKEN || '',
      'API-Version': '2023-10'
    },
    body: JSON.stringify({ query, variables })
  });

  const result = await response.json();
  
  if (result.errors) {
    console.error('Monday API errors:', result.errors);
    throw new Error(result.errors[0]?.message || 'Monday API error');
  }
  
  return result;
}

export default function ClientTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [clientEmail, setClientEmail] = useState<string>('');
  const [boardId, setBoardId] = useState<string>('');

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('magic_token');
    const email = localStorage.getItem('client_email');
    const storedBoardId = localStorage.getItem('client_board_id');

    if (!token || !email || !storedBoardId) {
      router.push('/login');
      return;
    }

    setClientEmail(email);
    setBoardId(storedBoardId);
    loadTicket(params.id as string, storedBoardId, email);
  }, [params.id, router]);

  const loadTicket = async (itemId: string, boardId: string, email: string) => {
    try {
      setLoading(true);

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
          }
        }
      `;

      const response = await callMondayAPI(query, {
        itemId: [itemId]
      });

      if (response.data?.items?.[0]) {
        const item = response.data.items[0];
        
        const cols = item.column_values.reduce((acc: any, col: any) => {
          acc[col.id] = col.text || col.value;
          return acc;
        }, {});

        const ticketData: Ticket = {
          id: item.id,
          title: item.name,
          description: cols.long_text_mkxpgg6q || cols.long_text || cols.description || '',
          status: (cols.status?.toLowerCase() || 'open') as Ticket['status'],
          priority: (cols.color_mkxp805g?.toLowerCase() || cols.priority?.toLowerCase() || 'medium') as Ticket['priority'],
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          clientEmail: cols.email_mkxpawg3 || cols.client_email || '',
        };

        // Verify this ticket belongs to the client
        if (ticketData.clientEmail !== email) {
          router.push('/client/dashboard');
          return;
        }

        setTicket(ticketData);
      }
    } catch (err) {
      console.error('Failed to fetch ticket:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: Ticket['status']) => {
    const variants = {
      open: 'info' as const,
      in_progress: 'warning' as const,
      resolved: 'success' as const,
      closed: 'default' as const,
    };
    return (
      <Badge variant={variants[status]}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: Ticket['priority']) => {
    const variants = {
      low: 'default' as const,
      medium: 'info' as const,
      high: 'warning' as const,
      urgent: 'danger' as const,
    };
    return (
      <Badge variant={variants[priority]}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center animate-fade-in" style={{ backgroundColor: 'var(--ibacs-dark)' }}>
        <Loader size="lg" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--ibacs-dark)' }}>
        <Card className="p-12 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Ticket Not Found
          </h2>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
            This ticket doesn't exist or you don't have permission to view it.
          </p>
          <Button onClick={() => router.push('/client/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen animate-fade-in" style={{ backgroundColor: 'var(--ibacs-dark)' }}>
      {/* Header - IBACS RedsisLab Branded */}
      <div className="sticky top-0 z-10 border-b shadow-lg" style={{ 
        backgroundColor: 'var(--ibacs-primary)', 
        borderColor: 'var(--ibacs-tertiary)',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/client/dashboard')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Ticket Details
                </h1>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{clientEmail}</p>
              </div>
            </div>
            {/* RedsisLab Logo */}
            <div className="flex items-center justify-center rounded-lg" style={{
              width: '40px',
              height: '40px',
              backgroundColor: 'var(--redsislab-yellow)',
              boxShadow: 'var(--shadow-yellow)',
            }}>
              <span className="font-bold text-xl" style={{ color: 'var(--text-inverse)' }}>R</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-slide-up">
        <Card className="p-8">
          {/* Ticket Header */}
          <div className="border-b pb-6 mb-6" style={{ borderColor: 'var(--ibacs-tertiary)' }}>
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {ticket.title}
              </h2>
            </div>
            <div className="flex gap-4 flex-wrap">
              <div>
                <span className="text-sm mr-2" style={{ color: 'var(--text-secondary)' }}>Status:</span>
                {getStatusBadge(ticket.status)}
              </div>
              <div>
                <span className="text-sm mr-2" style={{ color: 'var(--text-secondary)' }}>Priority:</span>
                {getPriorityBadge(ticket.priority)}
              </div>
            </div>
          </div>

          {/* Ticket Details */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                Description
              </h3>
              <div className="p-4 rounded-lg" style={{ 
                backgroundColor: 'var(--ibacs-tertiary)',
                color: 'var(--text-primary)',
              }}>
                {ticket.description || <span style={{ color: 'var(--text-muted)' }}>No description provided</span>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Created
                </h4>
                <p style={{ color: 'var(--text-primary)' }}>
                  {formatDate(ticket.createdAt || new Date().toISOString())}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Last Updated
                </h4>
                <p style={{ color: 'var(--text-primary)' }}>
                  {formatDate(ticket.updatedAt || new Date().toISOString())}
                </p>
              </div>
            </div>

            {/* Support Message */}
            <div className="mt-8 p-6 rounded-lg" style={{
              backgroundColor: 'var(--ibacs-primary)',
              border: '1px solid var(--ibacs-tertiary)',
            }}>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                💡 Our support team will respond to your ticket shortly. You'll receive updates via email.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
