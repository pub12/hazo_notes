/**
 * Notes API route using SQLite for test app
 */

import { NextResponse } from "next/server";
import path from "path";

export const dynamic = "force-dynamic";

// Simple SQLite wrapper using better-sqlite3
let db: any = null;

async function getDb() {
  if (db) return db;

  try {
    const Database = (await import("better-sqlite3")).default;
    const dbPath = path.join(process.cwd(), "data", "test.db");
    db = new Database(dbPath);

    // Ensure table exists
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

    return db;
  } catch (error) {
    console.error("[hazo_notes API] Failed to initialize database:", error);
    throw error;
  }
}

// Generate UUID
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ref_id: string }> }
) {
  try {
    const { ref_id } = await params;
    const database = await getDb();

    const row = database
      .prepare("SELECT * FROM hazo_notes WHERE ref_id = ?")
      .get(ref_id);

    if (!row) {
      return NextResponse.json({
        success: true,
        notes: [],
        note_count: 0,
      });
    }

    const notes = JSON.parse(row.note || "[]");

    // Enrich with mock user data
    const enriched_notes = notes.map((note: any) => ({
      ...note,
      user_name: "Test User",
      user_email: "test@example.com",
      user_avatar: null,
    }));

    return NextResponse.json({
      success: true,
      notes: enriched_notes,
      note_count: row.note_count,
    });
  } catch (error) {
    console.error("[hazo_notes API] GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch notes" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ ref_id: string }> }
) {
  try {
    const { ref_id } = await params;
    const body = await request.json();
    const { note_text, note_files } = body;

    if (!note_text) {
      return NextResponse.json(
        { success: false, error: "note_text is required" },
        { status: 400 }
      );
    }

    const database = await getDb();

    // Create new note entry
    const new_note = {
      userid: "test-user-123",
      created_at: new Date().toISOString(),
      note_text: note_text.trim(),
      note_files: note_files || undefined,
    };

    // Check if row exists
    const existing = database
      .prepare("SELECT * FROM hazo_notes WHERE ref_id = ?")
      .get(ref_id);

    let updated_count: number;

    if (!existing) {
      // Create new row
      const new_id = generateUUID();
      database
        .prepare(
          `INSERT INTO hazo_notes (id, ref_id, note, note_count, created_at)
           VALUES (?, ?, ?, 1, datetime('now'))`
        )
        .run(new_id, ref_id, JSON.stringify([new_note]));
      updated_count = 1;
    } else {
      // Append to existing
      const existing_notes = JSON.parse(existing.note || "[]");
      const updated_notes = [...existing_notes, new_note];
      updated_count = updated_notes.length;

      database
        .prepare(
          `UPDATE hazo_notes
           SET note = ?, note_count = ?, changed_at = datetime('now')
           WHERE id = ?`
        )
        .run(JSON.stringify(updated_notes), updated_count, existing.id);
    }

    // Return enriched note
    const enriched_note = {
      ...new_note,
      user_name: "Test User",
      user_email: "test@example.com",
      user_avatar: null,
    };

    return NextResponse.json({
      success: true,
      note: enriched_note,
      note_count: updated_count,
    });
  } catch (error) {
    console.error("[hazo_notes API] POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add note" },
      { status: 500 }
    );
  }
}
