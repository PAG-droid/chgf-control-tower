# Where the data came from, and what disagrees

Everything in `src/data/` was extracted from
`MY_INVESTMENT/Projects/PROJ011 - Claude Code Hackathon Event` on 2026-08-14.

| Data file | Source |
|---|---|
| `agenda.json` | `08_minutes/2026-08-14_claude-code-hackathon/2026-08-14_hackathon-run-of-show-agenda.html` (v4) |
| `teams.json` | `11_strategy/2026-08-10_breakout-room-roster.md` |
| `judging.json` | `2026-08-14_Hackathon Judging Rubric.docx`, `2026-08-14_Claude Code Hackathon — Judge Scorecard.docx`, Xiaoxue's 2026-08-07 award-category updates |
| `resources.json` | `11_strategy/2026-08-10_neil-hackathon-project-idea-bank-v2.md`, `2026-08-14_Claude Code Hackathon — Host Guide.docx` |
| `ops.json` | `11_strategy/2026-08-12_helper-role-assignments.md`, `10_actions/actions_log.md`, `09_decisions/`, recent `02_updates/` |

## Contradictions found between sources

These are unresolved in the source material. The site follows the resolution
listed; if a resolution is wrong, fix the data file and push.

### 1. Two incompatible judging scales — highest impact

The **Judging Rubric** scores 1–3 per category (max 12, Emerging / Strong /
Standout). The **Judge Scorecard** scores 1–10 per category (max 40, weighted
25% each). Both documents are dated 2026-08-14.

**Resolution:** the site presents the Scorecard's 1–10 / max-40 scheme as
primary and notes the rubric variant in the scoring detail.

**Still needs a human decision:** if judges are handed different sheets, their
scores cannot be tallied together. Confirm which sheet is live before the
2:45 PM huddle.

### 2. Three extra award names in the rubric

The rubric lists *Best Real-World Scenario*, *Boldest Idea*, and *Most Likely
to Ship* under the Judging Huddle heading — separate from the four confirmed
award categories.

**Resolution:** treated as optional huddle discussion prompts, not awards, and
kept out of `categories`. If they are meant to be real awards, this is a
seven-award event and `judging.json` needs updating.

### 3. Agenda .docx contradicts the run-of-show HTML

| Detail | Agenda .docx (older) | Run-of-show HTML v4 (used) |
|---|---|---|
| Submissions close | 1:45 PM | 2:10 PM |
| Lunch | 12:00–12:45 | 12:00–12:30 |
| Catering | "Aegean Sunset / Garden Solstice" | Memphis Smokehouse, 11:45–2:00 |
| Team size | 1–3 | 2, flexible to 3–4 |

**Resolution:** the HTML is used throughout. It carries the 2026-08-11 and
2026-08-12 update notes documenting the build-time extension, so it is the
later revision. **The catering discrepancy is worth a 30-second check with
Ashley** — the two menus are unrelated, which suggests one is simply stale
rather than revised.

### 4. "Real-Work Impact" vs "Real-World Impact"

Both printed judge documents spell the criterion **Real-Work Impact** (missing
the "l"), in every occurrence. The award-categories update says **Real-World
Impact**.

**Resolution:** the site says Real-World. The printed judge materials in the
room will say Real-Work.

### 5. Award category names are marked "proposed"

The four award names (Impact in Action, Built to Last, Claude Code Wizardry,
Best in Show) appear only in Xiaoxue's 2026-08-07 update, where the status
field still reads `proposed`. The rubric names only the underlying dimensions.

**Resolution:** treated as confirmed, since they appear on the distributed
agenda.

### 6. Roster: "Johan De Vadder"

Listed on the Groups tab of the registration spreadsheet but absent from all 46
registration rows. Excluded, per the roster document's own analysis — dropping
the name makes Team C four members and reconciles the portfolio total exactly.

### 7. Jamie Purcell

Late in-person add to Team O, not present in the 2026-08-10 registration
export. Included with no GitHub-confirmed status on record.

## Deliberate omissions

- **No email addresses anywhere.** The roster source carries 45 of them; none
  were carried into `teams.json` or any other data file. The deployed bundle is
  verified clean.
- **No `githubConfirmed` flags.** Internal readiness data, not participant-facing.
- **No phone numbers.** None exist in the source material either — Teams is the
  escalation channel for everyone.
