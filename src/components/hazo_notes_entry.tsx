'use client';

/**
 * HazoNotesEntry - Displays a single note entry
 *
 * Shows user avatar, timestamp, and note content with file previews
 */

import React from 'react';
import type { HazoNotesEntryProps } from '../types/index.js';
import { render_note_with_files } from './hazo_notes_file_preview.js';

/**
 * Format timestamp for display
 */
function format_timestamp(iso_timestamp: string): string {
  try {
    const date = new Date(iso_timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso_timestamp;
  }
}

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
 * Single note entry display component
 */
export function HazoNotesEntry({ note, ProfileStampComponent }: HazoNotesEntryProps) {
  const { user_name, user_avatar, created_at, note_text, note_files } = note;

  // Render avatar
  const render_avatar = () => {
    if (ProfileStampComponent) {
      const custom_fields = [{ label: 'Posted', value: format_timestamp(created_at) }];
      return (
        <ProfileStampComponent
          size="sm"
          show_name={false}
          show_email={false}
          custom_fields={custom_fields}
        />
      );
    }

    // Fallback to image or initials
    if (user_avatar) {
      return (
        <img
          src={user_avatar}
          alt={user_name}
          className="w-7 h-7 rounded-full object-cover flex-shrink-0"
          title={user_name}
        />
      );
    }

    // Initials avatar
    return (
      <span
        className="w-7 h-7 rounded-full inline-flex items-center justify-center text-xs font-bold flex-shrink-0"
        style={{
          backgroundColor: get_avatar_color(user_name),
          color: '#ffffff',
        }}
        title={user_name}
      >
        {get_initials(user_name)}
      </span>
    );
  };

  return (
    <div className="cls_hazo_notes_entry p-3">
      {/* Note header: avatar and timestamp */}
      <div className="flex items-center gap-2 mb-2">
        {render_avatar()}
        {!ProfileStampComponent && (
          <span className="text-xs text-yellow-700 flex-shrink-0">
            {format_timestamp(created_at)}
          </span>
        )}
      </div>

      {/* Note content */}
      <div className="cls_hazo_notes_entry_content ml-9 overflow-hidden">
        <div
          className="w-full min-h-[40px] rounded-md border border-yellow-400 px-3 py-2 text-sm text-yellow-900 overflow-hidden"
          style={{ backgroundColor: '#d4c896' }}
        >
          {render_note_with_files(note_text, note_files)}
        </div>
      </div>
    </div>
  );
}
