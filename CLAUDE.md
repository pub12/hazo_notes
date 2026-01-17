# CLAUDE.md - hazo_notes Package

## Package Overview

`hazo_notes` is a database-backed notes system for the hazo ecosystem. It provides reusable React components for adding contextual notes with file attachments to any UI element. Originally extracted from `hazo_collab_forms`, it now serves as a standalone package for any Next.js application.

**Key Value Proposition**: Drop-in notes functionality with zero backend coding - just add the component and API route handlers.

## Architecture

### Entry Points

The package uses modular exports to separate client and server code:

- `hazo_notes` - Client-safe exports (components, hooks, types)
- `hazo_notes/api` - Server-side API handler factories
- `hazo_notes/lib` - Server-side utilities (config, logger)
- `hazo_notes/hooks` - React hooks (`use_notes`, `use_notes_file_upload`)
- `hazo_notes/components` - React components
- `hazo_notes/types` - TypeScript interfaces

### Component Hierarchy

```
HazoNotesIcon (main entry)
├── Popover/Sheet (UI container, dynamically loaded)
│   └── HazoNotesPanel (panel content)
│       ├── HazoNotesEntry[] (note display)
│       │   ├── ProfileStamp (user avatar, optional)
│       │   └── HazoNotesFilePreview[] (file rendering)
│       └── Textarea (note input)
```

### Core Components

**HazoNotesIcon** (`src/components/hazo_notes_icon.tsx`)
- Main trigger button that opens the notes panel
- Supports both controlled and uncontrolled modes
- **IMPORTANT**: Requires `popover_components` or `sheet_components` prop - cannot auto-import across package boundaries
- Shows visual indicator (amber background) when notes exist
- Auto-fetches user info from `/api/hazo_auth/me` if not provided
- Configurable icon size and border visibility

Key props:
- `popover_components`: **Required for popover style** - `{ Popover, PopoverTrigger, PopoverContent }` from your UI library
- `sheet_components`: **Required for slide_panel style** - `{ Sheet, SheetTrigger, SheetContent }` from your UI library
- `icon_size`: Button size in pixels (default: 28). The inner icon scales proportionally (~57% of button size, so 28px → 16px inner icon). This matches the standard h-7/w-7 button with h-4/w-4 icon pattern used across hazo packages.
- `show_border`: Whether to display a border around the button (default: true). When false, renders a borderless icon suitable for inline or toolbar usage.

```tsx
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

const popover_components = { Popover, PopoverTrigger, PopoverContent };

// Default 28px button with border
<HazoNotesIcon ref_id="123" popover_components={popover_components} />

// Compact 24px button without border
<HazoNotesIcon ref_id="123" icon_size={24} show_border={false} popover_components={popover_components} />

// Large 36px button with border
<HazoNotesIcon ref_id="123" icon_size={36} popover_components={popover_components} />
```

**HazoNotesPanel** (`src/components/hazo_notes_panel.tsx`)
- Notes display and input panel
- Handles both explicit save and auto-save modes
- Supports paste-to-embed for images
- Renders file previews inline or as attachments

**HazoNotesEntry** (`src/components/hazo_notes_entry.tsx`)
- Single note display with timestamp
- Shows user attribution via ProfileStamp (if available)
- Parses `<<embed:XXXX>>` and `<<attach:XXXX>>` syntax

**HazoNotesFilePreview** (`src/components/hazo_notes_file_preview.tsx`)
- Renders embedded images inline
- Renders other files as download links with icons

### React Hooks

**use_notes** (`src/hooks/use_notes.ts`)
- Manages notes state and API interactions
- Fetches notes from `/api/hazo_notes/[ref_id]`
- Provides `add_note` method for creating notes
- Supports skip mode for controlled components
- Optional refresh interval for real-time updates

**use_notes_file_upload** (`src/hooks/use_notes_file_upload.ts`)
- Handles file uploads and validation
- Supports two modes:
  - `jsonb`: Client-side Base64 encoding (simpler, default)
  - `filesystem`: Server-side upload via API
- Auto-generates file reference numbers (0001, 0002, etc.)
- Validates file size and type

### API Handler Factories

**createNotesHandler** (`src/api/create_notes_handler.ts`)
- Factory function that creates GET and POST route handlers
- GET: Fetches notes for a `ref_id`, enriches with user profiles
- POST: Adds new note, validates input, updates database
- Uses PostgREST-style queries via `hazo_connect`
- Handles UUID generation for new rows

**createFilesHandler** (`src/api/create_files_handler.ts`)
- Factory function for file upload endpoint
- Supports both JSONB and filesystem storage modes
- Validates file size and type on server
- Returns NoteFile object for embedding in notes

## Database Schema

```sql
CREATE TABLE hazo_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_id UUID NOT NULL,           -- Links to parent entity
  note JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  changed_at TIMESTAMPTZ,
  note_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_hazo_notes_ref_id ON hazo_notes(ref_id);
```

### JSONB Note Structure

Each element in the `note` array:

```typescript
interface NoteEntryDB {
  userid: string;           // UUID of note creator
  created_at: string;       // ISO timestamp
  note_text: string;        // Note content with optional file refs
  note_files?: NoteFile[];  // Optional file attachments
}
```

### File Reference Syntax

Notes support inline file references that get automatically rendered:

- `<<embed:0001>>` - Renders images inline, other files as previews
- `<<attach:0001>>` - Renders as downloadable link with icon

Example:
```
See the screenshot below:
<<embed:0001>>

Download the full report:
<<attach:0002>>
```

## Configuration

Config file: `config/hazo_notes_config.ini`

### Key Sections

**[ui]**
- `background_color`: Tailwind class (e.g., `bg-yellow-100`)
- `panel_style`: `popover` | `slide_panel`
- `save_mode`: `explicit` (save/cancel buttons) | `auto` (save on blur)

**[storage]**
- `file_storage_mode`: `jsonb` (in database) | `filesystem` (on server)
- `file_storage_path`: Path for filesystem mode

**[files]**
- `max_file_size_mb`: Maximum file size (default: 10)
- `allowed_file_types`: Comma-separated extensions (no dots)
- `max_files_per_note`: Maximum files per note entry (default: 5)

**[logging]**
- `logfile`: Log file path

## Key Design Patterns

### 1. Dynamic UI Component Loading

The package dynamically imports shadcn/ui components to avoid hard dependencies:

```typescript
// Popover components loaded at runtime
const popoverModule = await import('@/components/ui/popover');
```

This allows the package to work with different UI libraries or custom implementations.

### 2. Factory Pattern for API Handlers

API handlers are created via factory functions to allow dependency injection:

```typescript
const { GET, POST } = createNotesHandler({
  getHazoConnect: () => getHazoConnectSingleton(),
  getUserIdFromRequest: async (req) => extractUserId(req),
  getUserProfile: async (userId) => fetchProfile(userId),
});
```

### 3. Controlled vs Uncontrolled Components

HazoNotesIcon supports both modes:

**Uncontrolled** (default): Component manages its own state via `use_notes` hook
**Controlled**: Parent provides `notes` array and `on_notes_change` callback

### 4. Logger Injection Pattern

**Client-side**: Uses React Context via `LoggerProvider`
**Server-side**: Uses global singleton via `set_server_logger`

This allows the package to integrate with the app's logging infrastructure.

### 5. PostgREST-style Database Queries

Uses hazo_connect's PostgREST compatibility:

```typescript
// Fetch notes
const result = await hazoConnect.rawQuery(`/hazo_notes?ref_id=eq.${ref_id}`);

// Update notes
await hazoConnect.rawQuery(`/hazo_notes?id=eq.${row.id}`, {
  method: 'PATCH',
  body: JSON.stringify({ note: updated_notes }),
});
```

## Code Style Requirements

### Naming Conventions

- **Functions/Variables**: `snake_case` (e.g., `use_notes`, `add_note`, `ref_id`)
- **Constants**: `SCREAMING_SNAKE_CASE` (e.g., `MAX_NOTE_TEXT_LENGTH`)
- **Types/Interfaces**: `PascalCase` (e.g., `NoteEntry`, `HazoNotesIconProps`)
- **CSS Classes**: Prefix with `cls_` (e.g., `cls_hazo_notes_icon`)
- **React Components**: `PascalCase` (e.g., `HazoNotesIcon`)

### File Naming

- Components: `hazo_notes_icon.tsx`
- Hooks: `use_notes.ts`
- API: `create_notes_handler.ts`
- Types: `index.ts` (in types directory)

## Development Commands

```bash
# Build the package
npm run build

# Watch mode for development
npm run dev:package

# Run test app (port 3002)
npm run dev:test-app

# Build test app
npm run build:test-app

# Initialize SQLite test database
cd test-app && npm run init-db
```

## Dependencies

### Required
- `hazo_config` - INI configuration management
- `clsx` - Class name utilities
- `tailwind-merge` - Tailwind class merging
- `server-only` - Server-side code protection

### Peer Dependencies
- `react` ^18.0.0
- `next` >=14.0.0
- `@radix-ui/react-popover` ^1.0.0 (for popover style)
- `@radix-ui/react-dialog` ^1.0.0 (for slide panel style)
- `react-icons` ^5.0.0 (for file type icons)
- `tailwindcss` >=3.0.0

### Optional Peer Dependencies
- `hazo_auth` - For ProfileStamp and user authentication
- `hazo_connect` - For database operations
- `hazo_logs` - For structured logging

## Test App Structure

Located in `test-app/`. Uses SQLite for local development.

### Test Scenarios

- **basic**: Simple note creation and display
- **popover**: Popover style demonstration
- **slide-panel**: Slide panel style demonstration
- **with-files**: File attachment demonstration
- **auto-save**: Auto-save mode demonstration
- **multiple**: Multiple independent note instances
- **integration**: Controlled mode with parent state

### Running Tests Manually

1. Start test app: `npm run dev:test-app`
2. Open http://localhost:3002
3. Navigate test scenarios via sidebar
4. Verify note persistence across refreshes
5. Test file uploads (paste images, attach PDFs)

## Common Gotchas

### 1. Missing UI Components (Most Common Issue)

**Symptom**: Notes icon renders but clicking shows "Notes unavailable - pass popover_components prop" tooltip
**Cause**: The `popover_components` or `sheet_components` prop was not passed to `HazoNotesIcon`. The component cannot auto-import UI components across package boundaries.
**Fix**: Pass the UI components explicitly:

```tsx
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

const popover_components = { Popover, PopoverTrigger, PopoverContent };

<HazoNotesIcon
  ref_id="my-notes"
  popover_components={popover_components}  // Required!
/>
```

Also ensure `@radix-ui/react-popover` (for popover) or `@radix-ui/react-dialog` (for slide_panel) is installed.

### 2. User Shows as "Unknown User"

**Symptom**: Notes display but no user names
**Cause**: `getUserProfile` not implemented in API handler
**Fix**: Implement profile lookup in `createNotesHandler` options

### 3. Files Not Uploading

**Symptom**: File upload fails silently
**Cause**: Missing files API route or incorrect storage mode
**Fix**: Create `/api/hazo_notes/files/upload/route.ts` or use `jsonb` mode

### 4. Notes Not Persisting

**Symptom**: Notes disappear on refresh
**Cause**: Missing database table or incorrect `ref_id`
**Fix**: Run migration script, verify `ref_id` is consistent

### 5. Config Not Loading

**Symptom**: Default values used despite config file
**Cause**: Config file in wrong location
**Fix**: Place `hazo_notes_config.ini` in `config/` at app root

### 6. Authentication Errors

**Symptom**: "Unauthorized" when adding notes
**Cause**: `getUserIdFromRequest` returns null
**Fix**: Implement auth check in API handler

## Integration Points

### With hazo_auth

- Auto-fetches user info from `/api/hazo_auth/me`
- Uses ProfileStamp component for avatars (optional)
- Expects user object: `{ id, name, email, profile_image }`

### With hazo_connect

- Uses rawQuery for PostgREST-style database access
- Expects `getHazoConnectSingleton()` in API handlers
- Supports both PostgreSQL and SQLite

### With hazo_logs

- Client: Uses `LoggerProvider` context
- Server: Uses `set_server_logger` singleton
- Log methods: `debug`, `info`, `warn`, `error`

## Security Considerations

1. **Input Validation**: All note text and file uploads are validated
2. **Authentication**: POST endpoints require authenticated user
3. **File Size Limits**: Configurable max file size prevents abuse
4. **File Type Restrictions**: Whitelist-based file type validation
5. **SQL Injection**: Uses parameterized PostgREST queries
6. **XSS Protection**: File references are parsed, not executed

## Performance Considerations

1. **JSONB Storage**: Efficient for < 100 notes per ref_id
2. **File Storage**: Use `filesystem` mode for files > 1MB
3. **Indexing**: `ref_id` indexed for fast lookups
4. **Denormalized Count**: `note_count` avoids JSONB parsing
5. **Client-side Encoding**: Base64 encoding happens in browser for JSONB mode

## Troubleshooting Tips

**Enable debug logging**:
```typescript
// Client
const logger = createClientLogger({ packageName: 'my_app', level: 'debug' });

// Server
const logger = createLogger('hazo_notes', { level: 'debug' });
```

**Check API responses**:
```bash
# Fetch notes
curl http://localhost:3000/api/hazo_notes/my-ref-id

# Add note (requires auth)
curl -X POST http://localhost:3000/api/hazo_notes/my-ref-id \
  -H "Content-Type: application/json" \
  -d '{"note_text":"Test note"}'
```

**Verify database**:
```sql
-- Check notes exist
SELECT * FROM hazo_notes WHERE ref_id = 'my-ref-id';

-- Check note structure
SELECT note FROM hazo_notes WHERE ref_id = 'my-ref-id';
```
