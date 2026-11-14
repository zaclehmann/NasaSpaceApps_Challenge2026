// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// One indicator row: icon, name, last-hour trend, value and unit in aligned columns.
// A status mark and word appear only when the row needs attention, so a calm list stays calm.
import clsx from "clsx";
import { formatClock } from "@missionvitals/shared";
import type { IndicatorState } from "../../data/health";
import { useUi } from "../../state/ui";
import { Sparkline } from "../charts/Sparkline";
import { taskStatusText } from "../layout/RoutineList";
import { BadgeIcon, StatusWord } from "../status/StatusBadge";
import { STATUS_TEXT, STATUS_TINT } from "../status/statusStyles";
import { Button } from "../ui/Button";
import { INDICATOR_ICON } from "./icons";

const ARROW_WORD = { up: "rising", down: "falling", flat: "steady" };
const ONE_LINE = "overflow-hidden text-ellipsis whitespace-nowrap";

/** A few words after the status word. The full explanation is in the panel. */
function reason(state: IndicatorState, now: number): string {
  const { ev, latest } = state;
  if (ev.reason === "silent" && latest) return `${Math.max(1, Math.round((now - latest.t) / 60))} min`;
  if (ev.reason === "overdue") return "check overdue";
  if (ev.reason === "trend") return "near limit";
  return "";
}

interface Props {
  state: IndicatorState;
  now: number;
  selected: boolean;
  linked: boolean;
  /** The alert for this indicator has been acknowledged. */
  acknowledged: boolean;
}

export function IndicatorRow({ state, now, selected, linked, acknowledged }: Props) {
  const { select, setHoverIndicator, startProcedure } = useUi();
  const { def, status, valueText, latest, openTask, key } = state;
  const Icon = INDICATOR_ICON[key];
  // A check that is simply due is a routine matter, not a fault: the row says so without a status mark.
  const due = state.ev.reason === "not-taken";
  const flagged = status !== "ok" && !due;
  const needsMeasure = def.source === "entered" && valueText === null;
  const beat = key === "hr" && valueText && latest ? { animation: `mv-beat ${(60 / Math.max(30, latest.value)).toFixed(2)}s ease-out infinite` } : undefined;
  const time = def.source === "entered" && valueText && latest ? `${formatClock(latest.t)} MET` : "";
  return (
    <li
      className={clsx("flex items-center transition-colors duration-[120ms]", selected ? "bg-muted" : STATUS_TINT[status] || "hover:bg-muted", linked && "outline-2 -outline-offset-2 outline-foreground")}
      onMouseEnter={() => setHoverIndicator(key)}
      onMouseLeave={() => setHoverIndicator(null)}
    >
      <button
        type="button"
        aria-current={selected ? "true" : undefined}
        onClick={() => select({ kind: "indicator", key })}
        onFocus={() => setHoverIndicator(key)}
        onBlur={() => setHoverIndicator(null)}
        className="flex min-h-12 min-w-0 flex-1 items-center gap-2.5 py-1 pr-3 pl-4 text-left focus-visible:-outline-offset-2 max-xl:min-h-14"
      >
        <Icon size={16} strokeWidth={1.5} aria-hidden="true" className={clsx("shrink-0", selected ? "text-foreground" : "text-muted-foreground")} style={beat} />
        <span className="min-w-0 flex-1">
          <span className={clsx("block type-small", ONE_LINE, selected ? "font-semibold" : "font-medium")}>{key === "radiation" ? "Radiation" : def.name}</span>
          {flagged ? (
            <span className="flex items-center gap-1 type-caption">
              <BadgeIcon status={status} size={12} />
              <StatusWord status={status} className="whitespace-nowrap" />
              <span className={clsx("text-subtle-foreground", ONE_LINE)}>{acknowledged ? "acknowledged" : reason(state, now)}</span>
            </span>
          ) : (
            <span className={clsx("block type-caption", ONE_LINE, due ? "font-medium text-foreground" : "text-subtle-foreground")}>
              {!due && <span className="sr-only">In range, {ARROW_WORD[state.arrow]}. </span>}
              {due ? (openTask ? taskStatusText(openTask, now) : "Not taken today") : time}
            </span>
          )}
        </span>
        <Sparkline points={state.spark} def={def} status={status} now={now} width={48} />
        {valueText ? (
          <>
            <span key={valueText} className={clsx("fade-value min-w-[58px] shrink-0 text-right text-[17px] leading-6 font-semibold", status === "ok" || status === "watch" ? "text-foreground" : STATUS_TEXT[status])}>
              {valueText}
            </span>
            <span className="w-9 shrink-0 type-caption text-muted-foreground">{key === "mood" ? "" : def.unit}</span>
          </>
        ) : (
          !needsMeasure && <span className="w-[104px] shrink-0" />
        )}
      </button>
      {needsMeasure && (
        <Button size="sm" className="mr-3" onClick={() => startProcedure({ kind: key, taskId: openTask?.task.id })}>
          Measure
        </Button>
      )}
    </li>
  );
}
