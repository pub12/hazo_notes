/**
 * Type definitions for hazo_notes package
 */

/**
 * File attachment stored with a note
 */
export interface NoteFile {
  /** Reference ID used in note_text (e.g., "0001") */
  file_no: string;
  /** How to display: embed inline or as downloadable attachment */
  embed_type: 'embed' | 'attachment';
  /** Original filename */
  filename: string;
  /** Base64 data OR file path (based on storage mode) */
  filedata: string;
  /** MIME type for rendering */
  mime_type?: string;
  /** Size in bytes */
  file_size?: number;
}

/**
 * Note entry as stored in database JSONB
 */
export interface NoteEntryDB {
  /** UUID of user who created the note */
  userid: string;
  /** ISO timestamp when the note was created */
  created_at: string;
  /** Note content with optional embed/attach references */
  note_text: string;
  /** Optional array of attached files */
  note_files?: NoteFile[];
}

/**
 * Note entry enriched with user profile data (for display)
 */
export interface NoteEntry extends NoteEntryDB {
  /** User's display name */
  user_name: string;
  /** User's email address */
  user_email: string;
  /** User's avatar URL */
  user_avatar?: string;
}

/**
 * Database row structure for hazo_notes table
 */
export interface HazoNotesRow {
  /** UUID primary key */
  id: string;
  /** Reference to parent entity (e.g., form field, document) */
  ref_id: string;
  /** JSONB array of note entries */
  note: NoteEntryDB[];
  /** Row creation timestamp */
  created_at: string;
  /** Last modification timestamp */
  changed_at?: string;
  /** Denormalized count of notes */
  note_count: number;
}

/**
 * Input for creating a new note via API
 */
export interface NewNoteInput {
  /** Note text content */
  note_text: string;
  /** Optional file attachments */
  note_files?: NoteFile[];
}

/**
 * User information for note attribution
 */
export interface NoteUserInfo {
  /** User ID (UUID) */
  id: string;
  /** User's display name */
  name: string;
  /** User's email address */
  email: string;
  /** User's profile image URL */
  profile_image?: string;
}

/**
 * Configuration structure from INI file
 */
export interface HazoNotesConfig {
  ui: {
    /** Background color for notes panel (Tailwind class) */
    background_color: string;
    /** Panel presentation style */
    panel_style: 'popover' | 'slide_panel';
    /** Save behavior: explicit (save/cancel buttons) | auto (save on blur) */
    save_mode: 'explicit' | 'auto';
  };
  storage: {
    /** File storage mode: jsonb (in database) | filesystem (on server) */
    file_storage_mode: 'jsonb' | 'filesystem';
    /** Path for filesystem storage */
    file_storage_path: string;
  };
  files: {
    /** Maximum file size in MB */
    max_file_size_mb: number;
    /** Allowed file types (extensions) */
    allowed_file_types: string[];
    /** Maximum files per single note entry */
    max_files_per_note: number;
  };
  logging: {
    /** Log file path */
    logfile: string;
  };
}

/**
 * Props for HazoNotesIcon component
 */
export interface HazoNotesIconProps {
  /** UUID reference to parent entity */
  ref_id: string;
  /** Label shown in panel header */
  label?: string;
  /** Show indicator when notes exist */
  has_notes?: boolean;
  /** Display count badge */
  note_count?: number;

  // Controlled mode props
  /** Controlled notes array */
  notes?: NoteEntry[];
  /** Callback when notes change */
  on_notes_change?: (notes: NoteEntry[]) => void;

  /** User context (auto-fetched if not provided) */
  current_user?: NoteUserInfo;

  // Configuration overrides
  /** UI presentation style */
  panel_style?: 'popover' | 'slide_panel';
  /** Save behavior */
  save_mode?: 'explicit' | 'auto';
  /** Notes panel background color (Tailwind class) */
  background_color?: string;

  // File options
  /** Enable file attachments */
  enable_files?: boolean;
  /** Maximum files per note */
  max_files_per_note?: number;
  /** Allowed file types */
  allowed_file_types?: string[];
  /** Maximum file size in MB */
  max_file_size_mb?: number;

  // Callbacks
  /** Called when panel opens */
  on_open?: () => void;
  /** Called when panel closes */
  on_close?: () => void;

  // Styling
  /** Disable the notes icon */
  disabled?: boolean;
  /** Additional CSS class names */
  className?: string;
  /** Icon button size in pixels (default: 36) */
  icon_size?: number;
  /** Whether to show border around the icon button (default: true) */
  show_border?: boolean;
}

/**
 * Props for HazoNotesPanel component
 */
export interface HazoNotesPanelProps {
  /** UUID reference to parent entity */
  ref_id: string;
  /** Label shown in panel header */
  label?: string;
  /** Array of notes to display */
  notes: NoteEntry[];
  /** Callback to add a new note */
  on_add_note: (note: NewNoteInput) => Promise<void>;
  /** Callback when panel closes */
  on_close?: () => void;
  /** Current user info (null if not logged in) */
  current_user: NoteUserInfo | null;
  /** Save behavior */
  save_mode: 'explicit' | 'auto';
  /** Background color (Tailwind class) */
  background_color: string;
  /** Loading state */
  loading?: boolean;
  /** Error message */
  error?: string;
  /** Enable file attachments */
  enable_files?: boolean;
  /** Maximum files per note */
  max_files_per_note?: number;
  /** Allowed file types */
  allowed_file_types?: string[];
  /** Maximum file size in MB */
  max_file_size_mb?: number;
  /** ProfileStamp component (dynamically loaded) */
  ProfileStampComponent?: React.ComponentType<any> | null;
}

/**
 * Props for HazoNotesEntry component
 */
export interface HazoNotesEntryProps {
  /** The note entry to display */
  note: NoteEntry;
  /** ProfileStamp component for avatar */
  ProfileStampComponent?: React.ComponentType<any> | null;
}

/**
 * Props for HazoNotesFilePreview component
 */
export interface HazoNotesFilePreviewProps {
  /** The file to preview */
  file: NoteFile;
  /** Whether to render inline (embed) or as download link */
  display_mode: 'embed' | 'attachment';
}

/**
 * API handler factory options
 */
export interface CreateNotesHandlerOptions {
  /** Function to get hazo_connect adapter */
  getHazoConnect: () => Promise<any> | any;
  /** Function to get logger instance */
  getLogger?: () => any;
  /** Function to extract user ID from request */
  getUserIdFromRequest?: (req: Request) => Promise<string | null>;
  /** Function to get user profile by ID */
  getUserProfile?: (userId: string) => Promise<NoteUserInfo | null>;
}

/**
 * API handler factory options for file operations
 */
export interface CreateFilesHandlerOptions {
  /** Function to get hazo_connect adapter */
  getHazoConnect: () => Promise<any> | any;
  /** Function to get logger instance */
  getLogger?: () => any;
  /** Function to extract user ID from request */
  getUserIdFromRequest?: (req: Request) => Promise<string | null>;
  /** File storage mode */
  file_storage_mode?: 'jsonb' | 'filesystem';
  /** Path for filesystem storage */
  file_storage_path?: string;
  /** Maximum file size in MB */
  max_file_size_mb?: number;
  /** Allowed file types */
  allowed_file_types?: string[];
}

/**
 * API response for fetching notes
 */
export interface NotesApiResponse {
  success: boolean;
  notes?: NoteEntry[];
  note_count?: number;
  error?: string;
}

/**
 * API response for adding a note
 */
export interface AddNoteApiResponse {
  success: boolean;
  note?: NoteEntry;
  note_count?: number;
  error?: string;
}

/**
 * API response for file upload
 */
export interface FileUploadApiResponse {
  success: boolean;
  file?: NoteFile;
  error?: string;
}
