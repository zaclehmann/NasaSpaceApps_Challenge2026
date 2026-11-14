// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// One indicator row, two lines: icon, name and value on top, with room for a Measure or Log button;
// the trend line runs full width underneath. A status mark and word appear only when the row needs
// attention, so a calm list stays calm.
import clsx from "clsx";
import { formatClock } from "@missionvitals/shared";
import type { IndicatorState } from "../../data/health";
import { useUi } from "../../state/ui";
import { SparklineFill } from "../charts/Sparkline";
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
  if (ev.reason === "not-taken") return "not taken today";
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
  const { def, status, valueText, latest, openTask, key, soFar } = state;
  const Icon = INDICATOR_ICON[key];
  // A check that is simply due is a routine matter, not a fault: the row says so without a status mark.
  // Exercise is a running total from the shirt: its line says where the number comes from, not the
  // 16:00 confirm task (that lives in the routine list).
  const due = status === "due" && !soFar;
  const flagged = status !== "ok" && status !== "due";
  // Exercise has no button here: the shirt counts it, and the day's Confirm task lives in the routine list.
  const needsMeasure = def.source === "entered" && valueText === null && key !== "exercise";
  const beat = key === "hr" && valueText && latest ? { animation: `mv-beat ${(60 / Math.max(30, latest.value)).toFixed(2)}s ease-out infinite` } : undefined;
  // Exercise is counted by the shirt through the day: the source line says so, and the value reads "124 min today so far".
  const time = key === "exercise" && valueText ? "From your shirt" : def.source === "entered" && valueText && latest ? `${formatClock(latest.t)} MET` : "";
  return (
    <li
      className={clsx("relative transition-colors duration-[120ms]", selected ? "bg-muted" : STATUS_TINT[status] || "hover:bg-muted", linked && "outline-2 -outline-offset-2 outline-foreground")}
      onMouseEnter={() => setHoverIndicator(key)}
      onMouseLeave={() => setHoverIndicator(null)}
    >
      <button
        type="button"
        aria-current={selected ? "true" : undefined}
        onClick={() => select({ kind: "indicator", key })}
        onFocus={() => setHoverIndicator(key)}
        onBlur={() => setHoverIndicator(null)}
        className="flex w-full flex-col py-1 pr-4 pl-4 text-left focus-visible:-outline-offset-2"
      >
        {/* Top line. When a button sits on the right, the text keeps clear of it. */}
        <span className={clsx("flex min-h-9 w-full items-center gap-2.5", needsMeasure && "pr-[104px]")}>
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
                {/* Its own element plus a real space, so it reads "In range, steady. 07:02 MET". */}
                {status === "ok" && <span className="sr-only">In range, {ARROW_WORD[state.arrow]}.</span>}
                {!due && time && " "}
                <span>{due ? (openTask ? taskStatusText(openTask, now) : "Not taken today") : time}</span>
              </span>
            )}
          </span>
          {valueText && (
            <span className="flex shrink-0 items-baseline gap-1.5">
              <span key={valueText} className={clsx("fade-value text-right text-[17px] leading-6 font-semibold tabular-nums", soFar || status === "ok" || status === "watch" ? "text-foreground" : STATUS_TEXT[status])}>
                {valueText}
              </span>
              <span className={clsx("type-caption whitespace-nowrap text-muted-foreground", key !== "exercise" && "w-9")}>{key === "mood" ? "" : key === "exercise" ? `${def.unit} today so far` : def.unit}</span>
            </span>
          )}
        </span>
        {/* Bottom line: the trend, lined up with the name and as wide as the row. */}
        {state.spark.length >= 2 && (
          <span className="block w-full pl-[26px]">
            <SparklineFill points={state.spark} def={def} status={status} now={now} height={14} />
          </span>
        )}
      </button>
      {needsMeasure && (
        <Button size="sm" className="absolute! top-1.5 right-4 w-[88px] max-xl:top-1" onClick={() => startProcedure({ kind: key, taskId: openTask?.task.id })}>
          Measure
        </Button>
      )}
    </li>
  );
}
