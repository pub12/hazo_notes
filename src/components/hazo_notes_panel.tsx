'use client';

/**
 * HazoNotesPanel - Notes display and input panel
 *
 * Shows existing notes and provides input for new notes
 */

import React, { useState, useRef } from 'react';
import type { HazoNotesPanelProps, NoteFile } from '../types/index.js';
import { cn } from '../utils/cn.js';
import { HazoNotesEntry } from './hazo_notes_entry.js';
import { use_notes_file_upload } from '../hooks/use_notes_file_upload.js';
import { create_file_reference, format_file_size } from '../utils/file_utils.js';

/**
 * Get initials from name for avatar
 */
function get_initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

/**
 * Generate consistent hex color from name for avatar background
 */
function get_avatar_color(name: string): string {
  const colors = [
    '#ef4444', '#f97316', '#d97706', '#22c55e',
    '#14b8a6', '#3b82f6', '#6366f1', '#a855f7',
    '#ec4899', '#f43f5e',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

/**
 * Notes panel component
 */
export function HazoNotesPanel({
  ref_id,
  label = 'Notes',
  notes,
  on_add_note,
  on_close,
  current_user,
  save_mode,
  background_color,
  loading = false,
  error,
  enable_files = true,
  max_files_per_note = 5,
  allowed_file_types = ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'doc', 'docx'],
  max_file_size_mb = 10,
  ProfileStampComponent,
}: HazoNotesPanelProps) {
  // Apply defaults with nullish coalescing - handles explicit undefined from wrapper components
  const effective_save_mode = save_mode ?? 'explicit';
  const effective_background_color = background_color ?? 'bg-yellow-100';

  const [new_note_text, set_new_note_text] = useState('');
  const [is_saving, set_is_saving] = useState(false);
  const file_input_ref = useRef<HTMLInputElement>(null);

  // File upload hook
  const {
    pending_files,
    upload_file,
    remove_file,
    clear_files,
    uploading,
    error: upload_error,
  } = use_notes_file_upload({
    ref_id,
    max_file_size_mb,
    allowed_file_types,
  });

  // Handle save note
  const handle_save = async () => {
    if (!new_note_text.trim() && pending_files.length === 0) return;

    set_is_saving(true);
    try {
      // Build note text with file references
      let final_note_text = new_note_text.trim();

      // Append file references if not already in text
      for (const file of pending_files) {
        const ref = create_file_reference(file.file_no, file.embed_type);
        if (!final_note_text.includes(ref)) {
          final_note_text += `\n${ref}`;
        }
      }

      await on_add_note({
        note_text: final_note_text,
        note_files: pending_files.length > 0 ? pending_files : undefined,
      });

      // Clear inputs on success
      set_new_note_text('');
      clear_files();
    } finally {
      set_is_saving(false);
    }
  };

  // Handle auto-save on blur (if enabled)
  const handle_blur = () => {
    if (effective_save_mode === 'auto' && (new_note_text.trim() || pending_files.length > 0)) {
      handle_save();
    }
  };

  // Handle file selection
  const handle_file_select = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (pending_files.length >= max_files_per_note) {
        break;
      }
      await upload_file(file);
    }

    // Reset input
    if (file_input_ref.current) {
      file_input_ref.current.value = '';
    }
  };

  // Handle paste event for images
  const handle_paste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (!enable_files) return;
    if (pending_files.length >= max_files_per_note) return;

    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          // Get cursor position before async operation
          const textarea = e.currentTarget;
          const cursor_pos = textarea.selectionStart;

          // Create a named file from the blob
          const extension = item.type.split('/')[1] || 'png';
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const named_file = new File([file], `pasted-image-${timestamp}.${extension}`, {
            type: item.type,
          });

          // Upload and get the file reference
          const uploaded = await upload_file(named_file, 'embed');
          if (uploaded) {
            // Insert the file reference at cursor position
            const ref = create_file_reference(uploaded.file_no, 'embed');
            set_new_note_text((prev) => {
              const before = prev.slice(0, cursor_pos);
              const after = prev.slice(cursor_pos);
              return `${before}${ref}${after}`;
            });
          }
        }
        break;
      }
    }
  };

  // Render current user avatar
  const render_current_user_avatar = () => {
    if (!current_user) return null;

    if (ProfileStampComponent) {
      return (
        <ProfileStampComponent size="sm" show_name={false} show_email={false} />
      );
    }

    if (current_user.profile_image) {
      return (
        <img
          src={current_user.profile_image}
          alt={current_user.name}
          title={current_user.name}
          className="w-7 h-7 rounded-full object-cover flex-shrink-0"
        />
      );
    }

    return (
      <span
        className="w-7 h-7 rounded-full inline-flex items-center justify-center text-xs font-bold flex-shrink-0"
        style={{
          backgroundColor: get_avatar_color(current_user.name),
          color: '#ffffff',
        }}
        title={current_user.name}
      >
        {get_initials(current_user.name)}
      </span>
    );
  };

  // Derive a darker shade class for the header based on background_color
  const get_header_class = () => {
    // Extract color name and make it darker (e.g., bg-green-50 -> bg-green-200)
    const match = effective_background_color.match(/bg-(\w+)-(\d+)/);
    if (match) {
      const [, color] = match;
      return `bg-${color}-200`;
    }
    return effective_background_color;
  };

  // Get text color class based on background
  const get_text_class = () => {
    const match = effective_background_color.match(/bg-(\w+)-/);
    if (match) {
      const [, color] = match;
      return { primary: `text-${color}-900`, secondary: `text-${color}-700` };
    }
    return { primary: 'text-yellow-900', secondary: 'text-yellow-700' };
  };

  // Get border color class based on background
  const get_border_class = () => {
    const match = effective_background_color.match(/bg-(\w+)-/);
    if (match) {
      const [, color] = match;
      return `border-${color}-300`;
    }
    return 'border-yellow-300';
  };

  const header_class = get_header_class();
  const text_class = get_text_class();
  const border_class = get_border_class();

  return (
    <div className={cn('cls_hazo_notes_panel flex flex-col max-h-[500px]', effective_background_color)}>
      {/* Header - sticky note style */}
      <div className={cn('cls_hazo_notes_panel_header px-4 py-3 border-b flex-shrink-0', header_class, border_class)}>
        <h4 className={cn('font-medium text-sm', text_class.primary)}>{label}</h4>
        <p className={cn('text-xs mt-1', text_class.secondary)}>
          {notes.length} note{notes.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Error display */}
      {(error || upload_error) && (
        <div className="px-4 py-2 bg-red-100 text-red-700 text-sm border-b border-red-200">
          {error || upload_error}
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className={cn('px-4 py-6 text-center text-sm', text_class.secondary)}>
          Loading notes...
        </div>
      )}

      {/* Existing notes (scrollable area) */}
      {!loading && (
        <div className={cn('cls_hazo_notes_list flex-1 overflow-y-auto min-h-0', effective_background_color)}>
          {notes.length === 0 ? (
            <div className={cn('px-4 py-6 text-center text-sm', text_class.secondary)}>
              No notes yet.
            </div>
          ) : (
            <div className={cn('divide-y', border_class.replace('border-', 'divide-'))}>
              {notes.map((note, index) => (
                <HazoNotesEntry
                  key={`${note.created_at}-${index}`}
                  note={note}
                  ProfileStampComponent={ProfileStampComponent}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* New note textarea */}
      <div className={cn('cls_hazo_notes_new_note border-t px-4 py-3 flex-shrink-0', border_class, effective_background_color)}>
        <div className="flex items-center gap-2 mb-2">
          {current_user && render_current_user_avatar()}
          <label className={cn('text-xs font-medium', text_class.primary)}>
            Add a new note
          </label>
        </div>

        <textarea
          value={new_note_text}
          onChange={(e) => set_new_note_text(e.target.value)}
          onBlur={handle_blur}
          onPaste={handle_paste}
          className={cn(
            'cls_hazo_notes_textarea w-full min-h-[80px] rounded-md border bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 resize-y',
            border_class.replace('border-', 'border-').replace('-300', '-400'),
            `placeholder:${text_class.secondary.replace('text-', 'text-').replace('-700', '-500')}`,
            `focus-visible:ring-${border_class.replace('border-', '').replace('-300', '-500')}`
          )}
          placeholder={current_user ? (enable_files ? 'Type your note here... (paste images directly)' : 'Type your note here...') : 'Please log in to add notes'}
          disabled={!current_user || is_saving}
        />

        {/* Pending files */}
        {pending_files.length > 0 && (
          <div className="mt-2 space-y-1">
            {pending_files.map((file) => (
              <div
                key={file.file_no}
                className={cn('flex items-center justify-between px-2 py-1 rounded text-xs', header_class)}
              >
                <span className="truncate flex-1">
                  {file.filename} ({format_file_size(file.file_size || 0)})
                </span>
                <button
                  type="button"
                  onClick={() => remove_file(file.file_no)}
                  className={cn('ml-2 hover:opacity-80', text_class.secondary)}
                  title="Remove file"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        {current_user && (
          <div className="flex items-center justify-between mt-2">
            {/* File upload button */}
            {enable_files && (
              <div className="flex items-center gap-2">
                <input
                  ref={file_input_ref}
                  type="file"
                  onChange={handle_file_select}
                  accept={allowed_file_types.map(t => `.${t}`).join(',')}
                  className="hidden"
                  multiple
                  disabled={pending_files.length >= max_files_per_note || uploading}
                />
                <button
                  type="button"
                  onClick={() => file_input_ref.current?.click()}
                  disabled={pending_files.length >= max_files_per_note || uploading}
                  className={cn(
                    'px-2 py-1 text-xs rounded border',
                    pending_files.length >= max_files_per_note
                      ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                      : cn(border_class.replace('-300', '-400'), text_class.secondary, `hover:${header_class}`)
                  )}
                  title={`Attach file (${pending_files.length}/${max_files_per_note})`}
                >
                  {uploading ? 'Uploading...' : 'Attach'}
                </button>
              </div>
            )}

            {/* Save button (explicit mode) */}
            {effective_save_mode === 'explicit' && (
              <button
                type="button"
                onClick={handle_save}
                disabled={is_saving || (!new_note_text.trim() && pending_files.length === 0)}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded',
                  is_saving || (!new_note_text.trim() && pending_files.length === 0)
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : cn(header_class.replace('-200', '-500'), 'text-white', `hover:${header_class.replace('-200', '-600')}`)
                )}
              >
                {is_saving ? 'Saving...' : 'Save'}
              </button>
            )}
          </div>
        )}

        {!current_user && (
          <p className="text-xs text-red-600 mt-1">
            Please log in to add notes.
          </p>
        )}
      </div>
    </div>
  );
}
