// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Demo scenarios. They change the simulated data itself, not only the display.
import type { Scenario } from "./types";

export const SCENARIOS: Scenario[] = [
  { id: "normal", number: 1, name: "Normal day", description: "Everything in range. Mood check-in is due." },
  { id: "hr-exercise", number: 2, name: "Heart rate after exercise", description: "Heart rate climbs after a session and stays above the demo range: Caution." },
  { id: "low-spo2", number: 3, name: "Low SpO₂", description: "SpO₂ falls below 90 %: Warning, with the full-width bar." },
  { id: "high-bp", number: 4, name: "High blood pressure", description: "The morning blood pressure reading is high: Caution." },
  { id: "mood-falling", number: 5, name: "Mood falling", description: "Mood has slipped over the past week: Watch. Enter Low at the check-in to see Caution." },
  { id: "sensor-dropout", number: 6, name: "Shirt sensor dropout", description: "SpO₂ and temperature stop reporting: No data." },
  { id: "solar-event", number: 7, name: "Solar particle event", description: "Habitat radiation rises for the whole crew: Caution." },
];
