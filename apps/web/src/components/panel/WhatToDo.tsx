// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Numbered steps written like a flight procedure: one action per line (ui.md 1, 5.3).
export function Steps({ steps, label }: { steps: string[]; label?: string }) {
  return (
    <ol aria-label={label} className="space-y-1.5">
      {steps.map((s, i) => (
        <li key={s} className="flex gap-2.5 type-small">
          <span aria-hidden="true" className="w-[18px] shrink-0 text-center font-medium text-muted-foreground">
            {i + 1}
          </span>
          <span className="min-w-0 max-w-[62ch]">{s}</span>
        </li>
      ))}
    </ol>
  );
}
