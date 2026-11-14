// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// One indicator row (ui.md 5.2): badge and word, icon, name, value and unit, trend arrow, reading time.
import clsx from "clsx";
import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";
import { formatClock, statusLine } from "@missionvitals/shared";
import type { IndicatorState } from "../../data/health";
import { useUi } from "../../state/ui";
import { BadgeIcon, StatusWord } from "../status/StatusBadge";
import { STATUS_TEXT, STATUS_TINT } from "../status/statusStyles";
import { Button } from "../ui/Button";
import { taskStatusText } from "../layout/RoutineBar";
import { INDICATOR_ICON } from "./icons";

const ARROW = { up: ArrowUp, down: ArrowDown, flat: ArrowRight };
const ARROW_WORD = { up: "rising", down: "falling", flat: "steady" };

interface Props {
  state: IndicatorState;
  now: number;
  selected: boolean;
  linked: boolean;
}

export function IndicatorRow({ state, now, selected, linked }: Props) {
  const { select, setHoverIndicator, startProcedure } = useUi();
  const { def, status, valueText, latest, openTask, key } = state;
  const Icon = INDICATOR_ICON[key];
  const Arrow = ARROW[state.arrow];
  const tint = STATUS_TINT[status];
  const needsMeasure = def.source === "entered" && valueText === null;
  const beat = key === "hr" && valueText && latest ? { animation: `mv-beat ${(60 / Math.max(30, latest.value)).toFixed(2)}s ease-out infinite` } : undefined;
  const second = valueText && latest ? `${formatClock(latest.t)} MET` : openTask ? taskStatusText(openTask, now) : statusLine(key, state.ev, now).replace(/\.$/, "");
  return (
    <li
      className={clsx(
        "flex items-center transition-colors duration-[120ms]",
        tint || (selected && "bg-muted"),
        !tint && !selected && "hover:bg-muted",
        linked && "outline-2 -outline-offset-2 outline-foreground",
      )}
      onMouseEnter={() => setHoverIndicator(key)}
      onMouseLeave={() => setHoverIndicator(null)}
    >
      <button
        type="button"
        aria-current={selected ? "true" : undefined}
        onClick={() => select({ kind: "indicator", key })}
        onFocus={() => setHoverIndicator(key)}
        onBlur={() => setHoverIndicator(null)}
        className="flex min-h-16 min-w-0 flex-1 items-center gap-2 py-2 pr-3 pl-4 text-left focus-visible:-outline-offset-2"
      >
        <BadgeIcon status={status} />
        <Icon size={16} strokeWidth={1.5} aria-hidden="true" className="shrink-0 text-muted-foreground" style={beat} />
        <span className="min-w-0 flex-1">
          <span className={clsx("block type-body", selected && "font-semibold")}>{def.name}</span>
          <span className="flex flex-wrap gap-x-2 type-caption">
            <StatusWord status={status} />
            <span className="text-subtle-foreground">{second}</span>
          </span>
        </span>
        {valueText && (
          <span className="flex shrink-0 items-baseline gap-1">
            <span key={valueText} className={clsx("fade-value type-value", status === "ok" ? "text-foreground" : STATUS_TEXT[status])}>
              {valueText}
            </span>
            {key !== "mood" && <span className="type-label text-muted-foreground">{def.unit}</span>}
          </span>
        )}
        {valueText && (
          <span className="shrink-0 text-muted-foreground">
            <Arrow size={16} strokeWidth={1.5} aria-hidden="true" />
            <span className="sr-only">{ARROW_WORD[state.arrow]}</span>
          </span>
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
