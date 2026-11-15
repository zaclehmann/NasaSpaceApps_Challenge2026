// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Solar storm scenario: what is real (NASA DONKI event timing) and what is simulated (dose), with the events
// in real UTC time and a link to each NASA DONKI record. Shown only while the scenario is running.
import { DONKI_SOURCE, formatClock, type ReplayedEvent } from "@missionvitals/shared";
import { useData } from "../../data/DataProvider";
import { Section } from "./PanelShell";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "10 May 2024, 06:27 UTC" from the real event time. */
export function utcText(ms: number): string {
  const d = new Date(ms);
  const two = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${two(d.getUTCHours())}:${two(d.getUTCMinutes())} UTC`;
}

export function useSolarEvents(): ReplayedEvent[] {
  const { source } = useData();
  return source.getSolarEvents();
}

export function SolarStormNote() {
  const events = useSolarEvents();
  if (!events.length) return null;
  return (
    <Section title="Solar storm, May 2024">
      <div className="space-y-2 type-small">
        <p className="max-w-[62ch]">
          <span className="font-medium">Event timing: real.</span> The flare, CME and particle arrivals replay NASA DONKI records from the May 2024 solar storm.
        </p>
        <p className="max-w-[62ch]">
          <span className="font-medium">Dose rate: simulated.</span> DONKI records events, not dose.
        </p>
        <ul className="divide-y divide-border border-y border-border">
          {events.map((e) => (
            <li key={e.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-1.5">
              <a className="font-medium text-link underline underline-offset-2" href={e.link} target="_blank" rel="noreferrer">
                {e.label}
              </a>
              <span className="text-muted-foreground tabular-nums">
                {utcText(e.ms)}, replayed at {formatClock(e.met)} MET
              </span>
            </li>
          ))}
        </ul>
        <p className="type-caption text-subtle-foreground">Source: {DONKI_SOURCE.attribution}.</p>
      </div>
    </Section>
  );
}
