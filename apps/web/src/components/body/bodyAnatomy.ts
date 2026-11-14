// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Anatomy layers for the body figure, in the same 320 x 600 box as the outline (bodyShape.ts).
// Three views (Organs, Muscles, Skeleton), each with a front and a back. Each says how every region is
// drawn: as an anatomical shape (an organ, a muscle group, a bone) or as a cut of the outline.
//
// The drawings follow standard surface anatomy in the anatomical position: the heart two thirds to the
// body's left with its apex down and left, a three-lobed right lung and a two-lobed left lung with the
// cardiac notch, the liver under the right dome of the diaphragm, twelve pairs of ribs (seven true,
// three false, two floating) and so on. They are schematic teaching diagrams, not clinical images:
// they show where things are, not an individual's anatomy, and no status or advice depends on them.
// In the front view the body's left is on the viewer's right. Symmetric parts are drawn once and mirrored.
import type { BodyFace, BodyLayer, RegionId } from "@missionvitals/shared";
import type { CutRegion } from "./bodyShape";

export type Layer = BodyLayer;

export const FACES: { value: BodyFace; label: string }[] = [
  { value: "front", label: "Front" },
  { value: "back", label: "Back" },
];

export const LAYERS: { value: Layer; label: string }[] = [
  { value: "organs", label: "Organs" },
  { value: "muscles", label: "Muscles" },
  { value: "skeleton", label: "Skeleton" },
];

/** bone-back: bone seen behind other bone. cartilage: costal cartilage. hollow: an opening in bone. */
export type Tone = "organ" | "bone" | "bone-back" | "cartilage" | "hollow" | "muscle";

export interface Shape {
  d: string;
  /** Also draw it mirrored across the body's midline. */
  mirror?: boolean;
}

export type RegionArt = { kind: "cut" } | { kind: "shape"; tone: Tone; shapes: Shape[] };

interface Group {
  tone: Tone;
  shapes: Shape[];
}

export interface LayerDef {
  regions: Record<CutRegion, RegionArt>;
  /** Neutral parts drawn under the region shapes (spine, back of the ribs, pelvis). */
  fills: Group[];
  /** Neutral parts drawn over the region shapes (front of the ribs, sternum, limb bones). */
  over: Group[];
  /** Fine detail lines drawn last (fissures, sutures, tendon lines). */
  lines: { tone: Tone; width: number; shapes: Shape[] }[];
  /** Where leader lines meet each region in this view, if not the default. */
  anchors: Partial<Record<RegionId, [number, number]>>;
  /** Region names for the labels in this view, if not the default. */
  names: Partial<Record<RegionId, string>>;
}

/* ---------- drawing helpers ---------- */

type Pt = [number, number];
const f = (v: number) => Number(v.toFixed(1));
const one = (...d: string[]): Shape[] => d.map((x) => ({ d: x }));
const both = (...d: string[]): Shape[] => d.flatMap((x) => [{ d: x }, { d: x, mirror: true }]);
const ell = (cx: number, cy: number, rx: number, ry: number) => `M${f(cx - rx)} ${f(cy)}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0Z`;
const rr = (x: number, y: number, w: number, h: number, r: number) =>
  `M${f(x + r)} ${f(y)}h${f(w - 2 * r)}a${r} ${r} 0 0 1 ${r} ${r}v${f(h - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${r}h${f(-(w - 2 * r))}a${r} ${r} 0 0 1 ${-r} ${-r}v${f(-(h - 2 * r))}a${r} ${r} 0 0 1 ${r} ${-r}Z`;

/** Points along a smooth curve through the control points, with each point's position in control-point units. */
function spline(pts: Pt[], per: number): { p: Pt; u: number }[] {
  const out: { p: Pt; u: number }[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let s = 0; s < per; s++) {
      const t = s / per;
      const c = (a: number, b: number, c2: number, d: number) => 0.5 * (2 * b + (-a + c2) * t + (2 * a - 5 * b + 4 * c2 - d) * t * t + (-a + 3 * b - 3 * c2 + d) * t * t * t);
      out.push({ p: [c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])], u: i + t });
    }
  }
  out.push({ p: pts[pts.length - 1], u: pts.length - 1 });
  return out;
}

/**
 * A closed band following a smooth curve through the points. `widths` is one width, or one per point,
 * so a band can taper like a muscle belly or flare like the end of a long bone.
 */
function band(pts: Pt[], widths: number | number[], per = 6): string {
  const s = spline(pts, per);
  const wAt = (u: number) => {
    if (typeof widths === "number") return widths;
    const i = Math.min(widths.length - 2, Math.floor(u));
    return widths[i] + (widths[i + 1] - widths[i]) * (u - i);
  };
  const left: Pt[] = [];
  const right: Pt[] = [];
  s.forEach(({ p, u }, k) => {
    const a = s[Math.max(0, k - 1)].p;
    const b = s[Math.min(s.length - 1, k + 1)].p;
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const nx = -(b[1] - a[1]) / len;
    const ny = (b[0] - a[0]) / len;
    const w = wAt(u) / 2;
    left.push([p[0] + nx * w, p[1] + ny * w]);
    right.push([p[0] - nx * w, p[1] - ny * w]);
  });
  const all = [...left, ...right.reverse()];
  return `M${all.map((p) => `${f(p[0])} ${f(p[1])}`).join("L")}Z`;
}

/** Move a path made of absolute M, C and L commands up or down, or squeeze it toward a level. */
function mapY(d: string, fn: (y: number) => number): string {
  let i = 0;
  return d.replace(/-?\d+(\.\d+)?/g, (n) => (i++ % 2 === 1 ? String(f(fn(Number(n)))) : n));
}
const shiftY = (d: string, dy: number) => mapY(d, (y) => y + dy);
const squeezeY = (d: string, y0: number, k: number) => mapY(d, (y) => y0 + (y - y0) * k);

// The arm runs from the shoulder at about 20 degrees from vertical. `along` gives a point at a distance
// down the arm and an offset across it (positive is lateral, the thumb side in the anatomical position).
const ARM: Pt = [212, 126];
const along = (t: number, off = 0): Pt => [ARM[0] + t * 0.342 + off * 0.94, ARM[1] + t * 0.94 - off * 0.342];

/* ---------- organs, front ---------- */

/** Cerebral hemispheres seen from the front, inside the skull and above the eyes. */
const CEREBRUM = "M160 27.5C152 27 143.5 31.5 142 41C141 49 145.5 54.5 152 55.5C155.5 56 158.5 55 160 53.5C161.5 55 164.5 56 168 55.5C174.5 54.5 179 49 178 41C176.5 31.5 168 27 160 27.5Z";
const GYRI = [
  ...one("M160 28.5L160 53"),
  ...both("M146 36C150 37 150 41 154 41.5", "M144 45C148 45 150 48.5 154.5 48", "M152 30.5C155 33 153.5 36.5 157 37.5", "M149 52C152 51 154 52.5 157 51"),
];
const EYEBALLS = both(ell(151, 57, 4.2, 3.6));
const INNER_EARS = both(ell(179.5, 62, 2.2, 2.8));

/** Windpipe from the larynx to where it divides, and the two main bronchi. */
const TRACHEA = band([[160, 88], [160, 108], [160, 130]], [7, 5.2, 5.2]);
const BRONCHUS_R = band([[160, 129], [153, 135], [147, 141]], [4.4, 4, 3.2]);
const BRONCHUS_L = band([[160, 129], [167, 136], [172, 143]], [4.2, 3.8, 3]);
/** The body's right lung, on the viewer's left: three lobes, the higher dome under it. */
const LUNG_R_RAW = "M149 110C143 110 136 118 131 130C126 142 123.5 158 123.5 174C123.5 182 124 189 125 194C132 190 139 184 146 182C150 181 153 182 155 184C155.5 170 155 150 154.5 134C154 122 153 112 149 110Z";
/** The body's left lung, on the viewer's right: two lobes, with the cardiac notch where the heart sits. */
const LUNG_L_RAW = "M171 110C177 110 184 118 189 130C194 142 196.5 158 196.5 174C196.5 182 196 190 195 196C190 192 184 188 180 187C179 180 176.5 172 172 166C168.5 160 166 152 165.5 142C165 130 166 114 171 110Z";
/** The lung bases sit on the diaphragm at about the sixth rib in front, so the raw outlines are squeezed toward the apex. */
const LUNG_K = 0.9;
const LUNG_R = squeezeY(LUNG_R_RAW, 110, LUNG_K);
const LUNG_L = squeezeY(LUNG_L_RAW, 110, LUNG_K);
const LUNG_LINES = [
  ...one(
    "M154.5 150C144 150 134 152 126 156", // horizontal fissure, right lung
    "M150 124C140 142 131 166 125.5 186", // oblique fissure, right lung
    "M171 124C180 142 189 166 194.5 188", // oblique fissure, left lung
  ).map((sh) => ({ d: squeezeY(sh.d, 110, LUNG_K) })),
  ...one("M157.5 95H162.5M157.5 101H162.5M157.5 107H162.5M157.5 113H162.5M157.5 119H162.5"), // tracheal rings
];
/** Heart in the middle of the chest, two thirds to the body's left, apex down and to the left. */
const HEART = shiftY("M152 151C150 160 151 172 156 178.5C164 184.5 174 188.5 181 186.5C186.5 181 185 167 180.5 157C178 150 172.5 144.5 166.5 144C160.5 143.5 154.5 146 152 151Z", -11);
/** Great vessels: aortic arch, pulmonary trunk and superior vena cava. */
const AORTA = band([[161, 137], [160.5, 129], [165, 124.5], [171, 127], [172.5, 136]], [6.5, 6, 5.6, 5.2, 4.8]);
const PULMONARY_TRUNK = band([[166.5, 138], [169.5, 132], [175, 130]], [6, 5.4, 4.4]);
const VENA_CAVA = band([[153.5, 142], [153, 131], [153.5, 121]], [5, 4.6, 4.4]);
const HEART_LINES = one("M158 152C164 160 172 172 180 185", "M153.5 163C160 168 168 170 176 168").map((sh) => ({ d: shiftY(sh.d, -11) }));
const DIAPHRAGM = ["M124.5 196.5C131 191 139 185.5 146 183.5C151.5 183 156 185 160 187.5C165 188.5 172 187 180 188.5C186 190.5 191.5 194 195.5 198"].map((d) => ({ d: shiftY(d, -9) }));
/** Liver under the right dome of the diaphragm, its left lobe crossing the midline. */
const LIVER = shiftY("M124 198C131 193 139 187.5 146 185.5C152 185 157 187 162 189C169 191 175 194 179 198C176 204 166 209 154 214C144 219 132 226 125 227C122 219 121.5 207 124 198Z", -9);
const GALLBLADDER = shiftY("M144.5 214C146.5 213 148.5 214.5 148.5 217.5C148.5 221 147 223.5 145.5 223.5C144 223.5 143 221 143 218C143 216 143.5 214.5 144.5 214Z", -9);
/** Stomach under the left dome: fundus above, curving down and across to the pylorus. */
const STOMACH = shiftY("M167 200C169 194 179 190 187 193C194 197 196 207 194 217C192 227 185 235 176 238C169 240 162 237 159 231C163 231 168 229 171 224C174 218 171 209 167 200Z", -8);
const SPLEEN = ell(195.4, 199, 3.2, 8.5);
/** Large intestine: up the body's right, across under the stomach, down the left, then the sigmoid curve. */
const COLON = band([[131, 290], [130, 264], [131.5, 243], [146, 245], [160, 249], [175, 245], [189.5, 239], [191, 258], [190, 278], [183, 289], [173, 293], [165, 299]], [10, 10, 10, 10, 10, 10, 10, 10, 10, 9.5, 8.5, 7], 8);
const APPENDIX = band([[131.5, 292], [134.5, 297], [133.5, 302]], [2.6, 2.4, 1.8]);
const SMALL_INTESTINE = "M140 254C148 250.5 172 250.5 180 254C184 263 184 276 179 285.5C170 290 150 290 141 285.5C136 276 136 263 140 254Z";
const GUT_LINES = one(
  "M143 259C149 255 153 263 159 259C165 255 169 263 177 258.5",
  "M142 267C148 263 153 271 159 267C165 263 170 271 178 266.5",
  "M143 275C149 271 153 279 159 275C165 271 170 279 177 274.5",
  "M146 283C151 280 155 286 160 283C165 280 169 286 174 282.5",
  "M126 252H134M126 264H134M126 276H134M187 250H195M186 262H195M186 274H194", // haustra of the colon
  "M140 241.5V248M152 243.5V250M168 244V250.5M180 240.5V247",
  "M159 223C163 225 166 225.5 169 224.5", // pylorus
);
const BLADDER = "M153 303C155 298 165 298 167 303C168 309 164 312.5 160 312.5C156 312.5 152 309 153 303Z";
/** Lymph nodes at the neck, armpits and groin, the thymus behind the breastbone, and the spleen. */
const THYMUS = shiftY("M156.5 114C158 112.5 162 112.5 163.5 114C164.5 120 163.5 127 162 131L158 131C156.5 127 155.5 120 156.5 114Z", 7);
const LYMPH_NODES = both(ell(170.5, 95, 2.1, 2.1), ell(172, 101, 1.8, 1.8), ell(201, 153, 2.4, 2.8), ell(198.5, 159.5, 2, 2.3), ell(177, 304, 2.3, 2.3), ell(171, 309, 2, 2));

const ORGAN_REGIONS = {
  brain: { kind: "shape", tone: "organ", shapes: one(CEREBRUM) },
  eyes: { kind: "shape", tone: "organ", shapes: EYEBALLS },
  ear: { kind: "shape", tone: "organ", shapes: INNER_EARS },
  lungs: { kind: "shape", tone: "organ", shapes: one(LUNG_R, LUNG_L, TRACHEA, BRONCHUS_R, BRONCHUS_L) },
  heart: { kind: "shape", tone: "organ", shapes: one(VENA_CAVA, AORTA, PULMONARY_TRUNK, HEART) },
  immune: { kind: "shape", tone: "organ", shapes: [...one(THYMUS, SPLEEN), ...LYMPH_NODES] },
  gut: { kind: "shape", tone: "organ", shapes: one(STOMACH, COLON, APPENDIX, SMALL_INTESTINE, LIVER, GALLBLADDER) },
} satisfies Partial<Record<CutRegion, RegionArt>>;

const ORGAN_LINES = [...GYRI, ...LUNG_LINES, ...HEART_LINES, ...DIAPHRAGM, ...GUT_LINES];

const ORGAN_ANCHORS: Partial<Record<RegionId, [number, number]>> = {
  brain: [152, 40],
  eyes: [151, 57],
  ear: [179.5, 62],
  immune: [170.5, 95],
  lungs: [137, 146],
  heart: [172, 158],
  gut: [158, 268],
};

/* ---------- organs, back ---------- */

/** From behind: the cerebrum, the cerebellum under it, and the spinal cord, which ends near the first lumbar vertebra. */
const CEREBELLUM = "M148 58C152 55.5 168 55.5 172 58C174 63 170 67.5 160 67.5C150 67.5 146 63 148 58Z";
const SPINAL_CORD = band([[160, 67], [160, 110], [160, 170], [160, 213]], [4.4, 3.6, 3.2, 2]);
const CORD_LINES = one("M158.8 214C157.5 232 156.5 250 156 264M160 214V266M161.2 214C162.5 232 163.5 250 164 264", "M149 61C153 60 167 60 171 61M150 64.5C154 63.5 166 63.5 170 64.5");
/** A kidney with its notch facing the spine. dir is 1 for the viewer's right, -1 for the viewer's left. */
const kidney = (cx: number, cy: number, dir: 1 | -1) => {
  const x = (dx: number) => f(cx + dir * dx);
  return `M${x(-5)} ${cy - 12}C${x(4)} ${cy - 15} ${x(9)} ${cy - 6} ${x(8)} ${cy + 2}C${x(7)} ${cy + 11} ${x(1)} ${cy + 15} ${x(-5)} ${cy + 12}C${x(-2)} ${cy + 7} ${x(-1.5)} ${cy + 3} ${x(-1.5)} ${cy}C${x(-1.5)} ${cy - 3} ${x(-2)} ${cy - 7} ${x(-5)} ${cy - 12}Z`;
};
/** Seen from behind, the left kidney is on the viewer's left and sits a little higher than the right. */
const KIDNEYS = one(kidney(142, 212, -1), kidney(178, 216, 1));
const URETERS = one("M144 215C148 240 154 280 158 300", "M176 219C172 242 166 280 162 300");
/** From behind, both lungs show their full back surfaces; the cardiac notch faces the front. */
const LUNGS_BACK: Shape[] = [{ d: squeezeY(LUNG_R_RAW, 110, 1) }, { d: squeezeY(LUNG_R_RAW, 110, 1), mirror: true }];

/* ---------- skeleton, front ---------- */

const SKULL = "M160 25C174 25 182 35 182 48C182 54 181 59 179 62C180 65 179 68 176 69.5C175 72.5 173 75.5 170 77.5L150 77.5C147 75.5 145 72.5 144 69.5C141 68 140 65 141 62C139 59 138 54 138 48C138 35 146 25 160 25Z";
const MANDIBLE = "M143.5 66C143.5 74 146.5 82 152.5 86C156.5 88.3 163.5 88.3 167.5 86C173.5 82 176.5 74 176.5 66L173 66C172.6 72 170.6 77 166.8 79.6C163 81 157 81 153.2 79.6C149.4 77 147.4 72 147 66Z";
const CRANIUM = "M139.5 51C139.5 35.5 147.5 26.5 160 26.5C172.5 26.5 180.5 35.5 180.5 51C176 52.5 168 52 160 52.5C152 52 144 52.5 139.5 51Z";
const ORBITS = both("M145.2 55.5C146 52.5 154.5 52.5 156.2 55C157 59 155.5 62.5 151.5 62.8C147.5 63 144.6 60 145.2 55.5Z");
const NASAL = "M160 60.5C157.6 63.5 156.6 67.5 158 70L162 70C163.4 67.5 162.4 63.5 160 60.5Z";
const EAR_CANALS = both(ell(181, 63.5, 1.6, 1.9));
const SKULL_LINES = one("M150.5 77.8H169.5", "M153 76V79.6M156.5 76V79.8M160 76V80M163.5 76V79.8M167 76V79.6", "M141 44C147 41.5 173 41.5 179 44");

/** Vertebrae from the top of the neck to the bottom of the lower back: 7 cervical, 12 thoracic, 5 lumbar. */
const vertebra = (y: number, w: number, h: number) => rr(160 - w / 2, y - h / 2, w, h, Math.min(2, h / 3));
const CERVICAL = Array.from({ length: 7 }, (_, i) => vertebra(81.5 + i * 3.9, 9 + i * 0.4, 3));
const THORACIC = Array.from({ length: 12 }, (_, i) => vertebra(110 + i * 8, 11 + i * 0.3, 6));
const LUMBAR = Array.from({ length: 5 }, (_, i) => vertebra(207 + i * 11, 16 + i * 0.8, 8.6));
const SACRUM = "M149.5 259.5L170.5 259.5C169.5 274 165.5 289 161.5 299L160 306L158.5 299C154.5 289 150.5 274 149.5 259.5Z";
const SACRUM_LINES = one("M152 268H168M153.5 276.5H166.5M155.5 285H164.5M157 293H163");
/** One hip bone (viewer's right): ilium above, pubis in front, ischium below, round the obturator foramen. */
const HIP_BONE = "M168.5 265C176 257 190 255 198 261C201.5 267 199.5 278 195.5 286C198.5 292 197.5 302 192.5 306C189 314 182.5 322 174.5 324C168.5 324.5 163.5 320.5 162 314.5L162 304.5C168 300.5 174 298 176 292C174.5 284 171 275 168.5 265Z";
const OBTURATOR = both(ell(171.5, 313, 5, 6.2));
const PUBIC_SYMPHYSIS = rr(158.6, 304.5, 2.8, 10.5, 1.2);

const MANUBRIUM = shiftY("M152 109L168 109C169 114 167.5 119 165 122L155 122C152.5 119 151 114 152 109Z", 7);
const STERNUM_BODY = shiftY("M155.5 123L164.5 123C166 136 166 152 164 166L156 166C154 152 154 136 155.5 123Z", 7);
const XIPHOID = shiftY("M158 167L162 167L160 176Z", 7);
const CLAVICLE = band([[166.5, 118], [180, 112.5], [195, 112.5], [207.5, 115]], [4.6, 3.2, 3.2, 4.4]);
const ACROMION = band([[199, 113.5], [206, 114], [211.5, 118]], [3.6, 4.6, 4]);
const CORACOID = ell(199.5, 121.5, 2.4, 3.2);

/** Rib geometry on the viewer's right. Each rib leaves the spine, sweeps out and down, then forward to its cartilage. */
const RIB_W = [20, 27, 31, 34, 36, 37.5, 38, 38, 37, 35.5];
const RIB_DROP = [0, 12, 15, 18, 20, 21.5, 22.5, 24, 24, 23];
const RIB_JOINT_X = [0, 15.5, 15.5, 16, 17, 18, 19, 24, 27, 29];
const STERNAL_Y = [122, 131, 140, 149, 157, 164, 171];
/** Where the cartilages of ribs 8 to 10 join the one above, forming the costal margin. */
const MARGIN: Pt[] = [[172, 179.5], [179, 189], [185, 198.5]];
const ribY = (i: number) => 110 + i * 8;

const RIBS_BACK: string[] = [];
const RIBS_FRONT: string[] = [];
const COSTAL_CARTILAGE: string[] = [];
RIBS_BACK.push(band([[165, 109], [176, 106.5], [180.5, 113]], 2.2));
RIBS_FRONT.push(band([[180.5, 113], [177.5, 120], [171, 122.5]], 2.6));
COSTAL_CARTILAGE.push(band([[171, 122.5], [167.2, 121.5]], 2.6));
for (let i = 1; i < 10; i++) {
  const y = ribY(i);
  const w = RIB_W[i];
  const side: Pt = [160 + w, y + 7];
  const joint: Pt = [160 + RIB_JOINT_X[i], y + RIB_DROP[i]];
  RIBS_BACK.push(band([[165, y], [160 + w * 0.62, y - 2.5], side], 2.2));
  RIBS_FRONT.push(band([side, [160 + w - 1.5, y + 13.5], [(side[0] + joint[0]) / 2 + 3, y + RIB_DROP[i] - 1.5], joint], 2.8));
  const end: Pt = i < 7 ? [165.2, STERNAL_Y[i]] : MARGIN[i - 7];
  COSTAL_CARTILAGE.push(band([joint, [(joint[0] + end[0]) / 2, (joint[1] + end[1]) / 2 + 1.5], end], 2.4));
}
/** Ribs 11 and 12 are floating: they end free in the side wall. */
RIBS_BACK.push(band([[165, 190], [180, 189], [190.5, 198.5]], [2.2, 2.2, 1.6]));
RIBS_BACK.push(band([[165, 198], [175, 198], [182.5, 205.5]], [2.2, 2.2, 1.6]));

/** Upper limb: humerus, then radius (thumb side) and ulna, wrist bones and the five rays of the hand. */
const HUMERUS = [ell(207.5, 127, 6.3, 6.3), band([along(6), along(48), along(88)], [7.5, 5.4, 7]), band([along(95, -7), along(96, 0), along(95, 7)], [6, 7, 6])];
const RADIUS = band([along(103, 4), along(140, 4.6), along(184, 3)], [4.6, 3.8, 4.2]);
const ULNA = band([along(99, -3.6), along(140, -3.8), along(184, -3)], [5.6, 3.4, 2.6]);
const HAND = [
  band([along(188, -4.5), along(190, 0), along(188, 4.5)], [5, 6, 5]),
  band([along(193, 4.5), along(203, 6.8), along(212, 8)], 2.4),
  band([along(196, 3.2), along(214, 4.6), along(230, 5.2)], 2.3),
  band([along(197, 0.6), along(216, 1.2), along(233.5, 1.4)], 2.3),
  band([along(196.5, -2.2), along(214, -2.4), along(230.5, -2.2)], 2.2),
  band([along(195.5, -4.8), along(210, -6), along(224, -6.2)], 2.1),
];
/** Lower limb: femur with its head in the hip socket, kneecap, tibia (shin) and the thinner fibula outside it. */
const FEMUR = [
  ell(187, 299.5, 6.2, 6.2),
  band([[187, 299.5], [193, 302.5], [198, 305.5]], [5.4, 5, 6]),
  ell(198.5, 306.5, 4.4, 6),
  band([[197.5, 309], [195, 345], [192.2, 392], [191, 419]], [8, 6.4, 6.4, 9]),
  band([[183.5, 427.5], [191, 425.5], [198.5, 427.5]], [13, 11, 13]),
];
const PATELLA = "M191 421.5C195.2 421.5 197 425.5 195.6 430C194.4 433.4 187.6 433.4 186.4 430C185 425.5 186.8 421.5 191 421.5Z";
const TIBIA = [band([[183, 440.5], [191, 439.5], [199.5, 440.5]], [6.5, 7, 6.5]), band([[191, 442], [192.6, 490], [195, 541]], [10.5, 6.4, 6.6]), ell(192.8, 548, 3.6, 4.2)];
const FIBULA = [band([[202, 444], [203.6, 490], [202.4, 545]], [4.4, 2.6, 3.4]), ell(202.6, 550.5, 2.6, 4)];
const FOOT = [
  "M190.5 554C194 551 203.5 551 207.5 554L209.5 561L190 561Z",
  band([[192, 561.5], [191.6, 568], [191.4, 574]], 2.5),
  band([[196.4, 561.5], [196.6, 569], [196.8, 576]], 2.4),
  band([[200.8, 561.5], [201.6, 569], [202.4, 576.4]], 2.4),
  band([[205, 561.5], [206.4, 568.5], [207.6, 575.5]], 2.3),
  band([[208.6, 561.5], [210.4, 567.5], [212, 573.5]], 2.2),
];

/* ---------- skeleton, back ---------- */

/** Shoulder blade on the back of the ribs, with its spine running out to the acromion. */
const SCAPULA = "M174 119.5C184 117.5 196 119.5 203 124.5C205 128.5 204 132.5 202 135.5C196 146.5 188 158.5 180.5 167.5C176.5 152.5 173 134.5 174 119.5Z";
const SCAPULAR_SPINE = band([[176, 129], [194, 122], [210, 116]], [2.6, 3.6, 5]);
const SPINOUS = [...Array.from({ length: 12 }, (_, i) => ell(160, 110 + i * 8, 1.5, 2.4)), ...Array.from({ length: 5 }, (_, i) => ell(160, 207 + i * 11, 1.8, 3))];
const CALCANEUS = "M192 549C196 546.5 202 546.5 206 549C208.5 557 208 568 205 574.5C202 577.5 195 577.5 192.5 574.5C190 568 190 557 192 549Z";

/* ---------- muscles, front (viewer's right, mirrored) ---------- */

const STERNOMASTOID = band([[174, 80], [169.5, 95], [163.5, 109.5]], [3.4, 4.8, 3]);
const TRAPEZIUS_FRONT = "M171 90C174 98 186 106 206 112C196 113.5 184 112.5 172.5 109.5C170.5 104 170.5 96 171 90Z";
const PECTORAL = "M163 114C172 111.5 182 112 188.5 114C198 124 207 138 212 150.5C206 156.5 196 162 184 164C174 165 166 162 163 156Z";
const DELTOID = "M187 112C197 108.5 211 110 219 116C226.5 122 231.5 135 234 148.5C235.5 159 236.5 169 235.5 177C230.5 170 224 160 217 150C209 138 199 124 187 112Z";
const BICEPS = band([along(22, -1.5), along(46, -2.5), along(70, -2.8), along(95, -1)], [5, 12.5, 13, 4.5]);
const BRACHIALIS = band([along(56, 8), along(74, 8.6), along(93, 7)], [2, 5, 2]);
const BRACHIORADIALIS = band([along(86, 6.5), along(114, 6.6), along(150, 4.8), along(182, 3.6)], [3, 9.6, 6, 2]);
const FOREARM_FLEXORS = band([along(97, -5), along(120, -5.4), along(150, -3.4), along(182, -2)], [4, 9.6, 6.4, 3]);
const SERRATUS = [band([[199.5, 165], [191, 169.5]], [4.4, 1.2]), band([[200, 175], [191, 180]], [4.4, 1.2]), band([[200, 185], [191.5, 190.5]], [4.2, 1.2])];
const RECTUS_ABDOMINIS = [rr(162, 168, 13, 16.5, 4), rr(162, 187.5, 13.4, 19, 4), rr(162, 209.5, 13.4, 21, 4), "M162 233.5H175.4C176 257 172.5 281 165.5 299.5H162Z"];
const OBLIQUE = "M178 172C186 180 197 190 201.5 200C198.5 222 196.5 244 198 262C199 270 200.5 276 201 281C192 288 181 297 170 304C174 280 177.5 230 178 172Z";
const TENSOR_FASCIAE = band([[197, 282], [201, 300], [202, 323]], [4, 7.4, 3]);
const RECTUS_FEMORIS = band([[192, 300], [193, 340], [192.6, 390], [191.5, 420]], [7, 14, 13, 6]);
const VASTUS_LATERALIS = band([[200, 316], [203, 350], [202, 395], [197.5, 424]], [5, 9, 9, 5]);
const VASTUS_MEDIALIS = band([[184.5, 372], [182.6, 400], [184.8, 426]], [4, 11, 6]);
const ADDUCTORS = "M163.5 322C170 318 179 312 186 304C186 326 184.5 352 181.5 378C179 392 178.5 404 179 414C175 388 169 352 163.5 322Z";
const SARTORIUS = band([[196.5, 281], [190, 320], [183.6, 380], [180.8, 432]], [4, 4.6, 4.6, 3.4]);
const PATELLAR_TENDON = band([[191, 426], [191.4, 447]], [6.4, 4]);
const TIBIALIS_ANTERIOR = band([[198, 444], [200.2, 470], [199.2, 505], [196.2, 538]], [4, 8.6, 6, 2.4]);
const CALF_INNER = band([[184, 442], [184.4, 468], [187, 502]], [3, 8.4, 2]);
const PERONEALS = band([[205, 448], [206.8, 478], [205, 516]], [2, 4.6, 2]);

const MUSCLES_FRONT = both(
  TRAPEZIUS_FRONT,
  STERNOMASTOID,
  PECTORAL,
  ...SERRATUS,
  OBLIQUE,
  ...RECTUS_ABDOMINIS,
  DELTOID,
  BRACHIALIS,
  BICEPS,
  FOREARM_FLEXORS,
  BRACHIORADIALIS,
  ADDUCTORS,
  TENSOR_FASCIAE,
  VASTUS_LATERALIS,
  VASTUS_MEDIALIS,
  RECTUS_FEMORIS,
  SARTORIUS,
  PATELLAR_TENDON,
  CALF_INNER,
  PERONEALS,
  TIBIALIS_ANTERIOR,
);
const MUSCLE_LINES_FRONT = [...one("M160 120V300"), ...both("M166.5 118C180 112 196 112 207 114.5", "M199 280C190 290 178 300 166 308", "M170 122C180 126 192 134 206 146")];

/* ---------- muscles, back (viewer's right, mirrored unless single) ---------- */

/** Trapezius: a kite from the base of the skull out to both shoulders and down to the last thoracic vertebra. */
const TRAPEZIUS = "M160 80C164 90 170 100 180 106C190 110 200 112 208 114C204 118 196 122 186 126C178 140 168 170 160 198C152 170 142 140 134 126C124 122 116 118 112 114C120 112 130 110 140 106C150 100 156 90 160 80Z";
const INFRASPINATUS = band([[181, 134], [196, 140], [210, 148]], [10, 12, 5]);
const LATISSIMUS = "M161.5 170C172 166 186 160 207 153C208 158 207.5 166 206 174C203 196 198 222 193 244C186 252 174 256 161.5 258Z";
const ERECTOR_SPINAE = band([[165.5, 200], [166.2, 240], [165, 280]], [6, 8.4, 5]);
const TRICEPS = band([along(18, 2), along(45, 2), along(70, 1), along(95, 0)], [6, 13.5, 12.5, 5]);
const FOREARM_EXTENSORS = [band([along(88, 5.5), along(116, 5.8), along(150, 4.2), along(182, 3)], [3, 9.4, 6, 2]), band([along(98, -5), along(120, -5.2), along(150, -3.4), along(182, -2)], [4, 9, 6, 3])];
const GLUTEUS_MEDIUS = "M168 264C180 258 194 260 201 268C203 278 202 286 199 292C190 286 178 282 168 282Z";
const GLUTEUS_MAXIMUS = "M162 280C172 278 188 282 200 292C205 302 205 316 200 328C192 336 176 338 164 332C162 316 161.5 298 162 280Z";
const BICEPS_FEMORIS = band([[197, 336], [200, 370], [200, 405], [201, 432]], [6, 10, 8, 3]);
const SEMITENDINOSUS = band([[180, 334], [183, 370], [184, 405], [182.6, 434]], [7, 11, 9, 3]);
const GASTROCNEMIUS = [band([[186.6, 440], [187, 465], [189.6, 495]], [6, 11, 5]), band([[200, 440], [201.4, 463], [200, 491]], [5, 9.6, 4])];
const ACHILLES = band([[194.6, 494], [196.6, 525], [198, 552]], [7.5, 4, 3.6]);

const MUSCLES_BACK = [
  ...both(LATISSIMUS, ERECTOR_SPINAE, INFRASPINATUS),
  ...one(TRAPEZIUS),
  ...both(DELTOID, TRICEPS, ...FOREARM_EXTENSORS, GLUTEUS_MEDIUS, GLUTEUS_MAXIMUS, BICEPS_FEMORIS, SEMITENDINOSUS, ACHILLES, ...GASTROCNEMIUS),
];
const MUSCLE_LINES_BACK = [...one("M160 82V280"), ...both("M176 129C188 124 200 119 209 116", "M170 256C176 266 180 276 182 286", along(30, 3).join(" ").replace(/^/, "M") + "L" + along(88, 1).join(" "))];

/* ---------- the three views, front and back ---------- */

const CUT: RegionArt = { kind: "cut" };
const ALL_CUT: Record<CutRegion, RegionArt> = { brain: CUT, eyes: CUT, ear: CUT, immune: CUT, lungs: CUT, heart: CUT, gut: CUT, musculoskeletal: CUT };

const LIMB_BONES = both(...HUMERUS, RADIUS, ULNA, ...HAND, ...FEMUR, ...TIBIA, ...FIBULA);

export const LAYER_DEFS: Record<Layer, Record<BodyFace, LayerDef>> = {
  organs: {
    front: {
      regions: { ...ORGAN_REGIONS, musculoskeletal: CUT },
      fills: [],
      over: [{ tone: "organ", shapes: one(BLADDER) }],
      lines: [{ tone: "organ", width: 0.7, shapes: ORGAN_LINES }],
      anchors: ORGAN_ANCHORS,
      names: {},
    },
    back: {
      regions: {
        ...ALL_CUT,
        brain: { kind: "shape", tone: "organ", shapes: one(CEREBRUM, CEREBELLUM, SPINAL_CORD) },
        lungs: { kind: "shape", tone: "organ", shapes: LUNGS_BACK },
      },
      fills: [],
      over: [{ tone: "organ", shapes: KIDNEYS }],
      lines: [{ tone: "organ", width: 0.7, shapes: [...GYRI, ...CORD_LINES, ...URETERS] }],
      anchors: { brain: [152, 40], lungs: [137, 150] },
      names: {},
    },
  },
  muscles: {
    front: {
      regions: { ...ALL_CUT, musculoskeletal: { kind: "shape", tone: "muscle", shapes: MUSCLES_FRONT } },
      fills: [],
      over: [],
      lines: [{ tone: "muscle", width: 0.7, shapes: MUSCLE_LINES_FRONT }],
      anchors: { musculoskeletal: along(60, -2) },
      names: { musculoskeletal: "Muscles" },
    },
    back: {
      regions: { ...ALL_CUT, musculoskeletal: { kind: "shape", tone: "muscle", shapes: MUSCLES_BACK } },
      fills: [],
      over: [],
      lines: [{ tone: "muscle", width: 0.7, shapes: MUSCLE_LINES_BACK }],
      anchors: { musculoskeletal: along(60, 2) },
      names: { musculoskeletal: "Muscles" },
    },
  },
  skeleton: {
    front: {
      regions: {
        ...ORGAN_REGIONS,
        brain: { kind: "shape", tone: "bone", shapes: one(CRANIUM) },
        eyes: { kind: "shape", tone: "hollow", shapes: ORBITS },
        ear: { kind: "shape", tone: "hollow", shapes: EAR_CANALS },
        musculoskeletal: CUT,
      },
      fills: [
        { tone: "bone", shapes: one(SKULL, MANDIBLE, ...CERVICAL, ...THORACIC, ...LUMBAR, SACRUM) },
        { tone: "bone-back", shapes: both(...RIBS_BACK) },
        { tone: "bone", shapes: both(HIP_BONE) },
        { tone: "cartilage", shapes: one(PUBIC_SYMPHYSIS) },
        { tone: "hollow", shapes: [...OBTURATOR, ...one(NASAL)] },
      ],
      over: [
        { tone: "cartilage", shapes: both(...COSTAL_CARTILAGE) },
        { tone: "bone", shapes: [...both(...RIBS_FRONT), ...one(MANUBRIUM, STERNUM_BODY, XIPHOID)] },
        { tone: "bone", shapes: both(CORACOID, ACROMION, CLAVICLE) },
        { tone: "bone", shapes: [...LIMB_BONES, ...both(...FOOT, PATELLA)] },
      ],
      lines: [
        { tone: "organ", width: 0.6, shapes: [...LUNG_LINES, ...HEART_LINES, ...GUT_LINES] },
        { tone: "bone", width: 0.7, shapes: [...SKULL_LINES, ...SACRUM_LINES] },
      ],
      anchors: { ...ORGAN_ANCHORS, brain: [160, 34], eyes: [151, 58], ear: [181, 63.5], musculoskeletal: [194, 370] },
      names: { musculoskeletal: "Bones" },
    },
    back: {
      regions: { ...ALL_CUT, brain: { kind: "shape", tone: "bone", shapes: one(SKULL) } },
      fills: [
        { tone: "bone", shapes: both(...RIBS_BACK, HIP_BONE) },
        { tone: "bone", shapes: one(...CERVICAL, ...THORACIC, ...LUMBAR, SACRUM) },
        { tone: "hollow", shapes: OBTURATOR },
      ],
      over: [
        { tone: "bone", shapes: both(SCAPULA, SCAPULAR_SPINE) },
        { tone: "bone", shapes: [...LIMB_BONES, ...both(CALCANEUS)] },
        { tone: "bone-back", shapes: one(...SPINOUS) },
      ],
      lines: [{ tone: "bone", width: 0.7, shapes: [...SACRUM_LINES, ...one("M144 56L160 40L176 56", "M160 27V40")] }],
      anchors: { brain: [160, 34], musculoskeletal: [194, 370] },
      names: { musculoskeletal: "Bones" },
    },
  },
};

/** Organ outlines reused as tap zones for the organ parts. */
export const ORGAN_PATHS = { CEREBRUM, LUNG_R, LUNG_L, HEART, LIVER, STOMACH, COLON, SMALL_INTESTINE, BLADDER };
