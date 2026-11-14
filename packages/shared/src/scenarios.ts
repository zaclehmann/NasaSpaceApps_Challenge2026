// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Demo scenarios. They change the simulated data itself, not only the display.
import type { MissionSetting, Scenario } from "./types";

/**
 * Mission settings for the demo (the brief's "different environments"). Only the name and the one-way
 * Earth link delay change; thresholds and data stay the same. Delays are typical simulated values.
 */
export const MISSION_SETTINGS: MissionSetting[] = [
  { id: "mars-transit", label: "Mars transit", missionName: "Ares Transit 1", delaySec: 6 * 60 + 48 },
  { id: "station", label: "Space station", missionName: "Station Expedition 74", delaySec: 0.3 },
  { id: "lunar", label: "Lunar base", missionName: "Artemis Base Camp", delaySec: 1.3 },
  { id: "mars-rover", label: "Mars rover", missionName: "Rover Excursion 3", delaySec: 6 * 60 + 48 },
];

export const SCENARIOS: Scenario[] = [
  { id: "normal", number: 1, name: "Normal day", description: "Everything in range. Mood check-in is due." },
  { id: "hr-exercise", number: 2, name: "Heart rate after exercise", description: "Heart rate stays above the demo range after this afternoon's exercise session: Caution." },
  { id: "low-spo2", number: 3, name: "Low SpO₂", description: "SpO₂ falls below 90 %: Warning, with the full-width bar." },
  { id: "high-bp", number: 4, name: "High blood pressure", description: "The morning blood pressure reading is high: Caution." },
  { id: "mood-falling", number: 5, name: "Mood falling", description: "Mood has slipped over the past week: Watch. Enter Low at the check-in to see Caution." },
  { id: "sensor-dropout", number: 6, name: "Shirt sensor dropout", description: "The shirt stops reporting heart rate and SpO₂: No data." },
  { id: "solar-event", number: 7, name: "Solar particle event", description: "Habitat radiation rises for the whole crew: Caution." },
];
