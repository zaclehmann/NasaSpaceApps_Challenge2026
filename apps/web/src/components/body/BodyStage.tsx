// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// The figure with its region labels. With room, labels sit beside the figure on leader lines.
// Without room (narrow column or phone), they become a list under the figure.
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { REGION_BY_ID, STATUS_WORD, type RegionId } from "@missionvitals/shared";
import type { HealthView } from "../../data/health";
import { useHighlights } from "../../state/selection";
import { useUi } from "../../state/ui";
import { BadgeIcon, StatusWord } from "../status/StatusBadge";
import { STATUS_TEXT } from "../status/statusStyles";
import { BodyFigure } from "./BodyFigure";
import { CALLOUTS, REGION_ORDER } from "./bodyShape";

const RATIO = 320 / 600;
const LABEL_MIN = 148;

function useSize() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

function regionLabel(view: HealthView, id: RegionId): string {
  const r = REGION_BY_ID[id];
  const s = view.regions[id];
  const n = r.indicators.length;
  return `${r.name}, ${s === null ? "not measured directly" : STATUS_WORD[s].toLowerCase()}, ${n} ${n === 1 ? "reading" : "readings"}`;
}

/** The readings under a region name: short name, value and unit. Colour only when out of range. */
function Readings({ view, id }: { view: HealthView; id: RegionId }) {
  const r = REGION_BY_ID[id];
  if (!r.indicators.length) return <span className="text-subtle-foreground">Not measured</span>;
  return (
    <>
      {r.indicators.map((k) => {
        const s = view.indicators[k];
        const quiet = s.status === "ok" || s.status === "watch";
        return (
          <span key={k} className="whitespace-nowrap">
            <span className="text-subtle-foreground">{s.def.short}</span>{" "}
            {s.valueText ? (
              <span className={clsx("font-medium", quiet ? "text-foreground" : STATUS_TEXT[s.status])}>
                {s.valueText}
                {k === "mood" ? "" : ` ${s.def.unit}`}
              </span>
            ) : (
              <span className="text-nodata-text">{s.ev.reason === "silent" ? "no data" : "due"}</span>
            )}
          </span>
        );
      })}
    </>
  );
}

function RegionButton({ view, id, align, list }: { view: HealthView; id: RegionId; align: "left" | "right"; list?: boolean }) {
  const { select, setHoverRegion } = useUi();
  const { hoverRegions, selectedRegions } = useHighlights(view);
  const status = view.regions[id];
  const selected = selectedRegions.has(id);
  const lit = selected || hoverRegions.has(id);
  const flagged = status !== null && status !== "ok";
  return (
    <button
      type="button"
      aria-label={regionLabel(view, id)}
      aria-pressed={selected}
      onClick={() => select({ kind: "region", id })}
      onMouseEnter={() => setHoverRegion(id)}
      onMouseLeave={() => setHoverRegion(null)}
      onFocus={() => setHoverRegion(id)}
      onBlur={() => setHoverRegion(null)}
      className={clsx(
        "block w-full rounded-sm type-caption transition-colors duration-[120ms]",
        list ? "min-h-12 px-4 py-2 text-left hover:bg-muted" : "relative px-1.5 py-0.5 max-xl:before:absolute max-xl:before:inset-x-0 max-xl:before:-inset-y-[5px] max-xl:before:content-['']",
        !list && (align === "right" ? "text-left" : "text-right"),
        list && selected && "bg-muted",
      )}
    >
      <span className={clsx("block type-label", lit || selected ? "text-foreground" : "text-muted-foreground", selected && "font-semibold", lit && !list && "underline underline-offset-2")}>
        {REGION_BY_ID[id].name}
      </span>
      {flagged && status && (
        <span className={clsx("flex items-center gap-1", !list && align === "left" && "justify-end")}>
          <BadgeIcon status={status} size={12} />
          <StatusWord status={status} />
        </span>
      )}
      <span className={clsx("flex flex-wrap gap-x-2", !list && align === "left" && "justify-end")}>
        <Readings view={view} id={id} />
      </span>
    </button>
  );
}

interface Props {
  view: HealthView;
  /** Fill the height of the parent (desktop and tablet). On phone the stage takes its natural height. */
  fill?: boolean;
}

export function BodyStage({ view, fill = false }: Props) {
  const [ref, size] = useSize();
  const callouts = fill && size.w >= 620 && size.h >= 470;
  const figH = callouts ? Math.min(size.h, 640, (size.w - 2 * LABEL_MIN) / RATIO) : fill ? Math.max(260, Math.min(420, size.h - 190, size.w / RATIO)) : Math.min(440, (size.w * 0.62) / RATIO);
  const figW = figH * RATIO;
  const top = (size.h - figH) / 2;
  const labelW = Math.min(190, (size.w - figW) / 2 - 10);

  return (
    <div ref={ref} className={clsx("relative min-w-0", fill ? "min-h-0 flex-1" : "", !callouts && fill && "overflow-y-auto")} role="group" aria-label="Body systems. Choose a region to see what it means.">
      {size.w > 0 && callouts && (
        <>
          <div className="absolute" style={{ left: (size.w - figW) / 2, top, width: figW, height: figH }}>
            <BodyFigure view={view} leaders />
          </div>
          <ul>
            {REGION_ORDER.map((id) => {
              const c = CALLOUTS[id];
              const x = (size.w + figW) / 2 + 8;
              return (
                <li key={id} className="absolute" style={{ top: top + (c.y / 600) * figH - 11, width: labelW, ...(c.side === "right" ? { left: x } : { right: x }) }}>
                  <RegionButton view={view} id={id} align={c.side} />
                </li>
              );
            })}
          </ul>
        </>
      )}
      {size.w > 0 && !callouts && (
        <>
          <div className="mx-auto mt-2" style={{ width: figW, height: figH }}>
            <BodyFigure view={view} leaders={false} />
          </div>
          <ul className={clsx("mt-4 grid", size.w >= 440 ? "grid-cols-2" : "grid-cols-1 divide-y divide-border border-y border-border")}>
            {REGION_ORDER.map((id) => (
              <li key={id}>
                <RegionButton view={view} id={id} align="right" list />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
