/**
 * Monday Files & Assets Utilities
 * Handles file uploads and downloads via monday.com assets
 */

import type { TicketFile } from '@portal/types';

/**
 * Upload file to monday.com
 * Note: Actual upload requires multipart/form-data POST to monday API
 * This is typically done from backend (monday-code)
 */
export async function uploadFileToMonday(
  apiToken: string,
  file: any,
  itemId?: number
): Promise<{ assetId: string; url: string }> {
  // This is a placeholder - actual implementation in monday-code backend
  // Monday file upload endpoint: https://api.monday.com/v2/file
  
  const formData = new FormData();
  formData.append('query', 'mutation ($file: File!) { add_file_to_column(file: $file) { id url } }');
  
  if (file instanceof File) {
    formData.append('variables[file]', file);
  }

  const response = await fetch('https://api.monday.com/v2/file', {
    method: 'POST',
    headers: {
      'Authorization': apiToken,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`File upload failed: ${response.statusText}`);
  }

  const result = await response.json();
  return {
    assetId: result.data?.add_file_to_column?.id || '',
    url: result.data?.add_file_to_column?.url || '',
  };
}

/**
 * Add uploaded file to item's file column
 */
export async function attachFileToItem(
  apiToken: string,
  itemId: number,
  columnId: string,
  assetId: string
): Promise<void> {
  const query = `
    mutation ($itemId: ID!, $columnId: String!, $value: JSON!) {
      change_column_value(
        item_id: $itemId
        column_id: $columnId
        value: $value
      ) {
        id
      }
    }
  `;

  const response = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': apiToken,
    },
    body: JSON.stringify({
      query,
      variables: {
        itemId,
        columnId,
        value: JSON.stringify({
          assetId,
        }),
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to attach file: ${response.statusText}`);
  }
}

/**
 * Parse monday asset to TicketFile format
 */
export function parseAssetToTicketFile(
  asset: any,
  ticketId: string,
  uploadedByType: 'client' | 'admin' = 'client'
): TicketFile {
  return {
    id: asset.id,
    ticket_id: ticketId,
    name: asset.name || 'Unnamed file',
    url: asset.url,
    public_url: asset.public_url,
    size: asset.file_size || 0,
    mime_type: getMimeTypeFromExtension(asset.file_extension),
    uploaded_by: asset.uploaded_by?.id?.toString() || 'unknown',
    uploaded_by_type: uploadedByType,
    uploaded_at: asset.created_at || new Date().toISOString(),
  };
}

/**
 * Get MIME type from file extension
 */
function getMimeTypeFromExtension(ext: string): string {
  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    txt: 'text/plain',
    csv: 'text/csv',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
  };

  return mimeTypes[ext?.toLowerCase()] || 'application/octet-stream';
}

/**
 * Validate file size and type
 */
export function validateFile(
  file: File,
  maxSizeMB: number = 10,
  allowedTypes: string[] = ['image/*', 'application/pdf', '.doc', '.docx', '.txt']
): { valid: boolean; error?: string } {
  // Check size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    };
  }

  // Check type
  const fileType = file.type;
  const fileName = file.name;
  
  const isAllowed = allowedTypes.some(allowed => {
    if (allowed.startsWith('.')) {
      return fileName.toLowerCase().endsWith(allowed);
    }
    if (allowed.endsWith('/*')) {
      const category = allowed.split('/')[0];
      return fileType.startsWith(category + '/');
    }
    return fileType === allowed;
  });

  if (!isAllowed) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  return { valid: true };
}
