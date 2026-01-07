/**
 * Notes API Handler Factory
 *
 * Creates GET and POST handlers for the /api/hazo_notes/[ref_id] endpoint.
 * These handlers should be used in a Next.js API route.
 *
 * @example
 * ```typescript
 * // app/api/hazo_notes/[ref_id]/route.ts
 * import { createNotesHandler } from 'hazo_notes/api';
 * import { getHazoConnectSingleton } from 'hazo_connect/nextjs/setup';
 *
 * export const dynamic = 'force-dynamic';
 *
 * const { GET, POST } = createNotesHandler({
 *   getHazoConnect: () => getHazoConnectSingleton(),
 *   getUserIdFromRequest: async (req) => {
 *     // Your auth logic here
 *     return userId;
 *   },
 *   getUserProfile: async (userId) => {
 *     // Your profile lookup logic here
 *     return { id: userId, name: 'User', email: 'user@example.com' };
 *   }
 * });
 *
 * export { GET, POST };
 * ```
 */

import { NextResponse } from 'next/server';
import type {
  CreateNotesHandlerOptions,
  NoteEntryDB,
  NoteEntry,
  HazoNotesRow,
  NotesApiResponse,
  AddNoteApiResponse,
  NoteFile,
} from '../types/index.js';

// ============================================================================
// Constants
// ============================================================================

/** Maximum note text length in characters */
const MAX_NOTE_TEXT_LENGTH = 10000;

/** Maximum files per note */
const DEFAULT_MAX_FILES_PER_NOTE = 5;

// ============================================================================
// Helper Functions
// ============================================================================

/** Generate a UUID v4 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Create a standardized error response */
function createErrorResponse(
  error: string,
  status: number
): NextResponse<NotesApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status }
  );
}

/** No-op logger */
const noopLogger = {
  error: () => {},
  warn: () => {},
  info: () => {},
  debug: () => {},
};

/**
 * Creates GET and POST handlers for notes
 *
 * @param options - Configuration options
 * @returns Object with GET and POST handlers
 */
export function createNotesHandler(options: CreateNotesHandlerOptions) {
  const { getHazoConnect, getLogger, getUserIdFromRequest, getUserProfile } = options;
  const logger = getLogger?.() || noopLogger;

  /**
   * GET handler - Fetch notes for a ref_id
   *
   * @param request - The incoming request
   * @param context - Route context with params
   */
  async function GET(
    request: Request,
    context: { params: Promise<{ ref_id: string }> }
  ): Promise<NextResponse<NotesApiResponse>> {
    try {
      const { ref_id } = await context.params;

      if (!ref_id) {
        return createErrorResponse('ref_id is required', 400);
      }

      logger.debug('[hazo_notes] GET request', { ref_id });

      const hazoConnect = await getHazoConnect();

      // Query the hazo_notes table using PostgREST-style query
      const result: HazoNotesRow[] = await hazoConnect.rawQuery(`/hazo_notes?ref_id=eq.${ref_id}`);

      if (!result || result.length === 0) {
        return NextResponse.json({
          success: true,
          notes: [],
          note_count: 0,
        });
      }

      const row = result[0];
      const notes_db: NoteEntryDB[] = Array.isArray(row.note) ? row.note : [];

      // Enrich notes with user profiles if getUserProfile is provided
      let notes: NoteEntry[];
      if (getUserProfile) {
        notes = await Promise.all(
          notes_db.map(async (note) => {
            const profile = await getUserProfile(note.userid).catch(() => null);
            return {
              ...note,
              user_name: profile?.name || 'Unknown User',
              user_email: profile?.email || '',
              user_avatar: profile?.profile_image,
            };
          })
        );
      } else {
        notes = notes_db.map((note) => ({
          ...note,
          user_name: 'Unknown User',
          user_email: '',
        }));
      }

      return NextResponse.json({
        success: true,
        notes,
        note_count: row.note_count,
      });
    } catch (error) {
      logger.error('[hazo_notes] GET error', {
        error: error instanceof Error ? error.message : String(error),
      });
      return createErrorResponse('Failed to fetch notes', 500);
    }
  }

  /**
   * POST handler - Add a new note
   *
   * @param request - The incoming request
   * @param context - Route context with params
   */
  async function POST(
    request: Request,
    context: { params: Promise<{ ref_id: string }> }
  ): Promise<NextResponse<AddNoteApiResponse>> {
    try {
      const { ref_id } = await context.params;

      if (!ref_id) {
        return NextResponse.json(
          { success: false, error: 'ref_id is required' },
          { status: 400 }
        );
      }

      // Get user ID from request
      const userId = getUserIdFromRequest
        ? await getUserIdFromRequest(request)
        : null;

      if (!userId) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized - user not authenticated' },
          { status: 401 }
        );
      }

      // Parse request body
      const body = await request.json();
      const { note_text, note_files } = body as {
        note_text: string;
        note_files?: NoteFile[];
      };

      // Validate note_text
      if (!note_text || typeof note_text !== 'string') {
        return NextResponse.json(
          { success: false, error: 'note_text is required' },
          { status: 400 }
        );
      }

      if (note_text.length > MAX_NOTE_TEXT_LENGTH) {
        return NextResponse.json(
          {
            success: false,
            error: `note_text exceeds maximum length of ${MAX_NOTE_TEXT_LENGTH} characters`,
          },
          { status: 400 }
        );
      }

      // Validate note_files if provided
      if (note_files) {
        if (!Array.isArray(note_files)) {
          return NextResponse.json(
            { success: false, error: 'note_files must be an array' },
            { status: 400 }
          );
        }

        if (note_files.length > DEFAULT_MAX_FILES_PER_NOTE) {
          return NextResponse.json(
            {
              success: false,
              error: `Maximum ${DEFAULT_MAX_FILES_PER_NOTE} files per note allowed`,
            },
            { status: 400 }
          );
        }
      }

      logger.debug('[hazo_notes] POST request', { ref_id, userId });

      const hazoConnect = await getHazoConnect();

      // Create new note entry
      const new_note: NoteEntryDB = {
        userid: userId,
        created_at: new Date().toISOString(),
        note_text: note_text.trim(),
        note_files: note_files || undefined,
      };

      // Check if row exists for this ref_id
      const existing: HazoNotesRow[] = await hazoConnect.rawQuery(`/hazo_notes?ref_id=eq.${ref_id}`);

      let updated_count: number;

      if (!existing || existing.length === 0) {
        // Create new row with first note
        const new_id = generateUUID();
        await hazoConnect.rawQuery('/hazo_notes', {
          method: 'POST',
          body: JSON.stringify({
            id: new_id,
            ref_id,
            note: [new_note],
            note_count: 1,
          }),
          headers: { 'Content-Type': 'application/json' },
        });
        updated_count = 1;
      } else {
        // Append to existing notes array
        const row = existing[0];
        const existing_notes = Array.isArray(row.note) ? row.note : [];
        const updated_notes = [...existing_notes, new_note];
        updated_count = updated_notes.length;

        await hazoConnect.rawQuery(`/hazo_notes?id=eq.${row.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            note: updated_notes,
            note_count: updated_count,
            changed_at: new Date().toISOString(),
          }),
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Get user profile for response
      const profile = getUserProfile
        ? await getUserProfile(userId).catch(() => null)
        : null;

      const enriched_note: NoteEntry = {
        ...new_note,
        user_name: profile?.name || 'Unknown User',
        user_email: profile?.email || '',
        user_avatar: profile?.profile_image,
      };

      return NextResponse.json({
        success: true,
        note: enriched_note,
        note_count: updated_count,
      });
    } catch (error) {
      logger.error('[hazo_notes] POST error', {
        error: error instanceof Error ? error.message : String(error),
      });
      return NextResponse.json(
        { success: false, error: 'Failed to add note' },
        { status: 500 }
      );
    }
  }

  return { GET, POST };
}
