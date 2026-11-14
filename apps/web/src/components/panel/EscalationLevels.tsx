// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// When to escalate (ui.md 5.3): three levels, the current one marked with a filled dot and 600 weight.
import clsx from "clsx";
import type { Escalation } from "@missionvitals/shared";
import { useUi } from "../../state/ui";
import { Button } from "../ui/Button";

export type EscalationLevel = "self" | "cmo" | "surgeon";

const LEVELS: { id: EscalationLevel; title: string }[] = [
  { id: "self", title: "Yourself" },
  { id: "cmo", title: "Crew medical officer" },
  { id: "surgeon", title: "Flight surgeon on Earth" },
];

export function EscalationLevels({ escalation, current, onReport }: { escalation: Escalation; current: EscalationLevel; onReport?: () => void }) {
  const { setReportOpen } = useUi();
  return (
    <section>
      <h3 className="type-section">When to escalate</h3>
      <ul className="mt-2 space-y-2">
        {LEVELS.map((l) => {
          const on = l.id === current;
          return (
            <li key={l.id} className="flex gap-3 type-small">
              <span aria-hidden="true" className={clsx("mt-1.5 size-2 shrink-0 rounded-full border", on ? "border-foreground bg-foreground" : "border-border-strong")} />
              <span className="min-w-0">
                <span className={clsx(on && "font-semibold")}>
                  {l.title}
                  {on && <span className="sr-only"> (current level)</span>}
                </span>
                <span className="block text-muted-foreground">{escalation[l.id]}</span>
              </span>
            </li>
          );
        })}
      </ul>
      <Button className="mt-3" onClick={onReport ?? (() => setReportOpen(true))}>
        Send report
      </Button>
    </section>
  );
}
