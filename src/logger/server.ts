/**
 * Server-side logger management
 * Used for server-only code like config.ts
 */

import 'server-only';
import type { Logger } from './types.js';
import { noop_logger } from './types.js';

/**
 * Module-level logger instance for server-side code
 * Defaults to no-op logger
 */
let server_logger: Logger = noop_logger;

/**
 * Set the logger instance for server-side code
 * Call this once during app initialization
 *
 * @example
 * ```ts
 * // In your app initialization (e.g., instrumentation.ts)
 * import { createLogger } from 'hazo_logs';
 * import { set_server_logger } from 'hazo_notes/lib';
 *
 * const logger = createLogger('hazo_notes');
 * set_server_logger(logger);
 * ```
 */
export function set_server_logger(logger: Logger): void {
  server_logger = logger;
}

/**
 * Get the current server logger instance
 * Returns no-op logger if none has been set
 */
export function get_server_logger(): Logger {
  return server_logger;
}
