# hazo_notes

Database-backed notes system with file attachment support for Next.js applications in the hazo ecosystem.

## Features

- **Database-backed persistence** - Notes stored in PostgreSQL or SQLite via hazo_connect
- **File attachments** - Support for images, PDFs, and documents with embed/attach modes
- **Flexible UI styles** - Choose between popover or slide panel presentation
- **Smart save modes** - Explicit save/cancel buttons or auto-save on blur
- **INI-based configuration** - Simple config file for all settings
- **Full TypeScript support** - Complete type definitions included
- **Controlled and uncontrolled modes** - Works with parent state or manages its own
- **Paste-to-embed images** - Paste images directly into notes
- **User attribution** - Automatic user profiles with avatars (optional)
- **File reference syntax** - Inline file references with `<<embed:XXXX>>` and `<<attach:XXXX>>`

## Prerequisites

Before installing hazo_notes, ensure you have:

- Next.js 14+ with React 18+
- Tailwind CSS configured
- **hazo_connect** installed and configured (for database access)
- PostgreSQL or SQLite database

## Installation

```bash
npm install hazo_notes
```

### Peer Dependencies

Install these based on your needs:

```bash
# Required for UI components
npm install @radix-ui/react-popover @radix-ui/react-dialog react-icons

# Recommended for full functionality
npm install hazo_connect hazo_auth hazo_logs
```

## Quick Start

### 1. Add the Component

**Important:** You must pass your UI components via the `popover_components` or `sheet_components` prop. The component cannot auto-import these across package boundaries.

```tsx
import { HazoNotesIcon } from 'hazo_notes';
// Import your shadcn/ui components
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

// Create the components object
const popover_components = { Popover, PopoverTrigger, PopoverContent };

function MyComponent() {
  return (
    <div className="flex items-center gap-2">
      <h2>Customer Information</h2>
      <HazoNotesIcon
        ref_id="customer-info-section"
        label="Customer Information"
        popover_components={popover_components}
      />
    </div>
  );
}
```

### 2. Create API Route

Create `app/api/hazo_notes/[ref_id]/route.ts`:

```typescript
import { createNotesHandler } from 'hazo_notes/api';
import { getHazoConnectSingleton } from 'hazo_connect/nextjs/setup';
// Import your auth and user lookup functions
import { getSession } from '@/lib/auth'; // Replace with your auth
import { getUserById } from '@/lib/users'; // Replace with your user lookup

export const dynamic = 'force-dynamic';

const { GET, POST } = createNotesHandler({
  getHazoConnect: () => getHazoConnectSingleton(),
  getUserIdFromRequest: async (req) => {
    // IMPORTANT: Replace with your authentication logic
    const session = await getSession(req);
    return session?.user?.id || null;
  },
  getUserProfile: async (userId) => {
    // IMPORTANT: Replace with your user profile lookup
    const user = await getUserById(userId);
    return {
      id: userId,
      name: user?.name || 'Unknown User',
      email: user?.email || '',
      profile_image: user?.avatar,
    };
  },
});

export { GET, POST };
```

### 3. Set Up Database

Run the migration:

**PostgreSQL:**
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

**SQLite:**
```sql
CREATE TABLE IF NOT EXISTS hazo_notes (
  id TEXT PRIMARY KEY,
  ref_id TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  changed_at TEXT,
  note_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_hazo_notes_ref_id ON hazo_notes(ref_id);
```

### 4. Configure (Optional)

Copy the config template:

```bash
mkdir -p config
cp node_modules/hazo_notes/templates/config/hazo_notes_config.ini config/
```

Edit `config/hazo_notes_config.ini` to customize behavior.

For detailed setup instructions, see [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md).

## Usage Examples

### Basic Usage

```tsx
import { HazoNotesIcon } from 'hazo_notes';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

const popover_components = { Popover, PopoverTrigger, PopoverContent };

export default function FormPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label>Annual Income</label>
        <HazoNotesIcon
          ref_id="income-field"
          label="Annual Income"
          popover_components={popover_components}
        />
      </div>
      <input type="number" name="income" />
    </div>
  );
}
```

**Result**: Click the notes icon to add contextual notes about this field.

### With File Attachments

```tsx
<HazoNotesIcon
  ref_id="contract-review"
  label="Contract Review"
  enable_files={true}
  max_files_per_note={5}
  allowed_file_types={['pdf', 'docx', 'png', 'jpg']}
  max_file_size_mb={10}
  popover_components={popover_components}
/>
```

**Features**:
- Upload files via file picker or paste images
- Files referenced in note text with `<<embed:0001>>` or `<<attach:0001>>`
- Images display inline, other files show as download links

### Slide Panel Style

```tsx
import { Sheet, SheetTrigger, SheetContent } from '@/components/ui/sheet';

const sheet_components = { Sheet, SheetTrigger, SheetContent };

<HazoNotesIcon
  ref_id="detailed-notes"
  label="Detailed Notes"
  panel_style="slide_panel"
  sheet_components={sheet_components}
/>
```

**Result**: Notes open in a slide-out panel instead of a popover.

### Auto-Save Mode

```tsx
<HazoNotesIcon
  ref_id="quick-notes"
  label="Quick Notes"
  save_mode="auto"
  popover_components={popover_components}
/>
```

**Result**: Notes save automatically when panel closes (no save/cancel buttons).

### Custom Styling

```tsx
<HazoNotesIcon
  ref_id="styled-notes"
  label="Styled Notes"
  background_color="bg-blue-50"
  className="ml-2"
  popover_components={popover_components}
/>
```

### Controlled Mode

```tsx
'use client';

import { useState } from 'react';
import { HazoNotesIcon } from 'hazo_notes';
import type { NoteEntry } from 'hazo_notes/types';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

const popover_components = { Popover, PopoverTrigger, PopoverContent };

export default function ControlledExample() {
  const [notes, setNotes] = useState<NoteEntry[]>([]);

  return (
    <HazoNotesIcon
      ref_id="controlled-notes"
      label="Controlled Notes"
      notes={notes}
      on_notes_change={setNotes}
      popover_components={popover_components}
    />
  );
}
```

**Use Case**: Sync notes with parent component state or external state management.

## Configuration

Configuration options in `config/hazo_notes_config.ini`:

```ini
[ui]
# Background color for notes panel (Tailwind CSS class)
background_color = bg-yellow-100

# Panel presentation style: popover | slide_panel
panel_style = popover

# Save behavior: explicit | auto
save_mode = explicit

[storage]
# File storage mode: jsonb | filesystem
file_storage_mode = jsonb

# Path for filesystem storage (only used when file_storage_mode = filesystem)
file_storage_path = /uploads/notes

[files]
# Maximum file size in MB
max_file_size_mb = 10

# Allowed file types (comma-separated extensions, no dots)
allowed_file_types = pdf,png,jpg,jpeg,gif,doc,docx

# Maximum files per single note entry
max_files_per_note = 5

[logging]
# Log file path (relative to application root)
logfile = logs/hazo_notes.log
```

## Component API

### HazoNotesIcon Props

```typescript
interface HazoNotesIconProps {
  // Required
  ref_id: string;                      // Unique identifier for this notes instance

  // UI Components (REQUIRED - must pass one based on panel_style)
  popover_components?: {               // Required for panel_style="popover" (default)
    Popover: React.ComponentType<any>;
    PopoverTrigger: React.ComponentType<any>;
    PopoverContent: React.ComponentType<any>;
  };
  sheet_components?: {                 // Required for panel_style="slide_panel"
    Sheet: React.ComponentType<any>;
    SheetTrigger: React.ComponentType<any>;
    SheetContent: React.ComponentType<any>;
  };

  // Display
  label?: string;                      // Panel header label
  has_notes?: boolean;                 // Show indicator when notes exist
  note_count?: number;                 // Display count badge

  // Controlled mode
  notes?: NoteEntry[];                 // Controlled notes array
  on_notes_change?: (notes: NoteEntry[]) => void;

  // User context
  current_user?: NoteUserInfo;         // User info (auto-fetched if not provided)

  // Configuration overrides
  panel_style?: 'popover' | 'slide_panel';
  save_mode?: 'explicit' | 'auto';
  background_color?: string;           // Tailwind class

  // File options
  enable_files?: boolean;              // Enable file attachments
  max_files_per_note?: number;
  allowed_file_types?: string[];
  max_file_size_mb?: number;

  // Callbacks
  on_open?: () => void;
  on_close?: () => void;

  // Styling
  disabled?: boolean;
  className?: string;
}
```

## Hooks API

### use_notes

Manages notes state and API interactions.

```typescript
import { use_notes } from 'hazo_notes/hooks';

function MyComponent({ refId }: { refId: string }) {
  const {
    notes,
    note_count,
    loading,
    error,
    add_note,
    refresh,
  } = use_notes(refId);

  const handleAddNote = async () => {
    const success = await add_note('This is my note');
    if (success) {
      console.log('Note added!');
    }
  };

  if (loading) return <div>Loading notes...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <p>{note_count} notes</p>
      <button onClick={handleAddNote}>Add Note</button>
    </div>
  );
}
```

### use_notes_file_upload

Handles file uploads and validation.

```typescript
import { use_notes_file_upload } from 'hazo_notes/hooks';

function FileUploadExample() {
  const {
    pending_files,
    upload_file,
    remove_file,
    uploading,
    error,
  } = use_notes_file_upload({
    ref_id: 'my-notes',
    max_file_size_mb: 5,
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const uploaded = await upload_file(file, 'attachment');
      if (uploaded) {
        console.log('File uploaded:', uploaded.filename);
      }
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileSelect} disabled={uploading} />
      {pending_files.map(f => (
        <div key={f.file_no}>
          {f.filename}
          <button onClick={() => remove_file(f.file_no)}>Remove</button>
        </div>
      ))}
    </div>
  );
}
```

## File Attachments

Notes support inline file references in text:

### Embed Mode (Images Inline)

```
Check out this screenshot:
<<embed:0001>>
```

**Result**: Image displays directly in the note.

### Attach Mode (Download Link)

```
Download the full report:
<<attach:0001>>
```

**Result**: Shows as a clickable download link with file icon.

### Paste to Embed

Users can paste images directly into the note textarea - they're automatically uploaded and referenced with `<<embed:XXXX>>` syntax.

## File Storage Modes

### JSONB Mode (Default)

```ini
[storage]
file_storage_mode = jsonb
```

- Files stored as Base64 in database
- Simpler setup (no file API needed)
- Good for small files (< 1MB)
- Works out of the box

### Filesystem Mode

```ini
[storage]
file_storage_mode = filesystem
file_storage_path = /uploads/notes
```

- Files stored on server filesystem
- Better for large files
- Requires file upload API route

Create `app/api/hazo_notes/files/upload/route.ts`:

```typescript
import { createFilesHandler } from 'hazo_notes/api';
import { getHazoConnectSingleton } from 'hazo_connect/nextjs/setup';

export const dynamic = 'force-dynamic';

const { POST } = createFilesHandler({
  getHazoConnect: () => getHazoConnectSingleton(),
  getUserIdFromRequest: async (req) => {
    const session = await getSession(req);
    return session?.user?.id || null;
  },
  file_storage_mode: 'filesystem',
  file_storage_path: '/uploads/notes',
  max_file_size_mb: 10,
  allowed_file_types: ['pdf', 'png', 'jpg', 'jpeg', 'gif'],
});

export { POST };
```

## Logger Integration (Optional)

### Client-Side

```tsx
// app/providers.tsx
'use client';

import { LoggerProvider } from 'hazo_notes';
import { createClientLogger } from 'hazo_logs/ui';

const logger = createClientLogger({ packageName: 'my_app' });

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LoggerProvider logger={logger}>
      {children}
    </LoggerProvider>
  );
}
```

### Server-Side

```typescript
// lib/logger-setup.ts
import { set_server_logger } from 'hazo_notes/lib';
import { createLogger } from 'hazo_logs';

export function initializeLogger() {
  set_server_logger(createLogger('hazo_notes'));
}
```

## TypeScript Types

All types are exported from `hazo_notes/types`:

```typescript
import type {
  NoteEntry,
  NoteFile,
  NoteUserInfo,
  HazoNotesIconProps,
  HazoNotesPanelProps,
} from 'hazo_notes/types';
```

## Database Schema

The `hazo_notes` table stores all notes:

```sql
CREATE TABLE hazo_notes (
  id UUID PRIMARY KEY,
  ref_id UUID NOT NULL,              -- Links to parent entity
  note JSONB NOT NULL DEFAULT '[]',  -- Array of note entries
  created_at TIMESTAMPTZ NOT NULL,
  changed_at TIMESTAMPTZ,
  note_count INTEGER NOT NULL DEFAULT 0
);
```

Each note entry in the JSONB array:

```typescript
{
  userid: "user-uuid",
  created_at: "2026-01-07T12:30:00.000Z",
  note_text: "This is the note content",
  note_files: [
    {
      file_no: "0001",
      embed_type: "embed",
      filename: "screenshot.png",
      filedata: "base64_data_or_file_path",
      mime_type: "image/png",
      file_size: 12345
    }
  ]
}
```

## Troubleshooting

### Notes icon doesn't open panel

**Problem**: Icon renders but clicking shows "Notes unavailable - pass popover_components prop" tooltip.

**Cause**: The component cannot auto-import UI components across package boundaries.

**Solution**: You must explicitly pass the UI components prop:

```tsx
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

const popover_components = { Popover, PopoverTrigger, PopoverContent };

<HazoNotesIcon
  ref_id="my-notes"
  popover_components={popover_components}  // Required!
/>
```

For slide panel style, use `sheet_components` instead:
```tsx
import { Sheet, SheetTrigger, SheetContent } from '@/components/ui/sheet';

const sheet_components = { Sheet, SheetTrigger, SheetContent };

<HazoNotesIcon
  ref_id="my-notes"
  panel_style="slide_panel"
  sheet_components={sheet_components}
/>
```

Make sure you also have the required dependencies:
```bash
npm install @radix-ui/react-popover @radix-ui/react-dialog
```

### User shows as "Unknown User"

**Problem**: Notes display but no user names.

**Solution**: Implement `getUserProfile` in your API handler:
```typescript
getUserProfile: async (userId) => {
  const user = await fetchUserFromDatabase(userId);
  return {
    id: userId,
    name: user.name,
    email: user.email,
    profile_image: user.avatar,
  };
}
```

### Notes don't persist

**Problem**: Notes disappear after refresh.

**Solution**:
1. Verify database table exists (run migration)
2. Check `ref_id` is consistent
3. Verify API route is working: `curl http://localhost:3000/api/hazo_notes/test-id`

### File upload fails

**Problem**: Can't upload files.

**Solution**:
- For JSONB mode: Should work out of the box
- For filesystem mode: Create the files upload API route (see File Storage Modes above)

### Authentication errors

**Problem**: "Unauthorized" when adding notes.

**Solution**: Implement `getUserIdFromRequest` to return authenticated user ID:
```typescript
getUserIdFromRequest: async (req) => {
  const session = await getSession(req);
  if (!session?.user?.id) return null;
  return session.user.id;
}
```

## Examples

See the `test-app/` directory for complete working examples:

- **Basic notes**: Simple note creation and display
- **Popover style**: Notes in a popover
- **Slide panel style**: Notes in a slide-out panel
- **With files**: File attachment demonstrations
- **Auto-save**: Auto-save mode example
- **Multiple instances**: Multiple independent notes on one page
- **Controlled mode**: Parent state integration

Run the test app:

```bash
npm run dev:test-app
# Open http://localhost:3002
```

## Contributing

See [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md) for development setup instructions.

## License

MIT

## Related Packages

- [hazo_connect](https://github.com/pub12/hazo_connect) - Database connection abstraction
- [hazo_auth](https://github.com/pub12/hazo_auth) - Authentication and user management
- [hazo_logs](https://github.com/pub12/hazo_logs) - Structured logging
- [hazo_config](https://github.com/pub12/hazo_config) - INI configuration management

## Support

- Issues: https://github.com/pub12/hazo_notes/issues
- Documentation: https://github.com/pub12/hazo_notes#readme
