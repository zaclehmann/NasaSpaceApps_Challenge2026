// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
import clsx from "clsx";
import type { HealthView } from "../../data/health";
import { BadgeIcon } from "../status/StatusBadge";
import { buildSummary } from "./summary";

/** New cautions are announced politely; warnings are announced assertively by the warning bar (ui.md 11). */
export function SummarySentence({ view, className }: { view: HealthView; className?: string }) {
  const s = buildSummary(view);
  return (
    <p aria-live="polite" className={clsx("flex items-start gap-2.5 type-summary text-foreground", className)}>
      <BadgeIcon status={s.status} size={20} className="mt-1" />
      <span className="min-w-0">{s.sentence}</span>
    </p>
  );
}
