// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Geometry for the body systems figure (ui.md 6): one smooth front-view outline in an A-pose, in a 320 x 600 box.
// The outline is drawn once for the figure's left half and mirrored, so the two sides always match.
// Regions are simple cut shapes; the figure clips them to the outline, so region edges follow the body.
import type { RegionId } from "@missionvitals/shared";

type Seg = [number, number, number, number, number, number];

const START: [number, number] = [160, 22];

/** Cubic segments from the top of the head, down the viewer's right side, to the crotch. */
const HALF: Seg[] = [
  [175, 22, 185, 33, 185, 48], // crown to temple
  [185, 50, 185, 52, 186, 53],
  [189, 52, 190.5, 56, 190, 61], // ear
  [189.6, 66, 187.5, 69.5, 184.5, 69],
  [183, 76, 178, 84, 171, 88], // jaw
  [171, 94, 171.5, 99, 174, 102], // neck
  [182, 106, 200, 108, 209, 113], // shoulder slope
  [217, 116.5, 223, 123, 227, 131], // shoulder cap
  [233, 145, 238.5, 163, 242.8, 178.6], // upper arm, outer
  [247, 193, 251.5, 205, 255.1, 216.8], // elbow
  [259, 225, 262, 232.5, 264.2, 240.1], // forearm
  [271, 260, 277, 280, 281.4, 297.7], // wrist
  [284, 303, 288.5, 309, 290.1, 315.8], // hand
  [293, 326, 295.5, 338, 293.5, 344],
  [292.5, 348, 288.5, 349.5, 286.5, 346], // fingertips
  [283, 340, 278, 331, 274.1, 321.6],
  [272, 315, 270.5, 308, 269.2, 302.1], // wrist, inner
  [262, 284, 253, 264, 245.4, 246.9], // forearm, inner
  [242, 238, 239.5, 230, 237.3, 223.2],
  [232, 208, 227, 195, 222.2, 186.2], // upper arm, inner
  [217, 173, 211, 160, 206.5, 152], // to the armpit
  [204.5, 150.5, 203.5, 153, 203.5, 157],
  [203.5, 185, 198, 215, 196.5, 245], // ribs to waist
  [196, 262, 201, 282, 203.5, 300], // waist to hip
  [207, 330, 206.5, 372, 203, 410], // thigh, outer
  [202, 420, 202.5, 428, 205, 438], // knee
  [209, 458, 208.5, 488, 204.5, 520], // calf
  [203.5, 532, 204, 542, 205.5, 549], // ankle
  [209, 556, 215.5, 564, 215, 571], // foot
  [214.5, 577, 207, 578, 199, 578],
  [193, 578, 188.5, 577, 188.5, 571],
  [188.5, 563, 191, 556, 191, 548], // ankle, inner
  [190, 535, 187.5, 505, 183.5, 478], // calf, inner
  [181.5, 462, 180, 448, 180.5, 438],
  [181, 428, 180.5, 418, 179, 408], // knee, inner
  [175, 378, 168.5, 345, 162, 322], // thigh, inner
  [161.5, 320, 160.8, 319, 160, 319], // crotch
];

const n = (v: number) => Number(v.toFixed(2));
const mx = (x: number) => n(320 - x);

/** The whole outline as one closed path: right side down, then the mirrored left side back up. */
export const BODY_PATH = (() => {
  let d = `M${START[0]} ${START[1]}`;
  for (const s of HALF) d += `C${s.join(" ")}`;
  for (let i = HALF.length - 1; i >= 0; i--) {
    const [c1x, c1y, c2x, c2y] = HALF[i];
    const [px, py] = i === 0 ? START : [HALF[i - 1][4], HALF[i - 1][5]];
    d += `C${mx(c2x)} ${c2y} ${mx(c1x)} ${c1y} ${mx(px)} ${py}`;
  }
  return `${d}Z`;
})();

const rect = (x: number, y: number, w: number, h: number) => `M${x} ${y}h${w}v${h}h${-w}Z`;
const poly = (pts: [number, number][]) => `M${pts.map((p) => p.join(" ")).join("L")}Z`;
const mirror = (pts: [number, number][]) => pts.map(([x, y]) => [mx(x), y] as [number, number]);
const ellipse = (cx: number, cy: number, rx: number, ry: number) => `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0Z`;
const roundRect = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}h${-(w - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${-r}v${-(h - 2 * r)}a${r} ${r} 0 0 1 ${r} ${-r}Z`;

/** The line from the top of the shoulder to the armpit, then down between arm and torso. */
const ARM: [number, number][] = [
  [212, 104],
  [205, 150],
  [209, 190],
  [212, 292],
  [212, 400],
  [320, 400],
  [320, 80],
  [212, 80],
];

export type CutRegion = Exclude<RegionId, "whole">;

/** Cut shapes per region. "Whole body" is the halo around the outline, not a cut. */
export const CUTS: Record<CutRegion, string[]> = {
  brain: [rect(120, 0, 80, 50)],
  eyes: [rect(139, 50, 42, 14)],
  ear: [rect(181, 49, 15, 23), rect(124, 49, 15, 23)],
  immune: [rect(146, 88, 28, 15), ellipse(200, 160, 7, 12), ellipse(120, 160, 7, 12)],
  lungs: [poly([[108, 104], [212, 104], [205, 150], [209, 190], [111, 190], [115, 150]])],
  heart: [roundRect(163, 130, 36, 44, 16)],
  gut: [rect(108, 190, 104, 102)],
  musculoskeletal: [poly(ARM), poly(mirror(ARM)), rect(100, 292, 120, 308)],
};

/** Paint and hit order, back to front. */
export const CUT_ORDER: CutRegion[] = ["musculoskeletal", "gut", "lungs", "heart", "immune", "brain", "eyes", "ear"];

export interface Callout {
  side: "left" | "right";
  /** Where the label sits, as a y position in the figure's box. */
  y: number;
  /** The point on the figure the leader line starts from. The status badge also sits here. */
  anchor: [number, number];
}

/** Label slots, spaced so labels never collide. Reading order runs top to bottom. */
export const CALLOUTS: Record<RegionId, Callout> = {
  brain: { side: "left", y: 30, anchor: [160, 36] },
  ear: { side: "right", y: 40, anchor: [188, 60] },
  eyes: { side: "left", y: 80, anchor: [150, 57] },
  immune: { side: "right", y: 94, anchor: [166, 96] },
  lungs: { side: "left", y: 138, anchor: [136, 138] },
  heart: { side: "right", y: 152, anchor: [182, 152] },
  gut: { side: "left", y: 242, anchor: [150, 242] },
  musculoskeletal: { side: "right", y: 264, anchor: [261, 264] },
  whole: { side: "left", y: 470, anchor: [105, 470] },
};

/** Regions in reading order, top to bottom. */
export const REGION_ORDER: RegionId[] = ["brain", "ear", "eyes", "immune", "lungs", "heart", "gut", "musculoskeletal", "whole"];
