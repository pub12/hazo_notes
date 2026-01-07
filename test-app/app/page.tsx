export default function HomePage() {
  return (
    <div className="container mx-auto max-w-4xl">
      <h1 className="text-3xl font-bold mb-4">Hazo Notes Test App</h1>
      <p className="text-muted-foreground mb-8">
        Use the sidebar to navigate between different test scenarios for the hazo_notes package.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="border rounded-lg p-6">
          <h2 className="font-semibold text-lg mb-3">Test Scenarios</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-amber-500">-</span>
              <span><strong>Basic Notes</strong> - Simple note creation and display</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500">-</span>
              <span><strong>Popover Style</strong> - Notes in popover container</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500">-</span>
              <span><strong>Slide Panel</strong> - Notes in slide-out panel</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500">-</span>
              <span><strong>File Attachments</strong> - Notes with embedded files</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500">-</span>
              <span><strong>Auto-Save Mode</strong> - Notes saved automatically on blur</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500">-</span>
              <span><strong>Multiple Instances</strong> - Multiple notes on one page</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500">-</span>
              <span><strong>Integration Test</strong> - Full hazo ecosystem integration</span>
            </li>
          </ul>
        </div>

        <div className="border rounded-lg p-6">
          <h2 className="font-semibold text-lg mb-3">Database</h2>
          <p className="text-sm text-muted-foreground mb-4">
            This test app uses SQLite for local development.
            Production deployments should use PostgreSQL.
          </p>
          <div className="bg-muted p-3 rounded text-xs font-mono">
            <p>Location: data/test.db</p>
            <p>Initialize: npm run init-db</p>
          </div>
        </div>

        <div className="border rounded-lg p-6">
          <h2 className="font-semibold text-lg mb-3">Mock User</h2>
          <p className="text-sm text-muted-foreground mb-4">
            The test app uses a mock authentication endpoint that returns a test user.
          </p>
          <div className="bg-muted p-3 rounded text-xs">
            <p><strong>Name:</strong> Test User</p>
            <p><strong>Email:</strong> test@example.com</p>
            <p><strong>ID:</strong> test-user-123</p>
          </div>
        </div>

        <div className="border rounded-lg p-6">
          <h2 className="font-semibold text-lg mb-3">Package Features</h2>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>- Database-backed storage (JSONB)</li>
            <li>- File attachments (embed/attach)</li>
            <li>- Popover & slide panel styles</li>
            <li>- Explicit & auto-save modes</li>
            <li>- INI-based configuration</li>
            <li>- TypeScript support</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
