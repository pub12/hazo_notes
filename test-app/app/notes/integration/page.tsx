"use client";

import { useState } from "react";
import { HazoNotesIcon, LoggerProvider, type NoteEntry } from "hazo_notes";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";

const popover_components = { Popover, PopoverTrigger, PopoverContent };
const sheet_components = { Sheet, SheetTrigger, SheetContent };

// Simple console logger for testing
const testLogger = {
  debug: (msg: string, data?: any) => console.log("[DEBUG]", msg, data),
  info: (msg: string, data?: any) => console.log("[INFO]", msg, data),
  warn: (msg: string, data?: any) => console.warn("[WARN]", msg, data),
  error: (msg: string, data?: any) => console.error("[ERROR]", msg, data),
};

export default function IntegrationPage() {
  // Controlled mode state
  const [controlledNotes, setControlledNotes] = useState<NoteEntry[]>([
    {
      userid: "user-1",
      user_name: "Alice Smith",
      user_email: "alice@example.com",
      created_at: new Date(Date.now() - 3600000).toISOString(),
      note_text: "This is a pre-populated note from controlled mode.",
    },
  ]);

  return (
    <LoggerProvider logger={testLogger}>
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold mb-4">Integration Test</h1>
        <p className="text-muted-foreground mb-8">
          Full integration test demonstrating all features together.
        </p>

        {/* Uncontrolled Mode */}
        <div className="border rounded-lg p-6 mb-6">
          <h2 className="font-semibold text-lg mb-4">Uncontrolled Mode</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Notes are fetched from and saved to the API automatically.
          </p>

          <div className="flex items-center justify-between p-4 bg-muted rounded">
            <span>Tax Return - Section A</span>
            <HazoNotesIcon
              ref_id="integration-uncontrolled"
              label="Tax Return - Section A"
              panel_style="popover"
              enable_files={true}
              on_open={() => console.log("Panel opened")}
              on_close={() => console.log("Panel closed")}
              popover_components={popover_components}
            />
          </div>
        </div>

        {/* Controlled Mode */}
        <div className="border rounded-lg p-6 mb-6">
          <h2 className="font-semibold text-lg mb-4">Controlled Mode</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Notes are managed by parent component state. No API calls.
          </p>

          <div className="flex items-center justify-between p-4 bg-muted rounded mb-4">
            <span>Review Comments ({controlledNotes.length} notes)</span>
            <HazoNotesIcon
              ref_id="integration-controlled"
              label="Review Comments"
              notes={controlledNotes}
              on_notes_change={setControlledNotes}
              has_notes={controlledNotes.length > 0}
              note_count={controlledNotes.length}
              current_user={{
                id: "current-user",
                name: "Current User",
                email: "current@example.com",
              }}
              popover_components={popover_components}
            />
          </div>

          <div className="text-xs bg-background p-2 rounded">
            <strong>Current state:</strong>
            <pre className="mt-1 overflow-x-auto">
              {JSON.stringify(controlledNotes, null, 2)}
            </pre>
          </div>
        </div>

        {/* Slide Panel Mode */}
        <div className="border rounded-lg p-6 mb-6">
          <h2 className="font-semibold text-lg mb-4">Slide Panel + Auto-Save</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Combining slide panel style with auto-save mode.
          </p>

          <div className="flex items-center justify-between p-4 bg-muted rounded">
            <span>Project Documentation</span>
            <HazoNotesIcon
              ref_id="integration-slide-auto"
              label="Project Documentation"
              panel_style="slide_panel"
              save_mode="auto"
              background_color="bg-blue-50"
              sheet_components={sheet_components}
            />
          </div>
        </div>

        {/* Logger Output */}
        <div className="bg-muted p-4 rounded-lg text-sm">
          <h4 className="font-semibold mb-2">Logger Integration:</h4>
          <p className="text-muted-foreground">
            Open browser dev tools to see log output from the LoggerProvider.
            The hazo_notes components use the injected logger for debugging.
          </p>
          <pre className="text-xs bg-background p-2 rounded mt-2 overflow-x-auto">
{`<LoggerProvider logger={customLogger}>
  <HazoNotesIcon ... />
</LoggerProvider>`}
          </pre>
        </div>
      </div>
    </LoggerProvider>
  );
}
