/**
 * Logger utilities for hazo_notes
 * Provides injectable logging for client components
 */

export type { Logger } from './types.js';
export { noop_logger } from './types.js';
export { LoggerProvider, use_logger } from './context.js';
export type { LoggerProviderProps } from './context.js';
