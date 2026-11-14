// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Guidance content. Plain language, non-diagnostic: re-measure, check the sensor, rest, hydrate,
// follow mission procedure, contact the crew medical officer. No drug names, doses or diagnoses.
// "Why it changes in space" only states what the listed source pages say (checked 14 Nov 2026).
import type { IndicatorKey, Status } from "./types";
import type { RegionId } from "./regions";
import { HRP_HAZARDS_URL, HRP_RISKS_URL } from "./regions";

export type Hazard = "Space radiation" | "Isolation and confinement" | "Distance from Earth" | "Gravity fields" | "Hostile/closed environments";

export const HAZARDS: Hazard[] = ["Space radiation", "Isolation and confinement", "Distance from Earth", "Gravity fields", "Hostile/closed environments"];

export interface Source {
  label: string;
  url: string;
}

export const SOURCES = {
  hazards: { label: "NASA HRP: 5 Hazards of Human Spaceflight", url: HRP_HAZARDS_URL },
  risks: { label: "NASA HRP: Risks of Human Spaceflight", url: HRP_RISKS_URL },
  bioMonitor: { label: "CSA: Bio-Monitor", url: "https://www.asc-csa.gc.ca/eng/sciences/astroskin.asp" },
  radiation: { label: "CSA: Monitoring radiation for astronaut health", url: "https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp" },
} satisfies Record<string, Source>;

export interface Escalation {
  self: string;
  cmo: string;
  surgeon: string;
}

export interface IndicatorGuidance {
  whatItIs: string;
  howToMeasure: { procedureId: string; equipment: string; steps: string[] };
  whySpace: { text: string[]; hazards: Hazard[]; risk: string; riskUrl: string };
  keepHealthy: string[];
  /** Steps per status. "Due" uses the No data steps: take today's measurement. */
  whatToDo: Record<Exclude<Status, "due">, string[]>;
  escalation: Escalation;
  sources: Source[];
}

const ESCALATION: Escalation = {
  self: "Rest, hydrate and re-measure.",
  cmo: "Still out of range after re-measuring, or you feel unwell.",
  surgeon: "Any Warning, or a Caution that repeats over days.",
};

const OK_STEPS = ["No action needed. Keep to today's routine."];
const SHIRT_NODATA = [
  "Check the shirt is on and sits snug against your skin.",
  "Check the battery pack is connected.",
  "Wait one minute for readings to return.",
  "If there is still no reading, tell the crew medical officer and follow the mission procedure for a sensor fault.",
];
const risk = (name: string) => ({ risk: name, riskUrl: HRP_RISKS_URL });

export const GUIDANCE: Record<IndicatorKey, IndicatorGuidance> = {
  hr: {
    whatItIs: "Heart rate is how many times your heart beats each minute.",
    howToMeasure: {
      procedureId: "HM-1",
      equipment: "Wearable shirt",
      steps: ["Put on the shirt so the sensors sit flat against your chest.", "Connect the battery pack.", "Stay still for one minute for a resting reading."],
    },
    whySpace: {
      text: [
        "Weightlessness changes how blood moves around the body and how the heart and blood vessels work.",
        "NASA lists this as a risk to watch on long missions.",
      ],
      hazards: ["Gravity fields"],
      ...risk("Cardiovascular Adaptations"),
    },
    keepHealthy: ["Complete today's exercise session.", "Drink water through the day.", "Keep to the sleep schedule."],
    whatToDo: {
      ok: OK_STEPS,
      watch: ["Slow down and rest for 5 minutes.", "Drink some water.", "Check again in 15 minutes."],
      caution: [
        "Stop and rest for 5 minutes.",
        "Check the shirt sits snug across your chest.",
        "Re-measure. If it is still outside your range, contact the crew medical officer.",
      ],
      warning: ["Stop what you are doing and rest.", "Contact the crew medical officer now.", "Follow the mission medical procedure.", "Send a report to the flight surgeon."],
      nodata: SHIRT_NODATA,
    },
    escalation: ESCALATION,
    sources: [SOURCES.risks, SOURCES.hazards, SOURCES.bioMonitor],
  },
  spo2: {
    whatItIs: "SpO₂ is how much oxygen your blood is carrying, as a percentage.",
    howToMeasure: {
      procedureId: "HM-2",
      equipment: "Wearable shirt and headband",
      steps: ["Put on the shirt and headband so the sensors touch your skin.", "Stay still for one minute.", "Breathe normally during the reading."],
    },
    whySpace: {
      text: [
        "Hypoxia is when oxygen levels in body tissues become lower than normal.",
        "NASA notes that the steps taken to avoid decompression sickness during spacewalks also raise the risk of mild hypoxia.",
        "Cabin pressure and air are part of the closed environment the crew depends on.",
      ],
      hazards: ["Hostile/closed environments"],
      ...risk("Hypoxia"),
    },
    keepHealthy: ["Report stuffy air or headaches to the crew.", "Keep the sensor clean and snug.", "Follow the pre-breathe procedure before a spacewalk."],
    whatToDo: {
      ok: OK_STEPS,
      watch: ["Sit still and breathe normally for 2 minutes.", "Check the sensor sits flat against your skin.", "Check again in 10 minutes."],
      caution: [
        "Stop and rest. Breathe slowly and normally.",
        "Check the sensor sits flat against your skin.",
        "Re-measure after 2 minutes. If it is still below your range, contact the crew medical officer.",
      ],
      warning: [
        "Stop what you are doing and stay still.",
        "Contact the crew medical officer now.",
        "Follow the mission procedure for low oxygen and check the cabin air readings.",
        "Send a report to the flight surgeon.",
      ],
      nodata: SHIRT_NODATA,
    },
    escalation: ESCALATION,
    sources: [SOURCES.risks, SOURCES.hazards, SOURCES.bioMonitor],
  },
  temp: {
    whatItIs: "Temperature is your body temperature from the thermometer, used as a simple fever check. Take it each morning and whenever you feel unwell.",
    howToMeasure: {
      procedureId: "HM-5",
      equipment: "Thermometer",
      steps: ["Wait 15 minutes after a hot drink, a meal or exercise.", "Take the reading with the crew thermometer as trained.", "Enter the value shown."],
    },
    whySpace: {
      text: [
        "NASA says spaceflight stress can reactivate inactive viruses in the body, leading to rashes and other symptoms.",
        "The crew shares a closed habitat, so NASA tracks microbes and immune responses.",
      ],
      hazards: ["Hostile/closed environments"],
      ...risk("Altered Immune System Responses"),
    },
    keepHealthy: ["Wash your hands and wipe shared surfaces.", "Keep to the sleep schedule.", "Take your temperature whenever you feel unwell."],
    whatToDo: {
      ok: OK_STEPS,
      watch: ["Rest and drink some water.", "Take your temperature again this evening."],
      caution: [
        "Rest and drink water.",
        "Re-measure after 15 minutes.",
        "If it is still outside your range, contact the crew medical officer.",
      ],
      warning: ["Stop work and rest.", "Contact the crew medical officer now.", "Follow the mission medical procedure.", "Send a report to the flight surgeon."],
      nodata: ["Take today's temperature with the thermometer.", "Use the guided procedure HM-5."],
    },
    escalation: ESCALATION,
    sources: [SOURCES.risks, SOURCES.hazards],
  },
  bp: {
    whatItIs: "Blood pressure is the force of blood on your artery walls, given as two numbers: systolic over diastolic.",
    howToMeasure: {
      procedureId: "HM-3",
      equipment: "Blood pressure cuff",
      steps: [
        "Sit with your back supported and feet restrained for 5 minutes.",
        "Fit the cuff on your upper arm at heart level.",
        "Stay still and quiet during the reading.",
      ],
    },
    whySpace: {
      text: [
        "Weightlessness changes how blood moves around the body and how the heart and blood vessels work.",
        "NASA says this may raise the risk of cardiovascular events, so regular checks matter.",
      ],
      hazards: ["Gravity fields"],
      ...risk("Cardiovascular Adaptations"),
    },
    keepHealthy: ["Complete today's exercise session.", "Drink water through the day.", "Take the reading at the same time each day."],
    whatToDo: {
      ok: OK_STEPS,
      watch: ["Take the next reading on time.", "Rest for 5 minutes before you measure.", "Keep the cuff at heart level."],
      caution: [
        "Rest quietly for 5 minutes.",
        "Check the cuff is on your upper arm at heart level.",
        "Re-measure. If it is still outside your range, contact the crew medical officer.",
      ],
      warning: ["Stop and rest.", "Re-measure once to confirm.", "Contact the crew medical officer now.", "Send a report to the flight surgeon."],
      nodata: ["Take today's blood pressure reading.", "Use the guided procedure HM-3."],
    },
    escalation: ESCALATION,
    sources: [SOURCES.risks, SOURCES.hazards, SOURCES.bioMonitor],
  },
  glucose: {
    whatItIs: "Blood glucose is the amount of sugar in your blood, your body's main fuel.",
    howToMeasure: {
      procedureId: "HM-4",
      equipment: "Glucometer",
      steps: ["Clean and dry your fingertip.", "Insert a test strip into the glucometer.", "Take a small blood sample and touch it to the strip.", "Note whether you have eaten."],
    },
    whySpace: {
      text: [
        "NASA calls a healthy, balanced diet an essential element of crew health and performance.",
        "Far from Earth, food and supplies are hard to replace, so the crew relies on what is on board.",
        "This prototype uses blood glucose as a simple check on how meals and energy are going.",
      ],
      hazards: ["Distance from Earth"],
      ...risk("Inadequate Food and Nutrition"),
    },
    keepHealthy: ["Eat your planned meals on time.", "Drink water through the day.", "Log meals you skip."],
    whatToDo: {
      ok: OK_STEPS,
      watch: ["Eat your next planned meal on time.", "Take tomorrow's fasting reading on time."],
      caution: [
        "Note when you last ate.",
        "Wash and dry your hands, then re-measure with a new strip.",
        "If it is still outside your range, contact the crew medical officer.",
      ],
      warning: ["Stop work and stay with a crewmate.", "Contact the crew medical officer now.", "Follow the mission medical procedure.", "Send a report to the flight surgeon."],
      nodata: ["Take today's blood glucose reading.", "Use the guided procedure HM-4."],
    },
    escalation: ESCALATION,
    sources: [SOURCES.risks, SOURCES.hazards],
  },
  sleep: {
    whatItIs: "Sleep is the number of hours you slept in the last sleep period.",
    howToMeasure: {
      procedureId: "HM-6",
      equipment: "Self-report",
      steps: ["After waking, note when you fell asleep and when you woke.", "Enter the hours slept.", "Note anything that woke you."],
    },
    whySpace: {
      text: [
        "NASA names chronic sleep loss, constant work demands and irregular internal body clocks as stressors on a mission.",
        "Lighting and noise in the habitat are part of what the crew has to manage.",
      ],
      hazards: ["Isolation and confinement", "Hostile/closed environments"],
      ...risk("Inadequate Sleep and Irregular Schedules"),
    },
    keepHealthy: ["Start and end the sleep period at the scheduled times.", "Dim screens and lights before sleep.", "Use ear plugs if noise wakes you."],
    whatToDo: {
      ok: OK_STEPS,
      watch: ["Start tonight's sleep period on time.", "Dim screens and lights 30 minutes before sleep."],
      caution: [
        "Tell the commander you are short on sleep before safety-critical tasks.",
        "Start tonight's sleep period on time.",
        "If you sleep under 6 hours again tomorrow, contact the crew medical officer.",
      ],
      warning: ["Tell the commander before any safety-critical task.", "Contact the crew medical officer today.", "Ask for a rest period in the schedule.", "Send a report to the flight surgeon."],
      nodata: ["Enter last night's sleep in the sleep review."],
    },
    escalation: { ...ESCALATION, self: "Keep to the sleep schedule and review tomorrow." },
    sources: [SOURCES.risks, SOURCES.hazards],
  },
  mood: {
    whatItIs: "Mood is your own rating of how you feel today, from Very low to Very good.",
    howToMeasure: {
      procedureId: "HM-7",
      equipment: "Self-report, private",
      steps: ["Find a quiet moment.", "Rate your mood and your stress.", "Add tags or a note if they help."],
    },
    whySpace: {
      text: [
        "NASA says isolation, distance from Earth and other stressors may affect crew mental health.",
        "A small crew lives and works in a confined space for a long time, so a daily check-in helps you notice changes early.",
      ],
      hazards: ["Isolation and confinement", "Distance from Earth"],
      ...risk("Behavioral Changes and Psychiatric Disorders"),
    },
    keepHealthy: ["Keep to the sleep schedule.", "Complete today's exercise session.", "Make time to talk with a crewmate or message home."],
    whatToDo: {
      ok: OK_STEPS,
      watch: ["Plan one thing you enjoy today.", "Talk with a crewmate.", "Check in again tomorrow."],
      caution: [
        "Take a 10 minute break from your task.",
        "Talk with a crewmate you trust.",
        "If your mood is still low tomorrow, talk with the crew medical officer.",
      ],
      warning: ["Talk with the crew medical officer today.", "Ask the commander to lighten today's schedule.", "Send a private report to the flight surgeon."],
      nodata: ["Do today's mood check-in. It takes about a minute."],
    },
    escalation: { self: "Take a break and talk with a crewmate.", cmo: "Low for a second day, or you want to talk.", surgeon: "Any Warning, or a low mood that repeats over days." },
    sources: [SOURCES.risks, SOURCES.hazards],
  },
  radiation: {
    whatItIs: "Habitat radiation is the dose rate measured inside the habitat, the same for the whole crew.",
    howToMeasure: {
      procedureId: "HM-8",
      equipment: "Habitat dosimeter",
      steps: ["The dosimeter reports on its own every minute.", "Check that its status shows connected.", "Report a silent dosimeter to the commander."],
    },
    whySpace: {
      text: [
        "NASA considers space radiation one of the most hazardous aspects of spaceflight, and it is invisible to the eye.",
        "NASA says crews exposed to space radiation may be more likely to develop cancer.",
        "The Canadian Space Agency calls radiation one of the key challenges for astronauts beyond the protection of Earth's atmosphere.",
      ],
      hazards: ["Space radiation"],
      ...risk("Radiation-Induced Cancers"),
    },
    keepHealthy: ["Know the mission procedure for a radiation event.", "Check the dosimeter status each day.", "Report a silent dosimeter."],
    whatToDo: {
      ok: OK_STEPS,
      watch: ["Check the reading again in 15 minutes.", "Review the mission procedure for a radiation event."],
      caution: [
        "Tell the commander. This reading is the same for the whole crew.",
        "Follow the mission procedure for a radiation event.",
        "Check the reading every 15 minutes until it is back in your range.",
      ],
      warning: ["Follow the mission procedure for a radiation event now.", "Stay with the crew and await the commander's instructions.", "Send a report to Earth."],
      nodata: ["Check the dosimeter is powered and connected.", "Report a silent dosimeter to the commander."],
    },
    escalation: { self: "Check the reading and review the procedure.", cmo: "The reading stays out of range. Tell the commander and the crew medical officer.", surgeon: "Any Warning, or a Caution that lasts for hours." },
    sources: [SOURCES.hazards, SOURCES.risks, SOURCES.radiation],
  },
  exercise: {
    whatItIs: "Exercise is the minutes of planned exercise you did today, counted by the shirt's activity sensor and confirmed by you.",
    howToMeasure: {
      procedureId: "HM-9",
      equipment: "Exercise devices and the wearable shirt",
      steps: ["Wear the shirt for today's planned session.", "After the session, check the minutes the shirt counted.", "Correct the total if the shirt missed part of a session, then save."],
    },
    whySpace: {
      text: [
        "NASA says bones become more brittle without gravity, which raises the chance of fractures.",
        "NASA also says all astronauts exercise to counter losses in bone density, muscle strength, and heart and blood vessel performance.",
        "This prototype cannot measure bone or muscle directly, so it tracks the exercise that protects them.",
      ],
      hazards: ["Gravity fields"],
      ...risk("Reduced Cardiorespiratory and Musculoskeletal Fitness"),
    },
    keepHealthy: ["Complete today's planned resistance and aerobic sessions.", "Keep the shirt on during exercise so it counts every session.", "Eat your planned meals."],
    whatToDo: {
      ok: OK_STEPS,
      watch: ["Keep today's planned session in the schedule.", "Check the shirt counted every session."],
      caution: [
        "Fit in the rest of today's session if the schedule allows.",
        "Tell the commander if the schedule leaves no time to exercise.",
        "If you are under the target again tomorrow, talk with the crew medical officer.",
      ],
      warning: ["Tell the commander and ask for exercise time in the schedule.", "Talk with the crew medical officer today.", "Send a report to the flight surgeon."],
      nodata: ["Log today's exercise after your session.", "Use the guided procedure HM-9."],
    },
    escalation: { self: "Make up the time today if you can.", cmo: "Under the target two days in a row.", surgeon: "Any Warning, or a shortfall that repeats over a week." },
    sources: [SOURCES.risks, SOURCES.hazards, SOURCES.bioMonitor],
  },
};

export interface RegionGuidance {
  whatItDoes: string;
  riskSentence: string;
  hazards: Hazard[];
  keepHealthy: string[];
  /** A related log or quick check, for regions this prototype does not measure directly. */
  relatedCheck?: string;
}

export const NOT_MEASURED = "This prototype doesn't measure this directly.";

export const REGION_GUIDANCE: Record<RegionId, RegionGuidance> = {
  brain: {
    whatItDoes: "Your brain runs your thinking, mood and sleep.",
    riskSentence: "NASA says isolation, distance from Earth, sleep loss and irregular schedules may affect crew mental health and performance.",
    hazards: ["Isolation and confinement", "Distance from Earth"],
    keepHealthy: ["Keep to the sleep schedule.", "Do the daily mood check-in.", "Make time to talk with a crewmate."],
  },
  eyes: {
    whatItDoes: "Your eyes let you read displays and procedures and judge distance.",
    riskSentence: "NASA says the structure of the eye and brain can change with spaceflight, and researches how to prevent it.",
    hazards: ["Gravity fields"],
    keepHealthy: ["Tell the crew medical officer if your vision changes.", "Take the scheduled vision check.", "Rest your eyes between long display tasks."],
    relatedCheck: "Vision check: planned, not in this prototype.",
  },
  ear: {
    whatItDoes: "Your inner ear tells your brain which way you are moving and helps you balance.",
    riskSentence: "NASA says gravity changes can bring motion sickness, dizziness and problems with hand-eye and walking coordination.",
    hazards: ["Gravity fields"],
    keepHealthy: ["Move slowly after a change in gravity.", "Tell a crewmate if you feel dizzy.", "Secure yourself before fine hand work."],
    relatedCheck: "Dizziness check: planned, not in this prototype.",
  },
  heart: {
    whatItDoes: "Your heart and blood vessels move blood, oxygen and fuel around your body.",
    riskSentence: "NASA says weightlessness changes blood circulation and how the heart and blood vessels function.",
    hazards: ["Gravity fields"],
    keepHealthy: ["Complete today's exercise session.", "Drink water through the day.", "Take your blood pressure readings on time."],
  },
  lungs: {
    whatItDoes: "Your lungs bring oxygen into your blood.",
    riskSentence: "NASA describes hypoxia as oxygen levels in body tissues becoming lower than normal.",
    hazards: ["Hostile/closed environments"],
    keepHealthy: ["Report stuffy air or headaches to the crew.", "Keep the shirt sensor snug.", "Follow the pre-breathe procedure before a spacewalk."],
  },
  immune: {
    whatItDoes: "Your immune system protects you from infection.",
    riskSentence: "NASA says spaceflight stress can reactivate inactive viruses in the body, leading to rashes and other symptoms.",
    hazards: ["Hostile/closed environments"],
    keepHealthy: ["Wash your hands and wipe shared surfaces.", "Keep to the sleep schedule.", "Report a rash or feeling unwell to the crew medical officer."],
    relatedCheck: "Temperature is a simple fever check, not a measure of the immune system.",
  },
  gut: {
    whatItDoes: "Your gut and metabolism turn food into energy.",
    riskSentence: "NASA calls a healthy, balanced diet an essential element of crew health and performance.",
    hazards: ["Distance from Earth"],
    keepHealthy: ["Eat your planned meals on time.", "Drink water through the day.", "Log meals you skip."],
  },
  musculoskeletal: {
    whatItDoes: "Your bones and muscles hold you up and let you move and work.",
    riskSentence: "NASA says bones become more brittle without gravity, and that all astronauts exercise to counter losses in bone density and muscle strength.",
    hazards: ["Gravity fields"],
    keepHealthy: ["Complete today's resistance exercise session.", "Log each session in the exercise log.", "Eat your planned meals."],
    relatedCheck: "Exercise minutes stand in for bone and muscle health. This prototype doesn't measure bone or muscle directly.",
  },
  whole: {
    whatItDoes: "Radiation reaches your whole body, and the whole crew, at once.",
    riskSentence: "NASA says crews exposed to space radiation may be more likely to develop cancer.",
    hazards: ["Space radiation"],
    keepHealthy: ["Know the mission procedure for a radiation event.", "Check the dosimeter status each day.", "Report a silent dosimeter."],
  },
};

/** The steps to show for a status. "Due" uses the No data steps: take today's measurement. */
export function whatToDoFor(key: IndicatorKey, status: Status): string[] {
  const steps = GUIDANCE[key].whatToDo;
  return status === "due" ? steps.nodata : steps[status];
}
