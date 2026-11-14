// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Body systems figure (ui.md 6): front view A-pose, flat fill, nine focusable regions.
// The figure shows status per body system; numbers live in the list.
import { useEffect, useState, type KeyboardEvent, type ReactNode } from "react";
import { REGIONS, REGION_BY_ID, STATUS_WORD, type RegionId, type Status } from "@missionvitals/shared";
import type { HealthView } from "../../data/health";
import { useHighlights } from "../../state/selection";
import { useUi } from "../../state/ui";
import { useReducedMotion } from "../../theme/useTheme";
import { BadgeShape } from "../status/StatusBadge";
import { STATUS_VAR, TINT_VAR, isAlerting } from "../status/statusStyles";

const roundRect = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;

/** Shapes per region, in a 320 x 600 box. Each function draws with the props it is given, so fills and edges share geometry. */
type Draw = (p: Record<string, string | number | undefined>) => ReactNode;

const SHAPES: Record<RegionId | "face", Draw> = {
  whole: (p) => <path d={`${roundRect(11, 11, 298, 578, 90)} ${roundRect(14, 14, 292, 572, 87)}`} fillRule="evenodd" {...p} />,
  musculoskeletal: (p) => (
    <>
      <path d="M96 112 A13 13 0 0 1 122 112 L117 312 A11 11 0 0 1 95 312 Z" transform="rotate(20 109 118)" {...p} />
      <path d="M224 112 A13 13 0 0 0 198 112 L203 312 A11 11 0 0 0 225 312 Z" transform="rotate(-20 211 118)" {...p} />
      <path d="M110 292 H160 L154 330 L136 560 A15 15 0 0 1 106 558 Z" {...p} />
      <path d="M210 292 H160 L166 330 L184 560 A15 15 0 0 0 214 558 Z" {...p} />
    </>
  ),
  gut: (p) => <path d="M103.7 186 H216.3 L214 204 Q209 250 212 300 H108 Q111 250 106 204 Z" {...p} />,
  lungs: (p) => <path d="M116 104 Q160 98 204 104 Q224 107 224 127 L216.3 186 H103.7 L96 127 Q96 107 116 104 Z" {...p} />,
  heart: (p) => <circle cx="184" cy="146" r="19" {...p} />,
  immune: (p) => (
    <>
      <rect x="148" y="78" width="24" height="28" rx="4" {...p} />
      <ellipse cx="101" cy="150" rx="7" ry="13" {...p} />
      <ellipse cx="219" cy="150" rx="7" ry="13" {...p} />
    </>
  ),
  face: (p) => <path d="M133.3 57 H186.7 A27 33 0 0 1 133.3 57 Z" {...p} />,
  brain: (p) => <path d="M133.6 44 A27 33 0 0 1 186.4 44 Z" {...p} />,
  eyes: (p) => <path d="M133.6 44 H186.4 A27 33 0 0 1 186.7 57 H133.3 A27 33 0 0 1 133.6 44 Z" {...p} />,
  ear: (p) => (
    <>
      <ellipse cx="132" cy="54" rx="5.5" ry="9.5" {...p} />
      <ellipse cx="188" cy="54" rx="5.5" ry="9.5" {...p} />
    </>
  ),
};

/** Paint order, back to front. */
const PAINT: (RegionId | "face")[] = ["whole", "musculoskeletal", "gut", "lungs", "heart", "immune", "face", "ear", "brain", "eyes"];
/** Focus order, top to bottom (ui.md 6.4). */
const FOCUS: RegionId[] = ["brain", "eyes", "ear", "immune", "lungs", "heart", "gut", "musculoskeletal", "whole"];
/** Where the badge and tooltip sit. */
const ANCHOR: Record<RegionId, [number, number]> = {
  whole: [160, 13],
  brain: [160, 31],
  eyes: [160, 50],
  ear: [188, 54],
  immune: [160, 91],
  lungs: [133, 138],
  heart: [184, 146],
  gut: [160, 244],
  musculoskeletal: [124, 420],
};

const SCAN_KEY = "missionvitals.scan";
const SCAN_MS = 600;

function scanSeen(): boolean {
  try {
    return window.sessionStorage.getItem(SCAN_KEY) === "1";
  } catch {
    return true;
  }
}

/** The one orchestrated moment (ui.md 10): regions take on their status from head to feet, once per session. */
function useBodyScan(): number {
  const reduced = useReducedMotion();
  const [progress, setProgress] = useState(() => (reduced || scanSeen() ? 1 : 0));
  useEffect(() => {
    if (progress >= 1) return;
    try {
      window.sessionStorage.setItem(SCAN_KEY, "1");
    } catch {
      // Without storage the scan simply plays again next time.
    }
    const start = performance.now();
    let frame = 0;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / SCAN_MS);
      setProgress(p);
      if (p < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return progress;
}

export function BodyFigure({ view }: { view: HealthView }) {
  const { select, setHoverRegion, hoverRegion } = useUi();
  const { hoverRegions, selectedRegions } = useHighlights(view);
  const progress = useBodyScan();

  const shown = (id: RegionId): Status | null => {
    const s = view.regions[id];
    if (s === null) return null;
    return progress * 600 >= ANCHOR[id][1] ? s : "ok";
  };
  const label = (id: RegionId) => {
    const r = REGION_BY_ID[id];
    const s = view.regions[id];
    const n = r.indicators.length;
    return `${r.name}, ${s === null ? "not measured directly" : STATUS_WORD[s].toLowerCase()}, ${n} ${n === 1 ? "reading" : "readings"}`;
  };
  const onKey = (id: RegionId) => (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      select({ kind: "region", id });
    }
  };
  const tip = hoverRegion ? { id: hoverRegion, status: view.regions[hoverRegion], at: ANCHOR[hoverRegion] } : null;

  return (
    <div className="relative mx-auto aspect-[320/600] h-full max-h-full min-w-[240px] max-w-[440px]" style={{ maxWidth: "min(440px, 100%)" }}>
      <svg viewBox="0 0 320 600" role="group" aria-label="Body systems figure. Select a region to see what it means." className="block h-full w-full">
        <g aria-hidden="true" pointerEvents="none">
          {PAINT.map((id) => {
            const s = id === "face" ? null : shown(id);
            return (
              <g key={id}>{SHAPES[id]({ className: "region-shape", fill: s && isAlerting(s) ? TINT_VAR[s] : "var(--figure)" })}</g>
            );
          })}
          {REGIONS.map((r) => {
            const s = shown(r.id);
            if (!s || s === "ok") return null;
            return (
              <g key={r.id}>
                {SHAPES[r.id]({
                  fill: "none",
                  stroke: s === "nodata" ? "var(--muted-foreground)" : STATUS_VAR[s],
                  strokeWidth: 1.5,
                  strokeDasharray: s === "nodata" ? "4 3" : undefined,
                  strokeLinejoin: "round",
                })}
              </g>
            );
          })}
          {REGIONS.filter((r) => hoverRegions.has(r.id) || selectedRegions.has(r.id)).map((r) => (
            <g key={r.id}>{SHAPES[r.id]({ fill: "none", stroke: "var(--foreground)", strokeWidth: 2, strokeLinejoin: "round" })}</g>
          ))}
          {REGIONS.map((r) => {
            const s = shown(r.id);
            if (!s || s === "ok") return null;
            const [x, y] = ANCHOR[r.id];
            return (
              <g key={r.id} transform={`translate(${x - 8} ${y - 8})`}>
                <circle cx="8" cy="8" r="9.5" fill={s === "nodata" ? "var(--figure)" : TINT_VAR[s]} />
                <BadgeShape status={s} />
              </g>
            );
          })}
        </g>
        {FOCUS.map((id) => (
          <g
            key={id}
            role="button"
            tabIndex={0}
            aria-label={label(id)}
            aria-pressed={selectedRegions.has(id)}
            className="cursor-pointer outline-none"
            onClick={() => select({ kind: "region", id })}
            onKeyDown={onKey(id)}
            onMouseEnter={() => setHoverRegion(id)}
            onMouseLeave={() => setHoverRegion(null)}
            onFocus={() => setHoverRegion(id)}
            onBlur={() => setHoverRegion(null)}
          >
            {SHAPES[id]({ fill: "transparent", stroke: "transparent", strokeWidth: id === "whole" ? 14 : id === "ear" ? 8 : 0, pointerEvents: "all" })}
          </g>
        ))}
        {/* The underarm marks sit on top of the chest and arms, so they get their own pointer target. Keyboard users reach the region through the neck. */}
        <g aria-hidden="true" className="cursor-pointer" onClick={() => select({ kind: "region", id: "immune" })} onMouseEnter={() => setHoverRegion("immune")} onMouseLeave={() => setHoverRegion(null)}>
          <ellipse cx="101" cy="150" rx="7" ry="13" fill="transparent" pointerEvents="all" />
          <ellipse cx="219" cy="150" rx="7" ry="13" fill="transparent" pointerEvents="all" />
        </g>
      </svg>
      {tip && (
        <div
          role="presentation"
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md bg-card px-2 py-1 type-caption whitespace-nowrap text-foreground shadow-float"
          style={{ left: `${(tip.at[0] / 320) * 100}%`, top: `calc(${(tip.at[1] / 600) * 100}% - 14px)` }}
        >
          <span className="font-medium">{REGION_BY_ID[tip.id].name}</span> <span className="text-muted-foreground">{tip.status === null ? "Not measured directly" : STATUS_WORD[tip.status]}</span>
        </div>
      )}
    </div>
  );
}
