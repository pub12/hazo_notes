"use client";

import { HazoNotesIcon } from "hazo_notes";

export default function WithFilesPage() {
  return (
    <div className="container mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">File Attachments Test</h1>
      <p className="text-muted-foreground mb-8">
        Notes with file attachments using embed and attach syntax.
      </p>

      {/* Paste Image Demo */}
      <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 mb-6 bg-blue-50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-blue-900">Paste Images Directly</h3>
            <p className="text-sm text-blue-700">
              Copy an image to your clipboard, then paste it directly into the notes textarea
            </p>
          </div>
          <HazoNotesIcon
            ref_id="paste-demo"
            label="Paste Demo"
            enable_files={true}
            max_files_per_note={5}
            allowed_file_types={["png", "jpg", "jpeg", "gif", "webp"]}
            max_file_size_mb={10}
          />
        </div>
        <div className="bg-white rounded p-4 text-sm text-blue-800">
          <p className="font-medium mb-2">Try it:</p>
          <ol className="list-decimal list-inside space-y-1 text-blue-700">
            <li>Take a screenshot (Cmd+Shift+4 on Mac, Win+Shift+S on Windows)</li>
            <li>Click the notes icon above to open the panel</li>
            <li>Click in the textarea and paste (Cmd+V / Ctrl+V)</li>
            <li>The image will appear as a pending attachment</li>
            <li>Click Save to embed the image in your note</li>
          </ol>
        </div>
      </div>

      {/* Standard File Attachments */}
      <div className="border rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">Document with Images</h3>
            <p className="text-sm text-muted-foreground">
              Attach images and documents to notes via file picker
            </p>
          </div>
          <HazoNotesIcon
            ref_id="files-test-images"
            label="Document with Images"
            enable_files={true}
            max_files_per_note={5}
            allowed_file_types={["png", "jpg", "jpeg", "gif", "pdf"]}
            max_file_size_mb={10}
          />
        </div>
        <div className="h-32 bg-muted rounded flex items-center justify-center text-muted-foreground">
          [Document preview area]
        </div>
      </div>

      <div className="border rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">Files Disabled</h3>
            <p className="text-sm text-muted-foreground">
              Notes without file attachment support
            </p>
          </div>
          <HazoNotesIcon
            ref_id="files-test-disabled"
            label="Files Disabled"
            enable_files={false}
          />
        </div>
        <div className="h-20 bg-muted rounded flex items-center justify-center text-muted-foreground">
          [Content area]
        </div>
      </div>

      <div className="bg-muted p-4 rounded-lg text-sm">
        <h4 className="font-semibold mb-2">File Embedding:</h4>
        <div className="space-y-2 text-muted-foreground">
          <p>
            <strong>Paste images:</strong> Copy any image and paste directly into the textarea
          </p>
          <p>
            <strong>Attach files:</strong> Click the "Attach" button to select files
          </p>
        </div>

        <h4 className="font-semibold mt-4 mb-2">File Reference Syntax:</h4>
        <div className="space-y-2 text-muted-foreground">
          <p>
            <code className="bg-background px-1 rounded">{`<<embed:0001>>`}</code>
            - Embeds images inline in the note (default for pasted images)
          </p>
          <p>
            <code className="bg-background px-1 rounded">{`<<attach:0001>>`}</code>
            - Shows as downloadable attachment link (default for non-images)
          </p>
        </div>

        <h4 className="font-semibold mt-4 mb-2">Configuration:</h4>
        <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
{`<HazoNotesIcon
  ref_id="unique-id"
  label="Field Label"
  enable_files={true}
  max_files_per_note={5}
  allowed_file_types={["png", "jpg", "pdf"]}
  max_file_size_mb={10}
/>`}
        </pre>
      </div>
    </div>
  );
}
