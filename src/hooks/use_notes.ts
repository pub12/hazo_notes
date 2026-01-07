'use client';

/**
 * React hook for managing notes state and API interactions
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { NoteEntry, NoteFile, NotesApiResponse, AddNoteApiResponse } from '../types/index.js';
import { use_logger } from '../logger/context.js';

export interface UseNotesOptions {
  /** Skip initial fetch (for controlled mode) */
  skip?: boolean;
  /** API endpoint base path */
  api_endpoint?: string;
  /** Refresh interval in milliseconds (0 = disabled) */
  refresh_interval?: number;
}

export interface UseNotesResult {
  /** Array of notes */
  notes: NoteEntry[];
  /** Total note count */
  note_count: number;
  /** Loading state */
  loading: boolean;
  /** Error message */
  error: string | null;
  /** Add a new note */
  add_note: (note_text: string, note_files?: NoteFile[]) => Promise<boolean>;
  /** Refresh notes from server */
  refresh: () => Promise<void>;
  /** Reset error state */
  clear_error: () => void;
}

/**
 * Hook for fetching and managing notes
 *
 * @param ref_id - Reference ID for the notes
 * @param options - Configuration options
 * @returns Notes state and methods
 *
 * @example
 * ```tsx
 * const { notes, loading, add_note } = use_notes('my-ref-id');
 *
 * const handleAddNote = async () => {
 *   const success = await add_note('This is my note');
 *   if (success) {
 *     console.log('Note added!');
 *   }
 * };
 * ```
 */
export function use_notes(ref_id: string, options: UseNotesOptions = {}): UseNotesResult {
  const {
    skip = false,
    api_endpoint = '/api/hazo_notes',
    refresh_interval = 0,
  } = options;

  const logger = use_logger();
  const [notes, set_notes] = useState<NoteEntry[]>([]);
  const [note_count, set_note_count] = useState(0);
  const [loading, set_loading] = useState(!skip);
  const [error, set_error] = useState<string | null>(null);

  // Use ref to track if component is mounted
  const mounted_ref = useRef(true);

  // Fetch notes from API
  const fetch_notes = useCallback(async () => {
    if (skip || !ref_id) {
      set_loading(false);
      return;
    }

    set_loading(true);
    set_error(null);

    try {
      const response = await fetch(`${api_endpoint}/${ref_id}`, {
        credentials: 'include',
      });

      if (!mounted_ref.current) return;

      const data: NotesApiResponse = await response.json();

      if (data.success) {
        set_notes(data.notes || []);
        set_note_count(data.note_count || 0);
        logger.debug('[use_notes] Fetched notes', {
          ref_id,
          count: data.notes?.length || 0,
        });
      } else {
        set_error(data.error || 'Failed to fetch notes');
        logger.error('[use_notes] Fetch error', { ref_id, error: data.error });
      }
    } catch (err) {
      if (!mounted_ref.current) return;
      const message = err instanceof Error ? err.message : 'Failed to fetch notes';
      set_error(message);
      logger.error('[use_notes] Fetch exception', { ref_id, error: message });
    } finally {
      if (mounted_ref.current) {
        set_loading(false);
      }
    }
  }, [ref_id, skip, api_endpoint, logger]);

  // Initial fetch
  useEffect(() => {
    mounted_ref.current = true;
    fetch_notes();

    return () => {
      mounted_ref.current = false;
    };
  }, [fetch_notes]);

  // Refresh interval
  useEffect(() => {
    if (refresh_interval <= 0 || skip) return;

    const interval = setInterval(fetch_notes, refresh_interval);
    return () => clearInterval(interval);
  }, [refresh_interval, skip, fetch_notes]);

  // Add a new note
  const add_note = useCallback(
    async (note_text: string, note_files?: NoteFile[]): Promise<boolean> => {
      if (!ref_id) {
        set_error('ref_id is required');
        return false;
      }

      if (!note_text.trim()) {
        set_error('Note text cannot be empty');
        return false;
      }

      try {
        const response = await fetch(`${api_endpoint}/${ref_id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            note_text: note_text.trim(),
            note_files,
          }),
        });

        const data: AddNoteApiResponse = await response.json();

        if (data.success && data.note) {
          // Optimistic update
          set_notes((prev) => [...prev, data.note!]);
          set_note_count(data.note_count || notes.length + 1);
          logger.debug('[use_notes] Added note', { ref_id, note_count: data.note_count });
          return true;
        } else {
          set_error(data.error || 'Failed to add note');
          logger.error('[use_notes] Add note error', { ref_id, error: data.error });
          return false;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add note';
        set_error(message);
        logger.error('[use_notes] Add note exception', { ref_id, error: message });
        return false;
      }
    },
    [ref_id, api_endpoint, notes.length, logger]
  );

  // Clear error
  const clear_error = useCallback(() => {
    set_error(null);
  }, []);

  return {
    notes,
    note_count,
    loading,
    error,
    add_note,
    refresh: fetch_notes,
    clear_error,
  };
}
