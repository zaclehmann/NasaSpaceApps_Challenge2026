// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Named body parts for symptom logging. Each anatomy view has its own parts, so a sore knee is logged
// on the Skeleton view and a strained calf on the Muscles view. Geometry lives in the web app
// (components/body/bodyZones.ts); this file holds names, links to the nine regions and related readings.
import type { RegionId } from "./regions";
import type { IndicatorKey } from "./types";

export type BodyLayer = "organs" | "muscles" | "skeleton";
export type BodyFace = "front" | "back";

export interface BodyPart {
  id: string;
  /** Plain name, e.g. "Left knee". Left and right are the astronaut's own. */
  name: string;
  /** The anatomy view the part belongs to. Its symptom words come from this view. */
  layer: BodyLayer;
  /** Which side of the figure shows it. */
  faces: BodyFace[];
  /** The body-system region its status rolls up into. */
  region: RegionId;
  /** Readings that relate to it, shown on the part's page. */
  indicators: IndicatorKey[];
}

/** Symptom words offered for a part, by its view. Plain words only, never a diagnosis. */
export const SYMPTOM_WORDS: Record<BodyLayer, string[]> = {
  organs: ["Headache", "Blurry vision", "Dizziness", "Breathlessness", "Chest discomfort", "Nausea", "Rash", "Other"],
  muscles: ["Pain", "Stiffness", "Cramp", "Strain", "Bruise", "Other"],
  skeleton: ["Pain", "Swelling", "Knock or injury", "Less movement", "Other"],
};

const BOTH: BodyFace[] = ["front", "back"];
const FRONT: BodyFace[] = ["front"];
const BACK: BodyFace[] = ["back"];

function part(id: string, name: string, layer: BodyLayer, faces: BodyFace[], region: RegionId, indicators: IndicatorKey[] = []): BodyPart {
  return { id, name, layer, faces, region, indicators };
}

/** A left and right pair. The base name is lower case, e.g. "knee" becomes "Left knee" and "Right knee". */
function pair(id: string, name: string, layer: BodyLayer, faces: BodyFace[], region: RegionId, indicators: IndicatorKey[] = []): BodyPart[] {
  return [part(`${id}-l`, `Left ${name}`, layer, faces, region, indicators), part(`${id}-r`, `Right ${name}`, layer, faces, region, indicators)];
}

const MSK: RegionId = "musculoskeletal";
const EX: IndicatorKey[] = ["exercise"];

export const BODY_PARTS: BodyPart[] = [
  // Organs
  part("o-head", "Head", "organs", BOTH, "brain", ["mood", "sleep"]),
  part("o-eyes", "Eyes", "organs", FRONT, "eyes"),
  part("o-ears", "Ears and balance", "organs", BOTH, "ear"),
  part("o-throat", "Throat and neck glands", "organs", FRONT, "immune", ["temp"]),
  part("o-lungs", "Lungs", "organs", BOTH, "lungs", ["spo2"]),
  part("o-heart", "Heart", "organs", FRONT, "heart", ["hr", "bp"]),
  part("o-liver", "Liver", "organs", FRONT, "gut", ["glucose"]),
  part("o-stomach", "Stomach", "organs", FRONT, "gut", ["glucose"]),
  part("o-intestines", "Intestines", "organs", FRONT, "gut", ["glucose"]),
  part("o-bladder", "Bladder", "organs", FRONT, "gut"),
  part("o-abdomen", "Abdomen", "organs", FRONT, "gut", ["glucose"]),
  ...pair("o-kidney", "kidney", "organs", BACK, "gut"),
  // Muscles
  part("m-neck", "Neck muscles", "muscles", BOTH, MSK, EX),
  ...pair("m-shoulder", "shoulder", "muscles", BOTH, MSK, EX),
  ...pair("m-chest", "chest", "muscles", FRONT, MSK, EX),
  ...pair("m-upper-arm", "upper arm", "muscles", BOTH, MSK, EX),
  ...pair("m-forearm", "forearm", "muscles", BOTH, MSK, EX),
  part("m-abdomen", "Abdominal muscles", "muscles", FRONT, MSK, EX),
  part("m-upper-back", "Upper back", "muscles", BACK, MSK, EX),
  part("m-lower-back", "Lower back", "muscles", BACK, MSK, EX),
  ...pair("m-glute", "glute", "muscles", BACK, MSK, EX),
  ...pair("m-thigh", "thigh", "muscles", FRONT, MSK, EX),
  ...pair("m-hamstring", "hamstring", "muscles", BACK, MSK, EX),
  ...pair("m-lower-leg", "calf and shin", "muscles", BOTH, MSK, EX),
  // Skeleton
  part("s-skull", "Skull and jaw", "skeleton", BOTH, MSK, EX),
  part("s-neck", "Neck spine", "skeleton", BOTH, MSK, EX),
  ...pair("s-collarbone", "collarbone", "skeleton", FRONT, MSK, EX),
  ...pair("s-shoulder", "shoulder joint", "skeleton", BOTH, MSK, EX),
  ...pair("s-shoulder-blade", "shoulder blade", "skeleton", BACK, MSK, EX),
  ...pair("s-ribs", "ribs", "skeleton", BOTH, MSK, EX),
  part("s-upper-spine", "Upper spine", "skeleton", BACK, MSK, EX),
  part("s-lower-spine", "Lower spine", "skeleton", BACK, MSK, EX),
  ...pair("s-upper-arm", "upper arm bone", "skeleton", BOTH, MSK, EX),
  ...pair("s-elbow", "elbow", "skeleton", BOTH, MSK, EX),
  ...pair("s-forearm", "forearm bones", "skeleton", BOTH, MSK, EX),
  ...pair("s-hand", "wrist and hand", "skeleton", BOTH, MSK, EX),
  ...pair("s-hip", "hip and pelvis", "skeleton", BOTH, MSK, EX),
  ...pair("s-thigh", "thigh bone", "skeleton", BOTH, MSK, EX),
  ...pair("s-knee", "knee", "skeleton", BOTH, MSK, EX),
  ...pair("s-shin", "shin bones", "skeleton", BOTH, MSK, EX),
  ...pair("s-foot", "ankle and foot", "skeleton", BOTH, MSK, EX),
];

export const PART_BY_ID: Record<string, BodyPart> = Object.fromEntries(BODY_PARTS.map((p) => [p.id, p]));

export function partsFor(layer: BodyLayer, face: BodyFace): BodyPart[] {
  return BODY_PARTS.filter((p) => p.layer === layer && p.faces.includes(face));
}
