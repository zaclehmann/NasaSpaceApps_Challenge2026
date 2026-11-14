// AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann.
// Mood check-in (ui.md 5.5): word scales, no faces. Private to the astronaut and the crew medical officer.
import { Lock } from "lucide-react";
import { useState } from "react";
import { MOOD_TAGS, MOOD_WORDS, STRESS_WORDS } from "@missionvitals/shared";
import { TextArea } from "../ui/NumericInput";
import { Scale } from "../ui/Scale";
import { ToggleTag } from "../ui/ToggleTag";
import type { NewReading } from "./BloodPressureForm";

export function MoodForm({ formId, onSave }: { formId: string; onSave: (r: NewReading) => void }) {
  const [mood, setMood] = useState<number | null>(null);
  const [stress, setStress] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [error, setError] = useState(false);
  return (
    <form
      id={formId}
      noValidate
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (mood === null || stress === null) {
          setError(true);
          return;
        }
        onSave({ value: mood, stress, tags, note: note.trim() || undefined, device: "self" });
      }}
    >
      <Scale legend="How is your mood today?" labels={MOOD_WORDS} value={mood} onChange={setMood} />
      <Scale legend="How stressed do you feel?" labels={STRESS_WORDS} value={stress} onChange={setStress} />
      {error && (mood === null || stress === null) && (
        <p role="alert" className="type-small text-warning-text">
          Choose an answer for both questions to save.
        </p>
      )}
      <div>
        <p className="mb-2 type-label text-muted-foreground">Anything else today? Optional</p>
        <div className="flex flex-wrap gap-2">
          {MOOD_TAGS.map((t) => (
            <ToggleTag key={t} label={t} on={tags.includes(t)} onToggle={() => setTags((x) => (x.includes(t) ? x.filter((y) => y !== t) : [...x, t]))} />
          ))}
        </div>
      </div>
      <TextArea label="Note, optional" value={note} onChange={setNote} />
      <p className="flex items-center gap-1.5 type-caption text-subtle-foreground">
        <Lock size={14} strokeWidth={1.5} aria-hidden="true" />
        Private. Only you and the crew medical officer see this.
      </p>
    </form>
  );
}
