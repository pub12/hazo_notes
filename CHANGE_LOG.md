# Changelog

All notable changes to the hazo_notes package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-07

### Added - Initial Release

#### Core Features
- **Database-backed notes system** with PostgreSQL and SQLite support
- **File attachment support** with two storage modes:
  - JSONB mode: Files stored as Base64 in database
  - Filesystem mode: Files stored on server with API upload endpoint
- **File reference syntax**: `<<embed:XXXX>>` for inline images, `<<attach:XXXX>>` for download links
- **Paste-to-embed functionality** for images pasted into note textarea

#### Components
- `HazoNotesIcon`: Main trigger component with visual indicator for existing notes
- `HazoNotesPanel`: Notes display and input panel with configurable save modes
- `HazoNotesEntry`: Individual note display with user attribution
- `HazoNotesFilePreview`: File rendering component for inline images and download links

#### React Hooks
- `use_notes`: State management for fetching and creating notes
  - Support for uncontrolled and controlled modes
  - Optimistic updates for better UX
  - Optional refresh interval for real-time updates
- `use_notes_file_upload`: File upload handling with validation
  - Client-side Base64 encoding for JSONB mode
  - Server upload support for filesystem mode
  - Automatic file number generation

#### API Handlers
- `createNotesHandler`: Factory function for GET/POST note endpoints
  - User authentication integration
  - User profile enrichment
  - Input validation (text length, file count)
- `createFilesHandler`: Factory function for file upload endpoint
  - File size and type validation
  - Multiple storage mode support

#### Configuration System
- INI-based configuration via `hazo_config`
- Config file: `config/hazo_notes_config.ini`
- Configuration sections:
  - `[ui]`: background_color, panel_style, save_mode
  - `[storage]`: file_storage_mode, file_storage_path
  - `[files]`: max_file_size_mb, allowed_file_types, max_files_per_note
  - `[logging]`: logfile path
- Component-level config overrides via props

#### UI Styles
- **Popover mode**: Compact popup near trigger button (via @radix-ui/react-popover)
- **Slide panel mode**: Full-height side panel (via @radix-ui/react-dialog)
- Dynamic UI component loading to avoid hard dependencies

#### Save Modes
- **Explicit save**: User clicks Save/Cancel buttons
- **Auto-save**: Note saved automatically when panel closes or on blur

#### Database
- Single table design: `hazo_notes`
- JSONB storage for note array
- Indexed `ref_id` for fast lookups
- Denormalized `note_count` for performance
- Migration script included: `migrations/001_create_hazo_notes_table.sql`

#### Logger Integration
- Optional integration with `hazo_logs` package
- Client-side logger via React Context (`LoggerProvider`)
- Server-side logger via singleton pattern (`set_server_logger`)
- Graceful degradation to no-op logger if not configured

#### User Attribution
- Optional integration with `hazo_auth` for user profiles
- ProfileStamp component support for user avatars
- Auto-fetch user info from `/api/hazo_auth/me`
- Fallback to "Unknown User" if profile unavailable

#### TypeScript Support
- Full type definitions for all components, hooks, and API handlers
- Exported types via `hazo_notes/types`
- Strict typing for API responses and database structures

#### Developer Experience
- Comprehensive test app with 7 example scenarios:
  - Basic notes
  - Popover style
  - Slide panel style
  - File attachments
  - Auto-save mode
  - Multiple instances
  - Controlled mode integration
- Development scripts:
  - `npm run build`: Build package
  - `npm run dev:package`: Watch mode for package development
  - `npm run dev:test-app`: Run test application
  - `npm run build:test-app`: Build test application
- SQLite database initialization script for test app

#### Documentation
- `README.md`: User-facing documentation with examples
- `SETUP_CHECKLIST.md`: Step-by-step integration guide
- `CLAUDE.md`: Technical reference for AI assistants
- `TECHDOC.md`: Deep technical architecture documentation
- Inline code comments and JSDoc annotations

#### Dependencies
- Required: `hazo_config`, `clsx`, `tailwind-merge`, `server-only`
- Peer: `react`, `next`, `@radix-ui/react-popover`, `@radix-ui/react-dialog`, `react-icons`, `tailwindcss`
- Optional peer: `hazo_auth`, `hazo_connect`, `hazo_logs`

#### Security Features
- User authentication requirement for POST requests
- Input validation (note text length, file size, file type)
- SQL injection prevention via PostgREST-style queries
- XSS protection via React's built-in escaping
- File type whitelist validation

#### Performance Optimizations
- Dynamic imports for heavy dependencies (UI components)
- Optimistic UI updates for better perceived performance
- Indexed database lookups (O(log n) retrieval)
- Denormalized count field to avoid JSONB parsing
- Tree-shaking friendly exports
- Minimal bundle size (~14KB gzipped excluding peer dependencies)

### Design Decisions - Initial Release

#### Why JSONB for notes storage?
- **Flexibility**: No schema changes needed for new note fields
- **Performance**: PostgreSQL JSONB is binary format, very fast
- **Simplicity**: Single query to fetch all notes for a ref_id
- **Scalability**: Efficient for up to ~100 notes per ref_id

#### Why two file storage modes?
- **JSONB mode**: Simpler setup, zero configuration, good for small files (< 1MB)
- **Filesystem mode**: Better for large files, reduces database size, allows CDN caching

#### Why factory pattern for API handlers?
- **Dependency injection**: Applications provide their own auth and database logic
- **Flexibility**: Easy to customize without modifying package code
- **Testability**: Easy to mock dependencies for testing

#### Why dynamic UI component loading?
- **Zero hard dependencies**: Package works with any UI library
- **Bundle size**: Don't load UI components until needed
- **Flexibility**: Applications can use custom UI components

#### Why both controlled and uncontrolled modes?
- **Uncontrolled**: Simpler API, less boilerplate for common use cases
- **Controlled**: Full control for complex state management scenarios

#### Why INI config format?
- **Human-readable**: Easy to edit without programming knowledge
- **Comments support**: Inline documentation in config file
- **Hazo ecosystem consistency**: Other hazo packages use INI files

## [Unreleased]

### Planned Features

#### Performance Enhancements
- [ ] Virtual scrolling for large note lists (> 50 notes)
- [ ] Pagination support for notes API
- [ ] Image thumbnail generation for large embedded images
- [ ] Lazy loading for file previews

#### Feature Additions
- [ ] Note editing (currently append-only)
- [ ] Note deletion with soft delete
- [ ] Note search and filtering
- [ ] @mentions in notes with user tagging
- [ ] Rich text editor support (Markdown, HTML)
- [ ] Note templates for common use cases
- [ ] Export notes to PDF/CSV
- [ ] Real-time collaboration via WebSockets

#### Developer Experience
- [ ] Storybook documentation for components
- [ ] Automated unit tests with Jest
- [ ] E2E tests with Playwright
- [ ] CI/CD pipeline setup
- [ ] Component playground in test app
- [ ] Migration helper scripts
- [ ] CLI tool for package setup

#### Accessibility
- [ ] ARIA labels and roles
- [ ] Keyboard navigation improvements
- [ ] Screen reader optimization
- [ ] High contrast mode support
- [ ] Focus management improvements

#### Integration Enhancements
- [ ] Webhook support for note events
- [ ] Email notifications for new notes
- [ ] Slack/Discord integration
- [ ] Zapier integration
- [ ] GraphQL API option

---

## Version History

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** version when making incompatible API changes
- **MINOR** version when adding functionality in a backwards compatible manner
- **PATCH** version when making backwards compatible bug fixes

### Deprecation Policy

Features marked as deprecated will be supported for at least one major version before removal. Migration guides will be provided for all breaking changes.

---

## Contributing

When contributing changes, please:

1. Add entries to the `[Unreleased]` section
2. Categorize changes appropriately:
   - `Added` for new features
   - `Changed` for changes in existing functionality
   - `Deprecated` for soon-to-be removed features
   - `Removed` for now removed features
   - `Fixed` for any bug fixes
   - `Security` for vulnerability fixes
3. Include the issue/PR number if applicable
4. Update this file as part of your PR

Example entry:
```markdown
### Added
- New `export_notes` hook for exporting notes to JSON (#123)
```

---

## Migration Guides

### Future Breaking Changes

When we introduce breaking changes, migration guides will be added here.

---

## Links

- [Repository](https://github.com/pub12/hazo_notes)
- [Issues](https://github.com/pub12/hazo_notes/issues)
- [NPM Package](https://www.npmjs.com/package/hazo_notes)
