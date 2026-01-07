"use client";

import { HazoNotesIcon } from "hazo_notes";

export default function AutoSavePage() {
  return (
    <div className="container mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">Auto-Save Mode Test</h1>
      <p className="text-muted-foreground mb-8">
        Notes are saved automatically when the panel closes or textarea loses focus.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Auto-Save Enabled</h3>
              <p className="text-sm text-muted-foreground">
                No Save button - saves on blur/close
              </p>
            </div>
            <HazoNotesIcon
              ref_id="auto-save-enabled"
              label="Auto-Save Enabled"
              save_mode="auto"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Type a note and click outside the panel to save.
          </p>
        </div>

        <div className="border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Explicit Save</h3>
              <p className="text-sm text-muted-foreground">
                Save button required (default)
              </p>
            </div>
            <HazoNotesIcon
              ref_id="auto-save-disabled"
              label="Explicit Save"
              save_mode="explicit"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Must click Save button to persist notes.
          </p>
        </div>
      </div>

      <div className="bg-muted p-4 rounded-lg text-sm mt-6">
        <h4 className="font-semibold mb-2">Save Modes:</h4>
        <div className="space-y-2 text-muted-foreground">
          <p>
            <strong>explicit</strong> (default) - User must click Save button to persist notes.
            Cancel button available to discard changes.
          </p>
          <p>
            <strong>auto</strong> - Notes are automatically saved when:
          </p>
          <ul className="list-disc list-inside ml-4">
            <li>The panel is closed</li>
            <li>The textarea loses focus (blur)</li>
          </ul>
        </div>

        <h4 className="font-semibold mt-4 mb-2">Configuration:</h4>
        <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
{`<HazoNotesIcon
  ref_id="unique-id"
  label="Field Label"
  save_mode="auto"  // or "explicit" (default)
/>`}
        </pre>
      </div>
    </div>
  );
}
