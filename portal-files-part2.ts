// ============================================
// app/(auth)/layout.tsx
// ============================================

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/api/client';
import TopNav from '@/components/TopNav';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  if (!isAuthenticated()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

// ============================================
// app/(auth)/dashboard/page.tsx
// ============================================

'use client';

import { useEffect, useState } from 'react';
import { ticketsApi, authApi } from '@/lib/api/client';
import { subscribeToTicketUpdates, disconnectWebSocket } from '@/lib/ws';
import type { Ticket, CurrentUser } from '@/types';
import TicketList from '@/components/TicketList';
import NewTicketForm from '@/components/NewTicketForm';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { Plus } from 'lucide-react';

export default function DashboardPage() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTicket, setShowNewTicket] = useState(false);

  useEffect(() => {
    // Load user and tickets
    Promise.all([
      authApi.getCurrentUser(),
      ticketsApi.getTickets(),
    ])
      .then(([userData, ticketsData]) => {
        setUser(userData);
        setTickets(ticketsData);
      })
      .catch((error) => {
        console.error('Failed to load dashboard data:', error);
      })
      .finally(() => {
        setLoading(false);
      });

    // Subscribe to real-time updates
    const unsubscribe = subscribeToTicketUpdates((event) => {
      console.log('Ticket update:', event);
      // Refresh tickets on update
      ticketsApi.getTickets().then(setTickets);
    });

    return () => {
      unsubscribe();
      disconnectWebSocket();
    };
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {user?.name || 'User'}
        </h1>
        <p className="text-gray-600 mt-1">
          {user?.client_name || 'Client Portal'}
        </p>
      </div>

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
          <div className="text-3xl font-bold text-monday-blue mt-2">
            {tickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length}
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-sm font-medium text-gray-600">Resolved</div>
          <div className="text-3xl font-bold text-green-600 mt-2">
            {tickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length}
          </div>
        </Card>
      </div>

      {/* New Ticket Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Your Tickets</h2>
        <Button
          onClick={() => setShowNewTicket(true)}
          className="flex items-center gap-2"
        >
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

// ============================================
// app/(auth)/tickets/[id]/page.tsx
// ============================================

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ticketsApi } from '@/lib/api/client';
import type { Ticket, Comment } from '@/types';
import TicketDetail from '@/components/TicketDetail';
import { Loader } from '@/components/ui/Loader';
import { Button } from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';

export default function TicketPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      ticketsApi.getTicket(ticketId),
      ticketsApi.getComments(ticketId),
    ])
      .then(([ticketData, commentsData]) => {
        setTicket(ticketData);
        setComments(commentsData);
      })
      .catch((error) => {
        console.error('Failed to load ticket:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [ticketId]);

  const handleCommentAdded = (newComment: Comment) => {
    setComments((prev) => [...prev, newComment]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader size="lg" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Ticket not found</p>
        <Button onClick={() => router.push('/dashboard')} className="mt-4">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button
        onClick={() => router.push('/dashboard')}
        variant="ghost"
        className="flex items-center gap-2"
      >
        <ArrowLeft size={18} />
        Back to Dashboard
      </Button>

      <TicketDetail
        ticket={ticket}
        comments={comments}
        onCommentAdded={handleCommentAdded}
      />
    </div>
  );
}

// ============================================
// components/TopNav.tsx
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/client';
import { getCurrentUserFromToken } from '@/lib/auth';
import { Button } from './ui/Button';
import { LogOut, User } from 'lucide-react';

export default function TopNav() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    const user = getCurrentUserFromToken();
    if (user) {
      setUserName(user.email);
    }
  }, []);

  const handleLogout = () => {
    authApi.logout();
    router.push('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-xl font-bold text-monday-blue hover:text-monday-blue-dark transition-colors"
            >
              REDSIS Portal
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <User size={18} />
              <span>{userName}</span>
            </div>
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
            >
              <LogOut size={18} />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}