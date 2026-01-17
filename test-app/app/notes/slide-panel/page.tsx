"use client";

import { HazoNotesIcon } from "hazo_notes";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";

const sheet_components = { Sheet, SheetTrigger, SheetContent };

export default function SlidePanelPage() {
  return (
    <div className="container mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">Slide Panel Test</h1>
      <p className="text-muted-foreground mb-8">
        Notes displayed in a slide-out panel from the right side of the screen.
      </p>

      <div className="border rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">Document Review</h3>
            <p className="text-sm text-muted-foreground">
              Click to open slide panel
            </p>
          </div>
          <HazoNotesIcon
            ref_id="slide-panel-doc"
            label="Document Review"
            panel_style="slide_panel"
            sheet_components={sheet_components}
          />
        </div>
        <div className="h-32 bg-muted rounded flex items-center justify-center text-muted-foreground">
          [Document preview area]
        </div>
      </div>

      <div className="border rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">Task Comments</h3>
            <p className="text-sm text-muted-foreground">
              Another slide panel example
            </p>
          </div>
          <HazoNotesIcon
            ref_id="slide-panel-task"
            label="Task Comments"
            panel_style="slide_panel"
            background_color="bg-blue-50"
            sheet_components={sheet_components}
          />
        </div>
        <div className="h-32 bg-muted rounded flex items-center justify-center text-muted-foreground">
          [Task details area]
        </div>
      </div>

      <div className="bg-muted p-4 rounded-lg text-sm">
        <h4 className="font-semibold mb-2">Configuration:</h4>
        <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
{`<HazoNotesIcon
  ref_id="unique-id"
  label="Field Label"
  panel_style="slide_panel"  // <-- Key difference
/>`}
        </pre>
        <p className="mt-2 text-muted-foreground">
          The slide panel is useful when you have longer notes or need more space.
          It slides in from the right and can be closed by clicking outside or the X button.
        </p>
      </div>
    </div>
  );
}
