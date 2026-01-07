/**
 * File utility functions for hazo_notes
 */

import type { NoteFile } from '../types/index.js';

/**
 * Generate a sequential file number (e.g., "0001", "0002")
 */
export function generate_file_no(existing_files: NoteFile[]): string {
  const max_no = existing_files.reduce((max, file) => {
    const num = parseInt(file.file_no, 10);
    return isNaN(num) ? max : Math.max(max, num);
  }, 0);
  return String(max_no + 1).padStart(4, '0');
}

/**
 * Convert File object to base64 string
 */
export async function file_to_base64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(',')[1] || result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Get MIME type from filename extension
 */
export function get_mime_type(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const mime_types: Record<string, string> = {
    // Images
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    // Documents
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    txt: 'text/plain',
    csv: 'text/csv',
    // Archives
    zip: 'application/zip',
    rar: 'application/vnd.rar',
  };
  return mime_types[ext] || 'application/octet-stream';
}

/**
 * Check if file type is allowed
 */
export function is_allowed_file_type(filename: string, allowed_types: string[]): boolean {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return allowed_types.map(t => t.toLowerCase()).includes(ext);
}

/**
 * Check if file is an image (can be embedded)
 */
export function is_image_file(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext);
}

/**
 * Format file size for display
 */
export function format_file_size(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Parse note text and extract file references
 * Returns array of { type: 'embed' | 'attach', file_no: string }
 */
export function parse_file_references(note_text: string): Array<{ type: 'embed' | 'attachment'; file_no: string }> {
  const references: Array<{ type: 'embed' | 'attachment'; file_no: string }> = [];

  // Match <<embed:0001>> pattern
  const embed_regex = /<<embed:(\d+)>>/g;
  let match;
  while ((match = embed_regex.exec(note_text)) !== null) {
    references.push({ type: 'embed', file_no: match[1] });
  }

  // Match <<attach:0001>> pattern
  const attach_regex = /<<attach:(\d+)>>/g;
  while ((match = attach_regex.exec(note_text)) !== null) {
    references.push({ type: 'attachment', file_no: match[1] });
  }

  return references;
}

/**
 * Create file reference syntax for inserting into note text
 */
export function create_file_reference(file_no: string, embed_type: 'embed' | 'attachment'): string {
  return embed_type === 'embed' ? `<<embed:${file_no}>>` : `<<attach:${file_no}>>`;
}

/**
 * Validate file before upload
 */
export function validate_file(
  file: File,
  options: {
    max_size_mb: number;
    allowed_types: string[];
  }
): { valid: boolean; error?: string } {
  // Check file size
  const max_bytes = options.max_size_mb * 1024 * 1024;
  if (file.size > max_bytes) {
    return {
      valid: false,
      error: `File size (${format_file_size(file.size)}) exceeds maximum allowed (${options.max_size_mb} MB)`,
    };
  }

  // Check file type
  if (!is_allowed_file_type(file.name, options.allowed_types)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${options.allowed_types.join(', ')}`,
    };
  }

  return { valid: true };
}
