// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// One Lucide icon per indicator and device (ui.md 3.7).
import { Activity, Brain, Droplet, Dumbbell, HeartPulse, Moon, Radiation, Shirt, Thermometer, Wind, type LucideIcon } from "lucide-react";
import type { DeviceId, RoutineKind } from "@missionvitals/shared";

export const INDICATOR_ICON: Record<RoutineKind, LucideIcon> = {
  hr: HeartPulse,
  bp: Activity,
  spo2: Wind,
  temp: Thermometer,
  glucose: Droplet,
  sleep: Moon,
  mood: Brain,
  radiation: Radiation,
  exercise: Dumbbell,
};

export const DEVICE_ICON: Record<Exclude<DeviceId, "self">, LucideIcon> = {
  shirt: Shirt,
  cuff: Activity,
  glucometer: Droplet,
  dosimeter: Radiation,
};
