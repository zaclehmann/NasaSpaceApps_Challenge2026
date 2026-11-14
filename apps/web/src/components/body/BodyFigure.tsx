// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// The body systems figure (ui.md 6): one smooth outline with nine regions, in three anatomy views.
// The figure is flat (ui.md 6.1): solid fills and thin lines, no shading, gradients or lighting.
// In range, a region is neutral. Watch and above tint it and edge it in the status colour.
// Each view also has named parts (a knee, a rib, a calf) that can be tapped to see or log a symptom.
// The figure is for pointing and looking; the labels and the part picker beside it are the real controls.
import { useEffect, useId, useState, type ReactNode } from "react";
import { REGIONS, type BodyFace, type RegionId, type Status } from "@missionvitals/shared";
import type { HealthView } from "../../data/health";
import { useHighlights } from "../../state/selection";
import { useUi } from "../../state/ui";
import { useReducedMotion } from "../../theme/useTheme";
import { BadgeShape } from "../status/StatusBadge";
import { STATUS_VAR, TINT_VAR, isAlerting } from "../status/statusStyles";
import { LAYER_DEFS, type Layer, type Shape, type Tone } from "./bodyAnatomy";
import { BODY_PATH, CALLOUTS, CUTS, CUT_ORDER, type CutRegion } from "./bodyShape";
import { zonesFor } from "./bodyZones";

const SCAN_KEY = "missionvitals.scan";
const SCAN_MS = 600;

const TONE_FILL: Record<Tone, string> = { organ: "var(--organ)", bone: "var(--bone)", "bone-back": "var(--bone-back)", cartilage: "var(--cartilage)", hollow: "var(--hollow)", muscle: "var(--muscle)" };
const TONE_LINE: Record<Tone, string> = { organ: "var(--organ-line)", bone: "var(--bone-line)", "bone-back": "var(--bone-line)", cartilage: "var(--bone-line)", hollow: "var(--bone-line)", muscle: "var(--muscle-line)" };
const MIRROR = "matrix(-1 0 0 1 320 0)";

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

/** Draw shapes, mirroring the ones marked for it. */
function Paths({ shapes, ...props }: { shapes: Shape[] } & Record<string, unknown>): ReactNode {
  return shapes.map((s, i) => <path key={i} d={s.d} transform={s.mirror ? MIRROR : undefined} {...props} />);
}

/** Leader line from an anchor on the figure out to a label slot at the edge of the figure's box. */
function leaderPath(id: RegionId, anchor: [number, number]): string {
  const { side, y } = CALLOUTS[id];
  return leaderTo(anchor, side, y);
}

function leaderTo([ax, ay]: [number, number], side: "left" | "right", y: number): string {
  const dir = side === "right" ? 1 : -1;
  const edge = side === "right" ? 326 : -6;
  const elbow = ax + dir * Math.abs(y - ay);
  return `M${ax} ${ay}L${elbow} ${y}L${edge} ${y}`;
}

interface Props {
  view: HealthView;
  leaders: boolean;
  /** In Muscles and Skeleton, labels name parts instead of body systems. Leaders then go to the parts. */
  partCallouts?: { id: string; side: "left" | "right"; y: number; anchor: [number, number] }[];
  layer: Layer;
  face: BodyFace;
  /** The part whose page is open, if any. */
  selectedPart: string | null;
  hoverPart: string | null;
  onHoverPart: (id: string | null) => void;
  onSelectPart: (id: string) => void;
}

export function BodyFigure({ view, leaders, partCallouts, layer, face, selectedPart, hoverPart, onHoverPart, onSelectPart }: Props) {
  const { select, setHoverRegion } = useUi();
  const { hoverRegions, selectedRegions } = useHighlights(view);
  const progress = useBodyScan();
  const def = LAYER_DEFS[layer][face];
  const zones = zonesFor(layer, face);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const bodyClip = `mv-body-${uid}`;
  const cutClip = (id: CutRegion) => `mv-cut-${id}-${uid}`;
  const zoneClip = (id: string) => `mv-zone-${id}-${uid}`;
  const cutIds = CUT_ORDER.filter((id) => def.regions[id].kind === "cut");
  const shapeIds = CUT_ORDER.filter((id) => def.regions[id].kind === "shape");

  const anchor = (id: RegionId): [number, number] => def.anchors[id] ?? CALLOUTS[id].anchor;
  const shown = (id: RegionId): Status | null => {
    const s = view.regionReadings[id];
    if (s === null) return null;
    return progress * 600 >= anchor(id)[1] ? s : "ok";
  };
  const lit = (id: RegionId) => hoverRegions.has(id) || selectedRegions.has(id);
  const quiet = (s: Status | null) => s === null || s === "ok" || s === "due";
  const pointer = (id: RegionId) => ({
    onClick: () => select({ kind: "region", id }),
    onMouseEnter: () => setHoverRegion(id),
    onMouseLeave: () => setHoverRegion(null),
  });
  const edgeStyle = (id: RegionId, width: number) => {
    const s = shown(id);
    const on = lit(id);
    return {
      fill: "none",
      stroke: on ? "var(--foreground)" : s === "nodata" ? "var(--muted-foreground)" : STATUS_VAR[s as Status],
      strokeWidth: on ? width + 0.5 : width,
      strokeLinejoin: "round" as const,
      strokeDasharray: !on && s === "nodata" ? "4 3" : undefined,
    };
  };
  const shapeArt = (id: CutRegion) => {
    const art = def.regions[id];
    return art.kind === "shape" ? art : null;
  };

  const whole = shown("whole");
  const wholeLit = lit("whole");
  const haloColor = wholeLit ? "var(--foreground)" : whole === "nodata" ? "var(--muted-foreground)" : whole && isAlerting(whole) ? STATUS_VAR[whole] : null;
  const marked = REGIONS.filter((r) => !quiet(shown(r.id)));
  // Parts to outline: one with an active symptom, the one being pointed at, and the one whose page is open.
  const partStatus = (id: string): Status | undefined => view.parts[id];
  const edged = zones.filter((z) => partStatus(z.id) || z.id === hoverPart || z.id === selectedPart);

  return (
    <svg viewBox="0 0 320 600" aria-hidden="true" className="block h-full w-full overflow-visible">
      <defs>
        <clipPath id={bodyClip}>
          <path d={BODY_PATH} />
        </clipPath>
        {cutIds.map((id) => (
          <clipPath key={id} id={cutClip(id)}>
            {CUTS[id].map((d) => (
              <path key={d} d={d} />
            ))}
          </clipPath>
        ))}
        {edged.map((z) => (
          <clipPath key={z.id} id={zoneClip(z.id)}>
            <Paths shapes={z.shapes} />
          </clipPath>
        ))}
      </defs>

      {/* Whole body: a halo that follows the outline, shown only when it has something to say. */}
      {haloColor && (
        <g className="region-shape" strokeLinejoin="round">
          <path d={BODY_PATH} fill="none" stroke={haloColor} strokeWidth={wholeLit ? 15 : 14} strokeDasharray={!wholeLit && whole === "nodata" ? "5 4" : undefined} />
          <path d={BODY_PATH} fill="none" stroke={whole && isAlerting(whole) ? TINT_VAR[whole] : "var(--background)"} strokeWidth={11} />
        </g>
      )}
      <path d={BODY_PATH} fill="transparent" stroke="transparent" strokeWidth={22} pointerEvents="stroke" className="cursor-pointer" {...pointer("whole")} />

      {/* The body, with tints for regions drawn as cuts of the outline. */}
      <g>
        <path d={BODY_PATH} fill="var(--figure)" />
        <g clipPath={`url(#${bodyClip})`}>
          {cutIds.map((id) => {
            const s = shown(id);
            return CUTS[id].map((d) => <path key={d} d={d} className="region-shape" fill={s && isAlerting(s) ? TINT_VAR[s] : "transparent"} />);
          })}
        </g>
      </g>

      {/* Anatomy for this view, kept inside the outline. */}
      <g clipPath={`url(#${bodyClip})`}>
        {def.fills.length > 0 && (
          <g>
            {def.fills.map((f, i) => (
              <Paths key={i} shapes={f.shapes} fill={TONE_FILL[f.tone]} stroke={TONE_LINE[f.tone]} strokeWidth={0.6} strokeLinejoin="round" />
            ))}
          </g>
        )}
        <g>
          {shapeIds.map((id) => {
            const art = shapeArt(id)!;
            const s = shown(id);
            return <Paths key={id} shapes={art.shapes} className="region-shape" fill={s && isAlerting(s) ? TINT_VAR[s] : TONE_FILL[art.tone]} stroke={TONE_LINE[art.tone]} strokeWidth={art.tone === "muscle" ? 0.9 : 0.6} strokeLinejoin="round" />;
          })}
        </g>
        {def.over.length > 0 && (
          <g>
            {def.over.map((f, i) => (
              <Paths key={i} shapes={f.shapes} fill={TONE_FILL[f.tone]} stroke={TONE_LINE[f.tone]} strokeWidth={0.6} strokeLinejoin="round" />
            ))}
          </g>
        )}
        {def.lines.map((l, i) => (
          <Paths key={i} shapes={l.shapes} fill="none" stroke={TONE_LINE[l.tone]} strokeWidth={l.width} strokeLinecap="round" />
        ))}
      </g>

      <path d={BODY_PATH} fill="none" stroke="var(--border-strong)" strokeWidth={1} strokeLinejoin="round" pointerEvents="none" />

      {/* Edges for flagged or highlighted regions. A cut shows the outline inside the cut, plus the cut inside the outline. */}
      {cutIds.map((id) => {
        if (!lit(id) && quiet(shown(id))) return null;
        const style = edgeStyle(id, 1.5);
        return (
          <g key={id} pointerEvents="none">
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
      {shapeIds.map((id) => {
        if (!lit(id) && quiet(shown(id))) return null;
        return (
          <g key={id} clipPath={`url(#${bodyClip})`} pointerEvents="none">
            <Paths shapes={shapeArt(id)!.shapes} {...edgeStyle(id, 1.5)} />
          </g>
        );
      })}

      {/* Parts: a symptom tints and edges its own part; pointing at or opening a part outlines it. */}
      {edged.map((z) => {
        const s = partStatus(z.id);
        const on = z.id === hoverPart || z.id === selectedPart;
        const style = { fill: "none", stroke: on ? "var(--foreground)" : STATUS_VAR[s as Status], strokeWidth: z.id === selectedPart ? 2 : 1.5, strokeLinejoin: "round" as const };
        return (
          <g key={z.id} pointerEvents="none">
            {s && (
              <g clipPath={`url(#${bodyClip})`}>
                <Paths shapes={z.shapes} fill={TINT_VAR[s]} fillOpacity={0.72} className="region-shape" />
              </g>
            )}
            <g clipPath={`url(#${zoneClip(z.id)})`}>
              <path d={BODY_PATH} {...style} />
            </g>
            <g clipPath={`url(#${bodyClip})`}>
              <Paths shapes={z.shapes} {...style} />
            </g>
          </g>
        );
      })}

      {/* Pointer targets: the named parts of this view. Keyboard and screen reader users use the part picker. */}
      <g clipPath={`url(#${bodyClip})`}>
        {zones.map((z) => (
          <g key={z.id} className="cursor-pointer" onClick={() => onSelectPart(z.id)} onMouseEnter={() => onHoverPart(z.id)} onMouseLeave={() => onHoverPart(null)}>
            <Paths shapes={z.shapes} fill="transparent" pointerEvents="all" />
          </g>
        ))}
      </g>

      {leaders &&
        partCallouts?.map((c) => {
          const on = c.id === hoverPart || c.id === selectedPart;
          const st = partStatus(c.id);
          return (
            <g key={c.id} pointerEvents="none">
              <path d={leaderTo(c.anchor, c.side, c.y)} fill="none" stroke={on ? "var(--foreground)" : "var(--border-strong)"} strokeWidth={1} vectorEffect="non-scaling-stroke" className="region-shape" />
              {!st && <circle cx={c.anchor[0]} cy={c.anchor[1]} r={1.8} fill={on ? "var(--foreground)" : "var(--muted-foreground)"} />}
            </g>
          );
        })}
      {leaders &&
        !partCallouts &&
        REGIONS.map((r) => (
          <path
            key={r.id}
            d={leaderPath(r.id, anchor(r.id))}
            fill="none"
            stroke={lit(r.id) ? "var(--foreground)" : "var(--border-strong)"}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
            pointerEvents="none"
            className="region-shape"
          />
        ))}
      {leaders &&
        !partCallouts &&
        REGIONS.filter((r) => !marked.includes(r)).map((r) => (
          <circle key={r.id} cx={anchor(r.id)[0]} cy={anchor(r.id)[1]} r={2} fill={lit(r.id) ? "var(--foreground)" : "var(--muted-foreground)"} pointerEvents="none" />
        ))}

      {marked.map((r) => {
        const s = shown(r.id) as Status;
        const [x, y] = anchor(r.id);
        return (
          <g key={r.id} transform={`translate(${x - 8} ${y - 8})`} pointerEvents="none">
            <circle cx="8" cy="8" r="10" fill={s === "nodata" ? "var(--figure)" : TINT_VAR[s]} />
            <BadgeShape status={s} />
          </g>
        );
      })}
      {zones
        .filter((z) => partStatus(z.id))
        .map((z) => (
          <g key={z.id} transform={`translate(${z.anchor[0] - 6} ${z.anchor[1] - 6}) scale(0.75)`} pointerEvents="none">
            <circle cx="8" cy="8" r="10" fill={TINT_VAR[partStatus(z.id) as Status]} />
            <BadgeShape status={partStatus(z.id) as Status} />
          </g>
        ))}
    </svg>
  );
}
