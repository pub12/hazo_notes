"use client";

import { HazoNotesIcon } from "hazo_notes";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

// UI components must be passed to HazoNotesIcon since dynamic imports don't work across package boundaries
const popover_components = { Popover, PopoverTrigger, PopoverContent };

export default function BasicNotesPage() {
  return (
    <div className="container mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">Basic Notes Test</h1>
      <p className="text-muted-foreground mb-8">
        Simple note creation and display using the default popover style.
      </p>

      <div className="border rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">Income Section</h3>
            <p className="text-sm text-muted-foreground">
              Click the notes icon to add or view notes
            </p>
          </div>
          <HazoNotesIcon
            ref_id="basic-test-income"
            label="Income Section"
            popover_components={popover_components}
          />
        </div>
        <div className="h-20 bg-muted rounded flex items-center justify-center text-muted-foreground">
          [Form field content would go here]
        </div>
      </div>

      <div className="border rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">Expenses Section</h3>
            <p className="text-sm text-muted-foreground">
              Another field with independent notes
            </p>
          </div>
          <HazoNotesIcon
            ref_id="basic-test-expenses"
            label="Expenses Section"
            popover_components={popover_components}
          />
        </div>
        <div className="h-20 bg-muted rounded flex items-center justify-center text-muted-foreground">
          [Form field content would go here]
        </div>
      </div>

      <div className="bg-muted p-4 rounded-lg text-sm">
        <h4 className="font-semibold mb-2">Test Instructions:</h4>
        <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
          <li>Click the notes icon next to a section</li>
          <li>Add a note in the textarea</li>
          <li>Click Save to persist the note</li>
          <li>Close and reopen to verify persistence</li>
          <li>Notice the icon changes color when notes exist</li>
        </ol>
      </div>
    </div>
  );
}
