/**
 * hazo_notes - Database-backed notes system with file attachment support
 *
 * Main entry point exports server-side utilities
 * For client components, use 'hazo_notes' (which maps to index.client.ts)
 * For API handlers, use 'hazo_notes/api'
 *
 * @packageDocumentation
 */

// Re-export everything from client
export * from './index.client.js';

// Server-only exports
export { get_config, get_notes_config, get_config_path, has_config } from './lib/config.js';
export { set_server_logger, get_server_logger } from './logger/server.js';
