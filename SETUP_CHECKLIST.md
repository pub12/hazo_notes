# hazo_notes Setup Checklist

Step-by-step instructions for integrating hazo_notes into your Next.js application.

## Prerequisites

- [ ] Next.js 14+ application
- [ ] React 18+
- [ ] Tailwind CSS configured
- [ ] hazo_connect configured (for database access)
- [ ] PostgreSQL or SQLite database

## Installation

### 1. Install the package

```bash
npm install hazo_notes
```

### 2. Install peer dependencies (if not already installed)

```bash
# Optional but recommended
npm install hazo_connect hazo_auth hazo_logs react-icons
```

**Note:** Radix UI primitives (`@radix-ui/react-popover` and `@radix-ui/react-dialog`) are bundled with this package. You don't need to install them separately.

## Database Setup

### 3. Create the database table

Run the migration for your database. Choose the appropriate version:

**PostgreSQL (Production):**
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

-- Optional: Add table and column comments for documentation
COMMENT ON TABLE hazo_notes IS 'Stores notes linked to any entity via ref_id';
COMMENT ON COLUMN hazo_notes.ref_id IS 'UUID reference to parent entity';
COMMENT ON COLUMN hazo_notes.note IS 'JSONB array of note entries';
```

**SQLite (Development/Testing):**
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

**Alternative**: Use the provided migration file:
```bash
# PostgreSQL
psql -d your_database -f node_modules/hazo_notes/migrations/001_create_hazo_notes_table.sql

# SQLite
sqlite3 your_database.db < node_modules/hazo_notes/migrations/001_create_hazo_notes_table.sql
```

## API Routes

### 4. Create the notes API route

Create `app/api/hazo_notes/[ref_id]/route.ts`:

```typescript
import { createNotesHandler } from 'hazo_notes/api';
import { getHazoConnectSingleton } from 'hazo_connect/nextjs/setup';
// Import your authentication and user lookup functions
import { getSession } from '@/lib/auth';
import { getUserById } from '@/lib/users';

export const dynamic = 'force-dynamic';

const { GET, POST } = createNotesHandler({
  getHazoConnect: () => getHazoConnectSingleton(),

  getUserIdFromRequest: async (req) => {
    // IMPORTANT: Replace this with your actual authentication logic
    // This function should return the authenticated user's ID or null
    const session = await getSession(req);
    return session?.user?.id || null;
  },

  getUserProfile: async (userId) => {
    // IMPORTANT: Replace this with your actual user profile lookup
    // This function fetches user details for attribution
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

**Important Notes**:
- The `getUserIdFromRequest` function MUST return a valid user ID for POST requests
- The `getUserProfile` function enriches notes with user information
- If you don't have user profiles, you can omit `getUserProfile`

### 5. (Optional) Create the files API route for file attachments

Only needed if using filesystem storage mode. For JSONB mode (default), skip this step.

Create `app/api/hazo_notes/files/upload/route.ts`:

```typescript
import { createFilesHandler } from 'hazo_notes/api';
import { getHazoConnectSingleton } from 'hazo_connect/nextjs/setup';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const { POST } = createFilesHandler({
  getHazoConnect: () => getHazoConnectSingleton(),

  getUserIdFromRequest: async (req) => {
    const session = await getSession(req);
    return session?.user?.id || null;
  },

  // File storage configuration
  file_storage_mode: 'filesystem', // or 'jsonb'
  file_storage_path: '/uploads/notes',
  max_file_size_mb: 10,
  allowed_file_types: ['pdf', 'png', 'jpg', 'jpeg', 'gif'],
});

export { POST };
```

## Configuration

### 6. Copy the config template

```bash
mkdir -p config
cp node_modules/hazo_notes/templates/config/hazo_notes_config.ini config/
```

### 7. Edit the configuration

Edit `config/hazo_notes_config.ini` to match your needs:

```ini
[ui]
# Background color for notes panel (Tailwind CSS class)
# Examples: bg-yellow-100, bg-blue-50, bg-gray-100
background_color = bg-yellow-100

# Panel presentation style
# Options: popover | slide_panel
# - popover: Compact popup near the trigger button
# - slide_panel: Full-height panel from the right side
panel_style = popover

# Save behavior
# Options: explicit | auto
# - explicit: User clicks Save/Cancel buttons
# - auto: Note saved automatically when panel closes or on blur
save_mode = explicit

[storage]
# File storage mode
# Options: jsonb | filesystem
# - jsonb: Store files as Base64 in database (simpler, good for small files)
# - filesystem: Store files on server filesystem (better for large files)
file_storage_mode = jsonb

# Path for filesystem storage (only used when file_storage_mode = filesystem)
# Must be an absolute path or relative to your application root
file_storage_path = /uploads/notes

[files]
# Maximum file size in MB
max_file_size_mb = 10

# Allowed file types (comma-separated extensions, no dots)
# Common types: pdf, png, jpg, jpeg, gif, doc, docx, xls, xlsx, txt
allowed_file_types = pdf,png,jpg,jpeg,gif,doc,docx

# Maximum files per single note entry
max_files_per_note = 5

[logging]
# Log file path (relative to application root)
logfile = logs/hazo_notes.log
```

## Component Usage

### 8. Add the HazoNotesIcon component

The component bundles its own Radix UI primitives, so no additional UI component setup is required.

```tsx
import { HazoNotesIcon } from 'hazo_notes';

function MyComponent() {
  return (
    <div className="flex items-center gap-2">
      <h2>Customer Information</h2>
      <HazoNotesIcon
        ref_id="customer-info-section"
        label="Customer Information"
      />
    </div>
  );
}
```

For slide panel style, just set the `panel_style` prop:

```tsx
<HazoNotesIcon
  ref_id="field-id"
  label="Field Notes"
  panel_style="slide_panel"
/>
```

### 9. (Optional) Configure component props

You can override config file settings via component props:

```tsx
<HazoNotesIcon
  ref_id="field-123"
  label="Customer Notes"

  // UI configuration overrides
  panel_style="slide_panel"      // 'popover' | 'slide_panel'
  save_mode="auto"               // 'explicit' | 'auto'
  background_color="bg-blue-100" // Tailwind class

  // File configuration
  enable_files={true}
  max_files_per_note={5}
  allowed_file_types={['pdf', 'png', 'jpg']}
  max_file_size_mb={10}

  // Callbacks
  on_open={() => console.log('Notes opened')}
  on_close={() => console.log('Notes closed')}

  // Styling
  icon_size={24}                 // Button size in pixels
  show_border={false}            // Hide border for inline usage
  className="ml-2"
/>
```

## Logger Integration (Optional)

If you want structured logging, integrate with hazo_logs:

### 10. Set up client-side logging

Create or update your providers file:

```tsx
// app/providers.tsx
'use client';

import { LoggerProvider } from 'hazo_notes';
import { createClientLogger } from 'hazo_logs/ui';

const logger = createClientLogger({
  packageName: 'my_app',
  level: 'debug' // or 'info', 'warn', 'error'
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LoggerProvider logger={logger}>
      {children}
    </LoggerProvider>
  );
}
```

Then wrap your app in the layout:

```tsx
// app/layout.tsx
import { Providers } from './providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### 11. Set up server-side logging

Create a logger initialization file:

```typescript
// lib/logger-setup.ts
import { set_server_logger } from 'hazo_notes/lib';
import { createLogger } from 'hazo_logs';

export function initializeLogger() {
  const logger = createLogger('hazo_notes', {
    level: 'debug',
    // Add other hazo_logs configuration
  });
  set_server_logger(logger);
}
```

Call this in your API routes or middleware:

```typescript
// middleware.ts or app/api/hazo_notes/[ref_id]/route.ts
import { initializeLogger } from '@/lib/logger-setup';

initializeLogger();

// ... rest of your code
```

## Verification Checklist

After setup, verify everything works:

- [ ] Database table `hazo_notes` exists with correct schema
- [ ] API route `/api/hazo_notes/[ref_id]` responds to GET and POST
- [ ] Authentication returns correct user ID (test with: `getUserIdFromRequest(mockRequest)`)
- [ ] HazoNotesIcon renders without errors
- [ ] Clicking notes icon opens the panel
- [ ] Notes can be created and saved
- [ ] Notes persist across page refreshes
- [ ] User attribution shows correct names (not "Unknown User")
- [ ] (If using files) File upload works correctly
- [ ] (If using files) Files display in notes

### Quick Verification Steps

1. **Test Component Rendering**:
   - Visit a page with HazoNotesIcon
   - Verify icon appears and is clickable

2. **Test API Endpoints**:
   ```bash
   # GET notes (should return empty array initially)
   curl http://localhost:3000/api/hazo_notes/test-ref-id

   # POST note (requires authentication)
   curl -X POST http://localhost:3000/api/hazo_notes/test-ref-id \
     -H "Content-Type: application/json" \
     -d '{"note_text":"Test note"}'
   ```

3. **Test Database**:
   ```sql
   -- Check table exists
   SELECT * FROM hazo_notes LIMIT 1;

   -- Verify notes were created
   SELECT ref_id, note_count, note FROM hazo_notes;
   ```

4. **Test User Attribution**:
   - Create a note
   - Verify your name appears (not "Unknown User")
   - Check that profile image displays (if available)

5. **Test File Attachments** (if enabled):
   - Click notes icon
   - Paste an image into the textarea
   - Verify `<<embed:0001>>` reference appears
   - Save note and verify image displays

## Troubleshooting

### Notes icon doesn't appear

**Possible Causes**:
1. Missing `ref_id` prop - The component requires a valid `ref_id` and will not render without one
2. `disabled={true}` is set
3. Tailwind CSS is not configured

**Solution**:
```tsx
// Check that ref_id is provided and valid
<HazoNotesIcon
  ref_id="my-field-123"  // Required - must be a non-empty string
  label="My Notes"
/>
```

In development, a console warning will appear if `ref_id` is missing.

### Notes not saving
- Check that `getUserIdFromRequest` returns a valid user ID
- Verify the API route is accessible at `/api/hazo_notes/[ref_id]`
- Check browser network tab for failed requests
- Verify database table exists

### User names showing as "Unknown User"
- Ensure `getUserProfile` is implemented and returns correct data
- Check that the user profile lookup is working
- Verify user IDs in database match your user table

### Files not uploading
- Verify file size is under the configured limit
- Check that the file type is in the allowed list
- For filesystem mode: Ensure the files API route is set up correctly
- For JSONB mode: Should work without additional setup

### Component not rendering
- Verify all peer dependencies are installed
- Check that Tailwind CSS is configured
- Ensure `react-icons` is installed
- Look for TypeScript errors

### Database connection errors
- Verify `hazo_connect` is configured correctly
- Check database credentials
- Ensure database is running and accessible
- Test connection with a simple query

### Configuration not loading
- Verify config file is at `config/hazo_notes_config.ini`
- Check file permissions
- Ensure file is valid INI format (no syntax errors)
- Try using component props to override config

## Next Steps

After successful setup:

1. **Explore Examples**: Check `test-app/` for usage examples
2. **Customize Styling**: Adjust `background_color` and Tailwind classes
3. **Add to Multiple Fields**: Use different `ref_id` values for each field
4. **Enable File Attachments**: Set `enable_files={true}` on components
5. **Consider Auto-Save**: Try `save_mode="auto"` for quick note-taking
6. **Review Logs**: Check `logs/hazo_notes.log` for debugging info

## Additional Resources

- **API Documentation**: See `CLAUDE.md` for detailed API reference
- **Technical Details**: See `TECHDOC.md` for architecture documentation
- **Test App**: Run `npm run dev:test-app` to see working examples
- **GitHub Issues**: Report bugs at https://github.com/pub12/hazo_notes/issues
