// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// A small trend line for a list row. The vertical scale includes the demo limits,
// so the line's height shows how close the value is to a limit, not just its wiggle.
import type { IndicatorDef, Status } from "@missionvitals/shared";
import type { SparkPoint } from "../../data/health";
import { STATUS_VAR } from "../status/statusStyles";

interface Props {
  points: SparkPoint[];
  def: IndicatorDef;
  status: Status;
  now: number;
  width?: number;
  height?: number;
}

export function Sparkline({ points, def, status, now, width = 56, height = 20 }: Props) {
  if (points.length < 2) return <span aria-hidden="true" className="shrink-0" style={{ width, height }} />;
  const live = def.source !== "entered";
  const vs = points.map((p) => p.v);
  let lo = Math.min(...vs, def.low ?? Infinity);
  let hi = Math.max(...vs, def.high ?? -Infinity);
  const pad = (hi - lo || 1) * 0.12;
  lo -= pad;
  hi += pad;
  const t0 = live ? now - 3600 : 0;
  const x = (p: SparkPoint, i: number) => (live ? ((p.t - t0) / 3600) * (width - 4) + 2 : (i / (points.length - 1)) * (width - 4) + 2);
  const y = (v: number) => height - 2 - ((v - lo) / (hi - lo)) * (height - 4);
  const pts = points.map((p, i) => [Math.max(2, x(p, i)), y(p.v)] as const);
  const line = pts.map(([px, py]) => `${px.toFixed(1)},${py.toFixed(1)}`).join(" ");
  // Out-of-range stretches are drawn again in the status colour.
  const runs: string[] = [];
  let run: string[] = [];
  points.forEach((p, i) => {
    if (p.level !== "ok") run.push(`${pts[i][0].toFixed(1)},${pts[i][1].toFixed(1)}`);
    else if (run.length) {
      runs.push(run.join(" "));
      run = [];
    }
  });
  if (run.length) runs.push(run.join(" "));
  const last = pts[pts.length - 1];
  const lastLevel = points[points.length - 1].level;
  const flagged = lastLevel === "caution" || lastLevel === "warning";
  const bandTop = def.high !== undefined ? y(def.high) : 0;
  const bandBottom = def.low !== undefined ? y(def.low) : height;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" className="shrink-0 overflow-visible">
      <rect x="0" y={bandTop} width={width} height={Math.max(0, bandBottom - bandTop)} fill="var(--border)" opacity="0.4" />
      <polyline points={line} fill="none" stroke="var(--muted-foreground)" strokeWidth="1.25" strokeLinejoin="round" strokeLinecap="round" />
      {runs.map((r) => (
        <polyline key={r} points={r} fill="none" stroke={STATUS_VAR[lastLevel === "warning" ? "warning" : "caution"]} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      ))}
      {status !== "nodata" && <circle cx={last[0]} cy={last[1]} r="2" fill={flagged ? STATUS_VAR[lastLevel] : "var(--foreground)"} />}
    </svg>
  );
}
