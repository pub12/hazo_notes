'use client';

/**
 * HazoNotesIcon - Main trigger component for notes panel
 *
 * Displays a notes icon that opens either a popover or slide panel
 * Supports both controlled and uncontrolled modes
 */

import React, { useState, useEffect } from 'react';
import type { HazoNotesIconProps, NoteUserInfo, NoteEntry, NewNoteInput } from '../types/index.js';
import { cn } from '../utils/cn.js';
import { use_logger } from '../logger/context.js';
import { use_notes } from '../hooks/use_notes.js';

// Default IoDocumentText icon (inline SVG to avoid hard dependency on react-icons)
function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      stroke="currentColor"
      fill="currentColor"
      strokeWidth="0"
      viewBox="0 0 512 512"
      height="1em"
      width="1em"
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
  panel_style = 'popover',
  save_mode = 'explicit',
  background_color = 'bg-yellow-100',
  enable_files = true,
  max_files_per_note = 5,
  allowed_file_types = ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'doc', 'docx'],
  max_file_size_mb = 10,
  on_open,
  on_close,
  disabled,
  className,
}: HazoNotesIconProps) {
  const logger = use_logger();
  const [is_open, set_is_open] = useState(false);
  const [fetched_user, set_fetched_user] = useState<NoteUserInfo | null>(null);

  // Dynamic UI components
  const [PopoverComponents, setPopoverComponents] = useState<{
    Popover: React.ComponentType<any>;
    PopoverTrigger: React.ComponentType<any>;
    PopoverContent: React.ComponentType<any>;
  } | null>(null);

  const [SheetComponents, setSheetComponents] = useState<{
    Sheet: React.ComponentType<any>;
    SheetTrigger: React.ComponentType<any>;
    SheetContent: React.ComponentType<any>;
  } | null>(null);

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

  // Load Popover components
  useEffect(() => {
    if (panel_style === 'popover') {
      const loadComponents = async () => {
        try {
          // @ts-expect-error - Module provided by consuming app
          const popoverModule = await import('@/components/ui/popover').catch(() => null);
          if (popoverModule) {
            setPopoverComponents({
              Popover: popoverModule.Popover,
              PopoverTrigger: popoverModule.PopoverTrigger,
              PopoverContent: popoverModule.PopoverContent,
            });
          }
        } catch {
          logger.debug('[HazoNotesIcon] Popover components not available');
        }
      };
      loadComponents();
    }
  }, [panel_style, logger]);

  // Load Sheet components for slide_panel
  useEffect(() => {
    if (panel_style === 'slide_panel') {
      const loadComponents = async () => {
        try {
          // @ts-expect-error - Module provided by consuming app
          const sheetModule = await import('@/components/ui/sheet').catch(() => null);
          if (sheetModule) {
            setSheetComponents({
              Sheet: sheetModule.Sheet,
              SheetTrigger: sheetModule.SheetTrigger,
              SheetContent: sheetModule.SheetContent,
            });
          }
        } catch {
          logger.debug('[HazoNotesIcon] Sheet components not available');
        }
      };
      loadComponents();
    }
  }, [panel_style, logger]);

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

  // Render trigger button
  const trigger_button = (
    <button
      type="button"
      className={cn(
        'cls_hazo_notes_icon flex h-9 w-9 items-center justify-center rounded-md border border-input bg-transparent text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        has_notes && 'bg-amber-100 border-amber-500',
        className
      )}
      aria-label={`Notes for ${label}`}
      title={`Notes for ${label}${has_notes ? ` (${display_count})` : ''}`}
    >
      <DocumentIcon className={cn('h-5 w-5', has_notes && 'text-amber-600')} />
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
    save_mode,
    background_color,
    loading,
    error,
    enable_files,
    max_files_per_note,
    allowed_file_types,
    max_file_size_mb,
    ProfileStampComponent,
  };

  // Render with popover
  if (panel_style === 'popover' && PopoverComponents) {
    const { Popover, PopoverTrigger, PopoverContent } = PopoverComponents;
    return (
      <div className="cls_hazo_notes_icon_wrapper">
        <Popover open={is_open} onOpenChange={handle_open_change}>
          <PopoverTrigger asChild>{trigger_button}</PopoverTrigger>
          <PopoverContent
            className="w-80 p-0"
            align="end"
            side="bottom"
            sideOffset={5}
            collisionPadding={16}
            avoidCollisions={true}
          >
            {HazoNotesPanelComponent && <HazoNotesPanelComponent {...panel_props} />}
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  // Render with slide panel (sheet)
  if (panel_style === 'slide_panel' && SheetComponents) {
    const { Sheet, SheetTrigger, SheetContent } = SheetComponents;
    return (
      <div className="cls_hazo_notes_icon_wrapper">
        <Sheet open={is_open} onOpenChange={handle_open_change}>
          <SheetTrigger asChild>{trigger_button}</SheetTrigger>
          <SheetContent className="w-96 p-0 sm:max-w-md">
            {HazoNotesPanelComponent && <HazoNotesPanelComponent {...panel_props} />}
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  // Fallback when components not loaded - still clickable but shows tooltip
  return (
    <div className="cls_hazo_notes_icon_wrapper">
      {React.cloneElement(trigger_button, {
        onClick: () => {
          logger.warn('[HazoNotesIcon] UI components not loaded. Install @radix-ui/react-popover or @radix-ui/react-dialog');
        },
        title: panel_style === 'popover'
          ? 'Notes unavailable - install @radix-ui/react-popover'
          : 'Notes unavailable - install @radix-ui/react-dialog',
      })}
    </div>
  );
}
