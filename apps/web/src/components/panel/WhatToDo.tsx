// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Numbered steps written like a flight procedure: one action per line (ui.md 1, 5.3).
export function Steps({ steps, label }: { steps: string[]; label?: string }) {
  return (
    <ol aria-label={label} className="space-y-2">
      {steps.map((s, i) => (
        <li key={s} className="flex gap-3 type-small">
          <span aria-hidden="true" className="w-4 shrink-0 text-right font-medium text-muted-foreground">
            {i + 1}
          </span>
          <span className="min-w-0 max-w-[62ch]">{s}</span>
        </li>
      ))}
    </ol>
  );
}

export function WhatToDo({ steps }: { steps: string[] }) {
  return (
    <section>
      <h3 className="type-section">What to do now</h3>
      <div className="mt-2">
        <Steps steps={steps} />
      </div>
    </section>
  );
}
