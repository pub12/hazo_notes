'use client';

/**
 * React Context for client-side logger injection
 * Allows consuming apps to provide their own logger instance
 */

import React, { createContext, useContext, type ReactNode } from 'react';
import type { Logger } from './types.js';
import { noop_logger } from './types.js';

/**
 * Context for providing logger to client components
 */
const LoggerContext = createContext<Logger>(noop_logger);

/**
 * Props for LoggerProvider
 */
export interface LoggerProviderProps {
  /**
   * Logger instance to provide to child components
   * If not provided, a no-op logger is used
   */
  logger?: Logger;

  /**
   * Child components
   */
  children: ReactNode;
}

/**
 * Provider component for injecting logger into client components
 * Wrap your app or component tree with this provider to enable logging
 *
 * @example
 * ```tsx
 * import { createClientLogger } from 'hazo_logs/ui';
 * import { LoggerProvider } from 'hazo_notes';
 *
 * const logger = createClientLogger({ packageName: 'my_app' });
 *
 * <LoggerProvider logger={logger}>
 *   <MyApp />
 * </LoggerProvider>
 * ```
 */
export function LoggerProvider({ logger, children }: LoggerProviderProps) {
  return (
    <LoggerContext.Provider value={logger || noop_logger}>
      {children}
    </LoggerContext.Provider>
  );
}

/**
 * Hook to access the logger from context
 * Returns no-op logger if no provider is found
 *
 * @example
 * ```tsx
 * const logger = use_logger();
 * logger.debug('Component mounted', { ref_id: 'my_note_ref' });
 * ```
 */
export function use_logger(): Logger {
  return useContext(LoggerContext);
}
