'use client';

/**
 * HazoNotesIcon - Main trigger component for notes panel
 *
 * Displays a notes icon that opens either a popover or slide panel
 * Supports both controlled and uncontrolled modes
 */

import React, { useState, useEffect } from 'react';
import * as Popover from '@radix-ui/react-popover';
import type { HazoNotesIconProps, NoteUserInfo, NoteEntry, NewNoteInput } from '../types/index.js';
import { cn } from '../utils/cn.js';
import { use_logger } from '../logger/context.js';
import { use_notes } from '../hooks/use_notes.js';
import { Sheet, SheetTrigger, SheetContent } from './internal/sheet.js';

// Default IoDocumentText icon (inline SVG to avoid hard dependency on react-icons)
function DocumentIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      className={className}
      style={style}
      stroke="currentColor"
      fill="currentColor"
      strokeWidth="0"
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M428 224H288a48 48 0 01-48-48V36a4 4 0 00-4-4h-92a64 64 0 00-64 64v320a64 64 0 0064 64h224a64 64 0 0064-64V228a4 4 0 00-4-4zm-92 160H176a16 16 0 010-32h160a16 16 0 010 32zm0-80H176a16 16 0 010-32h160a16 16 0 010 32z" />
      <path d="M419.22 188.59L275.41 44.78a2 2 0 00-3.41 1.41V176a16 16 0 0016 16h129.81a2 2 0 001.41-3.41z" />
    </svg>
  );
}

/**
 * Main notes icon component
 */
export function HazoNotesIcon({
  ref_id,
  label = 'Notes',
  has_notes: has_notes_prop,
  note_count: note_count_prop,
  notes: controlled_notes,
  on_notes_change,
  current_user,
  panel_style,
  save_mode,
  background_color,
  enable_files = true,
  max_files_per_note = 5,
  allowed_file_types = ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'doc', 'docx'],
  max_file_size_mb = 10,
  on_open,
  on_close,
  disabled,
  className,
  icon_size = 28,
  show_border = true,
}: HazoNotesIconProps) {
  const logger = use_logger();

  // Apply defaults with nullish coalescing - handles explicit undefined from wrapper components
  const effective_panel_style = panel_style ?? 'popover';
  const effective_save_mode = save_mode ?? 'explicit';
  const effective_background_color = background_color ?? 'bg-yellow-100';
  const [is_open, set_is_open] = useState(false);
  const [fetched_user, set_fetched_user] = useState<NoteUserInfo | null>(null);

  const [ProfileStampComponent, setProfileStampComponent] = useState<React.ComponentType<any> | null>(null);
  const [HazoNotesPanelComponent, setHazoNotesPanelComponent] = useState<React.ComponentType<any> | null>(null);

  // Use the notes hook for uncontrolled mode
  const {
    notes: fetched_notes,
    note_count,
    add_note,
    loading,
    error,
  } = use_notes(ref_id, {
    skip: !!controlled_notes,
  });

  const notes = controlled_notes ?? fetched_notes;
  const has_notes = has_notes_prop ?? (notes.length > 0);
  const display_count = note_count_prop ?? note_count;

  // Fetch user info if not provided
  useEffect(() => {
    if (!current_user) {
      const fetch_user = async () => {
        try {
          const response = await fetch('/api/hazo_auth/me', {
            credentials: 'include',
          });
          if (response.ok) {
            const data = await response.json();
            if (data.authenticated) {
              set_fetched_user({
                id: data.user_id || data.id,
                name: data.user_name || data.name || 'User',
                email: data.user_email || data.email || '',
                profile_image: data.profile_image || data.avatar_url || data.profile_picture_url,
              });
            }
          }
        } catch (error) {
          logger.debug('[HazoNotesIcon] Error fetching user', {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      };
      fetch_user();
    }
  }, [current_user, logger]);

  // Load ProfileStamp from hazo_auth
  useEffect(() => {
    const loadProfileStamp = async () => {
      try {
        const modulePath = 'hazo_auth/client';
        const hazoAuthModule = await import(/* webpackIgnore: true */ modulePath).catch(() => null) as Record<string, unknown> | null;
        if (hazoAuthModule?.ProfileStamp) {
          setProfileStampComponent(() => hazoAuthModule.ProfileStamp as React.ComponentType<any>);
        }
      } catch {
        logger.debug('[HazoNotesIcon] ProfileStamp not available');
      }
    };
    loadProfileStamp();
  }, [logger]);

  // Load HazoNotesPanel
  useEffect(() => {
    const loadPanel = async () => {
      const { HazoNotesPanel } = await import('./hazo_notes_panel.js');
      setHazoNotesPanelComponent(() => HazoNotesPanel);
    };
    loadPanel();
  }, []);

  const effective_user = current_user || fetched_user;

  // Handle open/close
  const handle_open_change = (open: boolean) => {
    set_is_open(open);
    if (open) {
      on_open?.();
    } else {
      on_close?.();
    }
  };

  // Handle add note
  const handle_add_note = async (note_input: NewNoteInput): Promise<void> => {
    if (on_notes_change) {
      // Controlled mode - let parent handle
      const new_note: NoteEntry = {
        userid: effective_user?.id || '',
        user_name: effective_user?.name || 'Unknown',
        user_email: effective_user?.email || '',
        user_avatar: effective_user?.profile_image,
        created_at: new Date().toISOString(),
        note_text: note_input.note_text,
        note_files: note_input.note_files,
      };
      on_notes_change([...notes, new_note]);
    } else {
      // Uncontrolled mode - use hook
      await add_note(note_input.note_text, note_input.note_files);
    }
  };

  // Don't render if disabled
  if (disabled) {
    return null;
  }

  // Calculate icon size (approximately 57% of button size to match h-4 w-4 icons at 28px button)
  const inner_icon_size = Math.round(icon_size * 0.57);

  // Render trigger button
  const trigger_button = (
    <button
      type="button"
      className={cn(
        'cls_hazo_notes_icon flex items-center justify-center rounded-md bg-transparent text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        show_border && 'border border-input',
        has_notes && 'bg-amber-100',
        has_notes && show_border && 'border-amber-500',
        className
      )}
      style={{ width: icon_size, height: icon_size }}
      aria-label={`Notes for ${label}`}
      title={`Notes for ${label}${has_notes ? ` (${display_count})` : ''}`}
    >
      <DocumentIcon
        className={cn(has_notes && 'text-amber-600')}
        style={{ width: inner_icon_size, height: inner_icon_size }}
      />
    </button>
  );

  // Panel props
  const panel_props = {
    ref_id,
    label,
    notes,
    on_add_note: handle_add_note,
    on_close: () => handle_open_change(false),
    current_user: effective_user,
    save_mode: effective_save_mode,
    background_color: effective_background_color,
    loading,
    error,
    enable_files,
    max_files_per_note,
    allowed_file_types,
    max_file_size_mb,
    ProfileStampComponent,
  };

  // Render with popover
  if (effective_panel_style === 'popover') {
    return (
      <div className="cls_hazo_notes_icon_wrapper">
        <Popover.Root open={is_open} onOpenChange={handle_open_change}>
          <Popover.Trigger asChild>{trigger_button}</Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              className="cls_hazo_notes_popover_content"
              style={{
                width: '320px',
                padding: 0,
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 10px 38px -10px rgba(22,23,24,0.35), 0 10px 20px -15px rgba(22,23,24,0.2)',
                zIndex: 50,
              }}
              align="end"
              side="bottom"
              sideOffset={5}
              collisionPadding={16}
              avoidCollisions={true}
            >
              {HazoNotesPanelComponent && <HazoNotesPanelComponent {...panel_props} />}
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>
    );
  }

  // Render with slide panel (sheet)
  if (effective_panel_style === 'slide_panel') {
    return (
      <div className="cls_hazo_notes_icon_wrapper">
        <Sheet open={is_open} onOpenChange={handle_open_change}>
          <SheetTrigger asChild>{trigger_button}</SheetTrigger>
          <SheetContent>
            {HazoNotesPanelComponent && <HazoNotesPanelComponent {...panel_props} />}
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  // Fallback (should not reach here with valid panel_style)
  return (
    <div className="cls_hazo_notes_icon_wrapper">
      {trigger_button}
    </div>
  );
}
