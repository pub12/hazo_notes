/**
 * Logger type definitions for hazo_notes
 * Compatible with hazo_logs but does not require it as a dependency
 */

/**
 * Logger interface compatible with hazo_logs
 * Consumers can provide any logger matching this interface
 */
export interface Logger {
  error(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  debug(message: string, data?: Record<string, unknown>): void;
}

/**
 * No-op logger that silently discards all log calls
 * Used as default when no logger is provided
 */
export const noop_logger: Logger = {
  error: () => {},
  warn: () => {},
  info: () => {},
  debug: () => {},
};
