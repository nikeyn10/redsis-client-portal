'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import TicketList from '@/components/TicketList';
import NewTicketForm from '@/components/NewTicketForm';
import { Download, FileSpreadsheet, FileText, BarChart3, Clock, Plus, LogOut, Check } from 'lucide-react';
import type { Ticket } from '@/types';
import { getColumnIdByTitle, type BoardColumn } from '@/lib/board-columns';

export default function ClientDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [clientEmail, setClientEmail] = useState<string>('');
  const [boardId, setBoardId] = useState<string>('');
  const [boardColumns, setBoardColumns] = useState<BoardColumn[]>([]);
  const [companyName, setCompanyName] = useState<string>('');

  // Calculate metrics
  const calculateMetrics = () => {
    const now = new Date();
    const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in_progress');
    const closedTickets = tickets.filter(t => t.status === 'closed' || t.status === 'resolved');
    
    // Calculate average response time (in hours)
    let totalResponseTime = 0;
    let responseCount = 0;
    
    tickets.forEach(ticket => {
      if (ticket.updatedAt && ticket.createdAt) {
        const created = new Date(ticket.createdAt);
        const updated = new Date(ticket.updatedAt);
        const diff = updated.getTime() - created.getTime();
        totalResponseTime += diff;
        responseCount++;
      }
    });
    
    const avgResponseHours = responseCount > 0 
      ? Math.round((totalResponseTime / responseCount) / (1000 * 60 * 60)) 
      : 0;
    
    return {
      total: tickets.length,
      open: openTickets.length,
      closed: closedTickets.length,
      avgResponseHours
    };
  };

  const metrics = calculateMetrics();

  // Export functions
  const exportToPDF = () => {
    const content = `
REDSISLAB CLIENT PORTAL - TICKETS REPORT
========================================

Generated: ${new Date().toLocaleString()}
Client: ${clientEmail}
Company: ${companyName || 'N/A'}

SUMMARY
-------
Total Tickets: ${metrics.total}
Open Tickets: ${metrics.open}
Closed Tickets: ${metrics.closed}
Average Response Time: ${metrics.avgResponseHours} hours

TICKETS
-------
${tickets.map((ticket, index) => `
${index + 1}. ${ticket.title}
   Status: ${ticket.status?.toUpperCase() || 'UNKNOWN'}
   Priority: ${ticket.priority?.toUpperCase() || 'MEDIUM'}
   Created: ${ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : 'N/A'}
   Last Updated: ${ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString() : 'N/A'}
   Description: ${ticket.description || 'No description'}
   ---
`).join('\n')}

End of Report
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tickets-report-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToExcel = () => {
    const headers = ['ID', 'Title', 'Status', 'Priority', 'Created', 'Updated', 'Description'];
    const rows = tickets.map(ticket => [
      ticket.id,
      ticket.title,
      ticket.status || 'unknown',
      ticket.priority || 'medium',
      ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : 'N/A',
      ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString() : 'N/A',
      ticket.description || ''
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tickets-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('magic_token');
    const email = localStorage.getItem('client_email');
    const userName = localStorage.getItem('user_name');
    const userCompany = localStorage.getItem('user_company');
    let storedBoardId = localStorage.getItem('client_board_id');

    if (!token || !email) {
      router.push('/login');
      return;
    }

    // Ensure boardId is always set to the ticket board
    if (!storedBoardId) {
      storedBoardId = '18379040651'; // Default to ticket board
      localStorage.setItem('client_board_id', storedBoardId);
    }

    setClientEmail(email);
    setBoardId(storedBoardId);
    setCompanyName(userCompany || '');
    
    // Load board columns first, then tickets
    loadBoardData(storedBoardId, email);
  }, [router]);

  const loadBoardData = async (boardId: string, email: string) => {
    try {
      setLoading(true);

      // Fetch board columns via API route
      const columnsResponse = await fetch(`/api/board-columns?boardId=${boardId}`);
      if (!columnsResponse.ok) {
        throw new Error('Failed to fetch board columns');
      }
      const columnsData = await columnsResponse.json();
      const columns = columnsData.data?.boards?.[0]?.columns || [];
      
      setBoardColumns(columns);
      console.log('📋 Board columns loaded:', columns);

      // Then load tickets
      await loadTickets(boardId, email, columns);
    } catch (err) {
      console.error('Failed to load board data:', err);
      alert('Failed to load board data: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const loadTickets = async (boardId: string, email: string, columns?: BoardColumn[]) => {
    try {
      // Use provided columns or fetch them
      let cols: BoardColumn[] = columns || [];
      if (cols.length === 0) {
        const columnsResponse = await fetch(`/api/board-columns?boardId=${boardId}`);
        if (!columnsResponse.ok) {
          throw new Error('Failed to fetch board columns');
        }
        const columnsData = await columnsResponse.json();
        cols = columnsData.data?.boards?.[0]?.columns || [];
      }
      
      // Find column IDs dynamically
      const emailColId = getColumnIdByTitle(cols, 'Client Email') || 
                        getColumnIdByTitle(cols, 'Email') || 
                        'email_mkxpawg3'; // fallback
      
      const statusColId = getColumnIdByTitle(cols, 'Status') || 'status';
      const priorityColId = getColumnIdByTitle(cols, 'Priority') || 
                           getColumnIdByTitle(cols, 'Color') || 
                           'color_mkxp805g';
      
      const descriptionColId = getColumnIdByTitle(cols, 'Description') || 
                              getColumnIdByTitle(cols, 'Long Text') || 
                              'long_text_mkxpgg6q';

      console.log('🔍 Dynamic column mapping:', {
        email: emailColId,
        status: statusColId,
        priority: priorityColId,
        description: descriptionColId
      });

      // Fetch tickets via API route
      const ticketsResponse = await fetch(`/api/tickets?boardId=${boardId}`);
      if (!ticketsResponse.ok) {
        const errorData = await ticketsResponse.json();
        throw new Error(errorData.error || 'Failed to fetch tickets');
      }
      
      const response = await ticketsResponse.json();

      if (response.data?.boards?.[0]?.items_page?.items) {
        const items = response.data.boards[0].items_page.items;
        
        console.log('🎫 RAW ITEMS FROM MONDAY:', items);
        console.log('🎫 NUMBER OF ITEMS:', items.length);
        
        const transformedTickets: Ticket[] = items.map((item: any) => {
          console.log('\n--- Processing Item:', item.name, '---');
          
          const colValues = item.column_values.reduce((acc: any, col: any) => {
            acc[col.id] = col.text || col.value;
            return acc;
          }, {});

          const ticket = {
            id: item.id,
            title: item.name,
            description: colValues[descriptionColId] || '',
            status: (colValues[statusColId]?.toLowerCase() || 'open') as Ticket['status'],
            priority: (colValues[priorityColId]?.toLowerCase() || 'medium') as Ticket['priority'],
            createdAt: item.created_at,
            updatedAt: item.updated_at,
            clientEmail: colValues[emailColId] || '',
          };
          
          return ticket;
        });

        console.log('\n✅ TRANSFORMED TICKETS:', transformedTickets);
        console.log('🔍 FILTERING BY EMAIL:', email);

        // Filter tickets by client email
        const clientTickets = transformedTickets.filter(ticket => {
          const matches = ticket.clientEmail === email;
          console.log(`Ticket "${ticket.title}": clientEmail="${ticket.clientEmail}" === "${email}" ? ${matches}`);
          return matches;
        });

        console.log('\n📊 RESULTS:');
        console.log('Total tickets found:', transformedTickets.length);
        console.log('After email filter:', clientTickets.length);

        setTickets(clientTickets);
      }
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
      alert('Failed to load tickets: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleCreateTicket = async (ticketData: { title: string; description: string; priority: string }) => {
    const targetBoardId = boardId || '18379040651';
    
    if (!targetBoardId) {
      alert('Board configuration error. Please try logging in again.');
      return;
    }

    try {
      console.log('📝 Creating ticket with data:', ticketData);
      console.log('📧 User email:', clientEmail);
      console.log('📋 Board ID:', targetBoardId);

      // Get dynamic column IDs
      const emailColId = getColumnIdByTitle(boardColumns, 'Client Email') || 
                        getColumnIdByTitle(boardColumns, 'Email') || 
                        'email_mkxpawg3';
      
      const statusColId = getColumnIdByTitle(boardColumns, 'Status') || 'status';
      
      const priorityColId = getColumnIdByTitle(boardColumns, 'Priority') || 
                           getColumnIdByTitle(boardColumns, 'Color') || 
                           'color_mkxp805g';
      
      const descriptionColId = getColumnIdByTitle(boardColumns, 'Description') || 
                              getColumnIdByTitle(boardColumns, 'Long Text') || 
                              'long_text_mkxpgg6q';

      // Map priority to proper status labels
      const priorityLabels: Record<string, string> = {
        low: 'Low',
        medium: 'Medium',
        high: 'High',
        urgent: 'Urgent'
      };

      const columnValues: any = {
        [statusColId]: { label: 'Open' },
        [emailColId]: { email: clientEmail, text: clientEmail },
        [priorityColId]: { label: priorityLabels[ticketData.priority] || 'Medium' },
      };

      if (ticketData.description) {
        columnValues[descriptionColId] = ticketData.description;
      }

      console.log('📊 Column values to set:', JSON.stringify(columnValues, null, 2));

      // Create ticket via API route
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          boardId: targetBoardId,
          itemName: ticketData.title,
          columnValues: columnValues
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create ticket');
      }

      const result = await response.json();
      const newItem = result.data?.create_item;

      console.log('✅ Ticket created successfully:', newItem);
      alert('Ticket created successfully! We will review it shortly.');
      
      // Refresh tickets
      loadTickets(targetBoardId, clientEmail, boardColumns);
      setShowNewTicket(false);

      return {
        id: newItem?.id || Date.now().toString(),
        title: ticketData.title,
        description: ticketData.description,
        status: 'open' as const,
        priority: ticketData.priority as 'low' | 'medium' | 'high' | 'urgent',
        createdAt: newItem?.created_at || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        clientEmail: clientEmail,
      };
    } catch (err) {
      console.error('❌ Failed to create ticket:', err);
      alert('Failed to create ticket: ' + (err instanceof Error ? err.message : 'Unknown error'));
      throw err;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('magic_token');
    localStorage.removeItem('client_email');
    localStorage.removeItem('client_board_id');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_company');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center animate-fade-in" style={{ backgroundColor: 'var(--ibacs-dark)' }}>
        <Loader size="lg" />
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              {/* RedsisLab Logo */}
              <div className="flex items-center justify-center rounded-lg" style={{
                width: '48px',
                height: '48px',
                backgroundColor: 'var(--redsislab-yellow)',
                boxShadow: 'var(--shadow-yellow)',
              }}>
                <span className="font-bold text-2xl" style={{ color: 'var(--text-inverse)' }}>R</span>
              </div>
              <div>
                <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  RedsisLab Client Portal
                </h1>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {clientEmail} {companyName && `• ${companyName}`}
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-slide-up">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="rounded-xl p-6 shadow-lg transition-all duration-200 hover:scale-105" style={{
            backgroundColor: 'var(--ibacs-secondary)',
            border: '1px solid var(--ibacs-tertiary)',
          }}>
            <div className="flex items-center justify-between mb-2">
              <FileText className="w-8 h-8" style={{ color: 'var(--redsislab-yellow)' }} />
              <span className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {metrics.total}
              </span>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Tickets</p>
          </div>

          <div className="rounded-xl p-6 shadow-lg transition-all duration-200 hover:scale-105" style={{
            backgroundColor: 'var(--ibacs-secondary)',
            border: '1px solid var(--ibacs-tertiary)',
          }}>
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-8 h-8" style={{ color: '#10b981' }} />
              <span className="text-3xl font-bold" style={{ color: '#10b981' }}>
                {metrics.open}
              </span>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Open Tickets</p>
          </div>

          <div className="rounded-xl p-6 shadow-lg transition-all duration-200 hover:scale-105" style={{
            backgroundColor: 'var(--ibacs-secondary)',
            border: '1px solid var(--ibacs-tertiary)',
          }}>
            <div className="flex items-center justify-between mb-2">
              <Check className="w-8 h-8" style={{ color: '#3b82f6' }} />
              <span className="text-3xl font-bold" style={{ color: '#3b82f6' }}>
                {metrics.closed}
              </span>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Closed Tickets</p>
          </div>

          <div className="rounded-xl p-6 shadow-lg transition-all duration-200 hover:scale-105" style={{
            backgroundColor: 'var(--ibacs-secondary)',
            border: '1px solid var(--ibacs-tertiary)',
          }}>
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8" style={{ color: 'var(--redsislab-yellow)' }} />
              <span className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {metrics.avgResponseHours}h
              </span>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Avg Response Time</p>
          </div>
        </div>

        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              My Support Tickets
            </h2>
            <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
              {tickets.length} {tickets.length === 1 ? 'ticket' : 'tickets'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {tickets.length > 0 && (
              <>
                <button
                  onClick={exportToPDF}
                  className="flex items-center px-4 py-2 rounded-lg font-semibold transition-all duration-200 hover:scale-105"
                  style={{
                    backgroundColor: 'var(--ibacs-primary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--ibacs-tertiary)',
                  }}
                  title="Export as PDF"
                >
                  <Download className="w-4 h-4 mr-2" />
                  PDF
                </button>
                <button
                  onClick={exportToExcel}
                  className="flex items-center px-4 py-2 rounded-lg font-semibold transition-all duration-200 hover:scale-105"
                  style={{
                    backgroundColor: 'var(--ibacs-primary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--ibacs-tertiary)',
                  }}
                  title="Export as Excel"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Excel
                </button>
              </>
            )}
            <button
              onClick={() => setShowNewTicket(true)}
              className="flex items-center px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105"
              style={{
                backgroundColor: 'var(--redsislab-yellow)',
                color: 'var(--text-inverse)',
                boxShadow: 'var(--shadow-yellow)',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--redsislab-yellow-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--redsislab-yellow)'}
            >
              <Plus className="w-5 h-5 mr-2" />
              New Ticket
            </button>
          </div>
        </div>

        {tickets.length === 0 ? (
          <div className="rounded-xl p-16 text-center" style={{
            backgroundColor: 'var(--ibacs-secondary)',
            border: '1px solid var(--ibacs-tertiary)',
          }}>
            <div className="text-7xl mb-6">🎫</div>
            <h3 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
              No Support Tickets Yet
            </h3>
            <p className="text-lg mb-8" style={{ color: 'var(--text-secondary)' }}>
              Create your first support ticket to get started
            </p>
            <button
              onClick={() => setShowNewTicket(true)}
              className="inline-flex items-center px-8 py-4 rounded-lg font-semibold transition-all duration-200 hover:scale-105"
              style={{
                backgroundColor: 'var(--redsislab-yellow)',
                color: 'var(--text-inverse)',
                boxShadow: 'var(--shadow-yellow)',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--redsislab-yellow-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--redsislab-yellow)'}
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Ticket
            </button>
          </div>
        ) : (
          <TicketList 
            tickets={tickets}
          />
        )}
      </div>

      {/* New Ticket Modal - IBACS Styled */}
      {showNewTicket && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
        }}>
          <div className="rounded-xl p-8 max-w-lg w-full mx-4 shadow-2xl" style={{
            backgroundColor: 'var(--ibacs-secondary)',
            border: '1px solid var(--ibacs-tertiary)',
          }}>
            <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
              Create New Ticket
            </h2>
            <NewTicketForm
              onSuccess={async (ticket) => {
                await handleCreateTicket({
                  title: ticket.title,
                  description: ticket.description,
                  priority: ticket.priority
                });
              }}
              onCancel={() => setShowNewTicket(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
