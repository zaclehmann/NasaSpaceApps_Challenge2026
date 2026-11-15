// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Shown at once on page load while the app asks the onboard server for this session (at most 4 seconds):
// the header, with the onboard server as its own item, and one quiet line. No spinner, no skeleton cards.
// The app replaces it as soon as it knows whether to use the server or local mode.
export function ConnectingShell() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="grid h-12 shrink-0 grid-cols-[auto_1fr] items-center gap-4 border-b border-border bg-background px-4 type-small md:grid-cols-[1fr_auto_1fr]">
        <span className="type-body font-semibold whitespace-nowrap">MissionVitals</span>
        <span className="justify-self-end whitespace-nowrap text-muted-foreground md:justify-self-center">Onboard server: connecting</span>
      </header>
      <main className="mx-auto w-full max-w-[1100px] px-4 pt-[10vh] md:px-6">
        <p role="status" className="type-body text-muted-foreground">
          Connecting to the onboard server…
        </p>
      </main>
    </div>
  );
}
