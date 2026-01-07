#!/usr/bin/env node

/**
 * Initialize SQLite database for test app
 */

import Database from "better-sqlite3";
import { mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, "..", "data", "test.db");

async function init() {
  console.log("Initializing hazo_notes test database...");
  console.log("Database path:", DB_PATH);

  // Ensure data directory exists
  const dataDir = dirname(DB_PATH);
  if (!existsSync(dataDir)) {
    await mkdir(dataDir, { recursive: true });
    console.log("Created data directory:", dataDir);
  }

  // Create database and table
  const db = new Database(DB_PATH);

  db.exec(`
    CREATE TABLE IF NOT EXISTS hazo_notes (
      id TEXT PRIMARY KEY,
      ref_id TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      changed_at TEXT,
      note_count INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_hazo_notes_ref_id ON hazo_notes(ref_id);
  `);

  console.log("Database initialized successfully!");

  // Show table info
  const tableInfo = db.prepare("PRAGMA table_info(hazo_notes)").all();
  console.log("\nTable schema:");
  tableInfo.forEach((col) => {
    console.log(`  ${col.name} (${col.type})${col.pk ? " PRIMARY KEY" : ""}`);
  });

  db.close();
}

init().catch((error) => {
  console.error("Failed to initialize database:", error);
  process.exit(1);
});
