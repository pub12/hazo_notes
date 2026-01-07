/**
 * Files API Handler Factory
 *
 * Creates handlers for file upload and download operations.
 * Used for filesystem storage mode.
 *
 * @example
 * ```typescript
 * // app/api/hazo_notes/files/upload/route.ts
 * import { createFilesHandler } from 'hazo_notes/api';
 *
 * export const dynamic = 'force-dynamic';
 *
 * const { POST } = createFilesHandler({
 *   getHazoConnect: () => getHazoConnectSingleton(),
 *   getUserIdFromRequest: async (req) => userId,
 *   file_storage_mode: 'filesystem',
 *   file_storage_path: '/uploads/notes',
 *   max_file_size_mb: 10,
 *   allowed_file_types: ['pdf', 'png', 'jpg', 'jpeg', 'gif'],
 * });
 *
 * export { POST };
 * ```
 */

import { NextResponse } from 'next/server';
import type {
  CreateFilesHandlerOptions,
  NoteFile,
  FileUploadApiResponse,
  HazoNotesRow,
} from '../types/index.js';
import {
  get_mime_type,
  is_allowed_file_type,
  generate_file_no,
} from '../utils/file_utils.js';

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_MAX_FILE_SIZE_MB = 10;
const DEFAULT_ALLOWED_TYPES = ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'doc', 'docx'];

// ============================================================================
// Helper Functions
// ============================================================================

/** No-op logger */
const noopLogger = {
  error: () => {},
  warn: () => {},
  info: () => {},
  debug: () => {},
};

/** Create error response */
function createErrorResponse(
  error: string,
  status: number
): NextResponse<FileUploadApiResponse> {
  return NextResponse.json({ success: false, error }, { status });
}

/**
 * Creates file upload and download handlers
 *
 * @param options - Configuration options
 * @returns Object with POST (upload) and GET (download) handlers
 */
export function createFilesHandler(options: CreateFilesHandlerOptions) {
  const {
    getHazoConnect,
    getLogger,
    getUserIdFromRequest,
    file_storage_mode = 'jsonb',
    file_storage_path = '/uploads/notes',
    max_file_size_mb = DEFAULT_MAX_FILE_SIZE_MB,
    allowed_file_types = DEFAULT_ALLOWED_TYPES,
  } = options;

  const logger = getLogger?.() || noopLogger;
  const max_bytes = max_file_size_mb * 1024 * 1024;

  /**
   * POST handler - Upload a file
   *
   * Accepts multipart/form-data with:
   * - file: The file to upload
   * - ref_id: Reference ID for the notes
   * - embed_type: 'embed' or 'attachment'
   */
  async function POST(request: Request): Promise<NextResponse<FileUploadApiResponse>> {
    try {
      // Check authentication
      const userId = getUserIdFromRequest
        ? await getUserIdFromRequest(request)
        : null;

      if (!userId) {
        return createErrorResponse('Unauthorized', 401);
      }

      // Parse form data
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const ref_id = formData.get('ref_id') as string | null;
      const embed_type = (formData.get('embed_type') as 'embed' | 'attachment') || 'attachment';

      if (!file) {
        return createErrorResponse('No file provided', 400);
      }

      if (!ref_id) {
        return createErrorResponse('ref_id is required', 400);
      }

      // Validate file type
      if (!is_allowed_file_type(file.name, allowed_file_types)) {
        return createErrorResponse(
          `File type not allowed. Allowed types: ${allowed_file_types.join(', ')}`,
          400
        );
      }

      // Validate file size
      if (file.size > max_bytes) {
        return createErrorResponse(
          `File size exceeds maximum of ${max_file_size_mb} MB`,
          400
        );
      }

      logger.debug('[hazo_notes/files] Upload request', {
        filename: file.name,
        size: file.size,
        ref_id,
        embed_type,
        storage_mode: file_storage_mode,
      });

      // Generate file number
      const file_no = generate_file_no([]);

      let filedata: string;

      if (file_storage_mode === 'filesystem') {
        // Filesystem storage - save to disk and store path
        try {
          const fs = await import('fs/promises');
          const path = await import('path');

          // Create directory if it doesn't exist
          const upload_dir = path.join(process.cwd(), file_storage_path, ref_id);
          await fs.mkdir(upload_dir, { recursive: true });

          // Save file
          const safe_filename = `${file_no}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
          const file_path = path.join(upload_dir, safe_filename);
          const buffer = Buffer.from(await file.arrayBuffer());
          await fs.writeFile(file_path, buffer);

          // Store relative path
          filedata = `${file_storage_path}/${ref_id}/${safe_filename}`;

          logger.debug('[hazo_notes/files] File saved to filesystem', { path: filedata });
        } catch (error) {
          logger.error('[hazo_notes/files] Filesystem write error', {
            error: error instanceof Error ? error.message : String(error),
          });
          return createErrorResponse('Failed to save file', 500);
        }
      } else {
        // JSONB storage - convert to base64
        const buffer = await file.arrayBuffer();
        filedata = Buffer.from(buffer).toString('base64');
      }

      const note_file: NoteFile = {
        file_no,
        embed_type,
        filename: file.name,
        filedata,
        mime_type: get_mime_type(file.name),
        file_size: file.size,
      };

      return NextResponse.json({
        success: true,
        file: note_file,
      });
    } catch (error) {
      logger.error('[hazo_notes/files] Upload error', {
        error: error instanceof Error ? error.message : String(error),
      });
      return createErrorResponse('Failed to upload file', 500);
    }
  }

  /**
   * GET handler - Download a file (for filesystem storage mode)
   *
   * Query params:
   * - ref_id: Reference ID
   * - file_no: File number
   */
  async function GET(
    request: Request,
    context: { params: Promise<{ file_id?: string }> }
  ): Promise<NextResponse> {
    try {
      if (file_storage_mode !== 'filesystem') {
        return createErrorResponse(
          'File download only available for filesystem storage mode',
          400
        );
      }

      const url = new URL(request.url);
      const ref_id = url.searchParams.get('ref_id');
      const file_no = url.searchParams.get('file_no');

      if (!ref_id || !file_no) {
        return createErrorResponse('ref_id and file_no are required', 400);
      }

      // Get notes to find the file
      const hazoConnect = await getHazoConnect();
      const result: HazoNotesRow[] = await hazoConnect.rawQuery(`/hazo_notes?ref_id=eq.${ref_id}`);

      if (!result || result.length === 0) {
        return createErrorResponse('Notes not found', 404);
      }

      // Find the file in notes
      const notes = result[0].note || [];
      let file_info: NoteFile | null = null;

      for (const note of notes) {
        if (note.note_files) {
          const found = note.note_files.find((f: NoteFile) => f.file_no === file_no);
          if (found) {
            file_info = found;
            break;
          }
        }
      }

      if (!file_info) {
        return createErrorResponse('File not found', 404);
      }

      // Read file from filesystem
      const fs = await import('fs/promises');
      const path = await import('path');

      const file_path = path.join(process.cwd(), file_info.filedata);
      const buffer = await fs.readFile(file_path);

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': file_info.mime_type || 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${file_info.filename}"`,
          'Content-Length': String(buffer.length),
        },
      });
    } catch (error) {
      logger.error('[hazo_notes/files] Download error', {
        error: error instanceof Error ? error.message : String(error),
      });
      return createErrorResponse('Failed to download file', 500);
    }
  }

  return { GET, POST };
}
