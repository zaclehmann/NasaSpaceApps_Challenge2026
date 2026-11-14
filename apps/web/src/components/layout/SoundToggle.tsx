// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// The visible mute for click feedback: the click sound and vibration. It never mutes an alarm; due checks
// and Warnings always sound. A toggle button: the icon and the word both say the state,
// so it never relies on the icon alone. On phone it is icon only, with the state in its accessible name.
import { Volume2, VolumeX } from "lucide-react";
import { useAlertMute } from "../../audio/alertTone";
import { Button } from "../ui/Button";

export function SoundToggle({ compact = false }: { compact?: boolean }) {
  const [muted, setMuted] = useAlertMute();
  const Icon = muted ? VolumeX : Volume2;
  return (
    <Button
      variant="text"
      size="sm"
      // Icon only on phone: the invisible extension makes the touch target 48 px wide as well as tall.
      className={compact ? "text-muted-foreground max-xl:before:-inset-x-3" : "text-muted-foreground"}
      aria-pressed={muted}
      aria-label={compact ? (muted ? "Click sound and vibration off. Turn on" : "Click sound and vibration on. Mute") : undefined}
      title="Mutes click sounds and vibration. Alarms for due checks and Warnings always sound."
      onClick={() => setMuted(!muted)}
    >
      <Icon size={16} strokeWidth={1.5} aria-hidden="true" />
      {!compact && (muted ? "Sound off" : "Sound on")}
    </Button>
  );
}
