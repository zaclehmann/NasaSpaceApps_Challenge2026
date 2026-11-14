// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Tap zones for the named body parts (packages/shared bodyParts.ts), per anatomy view and per face.
// Zones are simple shapes in the figure's 320 x 600 box; the figure clips them to the outline.
// Paired parts are drawn once, on the viewer's right, and mirrored. On the front that side is the
// astronaut's left; on the back it is their right.
import { PART_BY_ID, type BodyFace, type BodyLayer } from "@missionvitals/shared";
import { ORGAN_PATHS, type Shape } from "./bodyAnatomy";

export interface Zone {
  id: string;
  shapes: Shape[];
  /** Where the part's name and symptom marker sit. */
  anchor: [number, number];
}

interface ZoneDef {
  /** Full part id, or the base id of a left and right pair (without "-l" / "-r"). */
  id: string;
  paired?: boolean;
  shapes: string[];
  /** For a single part: also draw each shape mirrored. */
  mirror?: boolean;
  anchor: [number, number];
}

const rect = (x: number, y: number, w: number, h: number) => `M${x} ${y}h${w}v${h}h${-w}Z`;
const poly = (pts: [number, number][]) => `M${pts.map((p) => p.map((v) => +v.toFixed(1)).join(" ")).join("L")}Z`;
const ell = (cx: number, cy: number, rx: number, ry: number) => `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0Z`;

// The arm runs from the shoulder at about 20 degrees from vertical.
const S: [number, number] = [212, 126];
const D: [number, number] = [0.342, 0.94];
const N: [number, number] = [0.94, -0.342];
const along = (t: number, off = 0): [number, number] => [S[0] + t * D[0] + off * N[0], S[1] + t * D[1] + off * N[1]];
/** A band across the arm between two distances from the shoulder. */
const armBand = (t1: number, t2: number) => poly([along(t1, -24), along(t1, 24), along(t2, 24), along(t2, -24)]);

const ARM_ZONES = (prefix: string, upper: [number, number], fore: [number, number]): ZoneDef[] => [
  { id: `${prefix}-upper-arm`, paired: true, shapes: [armBand(...upper)], anchor: along((upper[0] + upper[1]) / 2) },
  { id: `${prefix}-forearm`, paired: true, shapes: [armBand(...fore)], anchor: along((fore[0] + fore[1]) / 2) },
];

/** Later zones sit on top of earlier ones where they overlap. */
const DEFS: Record<BodyLayer, ZoneDef[]> = {
  organs: [
    { id: "o-abdomen", shapes: [rect(122, 198, 76, 104)], anchor: [160, 296] },
    { id: "o-head", shapes: [rect(120, 0, 80, 50)], anchor: [160, 36] },
    { id: "o-eyes", shapes: [rect(139, 50, 42, 16)], anchor: [160, 60] },
    { id: "o-ears", shapes: [rect(181, 49, 15, 23)], mirror: true, anchor: [186, 61] },
    { id: "o-throat", shapes: [rect(146, 86, 28, 22)], anchor: [160, 97] },
    { id: "o-lungs", shapes: [ORGAN_PATHS.LUNG_R, ORGAN_PATHS.LUNG_L], anchor: [137, 150] },
    { id: "o-intestines", shapes: [ORGAN_PATHS.COLON, ORGAN_PATHS.SMALL_INTESTINE], anchor: [160, 270] },
    { id: "o-stomach", shapes: [ORGAN_PATHS.STOMACH], anchor: [184, 216] },
    { id: "o-liver", shapes: [ORGAN_PATHS.LIVER], anchor: [142, 206] },
    { id: "o-bladder", shapes: [ORGAN_PATHS.BLADDER], anchor: [160, 305] },
    { id: "o-heart", shapes: [ORGAN_PATHS.HEART], anchor: [170, 168] },
    { id: "o-kidney", paired: true, shapes: [ell(179, 221, 12, 18)], anchor: [179, 221] },
  ],
  muscles: [
    { id: "m-abdomen", shapes: [rect(124, 166, 72, 134)], anchor: [160, 232] },
    { id: "m-upper-back", shapes: [poly([[114, 110], [206, 110], [205, 150], [207, 200], [113, 200], [115, 150]])], anchor: [160, 150] },
    { id: "m-lower-back", shapes: [rect(116, 200, 88, 88)], anchor: [160, 246] },
    { id: "m-chest", paired: true, shapes: [poly([[161, 110], [207, 110], [205, 150], [203, 166], [161, 166]])], anchor: [184, 138] },
    { id: "m-neck", shapes: [rect(144, 86, 32, 24)], anchor: [160, 98] },
    ...ARM_ZONES("m", [30, 100], [100, 188]),
    { id: "m-shoulder", paired: true, shapes: [ell(217, 134, 15, 21)], anchor: [218, 134] },
    { id: "m-glute", paired: true, shapes: [rect(160, 288, 50, 50)], anchor: [183, 312] },
    { id: "m-thigh", paired: true, shapes: [rect(160, 300, 54, 132)], anchor: [190, 372] },
    { id: "m-hamstring", paired: true, shapes: [rect(160, 338, 54, 94)], anchor: [190, 384] },
    { id: "m-lower-leg", paired: true, shapes: [rect(160, 440, 62, 106)], anchor: [196, 490] },
  ],
  skeleton: [
    { id: "s-skull", shapes: [rect(120, 0, 80, 88)], anchor: [160, 44] },
    { id: "s-neck", shapes: [rect(146, 88, 28, 20)], anchor: [160, 98] },
    { id: "s-ribs", paired: true, shapes: [poly([[161, 118], [206, 118], [205, 150], [208, 208], [161, 208]])], anchor: [184, 164] },
    { id: "s-collarbone", paired: true, shapes: [poly([[161, 104], [208, 104], [207, 120], [161, 120]])], anchor: [184, 112] },
    { id: "s-shoulder-blade", paired: true, shapes: [ell(187, 144, 17, 24)], anchor: [187, 144] },
    { id: "s-upper-spine", shapes: [rect(152, 108, 16, 92)], anchor: [160, 154] },
    { id: "s-lower-spine", shapes: [rect(152, 200, 16, 90)], anchor: [160, 244] },
    ...ARM_ZONES("s", [16, 86], [114, 178]),
    { id: "s-elbow", paired: true, shapes: [armBand(86, 114)], anchor: along(100) },
    { id: "s-hand", paired: true, shapes: [armBand(178, 244)], anchor: along(206) },
    { id: "s-shoulder", paired: true, shapes: [ell(213, 131, 13, 13)], anchor: [213, 131] },
    { id: "s-hip", paired: true, shapes: [rect(160, 282, 50, 44)], anchor: [184, 304] },
    { id: "s-thigh", paired: true, shapes: [rect(160, 326, 54, 98)], anchor: [188, 376] },
    { id: "s-knee", paired: true, shapes: [rect(160, 424, 58, 30)], anchor: [192, 439] },
    { id: "s-shin", paired: true, shapes: [rect(160, 454, 60, 86)], anchor: [196, 496] },
    { id: "s-foot", paired: true, shapes: [rect(160, 540, 64, 60)], anchor: [200, 560] },
  ],
};

/** The zones to draw for one view and face, in paint order. */
export function zonesFor(layer: BodyLayer, face: BodyFace): Zone[] {
  const out: Zone[] = [];
  // On the front, the viewer's right is the astronaut's left. On the back it is their right.
  const drawnSide = face === "front" ? "l" : "r";
  const otherSide = face === "front" ? "r" : "l";
  const shown = (id: string) => PART_BY_ID[id]?.faces.includes(face);
  for (const z of DEFS[layer]) {
    if (z.paired) {
      const a = `${z.id}-${drawnSide}`;
      const b = `${z.id}-${otherSide}`;
      if (shown(a)) out.push({ id: a, shapes: z.shapes.map((d) => ({ d })), anchor: z.anchor });
      if (shown(b)) out.push({ id: b, shapes: z.shapes.map((d) => ({ d, mirror: true })), anchor: [320 - z.anchor[0], z.anchor[1]] });
    } else if (shown(z.id)) {
      out.push({ id: z.id, shapes: z.shapes.flatMap((d) => (z.mirror ? [{ d }, { d, mirror: true }] : [{ d }])), anchor: z.anchor });
    }
  }
  return out;
}
