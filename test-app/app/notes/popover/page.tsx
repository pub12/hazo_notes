"use client";

import { HazoNotesIcon } from "hazo_notes";

export default function PopoverStylePage() {
  return (
    <div className="container mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">Popover Style Test</h1>
      <p className="text-muted-foreground mb-8">
        Notes displayed in a popover container with different configurations.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Default Yellow</h3>
              <p className="text-sm text-muted-foreground">
                Default bg-yellow-100 background
              </p>
            </div>
            <HazoNotesIcon
              ref_id="popover-yellow"
              label="Yellow Theme"
              panel_style="popover"
              background_color="bg-yellow-100"
            />
          </div>
        </div>

        <div className="border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Blue Theme</h3>
              <p className="text-sm text-muted-foreground">
                Custom bg-blue-50 background
              </p>
            </div>
            <HazoNotesIcon
              ref_id="popover-blue"
              label="Blue Theme"
              panel_style="popover"
              background_color="bg-blue-50"
            />
          </div>
        </div>

        <div className="border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Green Theme</h3>
              <p className="text-sm text-muted-foreground">
                Custom bg-green-50 background
              </p>
            </div>
            <HazoNotesIcon
              ref_id="popover-green"
              label="Green Theme"
              panel_style="popover"
              background_color="bg-green-50"
            />
          </div>
        </div>

        <div className="border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Gray Theme</h3>
              <p className="text-sm text-muted-foreground">
                Custom bg-gray-100 background
              </p>
            </div>
            <HazoNotesIcon
              ref_id="popover-gray"
              label="Gray Theme"
              panel_style="popover"
              background_color="bg-gray-100"
            />
          </div>
        </div>
      </div>

      <div className="bg-muted p-4 rounded-lg text-sm mt-6">
        <h4 className="font-semibold mb-2">Configuration:</h4>
        <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
{`<HazoNotesIcon
  ref_id="unique-id"
  label="Field Label"
  panel_style="popover"
  background_color="bg-yellow-100"
/>`}
        </pre>
      </div>
    </div>
  );
}
