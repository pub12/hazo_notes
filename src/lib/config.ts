/**
 * Configuration management using hazo_config
 * Reads from hazo_notes_config.ini
 *
 * NOTE: This module is server-only and cannot be imported in client components
 */

import 'server-only';
import { HazoConfig } from 'hazo_config';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { get_server_logger } from '../logger/server.js';
import type { HazoNotesConfig } from '../types/index.js';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Config file name and subdirectory
const CONFIG_SUBDIR = 'config';
const CONFIG_FILE_NAME = 'hazo_notes_config.ini';

// Create a singleton instance of HazoConfig
let config_instance: HazoConfig | null = null;
let config_path_used: string | null = null;
let config_missing_warned = false;

/**
 * Get the HazoConfig instance, creating it if it doesn't exist
 * Looks for config file in the consuming application's root (process.cwd())
 * Falls back to package root if not found
 * @returns The HazoConfig instance or null if config file not found
 */
function get_config_instance(): HazoConfig | null {
  if (config_instance) {
    return config_instance;
  }

  // First try to find config in the consuming app's config subdirectory
  const app_root_config = path.resolve(process.cwd(), CONFIG_SUBDIR, CONFIG_FILE_NAME);
  // Fallback to package config subdirectory (for development/testing)
  const package_root_config = path.resolve(__dirname, '../../', CONFIG_SUBDIR, CONFIG_FILE_NAME);

  let config_path: string | null = null;

  if (existsSync(app_root_config)) {
    config_path = app_root_config;
  } else if (existsSync(package_root_config)) {
    config_path = package_root_config;
  }

  if (!config_path) {
    // Only warn once to avoid log spam
    if (!config_missing_warned) {
      config_missing_warned = true;
      get_server_logger().warn('[hazo_notes] Config file not found', {
        searched_locations: [app_root_config, package_root_config],
        hint: `Copy template: cp node_modules/hazo_notes/templates/${CONFIG_SUBDIR}/${CONFIG_FILE_NAME} ./${CONFIG_SUBDIR}/`,
      });
    }
    return null;
  }

  config_path_used = config_path;
  config_instance = new HazoConfig({
    filePath: config_path,
  });

  return config_instance;
}

/**
 * Get configuration values from the config file
 * @param section - The section name in the config file
 * @param key - The key within the section
 * @returns The configuration value or undefined if not found or config file missing
 */
export function get_config(section: string, key: string): string | undefined {
  try {
    const config = get_config_instance();
    if (!config) {
      return undefined;
    }
    return config.get(section, key);
  } catch (error) {
    get_server_logger().error('[hazo_notes] Error reading config', {
      section,
      key,
      error: error instanceof Error ? error.message : String(error),
    });
    return undefined;
  }
}

/**
 * Get the full notes configuration with defaults
 * @returns Complete HazoNotesConfig object
 */
export function get_notes_config(): HazoNotesConfig {
  return {
    ui: {
      background_color: get_config('ui', 'background_color') || 'bg-yellow-100',
      panel_style: (get_config('ui', 'panel_style') as 'popover' | 'slide_panel') || 'popover',
      save_mode: (get_config('ui', 'save_mode') as 'explicit' | 'auto') || 'explicit',
    },
    storage: {
      file_storage_mode: (get_config('storage', 'file_storage_mode') as 'jsonb' | 'filesystem') || 'jsonb',
      file_storage_path: get_config('storage', 'file_storage_path') || '/uploads/notes',
    },
    files: {
      max_file_size_mb: parseInt(get_config('files', 'max_file_size_mb') || '10', 10),
      allowed_file_types: (get_config('files', 'allowed_file_types') || 'pdf,png,jpg,jpeg,gif,doc,docx').split(',').map(t => t.trim()),
      max_files_per_note: parseInt(get_config('files', 'max_files_per_note') || '5', 10),
    },
    logging: {
      logfile: get_config('logging', 'logfile') || 'logs/hazo_notes.log',
    },
  };
}

/**
 * Get the path to the config file currently in use
 * @returns The config file path or null if no config loaded
 */
export function get_config_path(): string | null {
  return config_path_used;
}

/**
 * Check if a config file has been loaded
 * @returns true if config file exists and was loaded
 */
export function has_config(): boolean {
  return get_config_instance() !== null;
}
