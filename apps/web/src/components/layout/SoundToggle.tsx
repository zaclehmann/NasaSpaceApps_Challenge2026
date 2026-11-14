// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// The visible mute for alarm sounds (the routine alarm and the Warning tone). A toggle button: the icon and the word both say the state,
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
      className="text-muted-foreground"
      aria-pressed={muted}
      aria-label={compact ? (muted ? "Alarm sound off. Turn on" : "Alarm sound on. Mute") : undefined}
      title="Alarm sound: rings while a check is due now, and once when a Warning appears"
      onClick={() => setMuted(!muted)}
    >
      <Icon size={16} strokeWidth={1.5} aria-hidden="true" />
      {!compact && (muted ? "Sound off" : "Sound on")}
    </Button>
  );
}
