'use client';

import { useState, useRef } from 'react';
import { mondayTicketsApi } from '@/lib/api/monday-api';
import { useMondayContext } from '@/lib/monday-context';
import type { Ticket, CreateTicketRequest } from '@/types';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Select } from './ui/Select';
import { Button } from './ui/Button';
import { Upload, X, FileText, Image, File } from 'lucide-react';

interface NewTicketFormProps {
  onSuccess: (ticket: Ticket) => void;
  onCancel: () => void;
}

export default function NewTicketForm({ onSuccess, onCancel }: NewTicketFormProps) {
  const { context } = useMondayContext();
  const [formData, setFormData] = useState<CreateTicketRequest>({
    title: '',
    description: '',
    priority: 'medium',
  });
  const [errors, setErrors] = useState<Partial<CreateTicketRequest>>({});
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
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
      // Check if we're in demo mode (no real backend)
      const isDemoMode = localStorage.getItem('portal_auth_token') === 'demo-token-123';
      
      if (isDemoMode) {
        // Create mock ticket for demo
        const newTicket: Ticket = {
          id: Date.now().toString(),
          ...formData,
          status: 'open',
          client_id: 'demo-client',
          client_name: 'Demo Client',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        onSuccess(newTicket);
      } else {
        // Get board ID from context or environment variable
        // Default ticket board ID (update this to your actual ticket board ID)
        const TICKET_BOARD_ID = process.env.NEXT_PUBLIC_TICKET_BOARD_ID || '18379351659';
        const boardId = context?.board?.id?.toString() || TICKET_BOARD_ID;
        
        if (!boardId) {
          throw new Error('No board configured for tickets. Please contact support.');
        }
        
        const newTicket = await mondayTicketsApi.createTicket(
          boardId,
          formData.title,
          formData.description,
          formData.priority,
          context?.user?.email
        );
        onSuccess(newTicket);
      }
    } catch (error: any) {
      console.error('Failed to create ticket:', error);
      alert(error.message || 'Failed to create ticket. Please try again.');
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

      {/* File Upload Section */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Attachments
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.xlsx,.xls,.csv"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex flex-col items-center gap-2 text-gray-600 hover:text-blue-600"
          >
            <Upload className="w-8 h-8" />
            <span className="text-sm font-medium">Click to upload files</span>
            <span className="text-xs text-gray-500">PDF, DOC, Images, Excel (Max 10MB each)</span>
          </button>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-2 mt-3">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-200"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {getFileIcon(file.name)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

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
