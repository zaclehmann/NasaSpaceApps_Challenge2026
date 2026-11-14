// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// When to escalate (ui.md 5.3): three levels in order. The current one has a filled marker and 600 weight.
import clsx from "clsx";
import type { Escalation } from "@missionvitals/shared";

export type EscalationLevel = "self" | "cmo" | "surgeon";

const LEVELS: { id: EscalationLevel; title: string }[] = [
  { id: "self", title: "Yourself" },
  { id: "cmo", title: "Crew medical officer" },
  { id: "surgeon", title: "Flight surgeon on Earth" },
];

export function EscalationLevels({ escalation, current }: { escalation: Escalation; current: EscalationLevel }) {
  return (
    <section>
      <h3 className="mb-1.5 type-small font-semibold">When to escalate</h3>
      <ol className="space-y-1.5">
        {LEVELS.map((l, i) => {
          const on = l.id === current;
          return (
            <li key={l.id} className="flex gap-2.5 type-small">
              <span
                aria-hidden="true"
                className={clsx("mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] leading-none font-semibold", on ? "bg-foreground text-background" : "text-subtle-foreground")}
              >
                {i + 1}
              </span>
              <span className="min-w-0">
                <span className={on ? "font-semibold" : "text-muted-foreground"}>
                  {l.title}
                  {on && <span className="sr-only"> (current level)</span>}
                </span>
                <span className={clsx("block type-caption", on ? "text-muted-foreground" : "text-subtle-foreground")}>{escalation[l.id]}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
