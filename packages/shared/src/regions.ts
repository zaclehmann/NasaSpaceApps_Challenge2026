// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// The nine body-system regions of the figure (ui.md 6.2), with NASA HRP risk names.
import type { IndicatorKey } from "./types";

export type RegionId = "brain" | "eyes" | "ear" | "heart" | "lungs" | "immune" | "gut" | "musculoskeletal" | "whole";

export const HRP_RISKS_URL = "https://www.nasa.gov/hrp/risks/";
export const HRP_HAZARDS_URL = "https://www.nasa.gov/hrp/hazards/";

export interface RegionDef {
  id: RegionId;
  name: string;
  /** Where it sits on the figure (ui.md 6.2). */
  area: string;
  indicators: IndicatorKey[];
  /** Related log or quick check named in ui.md 6.2 when nothing is measured directly. */
  related?: string;
  risks: string[];
  crewWide?: boolean;
}

/** Top-to-bottom order, which is also the tab order on the figure (ui.md 6.4). */
export const REGIONS: RegionDef[] = [
  { id: "whole", name: "Whole body", area: "Thin ring around the whole figure, crew-wide", indicators: ["radiation"], risks: ["Radiation-Induced Cancers"], crewWide: true },
  { id: "brain", name: "Brain and mood", area: "Upper head", indicators: ["mood", "sleep"], risks: ["Behavioral Changes and Psychiatric Disorders", "Inadequate Sleep and Irregular Schedules"] },
  { id: "eyes", name: "Eyes", area: "Band across the face", indicators: [], related: "Vision check", risks: ["Spaceflight Associated Neuro-ocular Syndrome"] },
  { id: "ear", name: "Inner ear and balance", area: "Two marks at the sides of the head", indicators: [], related: "Dizziness check", risks: ["Altered Sensorimotor and Vestibular Function"] },
  { id: "immune", name: "Immune system", area: "Neck and underarm marks", indicators: ["temp"], risks: ["Altered Immune System Responses"] },
  { id: "lungs", name: "Lungs and oxygen", area: "Upper chest", indicators: ["spo2"], risks: ["Hypoxia"] },
  { id: "heart", name: "Heart and circulation", area: "Figure's left chest", indicators: ["hr", "bp"], risks: ["Cardiovascular Adaptations"] },
  { id: "gut", name: "Gut and metabolism", area: "Abdomen", indicators: ["glucose"], risks: ["Inadequate Food and Nutrition"] },
  {
    id: "musculoskeletal",
    name: "Bones and muscles",
    area: "Arms and legs",
    indicators: ["exercise"],
    risks: ["Spaceflight-Induced Bone Changes", "Reduced Cardiorespiratory and Musculoskeletal Fitness"],
  },
];

export const REGION_BY_ID = Object.fromEntries(REGIONS.map((r) => [r.id, r])) as Record<RegionId, RegionDef>;

export function regionsForIndicator(key: IndicatorKey): RegionDef[] {
  return REGIONS.filter((r) => r.indicators.includes(key));
}
