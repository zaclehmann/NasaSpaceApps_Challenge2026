// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Symptom logging. SymptomDialog records one symptom against a named body part (opened from a part's
// detail, or from the Symptoms page with no part chosen yet). SymptomsPage lists every symptom logged,
// as a table with Status and Actions columns, like the routine page.
// Private like mood (ui.md 5.7): only the astronaut and the crew medical officer see the details.
import * as RD from "@radix-ui/react-dialog";
import clsx from "clsx";
import { ArrowLeft, ChevronDown, Lock, Plus } from "lucide-react";
import { useEffect, useId, useState, type ReactNode } from "react";
import {
  BODY_PARTS,
  DAY,
  PART_BY_ID,
  SYMPTOM_WORDS,
  formatClock,
  missionDay,
  symptomRuleText,
  symptomStatus,
  type BodyLayer,
  type Symptom,
} from "@missionvitals/shared";
import { useData } from "../../data/DataProvider";
import type { HealthView } from "../../data/health";
import { useUi } from "../../state/ui";
import { StatusBadge } from "../status/StatusBadge";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { TextArea } from "../ui/NumericInput";
import { Scale } from "../ui/Scale";
import { Switch } from "../ui/Switch";
import { useReturnFocus } from "../ui/useReturnFocus";

const LAYER_NAME: Record<BodyLayer, string> = { organs: "Organs", muscles: "Muscles", skeleton: "Skeleton" };
const LAYERS: BodyLayer[] = ["organs", "muscles", "skeleton"];
const SEVERITY_LABELS = Array.from({ length: 11 }, (_, i) => String(i));

const STARTED = [
  { label: "Just now", ago: 0 },
  { label: "1 to 3 hours ago", ago: 2 * 3600 },
  { label: "Earlier today", ago: 6 * 3600 },
  { label: "Yesterday", ago: DAY },
  { label: "2 days ago", ago: 2 * DAY },
  { label: "3 or more days ago", ago: 3 * DAY },
];

function Select({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: ReactNode }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="type-label text-muted-foreground">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 w-full appearance-none rounded-md border border-input bg-card pr-10 pl-3 type-body text-foreground xl:h-10"
        >
          {children}
        </select>
        <ChevronDown size={16} strokeWidth={1.5} aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground" />
      </div>
    </div>
  );
}

/** Log one symptom. Rendered once in the app shell; opened by startSymptom(). */
export function SymptomDialog({ view }: { view: HealthView }) {
  const { symptomRequest, closeSymptom, showToast, select, setSymptomsOpen } = useUi();
  const { source } = useData();
  const open = symptomRequest !== null;
  const [partId, setPartId] = useState("");
  const [kind, setKind] = useState("");
  const [severity, setSeverity] = useState<number | null>(null);
  const [startedAgo, setStartedAgo] = useState(0);
  const [affectsWork, setAffectsWork] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState(false);

  // Start fresh each time it opens, on the part it was opened for.
  useEffect(() => {
    if (!symptomRequest) return;
    const first = symptomRequest.partId && PART_BY_ID[symptomRequest.partId] ? symptomRequest.partId : "";
    setPartId(first);
    setKind(first ? SYMPTOM_WORDS[PART_BY_ID[first].layer][0] : "");
    setSeverity(null);
    setStartedAgo(0);
    setAffectsWork(false);
    setNote("");
    setError(false);
  }, [symptomRequest]);

  const part = partId ? PART_BY_ID[partId] : undefined;
  const words = part ? SYMPTOM_WORDS[part.layer] : [];
  const startedAt = view.now - startedAgo;
  // The Scale reports 1 to 11; severity is 0 to 10.
  const level = severity === null ? null : severity - 1;
  const preview = part && level !== null ? symptomStatus({ severity: level, startedAt, affectsWork }, view.now) : null;

  const choosePart = (id: string) => {
    setPartId(id);
    const p = PART_BY_ID[id];
    if (p && !SYMPTOM_WORDS[p.layer].includes(kind)) setKind(SYMPTOM_WORDS[p.layer][0]);
  };

  const save = () => {
    if (!part || level === null || !kind) {
      setError(true);
      return;
    }
    source.addSymptom(view.astronaut.id, { partId: part.id, layer: part.layer, kind, severity: level, startedAt, affectsWork, note: note.trim() || undefined });
    showToast(`Symptom logged: ${kind.toLowerCase()}, ${part.name.toLowerCase()}`);
    closeSymptom();
    // Show it where it lives: the part's detail, with the figure on that part's view and side.
    setSymptomsOpen(false);
    select({ kind: "part", id: part.id });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && closeSymptom()}
      title="Log a symptom"
      subtitle={part ? `${part.name}, ${LAYER_NAME[part.layer]} view` : "Choose where you feel it"}
      footer={
        <>
          <Button variant="secondary" onClick={closeSymptom}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save}>
            Log symptom
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <Select label="Where" value={partId} onChange={choosePart}>
          <option value="" disabled>
            Choose a body part
          </option>
          {LAYERS.map((l) => (
            <optgroup key={l} label={LAYER_NAME[l]}>
              {BODY_PARTS.filter((p) => p.layer === l).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </optgroup>
          ))}
        </Select>

        {part && (
          <Select label="What it feels like" value={kind} onChange={setKind}>
            {words.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </Select>
        )}

        <Scale legend="How bad is it? 0 is barely there, 10 is the worst" labels={SEVERITY_LABELS} value={severity} onChange={setSeverity} />

        <Select label="When it started" value={String(startedAgo)} onChange={(v) => setStartedAgo(Number(v))}>
          {STARTED.map((s) => (
            <option key={s.label} value={s.ago}>
              {s.label}
            </option>
          ))}
        </Select>

        <Switch label="It stops or limits my work" description="Planned tasks, exercise or sleep." checked={affectsWork} onChange={setAffectsWork} />

        <TextArea label="Note, optional" value={note} onChange={setNote} />

        {error && (!part || level === null) && (
          <p role="alert" className="type-small text-warning-text">
            Choose where it is and how bad it is to save.
          </p>
        )}

        {preview && level !== null && (
          <div className="flex flex-col gap-1 border-t border-border pt-4">
            <span className="flex flex-wrap items-center gap-2 type-small">
              This will show as <StatusBadge status={preview} />
            </span>
            <span className="type-caption text-subtle-foreground">{symptomRuleText({ severity: level, startedAt, affectsWork }, view.now)}</span>
          </div>
        )}

        <p className="flex items-center gap-1.5 type-caption text-subtle-foreground">
          <Lock size={14} strokeWidth={1.5} aria-hidden="true" />
          Private. Only you and the crew medical officer see this.
        </p>
      </div>
    </Dialog>
  );
}

const when = (t: number) => `Day ${missionDay(t)}, ${formatClock(t)}`;
const cell = "px-3 py-2 whitespace-nowrap";
const mono = "font-mono text-[13px] tabular-nums";
const COLUMNS = ["Logged", "Where", "Symptom", "Severity", "Started", "Status", "Actions"];

function SymptomRow({ s, now }: { s: Symptom; now: number }) {
  const { source } = useData();
  const status = symptomStatus(s, now);
  const part = PART_BY_ID[s.partId];
  return (
    <tr className={clsx("h-12 align-middle", status === null && "text-muted-foreground")}>
      <td className={clsx(cell, mono, "text-muted-foreground")}>{when(s.t)}</td>
      <th scope="row" className={clsx(cell, "text-left", status === null ? "font-normal" : "font-medium")}>
        {part?.name ?? s.partId}
        <span className="block type-caption font-normal text-subtle-foreground">{LAYER_NAME[s.layer]}</span>
      </th>
      <td className={cell}>
        {s.kind}
        {s.note && <span className="block max-w-[220px] truncate type-caption text-subtle-foreground">{s.note}</span>}
      </td>
      <td className={clsx(cell, mono)}>{s.severity} / 10</td>
      <td className={clsx(cell, mono, "text-muted-foreground")}>{when(s.startedAt)}</td>
      <td className={cell}>{status ? <StatusBadge status={status} /> : <span>Resolved{s.resolvedAt !== undefined ? `, day ${missionDay(s.resolvedAt)}` : ""}</span>}</td>
      <td className={clsx(cell, "text-right")}>
        {status ? (
          <Button size="sm" variant="secondary" onClick={() => source.resolveSymptom(s.id)}>
            Mark resolved
          </Button>
        ) : (
          <span className="text-subtle-foreground">-</span>
        )}
      </td>
    </tr>
  );
}

/** Every symptom this astronaut has logged, as a full page with a Back button. */
export function SymptomsPage({ view }: { view: HealthView }) {
  const { symptomsOpen, setSymptomsOpen, startSymptom } = useUi();
  const { source } = useData();
  const returnFocus = useReturnFocus(symptomsOpen);
  const symptoms = source.getSymptoms(view.astronaut.id);
  return (
    <RD.Root open={symptomsOpen} onOpenChange={setSymptomsOpen}>
      <RD.Portal>
        <RD.Content
          onCloseAutoFocus={returnFocus}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            (e.currentTarget as HTMLElement).focus();
          }}
          className="anim-page fixed inset-0 z-40 flex flex-col bg-background text-foreground outline-none md:top-12"
        >
          <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-2 md:px-4">
            <RD.Close className="flex h-10 items-center gap-2 rounded-md px-2 type-small font-medium hover:bg-muted max-xl:h-12">
              <ArrowLeft size={18} strokeWidth={1.5} aria-hidden="true" />
              Back
            </RD.Close>
            <span aria-hidden="true" className="h-5 w-px bg-border" />
            <RD.Title className="type-section">Symptoms</RD.Title>
            <RD.Description className="sr-only">Symptoms {view.astronaut.name} has logged, newest first</RD.Description>
            <Button size="sm" variant="primary" className="ml-auto" onClick={() => startSymptom()}>
              <Plus size={16} strokeWidth={1.75} aria-hidden="true" />
              Log symptom
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-[1120px] px-4 pt-6 pb-10 md:px-6">
              {symptoms.length === 0 ? (
                <p className="type-body text-muted-foreground">No symptoms logged. Use Log symptom, or choose a body part on the figure.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full type-small">
                    <caption className="sr-only">Logged symptoms with status and actions</caption>
                    <thead className="bg-muted type-label text-muted-foreground">
                      <tr>
                        {COLUMNS.map((h) => (
                          <th key={h} scope="col" className={clsx("px-3 py-2.5 font-medium whitespace-nowrap", h === "Actions" ? "text-right" : "text-left")}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {symptoms.map((s) => (
                        <SymptomRow key={s.id} s={s} now={view.now} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="mt-3 flex items-center gap-1.5 type-caption text-subtle-foreground">
                <Lock size={14} strokeWidth={1.5} aria-hidden="true" />
                Private. Only you and the crew medical officer see this. Times are MET. Demo rules decide each status.
              </p>
            </div>
          </div>
        </RD.Content>
      </RD.Portal>
    </RD.Root>
  );
}
