# Control Tower — Claude Code Hackathon

Day-of control tower for the Gates Foundation × Anthropic Claude Code Hackathon,
Friday 14 August 2026.

## Change something during the event

**Every piece of content lives in `src/data/`. You never need to touch a component.**

| Want to change… | Edit |
|---|---|
| Agenda times, sessions, session detail | `src/data/agenda.json` |
| Team names, members, rooms | `src/data/teams.json` |
| Award categories, criteria, judges | `src/data/judging.json` |
| Submission steps, idea bank, links, FAQ | `src/data/resources.json` |
| Ops board: roles, open items, gaps | `src/data/ops.json` |

Then:

```bash
git add -A && git commit -m "Update agenda" && git push
```

Both deployments rebuild automatically. Live in about 60–90 seconds.

## Pages

| Route | Who | What |
|---|---|---|
| `/` | Everyone | Live agenda, auto-highlighted current session, countdown to next transition |
| `/teams` | Everyone | 15 teams, searchable by name, filterable by mode |
| `/judging` | Everyone | Award categories, criteria, judge panel, afternoon timeline |
| `/resources` | Everyone | How to submit, idea bank, quickstart links, FAQ, feedback survey |
| `/ops` | Organisers | Unlisted. Open items, unconfirmed roles, escalation matrix, decisions |

`/ops` is unlisted, not secret. It ships in the public bundle, so it contains
names and roles only — **no email addresses, no phone numbers.**

## Rehearse a different time of day

Append `?t=HH:MM` to preview the site as it will look at that moment:

```
https://<site>/?t=14:10#/          # the submission deadline
https://<site>/?t=12:15#/          # mid-lunch
```

The clock always evaluates in event-local time (`America/Los_Angeles`), so
virtual attendees in other timezones see the same schedule you do.

## Local development

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build into dist/
npm run typecheck  # optional; the build does not block on type errors
```

## Deployment

Two targets, one codebase, both auto-deploying from `main`:

- **GitHub Pages** — `.github/workflows/deploy-pages.yml`, builds with
  `VITE_BASE=/chgf-control-tower/`
- **Azure Static Web Apps** — see [docs/DEPLOY.md](docs/DEPLOY.md), builds at
  root with `staticwebapp.config.json`

## Source material

Extracted from `MY_INVESTMENT/Projects/PROJ011 - Claude Code Hackathon Event`.
Notes on what came from where, and known contradictions between source
documents, are in [docs/DATA-SOURCES.md](docs/DATA-SOURCES.md).
