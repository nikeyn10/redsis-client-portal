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
