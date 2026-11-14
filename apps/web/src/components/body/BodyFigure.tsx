// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// The body systems figure (ui.md 6): one smooth outline with nine regions.
// In range, a region is invisible. Watch and above tint it and edge it in the status colour.
// The figure itself is for pointing and looking; the labels beside it are the real buttons.
import { useEffect, useId, useState } from "react";
import { REGIONS, type RegionId, type Status } from "@missionvitals/shared";
import type { HealthView } from "../../data/health";
import { useHighlights } from "../../state/selection";
import { useUi } from "../../state/ui";
import { useReducedMotion } from "../../theme/useTheme";
import { BadgeShape } from "../status/StatusBadge";
import { STATUS_VAR, TINT_VAR, isAlerting } from "../status/statusStyles";
import { BODY_PATH, CALLOUTS, CUTS, CUT_ORDER, type CutRegion } from "./bodyShape";

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

/** Leader line from a region's anchor out to its label slot at the edge of the figure's box. */
function leaderPath(id: RegionId): string {
  const { side, y, anchor } = CALLOUTS[id];
  const [ax, ay] = anchor;
  const dir = side === "right" ? 1 : -1;
  const edge = side === "right" ? 326 : -6;
  const elbow = ax + dir * Math.abs(y - ay);
  return `M${ax} ${ay}L${elbow} ${y}L${edge} ${y}`;
}

export function BodyFigure({ view, leaders }: { view: HealthView; leaders: boolean }) {
  const { select, setHoverRegion } = useUi();
  const { hoverRegions, selectedRegions } = useHighlights(view);
  const progress = useBodyScan();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const bodyClip = `mv-body-${uid}`;
  const cutClip = (id: CutRegion) => `mv-cut-${id}-${uid}`;

  const shown = (id: RegionId): Status | null => {
    const s = view.regions[id];
    if (s === null) return null;
    return progress * 600 >= CALLOUTS[id].anchor[1] ? s : "ok";
  };
  const lit = (id: RegionId) => hoverRegions.has(id) || selectedRegions.has(id);
  const pointer = (id: RegionId) => ({
    onClick: () => select({ kind: "region", id }),
    onMouseEnter: () => setHoverRegion(id),
    onMouseLeave: () => setHoverRegion(null),
  });

  const whole = shown("whole");
  const wholeLit = lit("whole");
  const haloColor = wholeLit ? "var(--foreground)" : whole === "nodata" ? "var(--muted-foreground)" : whole && whole !== "ok" ? STATUS_VAR[whole] : null;
  const marked = REGIONS.filter((r) => {
    const s = shown(r.id);
    return s !== null && s !== "ok";
  });

  return (
    <svg viewBox="0 0 320 600" aria-hidden="true" className="block h-full w-full overflow-visible">
      <defs>
        <clipPath id={bodyClip}>
          <path d={BODY_PATH} />
        </clipPath>
        {CUT_ORDER.map((id) => (
          <clipPath key={id} id={cutClip(id)}>
            {CUTS[id].map((d) => (
              <path key={d} d={d} />
            ))}
          </clipPath>
        ))}
      </defs>

      {/* Whole body: a halo that follows the outline. Shown only when it has something to say. */}
      {haloColor && (
        <g className="region-shape" strokeLinejoin="round">
          <path d={BODY_PATH} fill="none" stroke={haloColor} strokeWidth={wholeLit ? 15 : 14} strokeDasharray={!wholeLit && whole === "nodata" ? "5 4" : undefined} />
          <path d={BODY_PATH} fill="none" stroke={whole && isAlerting(whole) ? TINT_VAR[whole] : "var(--background)"} strokeWidth={11} />
        </g>
      )}
      <path d={BODY_PATH} fill="transparent" stroke="transparent" strokeWidth={22} pointerEvents="stroke" className="cursor-pointer" {...pointer("whole")} />

      <path d={BODY_PATH} fill="var(--figure)" stroke="var(--border-strong)" strokeWidth={1} strokeLinejoin="round" />

      {/* Status tints, cut to the outline. */}
      <g clipPath={`url(#${bodyClip})`}>
        {CUT_ORDER.map((id) => {
          const s = shown(id);
          const on = s !== null && isAlerting(s);
          return CUTS[id].map((d) => <path key={d} d={d} className="region-shape" fill={on && s ? TINT_VAR[s] : "transparent"} />);
        })}
      </g>

      {/* Edges: the outline inside the cut, plus the cut inside the outline. */}
      {CUT_ORDER.map((id) => {
        const s = shown(id);
        const on = lit(id);
        if (!on && (s === null || s === "ok")) return null;
        const stroke = on ? "var(--foreground)" : s === "nodata" ? "var(--muted-foreground)" : STATUS_VAR[s as Status];
        const style = { fill: "none", stroke, strokeWidth: on ? 2 : 1.5, strokeLinejoin: "round" as const, strokeDasharray: !on && s === "nodata" ? "4 3" : undefined };
        return (
          <g key={id}>
            <g clipPath={`url(#${cutClip(id)})`}>
              <path d={BODY_PATH} {...style} />
            </g>
            <g clipPath={`url(#${bodyClip})`}>
              {CUTS[id].map((d) => (
                <path key={d} d={d} {...style} />
              ))}
            </g>
          </g>
        );
      })}

      {/* Pointer targets. Keyboard and screen reader users use the labels. */}
      <g clipPath={`url(#${bodyClip})`}>
        {CUT_ORDER.map((id) => (
          <g key={id} className="cursor-pointer" {...pointer(id)}>
            {CUTS[id].map((d) => (
              <path key={d} d={d} fill="transparent" pointerEvents="all" />
            ))}
          </g>
        ))}
      </g>

      {leaders &&
        REGIONS.map((r) => (
          <path
            key={r.id}
            d={leaderPath(r.id)}
            fill="none"
            stroke={lit(r.id) ? "var(--foreground)" : "var(--border-strong)"}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
            pointerEvents="none"
            className="region-shape"
          />
        ))}
      {leaders &&
        REGIONS.filter((r) => !marked.includes(r)).map((r) => (
          <circle key={r.id} cx={CALLOUTS[r.id].anchor[0]} cy={CALLOUTS[r.id].anchor[1]} r={2} fill={lit(r.id) ? "var(--foreground)" : "var(--muted-foreground)"} pointerEvents="none" />
        ))}

      {marked.map((r) => {
        const s = shown(r.id) as Status;
        const [x, y] = CALLOUTS[r.id].anchor;
        return (
          <g key={r.id} transform={`translate(${x - 8} ${y - 8})`} pointerEvents="none">
            <circle cx="8" cy="8" r="10" fill={s === "nodata" ? "var(--figure)" : TINT_VAR[s]} />
            <BadgeShape status={s} />
          </g>
        );
      })}
    </svg>
  );
}
