---
name: hackathon-judge
description: >
  Judge Claude Code hackathon submissions from a team's PRESENTATION (deck, video, live
  demo) and its GIT repo. Primary scale is the Judge Scorecard — 1-10 per criterion across
  Real-World Impact, Staying Power, Claude Code Craft, Execution & Demo, total /40 — with
  the legacy 1-3 bands (/12) as the evidence anchor. Emits a pasteable scorecard with cited
  rationale and confidence per score, the four official awards with decision records, the
  three official call-outs, and — ADDITIONAL to those — ~28 alternative prizes (Tokenmaxxer,
  Emoji Maximalist, Geekiest, Nerdiest, Normalist, The Filibuster…) over the whole field so
  nobody leaves empty-handed. Pulls roster and submissions live from the Control Tower.
  Triggers: "score this hackathon submission", "judge these projects", "judge all teams",
  "who wins Best in Show", "award slate", "judging huddle", "fun awards". Do NOT use to
  DESIGN a rubric (eval-harness-domain) or review code quality (/code-review).
metadata:
  owner: Neil Hausmann
  backup_owner: TBD
  approved_by: Neil Hausmann
  approval_date: "2026-08-14"
  review_date: "2026-11-14"
  sunset_date: ""
  risk_tier: 2
  risk_factors: "Produces comparative judgments about identifiable colleagues' work and a recommended award slate. Output is ONE judge's scorecard with cited evidence and explicit confidence — the organizer tallies across judges and the humans own the decision. Reads submitted decks and local clones of submitted repos; writes to neither."
  pii_handling: "Deck text, participant/author names and commit metadata are sent to the model in scoring calls. Do not paste credentials or unpublished grantee content found inside a submission; cite the path instead."
  changelog_url: "local-only skill; history in ~/.claude worktree"
  eval_pass_rate: TBD
  eval_last_run: TBD
---

# SKILL: Hackathon Judge (presentation + commits)

Canonical judging skill. Merged 2026-08-14 from two drafts plus the authoritative
`judging.json`; where the drafts disagreed, `judging.json` won and the conflict is recorded
inline so it does not get "fixed" back.

## Purpose

Turn two artifacts of very unequal honesty — a pitch and a commit history — into scores
that survive being questioned, and make sure every team leaves with something real.

The presentation is the submission's *claim*. The commits are its *behaviour*. Most
mis-scoring is one of two errors: a polished deck reading as execution, or a strong commit
history going unscored because the deck never showed it. Score the two channels separately
and report where they disagree — that disagreement is usually the most informative thing
about a submission.

Enthusiasm is not evidence. A narrative that is exciting and unsourced scores where its
evidence sits, and the rationale says so plainly.

Three outputs, firewalled from each other:

- **Part 1 — the scored scorecard.** 1-10 per criterion, evidence-cited, /40.
- **Part 2 — the four official awards + three official call-outs**, each with a decision record.
- **Part 3 — a superlative for everyone else**, from mechanical counters, one per team.

**The firewall:** no Part 3 counter may inform a Part 1 score, ever. Emoji count, token
spend, slide count and commit volume are *jokes with numbers attached* — the moment one of
them nudges an Impact score, the whole output is compromised.

---

## THE SCALE — read this before scoring anything

**The primary scale is 1-10 per criterion, maximum 40.** Four criteria weighted equally at
25%; a project's final score is the simple sum. This is the *Judge Scorecard*, and per
`judging.json` it **supersedes** the earlier "Hackathon Judging Rubric" that used 1-3 per
category (max 12) — that document is still in circulation, so expect judges to arrive with
it. Both are supported here: score the **1-3 band from evidence first**, then place within
its 1-10 sub-range. The band is the anchor; the 1-10 is the resolution.

| 1-3 band | 1-10 | Official scoring guide |
|---|---|---|
| **1 — Emerging** | 1-3 | *Limited* — little evidence of the criterion; concept stage or non-functional |
| **2 — Strong** | 4-6 | *Solid* — meets the criterion; works as shown, room to grow |
| **3 — Standout** | 7-8 | *Strong* — clearly exceeds expectations; polished and convincing |
| **3 — Standout** | 9-10 | *Exceptional* — best-in-show caliber; you would champion this project yourself |

**Within-band placement, so the tenths mean something:**
- **7** — exceeds on this criterion, one material gap remains.
- **8** — exceeds with no material gap, but you would not personally champion it.
- **9** — you would champion it.
- **10** — reserve for the single best you saw on that criterion. **At most one 10 per
  criterion per judge.** Without that discipline the top of the scale collapses in the
  first four demos and every later team is scored against a ceiling you already spent.

Report **both** totals — `/40` (primary, what the organizer tallies) and `/12` (the band
view, for anyone holding the older sheet). Never present only one.

> **The i / e / π column labels and "maximum 12.566" on the legacy sheet are decorative** —
> 12.566 is 4π, the joke carried into the total. Four bands at 3 sum to 12. Do not rescale
> anything; if someone wants the π framing, it is a display value over the /12.

---

## The four criteria, and what actually earns each band

Official descriptions from `judging.json`, then the observable anchors that stop a band
being bought with polish or volume.

### 1. Real-World Impact — *"Solves a real problem at your organization and fits a problem statement."*

- **1 (1-3)** — Framed technology-first ("we built an agent that…"), or the beneficiary is
  generic ("users", "the org"). No current-state cost. Value has to be inferred.
- **2 (4-6)** — Names a real team/role and the task it does today; the pain is concrete and
  credible even if unquantified; the build addresses that task, not a proxy for it.
- **3 (7-10)** — All of 2, **plus** the current-state cost is quantified with a source,
  **and** the repo works against the real surface (real schema, real API, real documents,
  production-shaped auth) rather than fixtures only, **and** the value attaches to a
  decision or workflow that actually happens on a known cadence.

Observables: named orgs/teams/roles in the deck; quantified claims **with** a stated source;
real integration in the repo (`.env.example`, MCP config, SQL against named schemas,
connector code) versus a mock-only tree.
**Cap:** quantified impact claims with zero corroboration → max **6**, confidence ≤ medium.
**Ask, don't deduct:** the missing fact is almost always *volume* — how often this happens
per month. One sentence from the presenter often moves this criterion two points.

### 2. Staying Power — *"The team and their colleagues will keep using it; a reusable skill, agent, MCP integration, or workflow."*

Note the official wording rewards **reusable form** — a skill, an agent, an MCP server, a
workflow — not merely a tidy repo. Weight that.

- **1 (1-3)** — Runs on the author's machine only: hardcoded paths or keys, no deps
  manifest, no install steps. A single-burst history with no structure.
- **2 (4-6)** — Reproducible by another person (deps manifest **and** install steps), and a
  concrete continuation path: a named owner, a named next user, or a scheduled review. A
  "Next steps" slide is **not** this.
- **3 (7-10)** — All of 2, **plus at least two** of: a deployed/hosted surface or CI/CD; a
  second committer or a named owning team; tests or a validation gate; config externalised;
  docs beyond the README; a stated adoption commitment from a named team. Packaged as a
  reusable skill/agent/MCP that a colleague could adopt tomorrow pushes toward 9-10.

**Cap:** forward-looking slides are the weakest evidence class in the rubric — a roadmap
never lifts a band alone. Ask "who owns it on Monday, and where does it run?"

### 3. Claude Code Craft — *"Creative, unique use of Claude Code beyond a single prompt."*

Split two things the wording invites conflating:

- **(a) Built WITH Claude Code** — the harness: config, skills, subagents, hooks, MCP
  servers, plan-then-execute discipline, agent-run gates. **This is the criterion.**
- **(b) The product calls the Claude API** — product architecture. Credit under Impact or
  Execution. A submission doing only (b) is not automatically above a 3 here.

- **1 (1-3)** — Claude Code as autocomplete or chat. Generated code lands; nothing about the
  harness is committed or described.
- **2 (4-6)** — Effective harness use, visible: a `CLAUDE.md` that actually constrains the
  work, committed slash commands or skills, an MCP server wired in, a history showing real
  build→test→fix iteration, plan-before-execute.
- **3 (7-10)** — Creative use that **measurably improved the solution**, traceable to a
  named artifact and a stated before/after: subagents with role separation, hooks enforcing
  an invariant, a skill or MCP server built for this project, a CI/eval gate the agent runs
  against its own output, a self-audit loop, or a documented harness change that fixed a
  specific recurring failure.

**Cap, both directions — the most gamed criterion:**
- Co-authored-commit count is **volume**, not craft. 400 trailered commits with no committed
  harness artifact is a 3-5. Never cite the count as the reason for a high score.
- **Zero** trailers does not cap the score — trailers die in squash merges. Score artifacts.
- A generic template `CLAUDE.md` with no project-specific constraint is not evidence. Read it.

### 4. Execution & Demo — *"Sound engineering, refined past the first idea, and a working demo that holds up live."*

"Refined past the first idea" is doing real work in that sentence: evidence that v1 was
found wanting and changed counts here.

- **1 (1-3)** — Incomplete or stubbed at the core; the "demo" describes what it would do.
- **2 (4-6)** — Works end to end on the demo path and the demo shows it: a real run, real
  output. Rough edges present and acknowledged.
- **3 (7-10)** — Polished **and** functional: handles a non-happy path or realistic data
  volume, the demo shows the actual artifact or outcome rather than narrating it, the repo
  corroborates (working entrypoint, core not TODO-stubbed, evidence of real runs), and there
  is a visible refinement — a defect found and fixed, a design corrected by a stakeholder.

**Caps:**
- Deck polish is **not** execution. No runnable entrypoint or a stubbed core → max **6**,
  however good the deck.
- **Demos are 120 seconds and live.** A demo that fails live is evidence about the demo, not
  proof the code is broken — note both, and cite the repo separately.
- No observable demo but a clearly working repo → score from the repo, confidence medium,
  and say the demo was not observable. Do not conflate "I could not see it" with "it does
  not work".

---

## Step 0 — Pull the field from the Control Tower (source of record)

The roster and submissions live in the Control Tower SPA
(https://pag-droid.github.io/chgf-control-tower/#/teams). It is client-side, so fetch the
data files directly — and **re-fetch at judge time**, because submissions land late:

```
python C:/Users/neilha/.claude/skills/hackathon-judge/scripts/fetch_control_tower.py --out <scratchpad>/roster.json
```

That wraps the three canonical files:

| File | What it gives |
|---|---|
| `…/chgf-control-tower/main/src/data/teams.json` | roster: letter, name, room, mode, members |
| `…/chgf-control-tower/main/src/data/demos.json` | per team: `deck`, `repo`, `video`, `presenters`, `note`, `share`, plus running order and `secondsPerDemo` |
| `…/chgf-control-tower/main/src/data/judging.json` | categories, criteria, scale, judges, timeline |

Map each team's `deck` → **presentation**, `repo` → **git**, `video`/`note` → supporting
evidence. **`null` means "not received yet"** — treat as missing, cap the dependent
criteria, and say so. Teams are keyed by **letter (A-S, no B — 18 teams)**; the letter is
the join key everywhere, because team names change and folder names differ from both.

**Two roster traps, both live:**
1. **The monorepo folder name is not the team name.** Team A "The Green Donuts" submits to
   the folder `The-Green-Donuts` *and* points at a separate repo `eba-claude-hackathon`. Use
   `demos.json:share` and `note` for the mapping; never infer it.
2. **A submission can sit outside the org.** A personal repo or a GitHub Pages app will not
   appear under the org or the hackathon team. A deployed URL is strong Execution and Staying
   Power evidence — get the repo behind it, or score the URL and mark the code channel
   unavailable.

### The clock is the binding constraint

From `judging.json`: **submissions close 14:10 · demos 14:15 (120s each, 18 teams ≈ 36 min)
· huddle 14:45 · awards 15:05.** That is roughly 20 minutes between the last demo and the
awards. So:

- **Collect all repo evidence BEFORE 14:10.** Repo collection is the slow half and is
  available hours earlier. Decks drop into a pass that is already primed.
- During demos, capture only what is *not* in the repo: did it work live, what did the
  120 seconds actually show, presenter answers to the one missing fact per criterion.
- The huddle needs the decision records already written. See Step 5.

### Getting the decks

**Look in the repo FIRST — before any SharePoint search.** On 2026-08-14 three of the five
decks obtained were committed inside the submission itself, not in the deck folder:
`Assets/Gearset-Triage-Agent.pptx`, `docs/AI-Navigator-Summary.pptx`, and
`OrgImpactSimulator-hackathon-pitch.pptx` at a branch root. One search costs nothing:

```
git -C <repo> ls-tree -r --name-only <ref> | grep -iE '\.(pptx|pdf|key)$'
```

> **This is the single most expensive mistake made in the 2026-08-14 run.** A team was
> scored 17/40 with "no presentation" and a one-line root README — while its deck sat in
> `Assets/` and a fully-designed skill sat in `.claude/skills/`. On review it scored
> **30/40**: last place to second. The counters had reported the skills directory present;
> the judge under-weighted it because the README was empty. **An empty README is not
> evidence of an empty submission.** Enumerate the tree before you conclude anything, and
> read every `.claude/**` file you find rather than noting that it exists.

Decks otherwise arrive in a shared OneDrive folder (or `public/decks/` as a PDF filename in
`demos.json`), typically minutes before judging. Both verified 2026-08-14:

- **A sharing URL is not addressable — but you can resolve it in two calls.** The connector
  reads `file:///{driveId}/{itemId}`, not `https://…/:p:/g/personal/…`. The reliable route,
  which beats searching:

  ```
  read_resource  drive:///users/<firstname>.<lastname>[redacted]
      -> returns that person's OneDrive driveId
  read_resource  file:///{driveId}/Microsoft Teams Chat Files/<exact file name>.pptx
      -> returns the deck text
  ```

  The path comes straight off the sharing URL: everything after `/Documents/`. Decks shared
  into a Teams chat land in **`Microsoft Teams Chat Files/`** almost every time.
- **Search is the WRONG tool for a just-uploaded deck, and fails misleadingly.** The index
  lags several minutes, so a deck posted at 22:09 was invisible at 22:12 — and worse, the
  same searches returned *plausible unrelated* decks (a strategy review, catering menus for
  a team called The Green Donuts) rather than nothing. **Never read a search miss as "no
  deck exists."** Go via the drive-id route above, or read the Teams message that carried it:
  `teams:///chats/{chatId}/messages/{messageId}`, taking both ids straight out of the
  `teams.microsoft.com/l/message/...` URL. That returns the attachment's exact filename and
  path even when search cannot see it. (Some chats return `FORBIDDEN` — that is a permission
  boundary, not a missing message.)
- **An empty deck folder does not return empty.** Searching before upload returns *plausible
  unrelated* decks (a strategy review, a portfolio update). Never read a search hit as
  confirmation a team's deck exists — match the exact filename against the roster.

---

## Step 1 — Collect evidence deterministically (before forming any opinion)

```
python C:/Users/neilha/.claude/skills/hackathon-judge/scripts/collect_evidence.py --project "<team letter> <team name>" --deck <deck.pptx> --repo <local repo> --paths <submission-dir> --since <YYYY-MM-DD> --until <YYYY-MM-DD> --tokens <self-reported> --talk-minutes <observed> --out <scratchpad>/ev/<letter>.evidence.json
```

`--repo` and `--paths` both repeat. `--tokens`/`--talk-minutes` feed Part 3 only and are
optional — omit rather than estimate; a null ranks as "not measured", a guess ranks as fact.

Clone remotes shallow: `git clone --filter=blob:none <url> <scratchpad>/<name>`.

**On the shared monorepo, `--paths` is mandatory.** Unscoped, every team inherits every other
team's commits, authors, diffstat and harness artifacts — 18 teams scoring identically on
Craft. The collector scopes the log, file list, diffstat and artifact lookup, and records
whether each artifact is the **submission's** or the **repo root's**: a root-level
`CLAUDE.md` on a shared repo is the organisers' file, not that team's craft. If a pathspec
matches nothing it falls back to unscoped and prints `!! SCOPE:` — never ignore that line,
it means the evidence is for the wrong thing.

**Squash-merge check before scoring Craft:** a squashed history destroys co-author trailers
and per-iteration commits. If squash-only, say so and score Craft from committed artifacts.

For a **PDF** deck, read it with the Read tool (`pages:`) and build the same fields by hand,
citing page numbers.

Read the JSON, not just the console summary — the console counts are the gameable surface.

---

## Step 2 — Claim ledger, before any score is set

Every factual claim about a named thing — a team, a partner, a system, a metric — gets a tag:

- **`[CORROBORATED]`** — in the presentation **and** visible in the repo. Cite both.
- **`[REPO-ONLY]`** — in the repo, not claimed in the pitch. Fully creditable; note the
  pitch undersold it.
- **`[PITCH-ASSERTED]`** — claimed, nothing in the repo speaks to it. Credit intent, never
  delivery.
- **`[UNVERIFIED]`** — a number or external fact with no source in either channel. Goes in a
  **Claims Requiring Verification** block and **cannot lift any score**.

Hard rule: **`[PITCH-ASSERTED]` and `[UNVERIFIED]` claims cannot move a criterion above 6.**
They can lower confidence. Ask the presenter — an unverified claim is a question for the
huddle, not a deduction.

---

## Step 3 — Score, one criterion at a time, across all teams

**Score column-wise, not team-wise.** Do Real-World Impact for every team, then Staying
Power, and so on. Scoring one team across all four first anchors every later team to it, and
the score starts meaning "relative to whoever demoed first" instead of the criterion. With a
single submission, still score each criterion in a separate pass and do not carry one
criterion's verdict into the next.

Every score needs **≥2 citations**, each one of: `slide N` / `page N` / a commit `sha` / a
repo `path` / `live demo`. One citation caps confidence at low.
**"Insufficient information" is always a valid verdict** — never manufacture a score to fill
a cell. Absence of evidence is not Standout, and it is not automatically Emerging either:
lower **confidence** and name the gap; lower the **score** only where the criterion's own
wording depends on the missing thing.

### Confidence, per score

| Confidence | Condition |
|---|---|
| **High** | ≥2 citations with **at least one from each channel** (pitch and repo), and they agree |
| **Medium** | One channel only; or the channels agree loosely; or the window is unknown; or the score sits on a boundary one artifact would move |
| **Low** | A single citation; or it rests on a `[PITCH-ASSERTED]`/`[UNVERIFIED]` claim; or the repo could not be inspected and the criterion depends on it; or an authorship/window confound is unresolved |

With every score record **score_stability** — the one artifact that would move it up, and
the one that would move it down. That converts "I feel it's a 6" into "it's a 6 until
someone shows me the deployed URL", which is what a huddle can actually act on.

---

## Step 4 — Calibrate across the set (skip only for a single submission)

1. **Distribution per criterion.** If ≥60% of a criterion's scores sit in 4-6, the criterion
   stopped discriminating. Re-read the two ends and justify the flatness or re-score.
2. **Ceiling discipline.** Exactly one 10 per criterion, at most. If you have two, one is an 9.
3. **Anchor drift.** Compare the first and last team scored on each criterion. If the same
   evidence would have scored differently, re-score that criterion cold.
4. **Halo check.** A team strong on Execution must not inherit an Impact or Staying Power
   score it has no evidence for. Verify citations are criterion-specific, not the same two
   artifacts reused four times.
5. **Confound register.** Per team: commits outside the window, single-author builds,
   vendored/forked code inflating the diffstat, monorepo dirs unrelated to the submission,
   a demo that failed live for environmental reasons.

---

## Step 5 — The four official awards, with a decision record each

| Award | Tagged criterion | Official description |
|---|---|---|
| 🏅 **Impact in Action** | Real-World Impact | Solves a meaningful problem and demonstrates clear value |
| 🏗️ **Built to Last** | Staying Power | Goes beyond a demo with a thoughtful, scalable foundation and a credible path to continued use |
| 🪄 **Claude Code Wizardry** | Claude Code Craft | Especially creative, ambitious, or technically impressive use of Claude Code |
| 🏆 **Best in Show** | *see conflict below* | The strongest overall project, bringing together impact, execution, creativity, and technical quality |

> **Recorded conflict — Best in Show.** `judging.json` tags it `"tagline": "Execution &
> Demo"` while its description reads "the strongest overall project". The legacy rubric
> sheet maps it to Execution & Demo; one earlier draft of this skill mapped it to the
> highest total and asserted there is no Execution & Demo award. **Default adopted here:
> award Best in Show on the highest total `/40`, using Execution & Demo as the first
> tiebreak.** That satisfies both readings and matches the scoring section, which defines
> the final score as the sum of four. **Flag it to the organizer once** — it is a
> two-sentence confirmation, and getting it wrong is visible on stage. Consequence to state
> plainly: Execution & Demo then has no standalone trophy, but it feeds the total.

Awards go on the **criterion score alone** (Best in Show: the total). A team **may win more
than one** — that is expected; note it. Also produce a **spread** variant where each team
takes at most one, and name which awards differ, so the huddle can choose. The rubric asks
to "recognise one standout project in each area"; it does not forbid a sweep.

**Tiebreaks, in order, shown in the output:** (1) higher confidence on that criterion;
(2) more `[CORROBORATED]` citations for it; (3) higher total `/40`; (4) for Best in Show
specifically, more criteria at 9-10; (5) unresolved → declare a genuine tie and take it to
the huddle. **Never** break a tie on deck quality, presenter fluency, or commit volume.

Each award gets a decision record, written **before** the huddle:

```
AWARD: Claude Code Wizardry
WINNER: <letter> <team>        Craft: 9/10 (band 3)   Confidence: high
DECIDED ON: the two strongest citations, named — not a summary
   1. <path or sha> — what it shows
   2. <slide N / live demo> — what it shows
RUNNER-UP: <letter> <team> at 8 — why not: <the specific discriminator>
MARGIN: 1 point (or: tie on score, resolved at tiebreak 2 — 4 corroborated citations vs 1)
WHAT WOULD OVERTURN THIS: <the single fact that, if produced, flips it>
NOT DECIDED ON: <the tempting-but-excluded signal — deck polish, commit volume, a
   [PITCH-ASSERTED] claim, the presenter's fluency>
```

The last two lines earn their keep. *What would overturn this* turns a challenge into a
checkable question instead of a debate about taste. *Not decided on* pre-empts the commonest
objection — "but they had the slickest demo" — by showing the signal was seen and set aside.

A record you cannot fill means the decision is not made yet.

### The three official huddle call-outs

`judging.json` also lists three optional call-outs. These are **official and judged, not
measured** — allocate them by judgment before any invented superlative, and they are the
best home for a team that just misses a main award:

- **Best Real-World Scenario** — most compelling or unexpected use case
- **Boldest Idea** — most creative or ambitious concept
- **Most Likely to Ship** — solution people could imagine using soon

### Multi-judge reality

There are four judges (Xiaoxue Du principal; Neil Hausmann; Matt Gee; Li-Tal Mashiach,
Anthropic). **Each judge scores independently and the organizer tallies across judges** — so
this skill's output is *one judge's* scorecard, never the verdict. Enter teams in demo order,
total each row in the Final Score column. Do not present a slate as decided; present it as
this judge's scores plus where the close calls are. The paper scorecard is the fallback.

---

## Step 6 — Part 3: the alternative prizes (ADDITIONAL to the official awards)

**Every alternative prize cites a number the team actually leads the field on.**

> **ONE AWARD PER TEAM — exclusive, not additive.** Set at the 2026-08-14 event, superseding an
> earlier additive reading. No team wins twice, so allocation is a **constrained assignment**,
> not four independent argmaxes. Consequences to state out loud when presenting, because they
> look like errors otherwise:
> - **The highest total may not take Best in Show.** If it wins a criterion award, Best in Show
>   goes to the next-highest. Say the margin aloud so it doesn't read as a mistake.
> - **Give each team its most distinctive claim, not its most prestigious.** Prefer the award a
>   team leads by the widest margin; that minimises the number of new ties you create downstream.
> - **Resolve cascades in one pass.** Moving one award frees another and can strand a team —
>   lay all teams and all honours out together and assign once, rather than patching.
> - A team submitting under two workstreams is still **one team** unless the organiser rules
>   otherwise. Ask; do not assume.

> **ELIGIBILITY: only teams that submitted something.** Set at the 2026-08-14 event, and it is
> the right rule. An award marks something a team *did*; handing one to a team with no
> submission means inventing a reason, and the only material available is their roster row —
> which produces name jokes dressed up as recognition. That is the participation trophy this
> whole section exists to avoid. It also resolves the tension cleanly: **coverage means every
> *submitting* team gets an award, not every registered team.** At the 2026-08-14 event that
> was 8 of 18 teams, and the mechanical assignment covered all of them from real numbers.
>
> Boundary case to put to the organiser, not to decide yourself: a team that *registered* a
> repo which turns out to be unreachable (404). They attempted a submission; nothing is
> verifiable. Ask.

Allocate in this order, so the real recognition is settled first:
1. The four official awards (Step 5) — scored, with decision records.
2. The three official call-outs (Step 5) — judged.
3. The alternative prizes — mechanical, over **all 18 teams**, official winners included.

```
python C:/Users/neilha/.claude/skills/hackathon-judge/scripts/assign_awards.py --evidence <scratchpad>/ev --out <scratchpad>/slate.json
```

**Default: no `--exclude`.** Every team is eligible for an alternative prize regardless of
what it already won. Then check coverage: any team holding *nothing* after all three passes
gets a bespoke award named by hand (below).

`--exclude` exists only for the organiser who wants maximum spread — "official winners don't
also collect a fun one". If you use it, say which rule is in force when presenting. An
`--exclude` naming no loaded team is a hard error, because it would silently leave a team
uncovered while the coverage line still read "complete".

**How it works:** the script z-scores every team on every counter and awards each superlative
**only to the team that actually leads that metric**. Ties settled by uniqueness; a team
leading several keeps its highest-margin one, with the free alternates listed as `also led`
so a judge can swap. `z` is the margin — a narrow win in a flat field is flagged
`NARROW WIN`, and there you cite the number, not the ranking.

> **Leader-only eligibility is load-bearing.** An early build let any team take any award and
> produced *"The Efficient One: only 2,000,000 tokens"* for a mid-field team. Every name in
> the catalogue is a superlative, so giving one to a non-leader states something false — in
> front of the person who knows their own numbers.

**Teams leading on nothing** come back as `BESPOKE AWARD NEEDED` with their four most unusual
metrics as raw material. Do **not** let the script invent one: name it by hand from the demo
— the thing the room actually remembers. Usually the best award of the night.

### The catalogue (~28, in `assign_awards.py` — edit for your crowd)

| Kind | Awards |
|---|---|
| Token spend | The Tokenmaxxer (most), The Efficient One (fewest) |
| Presentation | The Filibuster (longest), The TL;DR (fewest slides), Slide Density Record |
| Register | Emoji Maximalist, The Grayscale Award (zero emoji), Acronym Soup |
| Tribe | **Geekiest** (deep-technical references), **Nerdiest** (fandom/lore references), **The Normalist** (plainest business language) |
| Commit shape | The Night Shift (00:00-05:00), The Marathon, Most Committed, One Big Commit Energy, The Phoenix (most reverts), The Novelist (longest message) |
| Craft residue | The Yak Shaver (tooling touches per product touch), The Harness Tinkerer, The Rubber Duck (most Claude co-authored commits) |
| Engineering | Belt and Braces (tests at a hackathon), Dependency Collector, Bare Hands (zero deps), Prolific, Surgical, Most Files Touched, Optimist of the Year (most TODOs), Team Sport (most authors) |

Geekiest / Nerdiest / Normalist run off short visible lexicons in `collect_evidence.py` —
**read the actual hits** before announcing one; a single word can carry the score.

### Two rules that keep these funny rather than sharp

1. **Every citation is a real number, and the number is the joke.** "37 emoji across 9
   slides" lands; "seemed like a lot of emoji" is a dig. If you cannot cite it, cut it.
2. **Only give an award the recipient would screenshot.** Affection, never a verdict on
   competence. Aim at artifacts (emoji, commit hours, TODOs, dependency counts), never at
   ability. Anything reading as "we ran out of nice things to say" — a bus-factor or
   least-effort joke — stays out unless the recipient is in on it. When in doubt, go bespoke
   and name something you genuinely admired.

**Assert coverage, don't assume it.** The script prints `COVERAGE: n/n`. Reconcile it against
the Step 0 roster **by letter**, not by count — a team missing from the roster is also
missing from the coverage check, and the whole point is nobody is left out.

Because the alternative prizes are additive, coverage is a **union across all three passes**:
a team is covered if it holds an official award, a call-out, an alternative prize, or a
bespoke one. With 18 teams, 7 official honours and 28 alternative prizes there is plenty of
room — the residual risk is not "not enough prizes" but "a mid-field team leads no single
metric", which is exactly what the bespoke path is for. Expect one or two of those, and write
them yourself.

---

## Step 7 — Output

**A. Per submission** — pasteable, then the evidence underneath:

```
## Hackathon Scorecard — <letter> <team name>

- **Presentation:** <link / deck filename / "not received">
- **Git:** <repo or monorepo path>

**Real-World Impact:   7 / 10**  (band 3 · confidence medium)
<1-2 sentences citing specific evidence.>

**Staying Power:       8 / 10**  (band 3 · confidence medium)
**Claude Code Craft:   9 / 10**  (band 3 · confidence high)
**Execution & Demo:    5 / 10**  (band 2 · confidence medium — demo not observable)

**TOTAL: 29 / 40**   (band view: 11 / 12)
Judge note: <one line, ≤200 chars, the single decisive fact>
```

Per criterion, two sentences maximum: the score, the reason, the citations, and
score_stability. Example shape:

> **Claude Code Craft — 9 (high).** A project-specific skill plus a pre-commit hook that
> blocks un-sourced figures — the harness enforces the deliverable's own rule
> (`.claude/hooks/`, `.claude/skills/brief/SKILL.md`; slide 6 states the before/after).
> *Down to 7 if* the hook proves unwired; *10 reserved* unless nothing better appears.

Then: **Claims Requiring Verification** (each with the question to ask the presenter), and
**Channel disagreement** (where pitch and repo tell different stories, one line each).

**B. Across the set** — `## Ranked Summary`: Rank | Letter | Team | Git | Total /40 |
/12 | Highlight, sorted by total descending, ties noted. Plus the Step 4 distribution and
ceiling checks, and the confound register.

**C. Huddle pack** — standouts per criterion; close calls (margin ≤1 point or confidence
≤ medium) each stated as the specific question to settle; both award slates with tiebreak
trails; and the decision records verbatim.

**D. The full award slate** — every team, one row, no exceptions:

```
LETTER TEAM              AWARD                  WHY (the number)                 BASIS
O      Bleeding Edge     Claude Code Wizardry   4 subagents + 3 blocking hooks   official, 9/10
P      Team Rocket       The Yak Shaver         1.9 tooling per product touch    superlative, z=1.97
R      The Leftovers     <judges' bespoke>      <named from the demo>            bespoke
COVERAGE: 18/18 teams — complete
```

**E. Retain** each `*.evidence.json` and cite its path — a judge who disagrees should be able
to see the same facts.

Write for a reader who never saw this machinery: no tool, skill or JSON-field names in the
prose. Paths, slide numbers, SHAs and team letters stay — those are what a judge opens to
check you.

---

## Trap register (each has bought an undeserved score somewhere)

1. **Deck polish read as execution.** Design skill and criterion scores are uncorrelated.
2. **Commit volume read as craft.** Volume tracks merge style and verbosity. Named artifacts only.
3. **"Uses Claude" read as Claude Code Craft.** Calling the API is architecture.
4. **Roadmap read as staying power.** "Next steps" is the cheapest slide in any deck.
5. **Pre-window commits inflating the build.** Always set `--since`; report the split.
6. **Vendored or forked code in the diffstat.** A 60k-line insertion is often a copied dep.
7. **A round number with no source.** "Saves 12 hours" needs a baseline and who measured.
8. **Monorepo bleed.** Commits outside the submission dir are not the submission.
9. **Folder name ≠ team name ≠ repo name.** Join on the team letter.
10. **The articulate presenter.** Scores come from artifacts. If the pitch was clearer than
    the evidence, that gap belongs in the judge note.
11. **Absence read as failure.** Missing demo, missing README, uninspectable repo → lower
    confidence and name the gap.
12. **A 10 spent in the first four demos.** One 10 per criterion, or the scale collapses.
13. **The superseded rubric.** A judge arriving with the 1-3/12 sheet will tally against a
    different denominator. Report both totals, every time.

---

## Explicitly out of scope

- Designing or calibrating the rubric, or configuring a judge panel → **eval-harness-domain**.
- Security, licence or code-quality review. If something alarming surfaces (a committed
  secret, a licence violation), tell the organisers separately — never fold it into a score.
- Ranking presenters, or any judgment about individuals. The unit is the submission.
- **Deciding the winners.** This is one judge's cited scorecard; the organizer tallies across
  four judges and the humans own the call. A low-confidence award is meant to reach the
  huddle unresolved.
- **Judging your own team's submission.** If you are a judge with a submission in the field,
  declare it and recuse from that row rather than scoring it.
