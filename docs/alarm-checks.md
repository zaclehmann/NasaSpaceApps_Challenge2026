<!-- AI-assisted: generated with Claude Code, reviewed and edited by Zac Lehmann. -->
# Alarm and pulse checks

Manual checks for the alarm silencing and the due-now pulse (ui.md 5.6, 5.7 and 10). Each was run in
Chrome on 15 Nov 2026 with a script that counts the alarm tones (the 880 Hz triangle oscillator) and
reads the animation classes. Clear site data before each check, so no earlier choice carries over.

| # | Do this | Expect |
|---|---|---|
| 1 | Open `/?astronaut=hana&scenario=normal`. Don't touch anything for 3 s. | No sound. Nothing rings before the first interaction. |
| 2 | Click empty space on the page. | One ring, about half a second later (mood check is due now). |
| 3 | Press **Start**, then close the dialog with Escape. Wait 20 s. | No further rings. Start stays green but stops pulsing. |
| 4 | Fresh load. Make the first press **Start**. | No ring at all, and no pulse. |
| 5 | Fresh load. Click the page, press **Postpone**, then Cancel. Wait 20 s. | No further rings. |
| 6 | From Demo, choose **Low SpO₂** (after any first click). | The Warning tone rings once, taking over from a routine ring if one is sounding. Press **Acknowledge** while it sounds: it stops at once and never repeats. |
| 7 | Fresh load of the crew picker. | Due rows blink 5 times (about 5 s), then keep the red bar and tint without blinking. Opening a row stops its blink. |
| 8 | Repeat 3 and 7 with reduced motion on. | No pulse or blink; colour, bar and tint stay. |
| 9 | Load any due screen. Watch Start for 8 s. | 5 slow pulses (1.4 s each), then still. |

Choosing another demo scenario starts fresh: its due checks pulse and ring again.
