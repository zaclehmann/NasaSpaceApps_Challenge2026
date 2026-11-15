// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// The simulated crew, their baselines and the mission clock at load.
import { DAY } from "../time";
import type { Astronaut } from "../types";

/** MET at load: 141d 14:33. */
export const MET_AT_LOAD = 141 * DAY + 14 * 3600 + 33 * 60;
/** Live readings update this often. */
export const TICK_SEC = 5;
/** An out-of-range value must last this long before an alert fires, and stay clear this long before it ends. */
export const SUSTAIN_SEC = 60;
export const MIN = 60;

export const CREW: Astronaut[] = [
  { id: "hana", name: "Hana Park", role: "Flight engineer", isCmo: false },
  { id: "mira", name: "Mira Okafor", role: "Commander", isCmo: false },
  { id: "tomas", name: "Tomas Lindqvist", role: "Crew medical officer", isCmo: true },
];

export interface Baseline {
  hr: number;
  spo2: number;
  temp: number;
  bp: [number, number];
  glucose: number;
  sleep: number;
  mood: number;
  /** Clock minutes of this morning's checks: blood pressure, temperature, glucose, sleep. */
  morning: [number, number, number, number];
  /** Usual daily exercise, in minutes. */
  exercise: number;
  streak: number;
  weekBase: number;
}

export const BASE: Record<string, Baseline> = {
  hana: { hr: 68, spo2: 98, temp: 36.7, bp: [118, 76], glucose: 96, sleep: 7.2, mood: 4, morning: [422, 427, 430, 432], exercise: 132, streak: 12, weekBase: 41 },
  mira: { hr: 61, spo2: 97.6, temp: 36.6, bp: [112, 72], glucose: 90, sleep: 6.9, mood: 4, morning: [400, 405, 410, 415], exercise: 138, streak: 20, weekBase: 42 },
  tomas: { hr: 74, spo2: 98, temp: 36.8, bp: [121, 78], glucose: 94, sleep: 7.4, mood: 4, morning: [440, 443, 446, 450], exercise: 128, streak: 9, weekBase: 39 },
};
export const RADIATION_BASE = 9.1;

/** Exercise session start times (minutes after midnight MET), morning and afternoon, per astronaut. */
export const SESSION_START: Record<string, [number, number]> = {
  hana: [9 * 60, 13 * 60 + 30],
  mira: [8 * 60 + 30, 12 * 60 + 50],
  tomas: [10 * 60, 13 * 60 + 55],
};
