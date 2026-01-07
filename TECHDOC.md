# Technical Documentation - hazo_notes

Comprehensive technical reference for developers and maintainers of the hazo_notes package.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [File Structure](#file-structure)
3. [Data Flow](#data-flow)
4. [Component Architecture](#component-architecture)
5. [API Design](#api-design)
6. [Database Design](#database-design)
7. [Type System](#type-system)
8. [Configuration System](#configuration-system)
9. [Logger Architecture](#logger-architecture)
10. [File Handling](#file-handling)
11. [Security Model](#security-model)
12. [Performance Optimization](#performance-optimization)
13. [Testing Strategy](#testing-strategy)
14. [Deployment Considerations](#deployment-considerations)

## Architecture Overview

### System Context

```
┌─────────────────┐
│  Next.js App    │
│                 │
│  ┌───────────┐  │
│  │Component  │  │──┐
│  │  Layer    │  │  │
│  └───────────┘  │  │
│                 │  │
│  ┌───────────┐  │  │ hazo_notes Package
│  │   API     │  │  │
│  │  Routes   │  │  │
│  └───────────┘  │  │
└─────────────────┘  │
        │            │
        ▼            │
┌─────────────────┐  │
│  hazo_connect   │◄─┘
│  (Database)     │
└─────────────────┘
        │
        ▼
┌─────────────────┐
│  PostgreSQL /   │
│     SQLite      │
└─────────────────┘
```

### Package Exports Structure

```
hazo_notes/
├── index (default)         → Client components, hooks, LoggerProvider
├── api                     → createNotesHandler, createFilesHandler
├── hooks                   → use_notes, use_notes_file_upload
├── components              → All React components
├── lib                     → get_config, set_server_logger (server-only)
└── types                   → All TypeScript interfaces
```

### Design Principles

1. **Separation of Concerns**: Client and server code strictly separated via exports
2. **Zero Configuration**: Works with sensible defaults, configuration optional
3. **Dependency Injection**: API handlers use factory pattern for flexibility
4. **Progressive Enhancement**: Core features work without optional dependencies
5. **Type Safety**: Full TypeScript coverage with exported types
6. **Performance First**: Minimal bundle size, dynamic imports for heavy dependencies

## File Structure

```
hazo_notes/
├── src/
│   ├── api/
│   │   ├── create_notes_handler.ts      # GET/POST handler factory
│   │   ├── create_files_handler.ts      # File upload handler factory
│   │   └── index.ts                     # API exports
│   │
│   ├── components/
│   │   ├── hazo_notes_icon.tsx          # Main trigger component
│   │   ├── hazo_notes_panel.tsx         # Notes panel UI
│   │   ├── hazo_notes_entry.tsx         # Single note display
│   │   ├── hazo_notes_file_preview.tsx  # File rendering
│   │   └── index.ts                     # Component exports
│   │
│   ├── hooks/
│   │   ├── use_notes.ts                 # Notes state management
│   │   ├── use_notes_file_upload.ts     # File upload logic
│   │   └── index.ts                     # Hook exports
│   │
│   ├── lib/
│   │   ├── config.ts                    # INI config management
│   │   └── index.ts                     # Library exports
│   │
│   ├── logger/
│   │   ├── context.tsx                  # React context for client logger
│   │   ├── server.ts                    # Server logger singleton
│   │   ├── types.ts                     # Logger interfaces
│   │   └── index.ts                     # Logger exports
│   │
│   ├── types/
│   │   └── index.ts                     # All TypeScript interfaces
│   │
│   ├── utils/
│   │   ├── cn.ts                        # Tailwind class merging
│   │   ├── file_utils.ts                # File validation & encoding
│   │   └── index.ts                     # Utility exports
│   │
│   ├── index.client.ts                  # Client-safe exports
│   └── index.ts                         # All exports
│
├── migrations/
│   └── 001_create_hazo_notes_table.sql  # Database schema
│
├── templates/
│   └── config/
│       └── hazo_notes_config.ini        # Config template
│
├── test-app/                            # Development test application
│   ├── app/
│   │   ├── api/hazo_notes/[ref_id]/     # Example API route
│   │   ├── notes/                       # Test scenarios
│   │   └── layout.tsx                   # Root layout with providers
│   ├── components/ui/                   # shadcn/ui components
│   ├── config/                          # Test app config
│   ├── data/                            # SQLite database
│   └── scripts/                         # Database initialization
│
├── package.json                         # Package metadata
├── tsconfig.json                        # TypeScript config (development)
└── tsconfig.build.json                  # TypeScript config (build)
```

## Data Flow

### Note Creation Flow

```
┌─────────────┐
│   User      │
│  Clicks     │
│  Icon       │
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│  HazoNotesIcon   │ ◄─── Loads UI components dynamically
│                  │      (Popover or Sheet)
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ HazoNotesPanel   │
│                  │
│ ┌──────────────┐ │
│ │   use_notes  │ │ ◄─── Fetches existing notes
│ └──────────────┘ │
│                  │
│ User types note  │
│ and clicks Save  │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  add_note()      │ ◄─── Validates input
│                  │      Calls API
└──────┬───────────┘
       │
       ▼
┌──────────────────────────┐
│  POST /api/hazo_notes/   │
│       [ref_id]           │
│                          │
│ ┌──────────────────────┐ │
│ │ createNotesHandler   │ │
│ │                      │ │
│ │ 1. Authenticate user │ │
│ │ 2. Validate input    │ │
│ │ 3. Create note entry │ │
│ │ 4. Update database   │ │
│ │ 5. Enrich with user  │ │
│ │    profile           │ │
│ └──────────────────────┘ │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────┐
│  hazo_connect    │
│  rawQuery()      │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│    Database      │
│                  │
│ hazo_notes table │
│   INSERT/UPDATE  │
└──────────────────┘
```

### File Upload Flow (JSONB Mode)

```
┌─────────────┐
│   User      │
│   Pastes    │
│   Image     │
└──────┬──────┘
       │
       ▼
┌──────────────────────────┐
│  use_notes_file_upload   │
│                          │
│  1. Validate file        │
│  2. Convert to Base64    │
│  3. Generate file_no     │
│  4. Create NoteFile      │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────┐
│  pending_files   │ ◄─── Stored in component state
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  User saves note │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│   add_note()     │
│   with files     │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│    Database      │
│                  │
│  Files stored    │
│  in note JSONB   │
└──────────────────┘
```

## Component Architecture

### HazoNotesIcon Component Lifecycle

```typescript
// Mount
useEffect(() => {
  // 1. Load UI components (Popover/Sheet)
  loadUIComponents();

  // 2. Load ProfileStamp (optional)
  loadProfileStamp();

  // 3. Load HazoNotesPanel
  loadPanel();

  // 4. Fetch user info if not provided
  if (!current_user) fetchUserInfo();
}, []);

// State Management
const notes = controlled_notes ?? fetched_notes;  // Controlled/Uncontrolled
const [is_open, set_is_open] = useState(false);    // Panel open state

// Render
if (panel_style === 'popover') {
  return <Popover>...</Popover>
} else {
  return <Sheet>...</Sheet>
}
```

### Component Composition Pattern

```typescript
// Dynamic component loading prevents hard dependencies
const [PopoverComponents, setPopoverComponents] = useState<{
  Popover: ComponentType;
  PopoverTrigger: ComponentType;
  PopoverContent: ComponentType;
} | null>(null);

useEffect(() => {
  import('@/components/ui/popover').then(module => {
    setPopoverComponents({
      Popover: module.Popover,
      PopoverTrigger: module.PopoverTrigger,
      PopoverContent: module.PopoverContent,
    });
  });
}, []);
```

### State Management Patterns

**Uncontrolled Mode** (default):
```typescript
const { notes, add_note } = use_notes(ref_id);
// Component manages its own state
```

**Controlled Mode**:
```typescript
<HazoNotesIcon
  notes={notes}
  on_notes_change={setNotes}
/>
// Parent manages state
```

## API Design

### Handler Factory Pattern

```typescript
interface CreateNotesHandlerOptions {
  getHazoConnect: () => Promise<any> | any;
  getLogger?: () => any;
  getUserIdFromRequest?: (req: Request) => Promise<string | null>;
  getUserProfile?: (userId: string) => Promise<NoteUserInfo | null>;
}

export function createNotesHandler(options: CreateNotesHandlerOptions) {
  const { getHazoConnect, getUserIdFromRequest, getUserProfile } = options;

  async function GET(req: Request, context: Context): Promise<NextResponse> {
    // Implementation
  }

  async function POST(req: Request, context: Context): Promise<NextResponse> {
    // Implementation
  }

  return { GET, POST };
}
```

### API Endpoints

**GET `/api/hazo_notes/[ref_id]`**

Request:
```
GET /api/hazo_notes/customer-123
```

Response:
```json
{
  "success": true,
  "notes": [
    {
      "userid": "user-uuid",
      "user_name": "John Doe",
      "user_email": "john@example.com",
      "user_avatar": "/avatars/john.png",
      "created_at": "2026-01-07T12:30:00.000Z",
      "note_text": "Customer requested callback",
      "note_files": []
    }
  ],
  "note_count": 1
}
```

**POST `/api/hazo_notes/[ref_id]`**

Request:
```json
{
  "note_text": "Follow-up scheduled for Monday",
  "note_files": [
    {
      "file_no": "0001",
      "embed_type": "attachment",
      "filename": "schedule.pdf",
      "filedata": "base64_data_here",
      "mime_type": "application/pdf",
      "file_size": 12345
    }
  ]
}
```

Response:
```json
{
  "success": true,
  "note": {
    "userid": "user-uuid",
    "user_name": "John Doe",
    "user_email": "john@example.com",
    "created_at": "2026-01-07T13:00:00.000Z",
    "note_text": "Follow-up scheduled for Monday",
    "note_files": [...]
  },
  "note_count": 2
}
```

### Error Handling

All API responses follow consistent structure:

```typescript
// Success
{ success: true, notes: [...], note_count: 5 }

// Error
{ success: false, error: "Error message" }
```

HTTP Status Codes:
- `200` - Success
- `400` - Bad request (validation failed)
- `401` - Unauthorized (authentication required)
- `500` - Server error

## Database Design

### Schema

```sql
CREATE TABLE hazo_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_id UUID NOT NULL,
  note JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  changed_at TIMESTAMPTZ,
  note_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_hazo_notes_ref_id ON hazo_notes(ref_id);
```

### JSONB Structure

```jsonb
[
  {
    "userid": "550e8400-e29b-41d4-a716-446655440000",
    "created_at": "2026-01-07T12:30:00.000Z",
    "note_text": "This is the note content",
    "note_files": [
      {
        "file_no": "0001",
        "embed_type": "embed",
        "filename": "screenshot.png",
        "filedata": "data:image/png;base64,...",
        "mime_type": "image/png",
        "file_size": 12345
      }
    ]
  }
]
```

### Query Patterns

**Fetch notes**:
```typescript
const result = await hazoConnect.rawQuery(`/hazo_notes?ref_id=eq.${ref_id}`);
```

**Create new note row**:
```typescript
await hazoConnect.rawQuery('/hazo_notes', {
  method: 'POST',
  body: JSON.stringify({
    id: generateUUID(),
    ref_id,
    note: [new_note],
    note_count: 1,
  }),
});
```

**Append to existing notes**:
```typescript
await hazoConnect.rawQuery(`/hazo_notes?id=eq.${row.id}`, {
  method: 'PATCH',
  body: JSON.stringify({
    note: [...existing_notes, new_note],
    note_count: updated_count,
    changed_at: new Date().toISOString(),
  }),
});
```

### Indexing Strategy

1. **Primary Index**: `id` (UUID, auto-created)
2. **Lookup Index**: `ref_id` - Critical for note retrieval
3. **No JSONB indexes**: Small note arrays don't benefit from GIN indexes

### Data Integrity

- `ref_id` is NOT a foreign key - intentionally flexible
- `note_count` is denormalized for performance
- `changed_at` tracks last modification
- JSONB array allows infinite notes per ref_id

## Type System

### Core Types

```typescript
// Database storage format
interface NoteEntryDB {
  userid: string;
  created_at: string;
  note_text: string;
  note_files?: NoteFile[];
}

// Display format (enriched with user data)
interface NoteEntry extends NoteEntryDB {
  user_name: string;
  user_email: string;
  user_avatar?: string;
}

// File attachment
interface NoteFile {
  file_no: string;
  embed_type: 'embed' | 'attachment';
  filename: string;
  filedata: string;
  mime_type?: string;
  file_size?: number;
}
```

### Type Safety Patterns

**Strict typing for API responses**:
```typescript
interface NotesApiResponse {
  success: boolean;
  notes?: NoteEntry[];
  note_count?: number;
  error?: string;
}
```

**Discriminated unions for state**:
```typescript
type SaveMode = 'explicit' | 'auto';
type PanelStyle = 'popover' | 'slide_panel';
type FileStorageMode = 'jsonb' | 'filesystem';
```

## Configuration System

### Config File Loading

```typescript
// 1. Look in application root: process.cwd()/config/hazo_notes_config.ini
// 2. Fallback to package root: __dirname/../../config/hazo_notes_config.ini
// 3. Return null if not found (use defaults)

const config = new HazoConfig({ filePath: config_path });
```

### Configuration Hierarchy

1. **Component props** (highest priority)
2. **Config file** (middle priority)
3. **Hard-coded defaults** (lowest priority)

```typescript
const background_color =
  props.background_color ||           // Component prop
  get_config('ui', 'background_color') || // Config file
  'bg-yellow-100';                     // Default
```

### Config Validation

```typescript
// Type-safe config parsing
export function get_notes_config(): HazoNotesConfig {
  return {
    ui: {
      background_color: get_config('ui', 'background_color') || 'bg-yellow-100',
      panel_style: (get_config('ui', 'panel_style') as 'popover' | 'slide_panel') || 'popover',
      save_mode: (get_config('ui', 'save_mode') as 'explicit' | 'auto') || 'explicit',
    },
    // ... more config sections
  };
}
```

## Logger Architecture

### Dual Logger Pattern

**Client Logger** (React Context):
```typescript
const LoggerContext = createContext<Logger | null>(null);

export function LoggerProvider({ logger, children }) {
  return <LoggerContext.Provider value={logger}>{children}</LoggerContext.Provider>;
}

export function use_logger(): Logger {
  const logger = useContext(LoggerContext);
  return logger || noop_logger; // Graceful degradation
}
```

**Server Logger** (Singleton):
```typescript
let server_logger: Logger | null = null;

export function set_server_logger(logger: Logger) {
  server_logger = logger;
}

export function get_server_logger(): Logger {
  return server_logger || noop_logger;
}
```

### Logger Interface

```typescript
interface Logger {
  debug(message: string, meta?: Record<string, any>): void;
  info(message: string, meta?: Record<string, any>): void;
  warn(message: string, meta?: Record<string, any>): void;
  error(message: string, meta?: Record<string, any>): void;
}
```

## File Handling

### File Validation

```typescript
export function validate_file(file: File, options: {
  max_size_mb: number;
  allowed_types: string[];
}): { valid: boolean; error?: string } {
  // 1. Check file size
  const max_bytes = options.max_size_mb * 1024 * 1024;
  if (file.size > max_bytes) {
    return { valid: false, error: `File too large (max ${options.max_size_mb}MB)` };
  }

  // 2. Check file extension
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!ext || !options.allowed_types.includes(ext)) {
    return { valid: false, error: 'File type not allowed' };
  }

  return { valid: true };
}
```

### Base64 Encoding

```typescript
export function file_to_base64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
```

### File Reference Parsing

```typescript
// Parse <<embed:0001>> and <<attach:0001>> in note text
const fileRefRegex = /<<(embed|attach):(\d+)>>/g;

note_text.replace(fileRefRegex, (match, type, file_no) => {
  const file = note_files.find(f => f.file_no === file_no);
  return renderFilePreview(file, type);
});
```

## Security Model

### Authentication Flow

```typescript
async function POST(req: Request) {
  // 1. Extract user ID from request
  const userId = await getUserIdFromRequest(req);

  // 2. Reject if not authenticated
  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // 3. Proceed with authenticated request
  // ...
}
```

### Input Validation

```typescript
// Note text length limit
const MAX_NOTE_TEXT_LENGTH = 10000;

if (note_text.length > MAX_NOTE_TEXT_LENGTH) {
  return { success: false, error: 'Note too long' };
}

// File count limit
const DEFAULT_MAX_FILES_PER_NOTE = 5;

if (note_files && note_files.length > DEFAULT_MAX_FILES_PER_NOTE) {
  return { success: false, error: 'Too many files' };
}
```

### SQL Injection Prevention

Uses PostgREST-style queries with URL encoding:

```typescript
// Safe - ref_id is URL-encoded
await hazoConnect.rawQuery(`/hazo_notes?ref_id=eq.${ref_id}`);

// Safe - JSON.stringify escapes values
await hazoConnect.rawQuery('/hazo_notes', {
  method: 'POST',
  body: JSON.stringify({ note: [new_note] }),
});
```

### XSS Prevention

- File references are parsed, not executed
- User content is rendered in React (auto-escaped)
- Base64 data URLs are browser-validated

## Performance Optimization

### Bundle Size Optimization

1. **Dynamic imports** for heavy dependencies:
```typescript
const popoverModule = await import('@/components/ui/popover');
```

2. **Tree-shaking friendly** exports:
```typescript
export { HazoNotesIcon } from './components/hazo_notes_icon.js';
export { use_notes } from './hooks/use_notes.js';
```

3. **Minimal dependencies**:
   - `clsx`: 1KB
   - `tailwind-merge`: 8KB
   - `hazo_config`: ~5KB

### Database Performance

1. **Indexed lookups**: `ref_id` index for O(log n) retrieval
2. **Denormalized count**: Avoid parsing JSONB for count
3. **Single row per ref_id**: Minimize database roundtrips
4. **JSONB efficiency**: PostgreSQL JSONB is binary format (fast)

### Client Performance

1. **Optimistic updates**: Update UI before server response
2. **Debounced auto-save**: Prevent API spam
3. **Lazy loading**: Components loaded on-demand
4. **Memoization**: React hooks prevent unnecessary re-renders

## Testing Strategy

### Unit Testing

**Utility functions**:
```typescript
describe('file_utils', () => {
  it('validates file size', () => {
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const result = validate_file(file, { max_size_mb: 1, allowed_types: ['pdf'] });
    expect(result.valid).toBe(true);
  });
});
```

### Integration Testing

**API handlers**:
```typescript
describe('createNotesHandler', () => {
  it('creates a note successfully', async () => {
    const handler = createNotesHandler({
      getHazoConnect: () => mockHazoConnect,
      getUserIdFromRequest: async () => 'user-123',
    });

    const response = await handler.POST(mockRequest, mockContext);
    expect(response.status).toBe(200);
  });
});
```

### Manual Testing

Use test-app scenarios:
- Basic note creation
- File attachments
- Controlled mode
- Auto-save mode
- Multiple instances

## Deployment Considerations

### Environment Setup

**Production**:
- PostgreSQL database
- `hazo_connect` configured
- Config file at `config/hazo_notes_config.ini`
- Authentication integrated

**Development**:
- SQLite database (via test-app)
- Local config file
- Mock authentication

### Migration Strategy

1. **Create database table** using migration script
2. **Deploy package** to production
3. **Add API routes** to application
4. **Configure authentication** handlers
5. **Add components** to pages
6. **Test thoroughly** before going live

### Monitoring

Log key events:
```typescript
logger.info('[hazo_notes] Note created', {
  ref_id,
  user_id: userId,
  note_count: updated_count,
});
```

Monitor:
- Note creation rate
- File upload sizes
- API error rates
- Database query performance

### Scaling Considerations

**Vertical scaling**:
- JSONB storage efficient up to ~100 notes per ref_id
- Consider pagination for large note sets

**Horizontal scaling**:
- Stateless API handlers (scale easily)
- Database connection pooling via hazo_connect
- CDN for file attachments (filesystem mode)

**Database optimization**:
- Use filesystem mode for large files
- Archive old notes if needed
- Partition table by date if very high volume
