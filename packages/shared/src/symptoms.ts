// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Symptoms the astronaut logs against a body part, and how one turns into a status.
// All rules are DEMO values, like the indicator limits. Private like mood: the astronaut and the
// crew medical officer see the details; the crew overview only says "Symptom logged".
import type { BodyLayer } from "./bodyParts";
import { DAY } from "./time";
import type { Status } from "./types";

/** The fields the status rule reads. The full Symptom type extends this. */
export interface SymptomCore {
  /** 0 (barely there) to 10 (worst imaginable). */
  severity: number;
  /** MET seconds when the astronaut says it started. */
  startedAt: number;
  /** It stops or limits planned work. */
  affectsWork: boolean;
  /** MET seconds when marked resolved. */
  resolvedAt?: number;
}

/** One logged symptom. `kind` is one of SYMPTOM_WORDS[layer]. */
export interface Symptom extends SymptomCore {
  id: string;
  astronautId: string;
  /** A BODY_PARTS id (o-, m- or s- prefix). */
  partId: string;
  layer: BodyLayer;
  kind: string;
  /** MET seconds when it was logged. */
  t: number;
  note?: string;
}

/** What the log form sends; the data source fills in id, astronaut and time. */
export type NewSymptom = Omit<Symptom, "id" | "astronautId" | "t" | "resolvedAt">;

/** Demo: an active symptom older than this is Caution even if mild. */
export const SYMPTOM_LASTING_SEC = 2 * DAY;

/**
 * Demo status for one symptom, or null once it is resolved (it then adds nothing to its region).
 * Warning: severity 7 or more, or it affects work.
 * Caution: severity 4 to 6, or it has lasted more than 2 days.
 * Watch: any other active symptom (severity 0 to 3).
 */
export function symptomStatus(s: SymptomCore, now: number): Extract<Status, "watch" | "caution" | "warning"> | null {
  if (s.resolvedAt !== undefined && s.resolvedAt <= now) return null;
  if (s.severity >= 7 || s.affectsWork) return "warning";
  if (s.severity >= 4 || now - s.startedAt > SYMPTOM_LASTING_SEC) return "caution";
  return "watch";
}

/** The rule above in words, for the detail panel and the report. */
export function symptomRuleText(s: SymptomCore, now: number): string {
  const st = symptomStatus(s, now);
  if (st === null) return "Resolved. It no longer affects your status.";
  if (st === "warning") return s.affectsWork ? "Rule: Warning when a symptom affects your work." : "Rule: Warning at severity 7 or more.";
  if (st === "caution") return s.severity >= 4 ? "Rule: Caution at severity 4 to 6." : "Rule: Caution when a symptom lasts more than 2 days.";
  return "Rule: Watch for any mild symptom (severity 0 to 3).";
}
