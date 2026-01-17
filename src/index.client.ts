/**
 * hazo_notes - Client-safe exports
 *
 * This is the default entry point for 'hazo_notes' imports
 * Contains only client-safe components, hooks, and types
 *
 * @packageDocumentation
 */

// Components
export * from './components/index.js';

// Hooks
export * from './hooks/index.js';

// Types (client-safe subset)
export type {
  NoteFile,
  NoteEntry,
  NoteEntryDB,
  NewNoteInput,
  NoteUserInfo,
  HazoNotesIconProps,
  HazoNotesPanelProps,
  HazoNotesEntryProps,
  HazoNotesFilePreviewProps,
  NotesApiResponse,
  AddNoteApiResponse,
  // UI component types for consuming apps
  PopoverComponents,
  SheetComponents,
} from './types/index.js';

// Logger (client-side)
export { LoggerProvider, use_logger, noop_logger } from './logger/index.js';
export type { Logger, LoggerProviderProps } from './logger/index.js';

// Utils (client-safe)
export { cn } from './utils/cn.js';
export {
  generate_file_no,
  file_to_base64,
  get_mime_type,
  is_allowed_file_type,
  is_image_file,
  format_file_size,
  parse_file_references,
  create_file_reference,
  validate_file,
} from './utils/file_utils.js';
