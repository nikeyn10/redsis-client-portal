'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';

// Mock data for testing
const mockTickets = [
  {
    id: '1',
    title: 'Website Login Issue',
    description: 'Unable to log into the website using my credentials',
    status: 'open' as const,
    priority: 'high' as const,
    created_at: '2024-10-06T10:00:00Z',
    updated_at: '2024-10-06T10:00:00Z',
  },
  {
    id: '2', 
    title: 'Email Configuration Help',
    description: 'Need assistance setting up email forwarding',
    status: 'in_progress' as const,
    priority: 'medium' as const,
    created_at: '2024-10-05T14:30:00Z',
    updated_at: '2024-10-06T09:15:00Z',
  },
  {
    id: '3',
    title: 'Server Maintenance Window',
    description: 'Request for scheduled maintenance window next week',
    status: 'resolved' as const,
    priority: 'low' as const,
    created_at: '2024-10-04T16:45:00Z',
    updated_at: '2024-10-06T08:00:00Z',
  }
];

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [tickets] = useState(mockTickets);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
        <Button>
          New Ticket
        </Button>
      </div>

      {/* Tickets List */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {ticket.title}
                    </div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">
                      {ticket.description}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                      {ticket.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(ticket.created_at).toLocaleDateString()}
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