'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import TicketList from '@/components/TicketList';
import NewTicketForm from '@/components/NewTicketForm';
import { Plus } from 'lucide-react';
import type { Ticket } from '@/types';

// Mock data for testing
const mockTickets: Ticket[] = [
  {
    id: '1',
    title: 'Website Login Issue',
    description: 'Unable to log into the website using my credentials',
    status: 'open',
    priority: 'high',
    client_id: 'demo-client',
    client_name: 'Demo Client',
    created_at: '2024-10-06T10:00:00Z',
    updated_at: '2024-10-06T10:00:00Z',
  },
  {
    id: '2', 
    title: 'Email Configuration Help',
    description: 'Need assistance setting up email forwarding',
    status: 'in_progress',
    priority: 'medium',
    client_id: 'demo-client',
    client_name: 'Demo Client',
    created_at: '2024-10-05T14:30:00Z',
    updated_at: '2024-10-06T09:15:00Z',
  },
  {
    id: '3',
    title: 'Server Maintenance Window',
    description: 'Request for scheduled maintenance window next week',
    status: 'resolved',
    priority: 'low',
    client_id: 'demo-client',
    client_name: 'Demo Client',
    created_at: '2024-10-04T16:45:00Z',
    updated_at: '2024-10-06T08:00:00Z',
  }
];

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets);
  const [showNewTicket, setShowNewTicket] = useState(false);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleTicketCreated = (newTicket: Ticket) => {
    setTickets((prev) => [newTicket, ...prev]);
    setShowNewTicket(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <Card className="p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome to REDSIS Portal
        </h1>
        <p className="text-gray-600 mt-1">
          Manage your support tickets and requests
        </p>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="text-sm font-medium text-gray-600">Total Tickets</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            {tickets.length}
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-sm font-medium text-gray-600">Open Tickets</div>
          <div className="text-3xl font-bold text-blue-600 mt-2">
            {tickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length}
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-sm font-medium text-gray-600">Resolved</div>
          <div className="text-3xl font-bold text-green-600 mt-2">
            {tickets.filter((t) => t.status === 'resolved').length}
          </div>
        </Card>
      </div>

      {/* Tickets Section */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Your Tickets</h2>
        <Button onClick={() => setShowNewTicket(true)} className="flex items-center gap-2">
          <Plus size={18} />
          New Ticket
        </Button>
      </div>

      {/* New Ticket Form Modal */}
      {showNewTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Create New Ticket</h3>
            </div>
            <div className="p-6">
              <NewTicketForm
                onSuccess={handleTicketCreated}
                onCancel={() => setShowNewTicket(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tickets List */}
      {tickets.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-500">No tickets yet. Create your first ticket to get started.</p>
        </Card>
      ) : (
        <TicketList tickets={tickets} />
      )}
    </div>
  );
}