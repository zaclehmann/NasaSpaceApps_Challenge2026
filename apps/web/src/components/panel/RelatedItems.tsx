// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// "Also in <body system>": the other readings and logged symptoms in the same body system,
// so the astronaut can move between related items without going back to the figure.
import { BODY_PARTS, REGION_BY_ID, type IndicatorKey, type RegionId, type Status } from "@missionvitals/shared";
import type { HealthView } from "../../data/health";
import { useUi } from "../../state/ui";
import { BadgeIcon, StatusWord } from "../status/StatusBadge";
import { Section } from "./PanelShell";
import { ReadingRows } from "./RegionDetail";

export function RelatedItems({ view, region, skip = [], skipPart }: { view: HealthView; region: RegionId; skip?: IndicatorKey[]; skipPart?: string }) {
  const { select } = useUi();
  const def = REGION_BY_ID[region];
  const readings = def.indicators.filter((k) => !skip.includes(k));
  const parts = BODY_PARTS.filter((p) => p.region === region && p.id !== skipPart && view.parts[p.id]);
  if (!readings.length && !parts.length) return null;
  return (
    <Section title={`Also in ${def.name.toLowerCase()}`}>
      {readings.length > 0 && <ReadingRows view={view} keys={readings} />}
      {parts.length > 0 && (
        <ul className="mt-1 divide-y divide-border border-y border-border">
          {parts.map((p) => {
            const st = view.parts[p.id] as Status;
            return (
              <li key={p.id}>
                <button type="button" onClick={() => select({ kind: "part", id: p.id })} className="flex min-h-11 w-full items-center gap-2.5 py-1 text-left type-small hover:bg-muted max-xl:min-h-12">
                  <BadgeIcon status={st} />
                  <span className="min-w-0 flex-1 font-medium">{p.name}</span>
                  <StatusWord status={st} className="type-caption" />
                  <span className="type-caption text-subtle-foreground">Symptom</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}
