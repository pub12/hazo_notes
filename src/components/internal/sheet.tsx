'use client';

/**
 * Internal Sheet component for hazo_notes
 *
 * A self-contained slide-in panel built on @radix-ui/react-dialog
 * Uses inline styles to avoid external dependencies
 */

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '../../utils/cn.js';

// Re-export primitives
const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;
const SheetPortal = DialogPrimitive.Portal;

// Overlay component with fade animation
const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, style, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn('cls_hazo_sheet_overlay', className)}
    style={{
      position: 'fixed',
      inset: 0,
      zIndex: 50,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      ...style,
    }}
    {...props}
  />
));
SheetOverlay.displayName = 'SheetOverlay';

// X close icon (inline SVG to avoid lucide-react dependency)
function CloseIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      className={className}
      style={{ width: 16, height: 16, ...style }}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

interface SheetContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  /** Which side the sheet slides in from */
  side?: 'right' | 'left' | 'top' | 'bottom';
}

// Content component with slide animation
const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  SheetContentProps
>(({ side = 'right', className, style, children, ...props }, ref) => {
  // Base styles for content panel
  const baseStyles: React.CSSProperties = {
    position: 'fixed',
    zIndex: 50,
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    backgroundColor: 'white',
    padding: 0,
    boxShadow: '-4px 0 6px -1px rgba(0, 0, 0, 0.1), -2px 0 4px -1px rgba(0, 0, 0, 0.06)',
  };

  // Side-specific styles
  const sideStyles: Record<string, React.CSSProperties> = {
    right: {
      top: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      maxWidth: '24rem',
      borderLeft: '1px solid #e5e7eb',
    },
    left: {
      top: 0,
      left: 0,
      bottom: 0,
      width: '100%',
      maxWidth: '24rem',
      borderRight: '1px solid #e5e7eb',
    },
    top: {
      top: 0,
      left: 0,
      right: 0,
      borderBottom: '1px solid #e5e7eb',
    },
    bottom: {
      bottom: 0,
      left: 0,
      right: 0,
      borderTop: '1px solid #e5e7eb',
    },
  };

  return (
    <SheetPortal>
      <SheetOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn('cls_hazo_sheet_content', className)}
        style={{
          ...baseStyles,
          ...sideStyles[side],
          ...style,
        }}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          className="cls_hazo_sheet_close"
          style={{
            position: 'absolute',
            right: '1rem',
            top: '1rem',
            borderRadius: '0.125rem',
            opacity: 0.7,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '0.25rem',
            transition: 'opacity 150ms',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.opacity = '0.7';
          }}
        >
          <CloseIcon />
          <span style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
            Close
          </span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </SheetPortal>
  );
});
SheetContent.displayName = 'SheetContent';

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
};
