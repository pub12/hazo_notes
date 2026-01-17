"use client";

import { HazoNotesIcon } from "hazo_notes";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

const popover_components = { Popover, PopoverTrigger, PopoverContent };

export default function MultiplePage() {
  const fields = [
    { id: "multi-field-1", label: "Personal Information" },
    { id: "multi-field-2", label: "Employment History" },
    { id: "multi-field-3", label: "Education" },
    { id: "multi-field-4", label: "References" },
    { id: "multi-field-5", label: "Additional Notes" },
    { id: "multi-field-6", label: "Documents" },
  ];

  return (
    <div className="container mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">Multiple Instances Test</h1>
      <p className="text-muted-foreground mb-8">
        Multiple notes icons on a single page, each with independent state.
      </p>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <div key={field.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {index + 1}.
                </span>
                <div>
                  <h3 className="font-medium">{field.label}</h3>
                  <p className="text-xs text-muted-foreground">
                    ref_id: {field.id}
                  </p>
                </div>
              </div>
              <HazoNotesIcon
                ref_id={field.id}
                label={field.label}
                popover_components={popover_components}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-muted p-4 rounded-lg text-sm mt-6">
        <h4 className="font-semibold mb-2">Key Points:</h4>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
          <li>Each icon has a unique <code>ref_id</code></li>
          <li>Notes are stored independently per ref_id</li>
          <li>State is managed separately for each instance</li>
          <li>Only one popover/panel can be open at a time</li>
        </ul>
      </div>
    </div>
  );
}
