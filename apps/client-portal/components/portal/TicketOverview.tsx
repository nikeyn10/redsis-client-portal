'use client';

import { useEffect, useState } from 'react';
import { useMondayContext } from '@/lib/monday-context';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { Badge } from '@/components/ui/Badge';
import { RefreshCw, ExternalLink, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface Ticket {
  id: string;
  name: string;
  company: string;
  boardId: string;
  status: string;
  priority: string;
  createdDate: string;
  clientEmail: string;
}

export default function TicketOverview() {
  const { executeMondayQuery } = useMondayContext();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [companies, setCompanies] = useState<Array<{ id: string; name: string; boardId: string }>>([]);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);

      const query = `
        query GetCompanies($boardId: [ID!]!) {
          boards(ids: $boardId) {
            items_page(limit: 100) {
              items {
                id
                name
                column_values {
                  id
                  text
                }
              }
            }
          }
        }
      `;

      const response = await executeMondayQuery(query, {
        boardId: ['18379404757']
      });

      if (response.data?.boards?.[0]?.items_page?.items) {
        const companiesList = response.data.boards[0].items_page.items
          .map((item: any) => {
            const cols = item.column_values.reduce((acc: any, col: any) => {
              acc[col.id] = col.text;
              return acc;
            }, {});

            const boardId = cols.dropdown_mkxpakmh;
            if (!boardId) return null;

            return {
              id: item.id,
              name: item.name,
              boardId
            };
          })
          .filter(Boolean);

        setCompanies(companiesList);
        await loadTicketsFromAllBoards(companiesList);
      }
    } catch (err) {
      console.error('Failed to load companies:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTicketsFromAllBoards = async (companiesList: any[]) => {
    try {
      const allTickets: Ticket[] = [];

      for (const company of companiesList) {
        const query = `
          query GetTickets($boardId: [ID!]!) {
            boards(ids: $boardId) {
              items_page(limit: 50) {
                items {
                  id
                  name
                  column_values {
                    id
                    text
                  }
                  created_at
                }
              }
            }
          }
        `;

        const response = await executeMondayQuery(query, {
          boardId: [company.boardId]
        });

        if (response.data?.boards?.[0]?.items_page?.items) {
          const companyTickets = response.data.boards[0].items_page.items.map((item: any) => {
            const cols = item.column_values.reduce((acc: any, col: any) => {
              acc[col.id] = col.text;
              return acc;
            }, {});

            return {
              id: item.id,
              name: item.name,
              company: company.name,
              boardId: company.boardId,
              status: cols.status || 'Open',
              priority: cols.priority || 'Medium',
              createdDate: item.created_at,
              clientEmail: cols.email || ''
            };
          });

          allTickets.push(...companyTickets);
        }
      }

      setTickets(allTickets);
    } catch (err) {
      console.error('Failed to load tickets:', err);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'done':
      case 'closed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'working on it':
      case 'in progress':
        return <Clock className="w-4 h-4 text-blue-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader size="lg" />
      </div>
    );
  }

  const openTickets = tickets.filter(t => 
    !['done', 'closed'].includes(t.status.toLowerCase())
  );
  const closedTickets = tickets.filter(t => 
    ['done', 'closed'].includes(t.status.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Ticket Overview</h2>
          <p className="text-sm text-gray-600 mt-1">
            All tickets across all companies
          </p>
        </div>
        <Button onClick={loadCompanies} variant="secondary">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-600">Total Tickets</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{tickets.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-600">Open</div>
          <div className="text-2xl font-bold text-orange-600 mt-1">{openTickets.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-600">Closed</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{closedTickets.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-600">Companies</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{companies.length}</div>
        </Card>
      </div>

      {/* Tickets Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Ticket
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{ticket.name}</div>
                    {ticket.clientEmail && (
                      <div className="text-xs text-gray-500">{ticket.clientEmail}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-700">{ticket.company}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(ticket.status)}
                      <span className="text-sm text-gray-700">{ticket.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(ticket.createdDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <a
                      href={`https://redsisrgh.monday.com/boards/${ticket.boardId}/pulses/${ticket.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
