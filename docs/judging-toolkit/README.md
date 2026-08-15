# Judging toolkit

Built by **Neil Hausmann** on the day to support the 2:45 PM judging huddle.

The design goal running through all four pieces: **turn judgment into something that can
be questioned.** Every band, every award, every superlative points at a slide number, a
commit SHA or a measured number rather than a recollection.

| File | What it does |
|---|---|
| [`collect_evidence.py`](collect_evidence.py) | Reads a team's `.pptx` and their local git repos, emits one JSON evidence file. **Scores nothing.** Produces only citable facts — slide numbers, commit SHAs, file paths. Anything it cannot observe is emitted as `null` rather than guessed. No network calls. |
| [`assign_awards.py`](assign_awards.py) | Assigns the superlative awards so **every team gets exactly one**, deterministically. Ranks teams on each metric and solves the coverage problem, maximising how distinctive each team is on the award it receives. |
| [`fetch_control_tower.py`](fetch_control_tower.py) | Pulls the roster and submissions from this Control Tower and reports **what changed since the last poll** — which team just attached a deck, repo or video. Has a `--watch` mode. |
| [`hackathon-judge-SKILL.md`](hackathon-judge-SKILL.md) | The Claude skill that does the scoring. Judges a submission from its presentation *and* its git history, on the Judge Scorecard 1–10 × 4 criteria (max 40), with the legacy 1–3 bands as the evidence anchor. |

## The idea worth stealing

From the skill:

> Turn two artifacts of very unequal honesty — a pitch and a commit history — into scores
> that survive being questioned.
>
> The presentation is the submission's *claim*. The commits are its *behaviour*. Most
> mis-scoring is one of two errors: a polished deck reading as execution, or a strong
> commit history going unscored because the deck never showed it. Score the two channels
> separately and report where they disagree — that disagreement is usually the most
> informative thing about a submission.

## Why the fun awards are computed, not vibed

`assign_awards.py` exists because handing out superlatives ad hoc "reliably produces two
teams with a strong claim on the same award and one team with nothing, which is the moment
a fun award starts reading as a consolation prize." Assignment by measured distinctiveness
means every citation is a real number.

It carries ~28 alternative prizes — Tokenmaxxer, Emoji Maximalist, Geekiest, Nerdiest,
Normalist, The Filibuster — spread across the whole field so nobody leaves empty-handed.
Teams that won one of the four rubric awards are excluded by default via `--exclude`.

## Running it

```bash
# 1. Gather citable facts for one team
python collect_evidence.py --project "Team Rocket" --deck deck.pptx \
    --repo C:/path/to/clone --since 2026-08-11 --until 2026-08-15 --out evidence.json

# 2. Spread the superlatives across everyone who did not win a rubric award
python assign_awards.py --evidence ./evidence/ --exclude "Team A" --out slate.json

# 3. Watch the Control Tower for late submissions
python fetch_control_tower.py --out roster.json --watch --interval 120
```

`collect_evidence.py` makes no network calls and clones nothing — point it at repos you
have already cloned locally.

## Provenance and handling

The skill is risk tier 2: it produces comparative judgments about identifiable colleagues'
work. Its own framing is that the output is **one judge's scorecard with cited evidence and
explicit confidence** — the organiser tallies across judges and the humans own the decision.

Owner email addresses were redacted from the skill's metadata before archiving here,
because this repository is public. The originals are unmodified in the author's own
worktree.
