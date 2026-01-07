-- Migration: Create hazo_notes table
-- Version: 001
-- Description: Initial table creation for notes system with JSONB storage
-- Compatible with: PostgreSQL 13+, SQLite 3.38+ (with JSON1 extension)

-- ============================================================================
-- PostgreSQL Version
-- ============================================================================

-- Create the hazo_notes table
CREATE TABLE IF NOT EXISTS hazo_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_id UUID NOT NULL,
  note JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  changed_at TIMESTAMPTZ,
  note_count INTEGER NOT NULL DEFAULT 0
);

-- Create index on ref_id for efficient lookups
CREATE INDEX IF NOT EXISTS idx_hazo_notes_ref_id ON hazo_notes(ref_id);

-- Add comments for documentation
COMMENT ON TABLE hazo_notes IS 'Stores notes linked to any entity via ref_id. Notes are stored as JSONB array with user attribution and optional file attachments.';
COMMENT ON COLUMN hazo_notes.id IS 'Primary key UUID';
COMMENT ON COLUMN hazo_notes.ref_id IS 'UUID reference to the parent entity (e.g., form field, document, task)';
COMMENT ON COLUMN hazo_notes.note IS 'JSONB array of note entries: [{userid, created_at, note_text, note_files}]';
COMMENT ON COLUMN hazo_notes.created_at IS 'Timestamp when the notes row was first created';
COMMENT ON COLUMN hazo_notes.changed_at IS 'Timestamp of the last modification to the notes';
COMMENT ON COLUMN hazo_notes.note_count IS 'Denormalized count of notes for quick access without parsing JSONB';

-- ============================================================================
-- SQLite Version (for test-app)
-- Run this in SQLite instead of the PostgreSQL version above
-- ============================================================================

/*
-- SQLite version (uncomment to use):

CREATE TABLE IF NOT EXISTS hazo_notes (
  id TEXT PRIMARY KEY,
  ref_id TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  changed_at TEXT,
  note_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_hazo_notes_ref_id ON hazo_notes(ref_id);
*/

-- ============================================================================
-- Note Entry JSONB Schema Reference
-- ============================================================================
/*
Each element in the `note` JSONB array follows this structure:

{
  "userid": "550e8400-e29b-41d4-a716-446655440000",
  "created_at": "2026-01-07T12:30:00.000Z",
  "note_text": "This is the note content. See attachment: <<attach:0001>>",
  "note_files": [
    {
      "file_no": "0001",
      "embed_type": "attachment",
      "filename": "document.pdf",
      "filedata": "base64_encoded_content_or_file_path",
      "mime_type": "application/pdf",
      "file_size": 12345
    }
  ]
}

File references in note_text:
- <<embed:0001>> - Renders file inline (images displayed directly)
- <<attach:0001>> - Renders as downloadable link
*/
