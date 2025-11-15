'use client';

import { useRouter } from 'next/navigation';
import type { Ticket } from '@/types';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './ui/Table';
import { Clock, AlertCircle } from 'lucide-react';

interface TicketListProps {
  tickets: Ticket[];
}

export default function TicketList({ tickets }: TicketListProps) {
  const router = useRouter();

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
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => (
            <TableRow
              key={ticket.id}
              onClick={() => router.push(`/client/tickets/${ticket.id}`)}
              className="cursor-pointer transition-colors hover:bg-opacity-70"
              style={{
                borderBottom: '1px solid var(--ibacs-tertiary)',
              }}
            >
              <TableCell>
                <div className="flex items-start gap-2">
                  {ticket.priority === 'urgent' && (
                    <AlertCircle size={16} className="mt-0.5" style={{ color: 'var(--ibacs-red)' }} />
                  )}
                  <div>
                    <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {ticket.title}
                    </div>
                    <div className="text-xs mt-1 line-clamp-1" style={{ color: 'var(--text-muted)' }}>
                      {ticket.description}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(ticket.status)}</TableCell>
              <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                  <Clock size={14} />
                  {formatDate(ticket.created_at || ticket.createdAt || new Date().toISOString())}
                </div>
              </TableCell>
              <TableCell>
                <div style={{ color: 'var(--text-secondary)' }}>
                  {formatDate(ticket.updated_at || ticket.updatedAt || new Date().toISOString())}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
