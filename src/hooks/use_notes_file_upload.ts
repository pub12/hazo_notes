'use client';

/**
 * React hook for handling file uploads for notes
 */

import { useState, useCallback } from 'react';
import type { NoteFile, FileUploadApiResponse } from '../types/index.js';
import { use_logger } from '../logger/context.js';
import {
  validate_file,
  file_to_base64,
  get_mime_type,
  generate_file_no,
  is_image_file,
} from '../utils/file_utils.js';

export interface UseNotesFileUploadOptions {
  /** Reference ID for the notes */
  ref_id: string;
  /** API endpoint for file uploads */
  api_endpoint?: string;
  /** Maximum file size in MB */
  max_file_size_mb?: number;
  /** Allowed file types */
  allowed_file_types?: string[];
  /** Storage mode: jsonb (client-side encoding) or filesystem (server upload) */
  storage_mode?: 'jsonb' | 'filesystem';
}

export interface UseNotesFileUploadResult {
  /** Files pending to be attached to a note */
  pending_files: NoteFile[];
  /** Upload a file */
  upload_file: (file: File, embed_type?: 'embed' | 'attachment') => Promise<NoteFile | null>;
  /** Remove a pending file */
  remove_file: (file_no: string) => void;
  /** Clear all pending files */
  clear_files: () => void;
  /** Loading state */
  uploading: boolean;
  /** Error message */
  error: string | null;
  /** Clear error */
  clear_error: () => void;
}

const DEFAULT_MAX_FILE_SIZE_MB = 10;
const DEFAULT_ALLOWED_TYPES = ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'doc', 'docx'];

/**
 * Hook for handling file uploads for notes
 *
 * @param options - Configuration options
 * @returns File upload state and methods
 *
 * @example
 * ```tsx
 * const { pending_files, upload_file, remove_file } = use_notes_file_upload({
 *   ref_id: 'my-ref-id',
 *   max_file_size_mb: 5,
 * });
 *
 * const handleFileSelect = async (file: File) => {
 *   const uploaded = await upload_file(file, 'attachment');
 *   if (uploaded) {
 *     console.log('File uploaded:', uploaded.filename);
 *   }
 * };
 * ```
 */
export function use_notes_file_upload(options: UseNotesFileUploadOptions): UseNotesFileUploadResult {
  const {
    ref_id,
    api_endpoint = '/api/hazo_notes/files/upload',
    max_file_size_mb = DEFAULT_MAX_FILE_SIZE_MB,
    allowed_file_types = DEFAULT_ALLOWED_TYPES,
    storage_mode = 'jsonb',
  } = options;

  const logger = use_logger();
  const [pending_files, set_pending_files] = useState<NoteFile[]>([]);
  const [uploading, set_uploading] = useState(false);
  const [error, set_error] = useState<string | null>(null);

  // Upload a file
  const upload_file = useCallback(
    async (file: File, embed_type?: 'embed' | 'attachment'): Promise<NoteFile | null> => {
      set_error(null);

      // Validate file
      const validation = validate_file(file, {
        max_size_mb: max_file_size_mb,
        allowed_types: allowed_file_types,
      });

      if (!validation.valid) {
        set_error(validation.error || 'Invalid file');
        return null;
      }

      // Auto-determine embed type based on file type
      const actual_embed_type = embed_type || (is_image_file(file.name) ? 'embed' : 'attachment');

      set_uploading(true);

      try {
        let note_file: NoteFile;

        if (storage_mode === 'filesystem') {
          // Upload to server
          const formData = new FormData();
          formData.append('file', file);
          formData.append('ref_id', ref_id);
          formData.append('embed_type', actual_embed_type);

          const response = await fetch(api_endpoint, {
            method: 'POST',
            credentials: 'include',
            body: formData,
          });

          const data: FileUploadApiResponse = await response.json();

          if (!data.success || !data.file) {
            throw new Error(data.error || 'Upload failed');
          }

          note_file = data.file;
        } else {
          // JSONB mode - encode on client
          const base64_data = await file_to_base64(file);
          const file_no = generate_file_no(pending_files);

          note_file = {
            file_no,
            embed_type: actual_embed_type,
            filename: file.name,
            filedata: base64_data,
            mime_type: get_mime_type(file.name),
            file_size: file.size,
          };
        }

        // Add to pending files
        set_pending_files((prev) => [...prev, note_file]);

        logger.debug('[use_notes_file_upload] File uploaded', {
          filename: file.name,
          file_no: note_file.file_no,
          embed_type: actual_embed_type,
        });

        return note_file;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed';
        set_error(message);
        logger.error('[use_notes_file_upload] Upload error', { error: message });
        return null;
      } finally {
        set_uploading(false);
      }
    },
    [ref_id, api_endpoint, max_file_size_mb, allowed_file_types, storage_mode, pending_files, logger]
  );

  // Remove a pending file
  const remove_file = useCallback((file_no: string) => {
    set_pending_files((prev) => prev.filter((f) => f.file_no !== file_no));
  }, []);

  // Clear all pending files
  const clear_files = useCallback(() => {
    set_pending_files([]);
  }, []);

  // Clear error
  const clear_error = useCallback(() => {
    set_error(null);
  }, []);

  return {
    pending_files,
    upload_file,
    remove_file,
    clear_files,
    uploading,
    error,
    clear_error,
  };
}
