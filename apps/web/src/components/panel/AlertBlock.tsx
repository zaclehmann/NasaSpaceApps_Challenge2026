// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Alert detail (ui.md 5.6): why it fired, Acknowledge, and an action log.
// Acknowledge quiets the alert's prominence without hiding it.
import { useState } from "react";
import { formatClock, type Alert, type AlertActionKind } from "@missionvitals/shared";
import { useSource } from "../../data/DataProvider";
import { useUi } from "../../state/ui";
import { Button } from "../ui/Button";

const ACTIONS: { kind: Exclude<AlertActionKind, "note">; label: string; logged: string }[] = [
  { kind: "remeasured", label: "I re-measured", logged: "Re-measured" },
  { kind: "checked-sensor", label: "Checked the sensor", logged: "Checked the sensor" },
  { kind: "contacted-cmo", label: "Contacted the CMO", logged: "Contacted the crew medical officer" },
];

export const actionText = (kind: AlertActionKind, note?: string) => (kind === "note" ? `Note: ${note ?? ""}` : (ACTIONS.find((a) => a.kind === kind)?.logged ?? kind));

export function AlertBlock({ alert }: { alert: Alert }) {
  const source = useSource();
  const { showToast } = useUi();
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState("");
  const log = (kind: AlertActionKind, text?: string) => {
    source.logAction(alert.id, kind, text);
    showToast("Action logged");
  };
  return (
    <section aria-label="Alert">
      <h3 className="type-section">Why this alert fired</h3>
      <p className="mt-1 max-w-[62ch] type-small text-muted-foreground">{alert.rule}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {alert.acknowledged ? (
          <span className="type-small font-medium">Acknowledged at {formatClock(alert.acknowledgedAt ?? alert.firedAt)} MET</span>
        ) : (
          <Button
            variant="primary"
            onClick={() => {
              source.acknowledgeAlert(alert.id);
              showToast("Alert acknowledged");
            }}
          >
            Acknowledge
          </Button>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {ACTIONS.map((a) => (
          <Button key={a.kind} size="sm" onClick={() => log(a.kind)}>
            {a.label}
          </Button>
        ))}
        <Button size="sm" aria-expanded={noteOpen} onClick={() => setNoteOpen((x) => !x)}>
          Add note
        </Button>
      </div>
      {noteOpen && (
        <form
          className="mt-2 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!note.trim()) return;
            log("note", note.trim());
            setNote("");
            setNoteOpen(false);
          }}
        >
          <label className="sr-only" htmlFor={`note-${alert.id}`}>
            Note
          </label>
          <input
            id={`note-${alert.id}`}
            autoFocus
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What did you do or notice?"
            className="min-h-12 min-w-0 flex-1 rounded-md border border-input bg-card px-3 type-small outline-none placeholder:text-subtle-foreground focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring xl:min-h-8"
          />
          <Button size="sm" type="submit">
            Save note
          </Button>
        </form>
      )}
      {alert.actions.length > 0 && (
        <ul aria-label="Action log" className="mt-3 divide-y divide-border border-t border-border">
          {alert.actions.map((a, i) => (
            <li key={i} className="flex gap-3 py-2 type-small">
              <span className="shrink-0 text-subtle-foreground">{formatClock(a.t)} MET</span>
              <span className="min-w-0">{actionText(a.kind, a.note)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
