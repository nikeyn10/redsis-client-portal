'use client';

import { useState, useRef } from 'react';
import type { Ticket, Comment } from '@/types';
import { mondayTicketsApi } from '@/lib/api/monday-api';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';
import { Clock, User, MessageSquare, Paperclip, Download, X, FileText, Image, File } from 'lucide-react';

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
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isClosed = ticket.status === 'closed' || ticket.status === 'resolved';
  const canUploadFiles = !isClosed;

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmitting(true);
    try {
      const newComment = await mondayTicketsApi.addComment(ticket.id, commentText);
      onCommentAdded(newComment);
      setCommentText('');
      setFiles([]);
    } catch (error) {
      console.error('Failed to add comment:', error);
      alert('Failed to add comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && canUploadFiles) {
      const selectedFiles = Array.from(e.target.files);
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      const validFiles = selectedFiles.filter(file => {
        if (file.size > maxSize) {
          alert(`${file.name} exceeds 10MB limit`);
          return false;
        }
        return true;
      });
      
      setFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(ext || '')) {
      return <Image className="w-4 h-4" />;
    }
    if (['pdf', 'doc', 'docx', 'txt'].includes(ext || '')) {
      return <FileText className="w-4 h-4" />;
    }
    return <File className="w-4 h-4" />;
  };

  const exportToPDF = () => {
    // Simple text-based PDF export
    const content = `
Ticket: ${ticket.title}
Status: ${ticket.status}
Priority: ${ticket.priority}
Created: ${formatDate(ticket.created_at || ticket.createdAt || new Date().toISOString())}

Description:
${ticket.description}

Comments:
${comments.map(c => `[${formatDate(c.created_at)}] ${c.author}: ${c.text}`).join('\n')}
    `;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ticket-${ticket.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToExcel = () => {
    // CSV export (opens in Excel)
    const headers = 'Field,Value\n';
    const data = [
      ['Ticket ID', ticket.id],
      ['Title', ticket.title],
      ['Status', ticket.status],
      ['Priority', ticket.priority],
      ['Created', formatDate(ticket.created_at || ticket.createdAt || new Date().toISOString())],
      ['Updated', formatDate(ticket.updated_at || ticket.updatedAt || new Date().toISOString())],
      ['Description', ticket.description.replace(/\n/g, ' ')],
      ['Comments', comments.length.toString()]
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    
    const content = headers + data;
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ticket-${ticket.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={exportToPDF}>
              <Download className="w-4 h-4 mr-1" />
              PDF
            </Button>
            <Button variant="secondary" size="sm" onClick={exportToExcel}>
              <Download className="w-4 h-4 mr-1" />
              Excel
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-2">
            <Clock size={16} />
            <span>Created: {formatDate(ticket.created_at || ticket.createdAt || new Date().toISOString())}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={16} />
            <span>Updated: {formatDate(ticket.updated_at || ticket.updatedAt || new Date().toISOString())}</span>
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
        {!isClosed ? (
          <form onSubmit={handleSubmitComment} className="space-y-4">
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add your comment..."
              rows={4}
              disabled={submitting}
            />
            
            {/* File Upload */}
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.xlsx,.xls"
              />
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={submitting}
                >
                  <Paperclip className="w-4 h-4 mr-1" />
                  Attach Files
                </Button>
                {files.length > 0 && (
                  <span className="text-xs text-gray-500">
                    {files.length} file(s) selected
                  </span>
                )}
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 rounded-lg p-2 border border-gray-200"
                    >
                      <div className="flex items-center gap-2">
                        {getFileIcon(file.name)}
                        <span className="text-sm text-gray-900">{file.name}</span>
                        <span className="text-xs text-gray-500">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={submitting || !commentText.trim()}>
                {submitting ? 'Posting...' : 'Post Comment'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              ⚠️ This ticket is closed. Comments and file uploads are disabled.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
