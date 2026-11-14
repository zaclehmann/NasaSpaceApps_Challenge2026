// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// The figure with its region labels and a switch between three anatomy views.
// With room, labels sit beside the figure on leader lines.
// Without room (narrow column or phone), they become a list under the figure.
import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { PART_BY_ID, REGION_BY_ID, STATUS_WORD, partsFor, type BodyFace, type RegionId } from "@missionvitals/shared";
import type { HealthView } from "../../data/health";
import { useHighlights } from "../../state/selection";
import { useUi } from "../../state/ui";
import { BadgeIcon, StatusWord } from "../status/StatusBadge";
import { STATUS_TEXT } from "../status/statusStyles";
import { Tabs } from "../ui/Tabs";
import { BodyFigure } from "./BodyFigure";
import { FACES, LAYERS, LAYER_DEFS, type Layer } from "./bodyAnatomy";
import { zonesFor } from "./bodyZones";
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

const LAYER_KEY = "missionvitals.layer";

function useLayer(): [Layer, (l: Layer) => void] {
  const [layer, setLayer] = useState<Layer>(() => {
    try {
      const v = window.localStorage.getItem(LAYER_KEY);
      if (v === "organs" || v === "muscles" || v === "skeleton") return v;
    } catch {
      // Fall through to the default.
    }
    return "organs";
  });
  const set = (l: Layer) => {
    setLayer(l);
    try {
      window.localStorage.setItem(LAYER_KEY, l);
    } catch {
      // The choice lasts for this visit only.
    }
  };
  return [layer, set];
}

/**
 * One line of the readings that matter most for the chosen view. Screen readers only: hidden on screen.
 * Not a live region: the dose changes every minute, and announcing it each time would interrupt.
 * It sits straight after the view tabs, so it is read in order when someone moves on from them.
 */
function LayerSummary({ view, layer }: { view: HealthView; layer: Layer }) {
  const ex = view.indicators.exercise;
  const exText = ex.valueText ? `${ex.valueText} min today` : "not logged yet today";
  const week = ex.recentRange ? ` Last 7 days ${ex.recentRange} min.` : "";
  const dose = view.indicators.radiation.valueText;
  const text =
    layer === "organs"
      ? "Organ systems with their latest readings."
      : layer === "muscles"
        ? `Exercise ${exText}, against a demo target of 120 min.${week}`
        : `Bones keep their strength with daily load: exercise ${exText}.${dose ? ` Habitat dose ${dose} µGy/h.` : ""}`;
  return (
    <p className="sr-only">
      {text}
    </p>
  );
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
              <span className={s.status === "due" ? "text-muted-foreground" : "text-nodata-text"}>{s.status === "due" ? "due" : s.ev.reason === "silent" ? "no data" : "not taken"}</span>
            )}
          </span>
        );
      })}
    </>
  );
}

function RegionButton({ view, id, align, list, name }: { view: HealthView; id: RegionId; align: "left" | "right"; list?: boolean; name?: string }) {
  const { select, setHoverRegion } = useUi();
  const { hoverRegions, selectedRegions } = useHighlights(view);
  const status = view.regions[id];
  const selected = selectedRegions.has(id);
  const lit = selected || hoverRegions.has(id);
  const flagged = status !== null && status !== "ok" && status !== "due";
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
        {name ?? REGION_BY_ID[id].name}
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

/** A named part's label: its name, and its symptom status when it has one. */
function PartButton({ view, id, align, list, lit, onHover }: { view: HealthView; id: string; align: "left" | "right"; list?: boolean; lit: boolean; onHover: (id: string | null) => void }) {
  const { select, selection } = useUi();
  const part = PART_BY_ID[id];
  const status = view.parts[id];
  const selected = selection?.kind === "part" && selection.id === id;
  return (
    <button
      type="button"
      aria-label={`${part.name}${status ? `, ${STATUS_WORD[status].toLowerCase()} symptom` : ""}. Open to see or log a symptom.`}
      aria-pressed={selected}
      onClick={() => select({ kind: "part", id })}
      onMouseEnter={() => onHover(id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(id)}
      onBlur={() => onHover(null)}
      className={clsx(
        "block w-full rounded-sm type-caption transition-colors duration-[120ms]",
        list ? "min-h-12 px-4 py-2 text-left hover:bg-muted" : "relative px-1.5 py-px max-xl:before:absolute max-xl:before:inset-x-0 max-xl:before:-inset-y-[3px] max-xl:before:content-['']",
        !list && (align === "right" ? "text-left" : "text-right"),
        list && selected && "bg-muted",
      )}
    >
      <span className={clsx("block type-label whitespace-nowrap", lit || selected || status ? "text-foreground" : "text-muted-foreground", selected && "font-semibold", lit && !list && "underline underline-offset-2")}>
        {part.name}
      </span>
      {status && (
        <span className={clsx("flex items-center gap-1", !list && align === "left" && "justify-end")}>
          <BadgeIcon status={status} size={12} />
          <StatusWord status={status} />
          <span className="text-subtle-foreground">symptom</span>
        </span>
      )}
    </button>
  );
}

export interface PartCallout {
  id: string;
  side: "left" | "right";
  /** Centre of the label, in the figure's 600-unit height. */
  y: number;
  anchor: [number, number];
}

const LABEL_ONE = 19;
const LABEL_TWO = 35;
const LABEL_GAP = 3;

/**
 * Place a label for every part beside the figure. In the front view the body's right side is on the
 * viewer's left, so each label sits next to the part it names. Labels keep to their part's height where
 * they can and are pushed apart, then back up from the bottom, so none overlap.
 */
function layoutPartLabels(zones: { id: string; anchor: [number, number] }[], twoLines: (id: string) => boolean, pxPerUnit: number): PartCallout[] {
  const items = zones.map((z) => ({ id: z.id, anchor: z.anchor, side: (z.anchor[0] < 158 ? "left" : z.anchor[0] > 162 ? "right" : null) as "left" | "right" | null }));
  for (const it of items) {
    if (it.side) continue;
    const l = items.filter((x) => x.side === "left").length;
    const r = items.filter((x) => x.side === "right").length;
    it.side = l <= r ? "left" : "right";
  }
  const out: PartCallout[] = [];
  for (const side of ["left", "right"] as const) {
    const col = items.filter((x) => x.side === side).sort((a, b) => a.anchor[1] - b.anchor[1]);
    const h = col.map((x) => (twoLines(x.id) ? LABEL_TWO : LABEL_ONE) / pxPerUnit);
    const gap = LABEL_GAP / pxPerUnit;
    const tops = col.map((x, i) => x.anchor[1] - h[i] / 2);
    for (let i = 0; i < col.length; i++) tops[i] = Math.max(tops[i], i ? tops[i - 1] + h[i - 1] + gap : 4);
    for (let i = col.length - 1; i >= 0; i--) tops[i] = Math.min(tops[i], i < col.length - 1 ? tops[i + 1] - h[i] - gap : 596 - h[i]);
    col.forEach((x, i) => out.push({ id: x.id, side, y: tops[i] + h[i] / 2, anchor: x.anchor }));
  }
  return out;
}

interface Props {
  view: HealthView;
  /** Fill the height of the parent (desktop and tablet). On phone the stage takes its natural height. */
  fill?: boolean;
}

export function BodyStage({ view, fill = false }: Props) {
  const [ref, size] = useSize();
  const [layer, setLayer] = useLayer();
  const [face, setFace] = useState<BodyFace>("front");
  const [hoverPart, setHoverPart] = useState<string | null>(null);
  const { selection, select } = useUi();
  const pickerId = useId();
  const names = LAYER_DEFS[layer][face].names;
  const selectedPart = selection?.kind === "part" ? selection.id : null;
  const selectPart = (id: string) => select({ kind: "part", id });
  const parts = partsFor(layer, face);
  const zones = zonesFor(layer, face);
  const hovered = hoverPart ? zones.find((z) => z.id === hoverPart) : undefined;

  // A part opened from elsewhere (a symptom list, a report) brings its own view and side into sight.
  useEffect(() => {
    const part = selectedPart ? PART_BY_ID[selectedPart] : undefined;
    if (!part) return;
    if (part.layer !== layer) setLayer(part.layer);
    if (!part.faces.includes(face)) setFace(part.faces[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPart]);

  const figure = (leaders: boolean) => (
    <div className="relative h-full w-full">
      <BodyFigure view={view} leaders={leaders} partCallouts={partCallouts} layer={layer} face={face} selectedPart={selectedPart} hoverPart={hoverPart} onHoverPart={setHoverPart} onSelectPart={selectPart} />
      {hovered && (
        <div
          role="presentation"
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md bg-card px-2 py-1 type-caption font-medium whitespace-nowrap text-foreground shadow-float"
          style={{ left: `${(hovered.anchor[0] / 320) * 100}%`, top: `calc(${(hovered.anchor[1] / 600) * 100}% - 12px)` }}
        >
          {PART_BY_ID[hovered.id].name}
        </div>
      )}
    </div>
  );
  // Side labels need about 150 px each beside the figure. Narrower columns (1280 px screens, tablets)
  // get the two-column region list under the figure instead, so long names never collide.
  const callouts = fill && size.w >= 620 && size.h >= 470;
  const figH = callouts ? Math.min(size.h, 640, (size.w - 2 * LABEL_MIN) / RATIO) : fill ? Math.max(260, Math.min(420, size.h - 190, size.w / RATIO)) : Math.min(440, (size.w * 0.62) / RATIO);
  const figW = figH * RATIO;
  const top = (size.h - figH) / 2;
  const labelW = Math.min(190, (size.w - figW) / 2 - 10);
  // Organs keep the body-system labels, which carry the readings. Muscles and Skeleton label their own
  // parts, so an injury like a sore right forearm can be found and logged by name.
  const partMode = layer !== "organs";
  const partCallouts = partMode && callouts ? layoutPartLabels(zones, (id) => Boolean(view.parts[id]), figH / 600) : undefined;
  const litPart = hoverPart ?? selectedPart;

  return (
    <div className={clsx("flex min-w-0 flex-col", fill && "min-h-0 flex-1")}>
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pb-2">
      <Tabs label="Body view" items={LAYERS} value={layer} onChange={setLayer} />
      {/* Side is a separate choice from the view: a hairline and extra space keep the two groups apart. */}
      <span aria-hidden="true" className="mx-3 h-5 w-px bg-border-strong" />
      <Tabs label="Side" items={FACES} value={face} onChange={setFace} />
      <div className="relative ml-auto">
        <label htmlFor={pickerId} className="sr-only">
          Body part
        </label>
        <select
          id={pickerId}
          value={selectedPart && parts.some((p) => p.id === selectedPart) ? selectedPart : ""}
          onChange={(e) => e.target.value && selectPart(e.target.value)}
          className="h-8 max-w-[190px] appearance-none rounded-md border border-input bg-card pr-8 pl-2.5 type-small text-foreground max-xl:h-12"
        >
          <option value="">Choose a body part</option>
          {parts.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <ChevronDown size={14} strokeWidth={1.5} aria-hidden="true" className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground" />
      </div>
      <LayerSummary view={view} layer={layer} />
    </div>
    <div ref={ref} className={clsx("relative min-w-0", fill ? "min-h-0 flex-1" : "", !callouts && fill && "overflow-y-auto")} role="group" aria-label={partMode ? `Body, ${layer} view, ${face}. Choose a part to see or log a symptom.` : `Body, ${layer} view, ${face}. Tap a part to see or log a symptom, or a label to see what a body system means.`}>
      {size.w > 0 && callouts && (
        <>
          <div className="absolute" style={{ left: (size.w - figW) / 2, top, width: figW, height: figH }}>
            {figure(true)}
          </div>
          {partCallouts && (
            <ul aria-label={`${layer === "muscles" ? "Muscles" : "Bones"}, ${face}`}>
              {partCallouts.map((c) => {
                const x = (size.w + figW) / 2 + 8;
                const hPx = view.parts[c.id] ? LABEL_TWO : LABEL_ONE;
                return (
                  <li key={c.id} className="absolute" style={{ top: top + (c.y / 600) * figH - hPx / 2, width: labelW, ...(c.side === "right" ? { left: x } : { right: x }) }}>
                    <PartButton view={view} id={c.id} align={c.side} lit={litPart === c.id} onHover={setHoverPart} />
                  </li>
                );
              })}
            </ul>
          )}
          {!partCallouts && <ul>
            {REGION_ORDER.map((id) => {
              const c = CALLOUTS[id];
              const x = (size.w + figW) / 2 + 8;
              return (
                <li key={id} className="absolute" style={{ top: top + (c.y / 600) * figH - 11, width: labelW, ...(c.side === "right" ? { left: x } : { right: x }) }}>
                  <RegionButton view={view} id={id} align={c.side} name={names[id]} />
                </li>
              );
            })}
          </ul>}
        </>
      )}
      {size.w > 0 && !callouts && (
        <>
          <div className="mx-auto mt-2" style={{ width: figW, height: figH }}>
            {figure(false)}
          </div>
          {/* The list stands in for the side labels on phone and small tablets only. From 1024 px the
              figure itself is the control, so the list is not repeated beside it. */}
          <h3 className="mt-4 px-4 type-label text-muted-foreground lg:hidden">{partMode ? (layer === "muscles" ? "Muscles" : "Bones") : "Body systems"}</h3>
          <ul className={clsx("mt-2 grid lg:hidden", size.w >= 440 ? "grid-cols-2" : "grid-cols-1 divide-y divide-border border-y border-border")}>
            {partMode
              ? parts.map((p) => (
                  <li key={p.id}>
                    <PartButton view={view} id={p.id} align="right" list lit={litPart === p.id} onHover={setHoverPart} />
                  </li>
                ))
              : REGION_ORDER.map((id) => (
                  <li key={id}>
                    <RegionButton view={view} id={id} align="right" list name={names[id]} />
                  </li>
                ))}
          </ul>
        </>
      )}
    </div>
    </div>
  );
}
