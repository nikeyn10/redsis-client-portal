// ============================================
// components/TicketList.tsx
// ============================================

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
    <Card>
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
              onClick={() => router.push(`/tickets/${ticket.id}`)}
              className="cursor-pointer"
            >
              <TableCell>
                <div className="flex items-start gap-2">
                  {ticket.priority === 'urgent' && (
                    <AlertCircle size={16} className="text-red-500 mt-0.5" />
                  )}
                  <div>
                    <div className="font-medium text-gray-900">{ticket.title}</div>
                    <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                      {ticket.description}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(ticket.status)}</TableCell>
              <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-gray-500">
                  <Clock size={14} />
                  {formatDate(ticket.created_at)}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-gray-500">{formatDate(ticket.updated_at)}</div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

// ============================================
// components/TicketDetail.tsx
// ============================================

'use client';

import { useState } from 'react';
import type { Ticket, Comment, AddCommentRequest } from '@/types';
import { ticketsApi } from '@/lib/api/client';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';
import { Clock, User, MessageSquare } from 'lucide-react';

interface TicketDetailProps {
  ticket: Ticket;
  comments: Comment[];
  onCommentAdded: (comment: Comment) => void;
}

export default function TicketDetail({
  ticket,
  comments,
  onCommentAdded,
}: TicketDetailProps) {
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmitting(true);
    try {
      const newComment = await ticketsApi.addComment(ticket.id, {
        text: commentText,
      });
      onCommentAdded(newComment);
      setCommentText('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setSubmitting(false);
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
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Ticket Header */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {ticket.title}
            </h1>
            <div className="flex items-center gap-3">
              {getStatusBadge(ticket.status)}
              {getPriorityBadge(ticket.priority)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-2">
            <Clock size={16} />
            <span>Created: {formatDate(ticket.created_at)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={16} />
            <span>Updated: {formatDate(ticket.updated_at)}</span>
          </div>
        </div>

        <div className="border-t pt-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Description</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
        </div>
      </Card>

      {/* Comments Section */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare size={20} className="text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Comments ({comments.length})
          </h2>
        </div>

        {/* Existing Comments */}
        <div className="space-y-4 mb-6">
          {comments.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No comments yet. Be the first to comment!
            </p>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <User size={16} className="text-gray-500" />
                  <span className="font-medium text-gray-900">
                    {comment.author}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDate(comment.created_at)}
                  </span>
                  <Badge variant={comment.author_type === 'admin' ? 'info' : 'default'}>
                    {comment.author_type}
                  </Badge>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{comment.text}</p>
              </div>
            ))
          )}
        </div>

        {/* Add Comment Form */}
        <form onSubmit={handleSubmitComment} className="border-t pt-4">
          <Textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment..."
            rows={4}
            className="mb-3"
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={submitting || !commentText.trim()}>
              {submitting ? 'Posting...' : 'Post Comment'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

// ============================================
// components/NewTicketForm.tsx
// ============================================

'use client';

import { useState } from 'react';
import { ticketsApi } from '@/lib/api/client';
import type { Ticket, CreateTicketRequest } from '@/types';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Select } from './ui/Select';
import { Button } from './ui/Button';

interface NewTicketFormProps {
  onSuccess: (ticket: Ticket) => void;
  onCancel: () => void;
}

export default function NewTicketForm({ onSuccess, onCancel }: NewTicketFormProps) {
  const [formData, setFormData] = useState<CreateTicketRequest>({
    title: '',
    description: '',
    priority: 'medium',
  });
  const [errors, setErrors] = useState<Partial<CreateTicketRequest>>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = (): boolean => {
    const newErrors: Partial<CreateTicketRequest> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setSubmitting(true);
    try {
      const newTicket = await ticketsApi.createTicket(formData);
      onSuccess(newTicket);
    } catch (error) {
      console.error('Failed to create ticket:', error);
      alert('Failed to create ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Title"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        error={errors.title}
        placeholder="Brief summary of your issue"
        required
      />

      <Textarea
        label="Description"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        error={errors.description}
        placeholder="Provide detailed information about your issue..."
        rows={6}
        required
      />

      <Select
        label="Priority"
        value={formData.priority}
        onChange={(e) =>
          setFormData({
            ...formData,
            priority: e.target.value as CreateTicketRequest['priority'],
          })
        }
        required
      >
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="urgent">Urgent</option>
      </Select>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" onClick={onCancel} variant="secondary">
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Creating...' : 'Create Ticket'}
        </Button>
      </div>
    </form>
  );
}