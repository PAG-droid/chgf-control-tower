# Day-of playbook

Every change is: **edit one JSON file → commit → push.** Live in 60–90 seconds
on both hosts. You never edit a component.

```bash
git add -A && git commit -m "what changed" && git push
```

Watch it land:

```bash
gh run watch
```

---

## The changes you are most likely to make today

### A session is running late

Edit `src/data/agenda.json`. Shift the `start` and `end` of the affected
sessions. Times are 24-hour `"HH:MM"` in event-local time.

```json
{ "id": "sprint2", "start": "12:35", "end": "14:15", "durationLabel": "100 min" }
```

The current-session highlight and the countdown both recompute from these two
fields, so nothing else needs touching. Update `durationLabel` too — it is
display text and does not recalculate itself.

### A team names itself

Edit `src/data/teams.json`, set `name` on that team:

```json
{ "letter": "F", "name": "Sudo Make Me A Sandwich", ... }
```

### Someone moves team

Move the member object between the two teams' `members` arrays, then fix
`memberCount` on both. Also fix `mode` if the team changes between
`"All In-Person"`, `"All Virtual"`, and `"Mixed"`.

### Add an announcement

There is no announcement banner yet. The fastest honest option mid-event is to
edit the `detail` string of the current session in `agenda.json` — it renders
directly under the headline on `/`. Ask for a proper banner component if you
need one; it is a small addition.

### The submission deadline moves

Two places, and both matter:

1. `agenda.json` — the `submissions` session `start` / `end`
2. `resources.json` — `submission.deadline`, and the deadline referenced inside
   the last few `submission.steps`

### Close out an ops item

Edit `src/data/ops.json`, set `"status": "done"` on the item. It renders struck
through. Set `"at-risk"` to make it red.

---

## Rehearsing

Append `?t=HH:MM` to any URL to see the site as it will look then:

```
http://localhost:5173/?t=14:10#/     # the submission deadline
http://localhost:5173/?t=15:06#/     # awards
```

The clock freezes at that time. Remove the parameter to return to live.

---

## If a push breaks the site

```bash
git revert HEAD && git push
```

Faster and safer than hand-editing content back while the room waits. The
previous version is live again in about 90 seconds.

## If a deploy fails

```bash
gh run list --limit 3
gh run view --log-failed
```

Most likely cause by far is **invalid JSON** — a trailing comma or a missing
quote. Check before you push:

```bash
node -e "require('./src/data/agenda.json'); console.log('valid')"
```

The build does not typecheck, so a stray TypeScript error will not block a
deploy — but malformed JSON will.
