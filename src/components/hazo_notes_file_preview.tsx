'use client';

/**
 * HazoNotesFilePreview - Renders file attachments in notes
 *
 * Displays embedded images inline or renders download links for attachments
 */

import React from 'react';
import type { HazoNotesFilePreviewProps, NoteFile } from '../types/index.js';
import { cn } from '../utils/cn.js';
import { format_file_size, is_image_file } from '../utils/file_utils.js';

/**
 * Render a file preview based on display mode and file type
 */
export function HazoNotesFilePreview({
  file,
  display_mode,
}: HazoNotesFilePreviewProps) {
  const is_image = is_image_file(file.filename);

  // For embedded images
  if (display_mode === 'embed' && is_image) {
    const src = file.filedata.startsWith('/')
      ? file.filedata // Filesystem path
      : `data:${file.mime_type || 'image/png'};base64,${file.filedata}`; // Base64

    return (
      <div className="cls_hazo_notes_file_embed my-2">
        <img
          src={src}
          alt={file.filename}
          className="max-w-full max-h-64 rounded-md border border-yellow-300"
          loading="lazy"
        />
        <p className="text-xs text-yellow-700 mt-1">{file.filename}</p>
      </div>
    );
  }

  // For attachments or non-image embeds
  return (
    <div className="cls_hazo_notes_file_attachment my-2 overflow-hidden">
      <a
        href={
          file.filedata.startsWith('/')
            ? file.filedata
            : `data:${file.mime_type || 'application/octet-stream'};base64,${file.filedata}`
        }
        download={file.filename}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-md text-sm max-w-full',
          'bg-yellow-200 hover:bg-yellow-300 text-yellow-900',
          'border border-yellow-400 transition-colors'
        )}
      >
        <FileIcon mime_type={file.mime_type} />
        <span className="font-medium truncate min-w-0 flex-1">{file.filename}</span>
        {file.file_size && (
          <span className="text-yellow-700 text-xs whitespace-nowrap flex-shrink-0">
            ({format_file_size(file.file_size)})
          </span>
        )}
      </a>
    </div>
  );
}

/**
 * File icon based on MIME type
 */
function FileIcon({ mime_type }: { mime_type?: string }) {
  const type = mime_type || 'application/octet-stream';

  // PDF icon
  if (type.includes('pdf')) {
    return (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  // Image icon
  if (type.startsWith('image/')) {
    return (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  // Default document icon
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * Parse note text and render with inline file previews
 */
export function render_note_with_files(
  note_text: string,
  note_files?: NoteFile[]
): React.ReactNode {
  if (!note_files || note_files.length === 0) {
    return note_text;
  }

  // Create a map of file_no to file
  const file_map = new Map(note_files.map((f) => [f.file_no, f]));

  // Split text by file references
  const parts: React.ReactNode[] = [];
  let last_index = 0;
  let key = 0;

  // Match <<embed:0001>> and <<attach:0001>> patterns
  const regex = /<<(embed|attach):(\d+)>>/g;
  let match;

  while ((match = regex.exec(note_text)) !== null) {
    // Add text before the match
    if (match.index > last_index) {
      parts.push(
        <span key={key++}>{note_text.slice(last_index, match.index)}</span>
      );
    }

    // Add file preview
    const [, type, file_no] = match;
    const file = file_map.get(file_no);

    if (file) {
      parts.push(
        <HazoNotesFilePreview
          key={key++}
          file={file}
          display_mode={type as 'embed' | 'attachment'}
        />
      );
    } else {
      // File not found - show placeholder
      parts.push(
        <span key={key++} className="text-yellow-600 italic">
          [File not found: {file_no}]
        </span>
      );
    }

    last_index = match.index + match[0].length;
  }

  // Add remaining text
  if (last_index < note_text.length) {
    parts.push(<span key={key++}>{note_text.slice(last_index)}</span>);
  }

  return <>{parts}</>;
}
