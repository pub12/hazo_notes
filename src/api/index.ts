/**
 * API handlers for hazo_notes
 *
 * Factory functions for creating Next.js API route handlers
 */

export { createNotesHandler } from './create_notes_handler.js';
export { createFilesHandler } from './create_files_handler.js';

// Re-export types used in handlers
export type {
  CreateNotesHandlerOptions,
  CreateFilesHandlerOptions,
  NotesApiResponse,
  AddNoteApiResponse,
  FileUploadApiResponse,
} from '../types/index.js';
