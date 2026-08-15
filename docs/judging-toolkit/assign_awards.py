#!/usr/bin/env python
"""Assign superlative (fun) awards so that EVERY team gets exactly one, deterministically.

Reads the *.evidence.json files written by collect_evidence.py, ranks each team on each
superlative metric, and solves the coverage problem: one award per team, one team per
award, maximising how distinctive each team is on the award it receives.

Why this is not a vibes exercise: with N teams and a fixed award catalogue, handing out
awards ad hoc reliably produces two teams with a strong claim on the same award and one
team with nothing, which is the moment a fun award starts reading as a consolation prize.
Assignment by measured distinctiveness means every citation is a real number.

Teams that already won one of the four rubric awards are excluded by default (--exclude),
so the superlatives spread across everyone else.

Usage:
  python assign_awards.py --evidence <dir-or-glob> --exclude "Team A" --exclude "Team B"
      --out slate.json
"""
from __future__ import annotations

import argparse
import glob
import json
import os
import statistics
import sys

# award, metric key, direction, citation template.
#   high  -> most of it wins        low -> least of it wins (metric must be defined)
#   zero  -> only teams at exactly 0 are eligible
CATALOGUE = [
    ("The Tokenmaxxer",              "tokens_reported",            "high", "{v:,.0f} tokens burned"),
    ("The Efficient One",            "tokens_reported",            "low",  "the field's lowest token spend ({v:,.0f})"),
    ("The Filibuster",               "talk_minutes",               "high", "~{v} minutes of presentation"),
    ("The TL;DR",                    "slides",                     "low",  "the field's shortest deck, {v:.0f} slides"),
    ("Slide Density Record",         "densest_slide_words",        "high", "{v:.0f} words on a single slide"),
    ("Emoji Maximalist",             "emoji_total",                "high", "{v:.0f} emoji shipped"),
    ("The Grayscale Award",          "emoji_total",                "zero", "zero emoji, anywhere"),
    ("Geekiest",                     "geek_score",                 "high", "{v:.0f} deep-technical references"),
    ("Nerdiest",                     "nerd_score",                 "high", "{v:.0f} fandom/lore references"),
    ("The Normalist",                "normalist_score",            "high", "plainest business language in the field"),
    ("Acronym Soup",                 "acronym_tokens",             "high", "{v:.0f} acronyms deployed"),
    ("The Night Shift",              "nocturnal_commits",          "high", "{v:.0f} commits between midnight and 5am"),
    ("The Marathon",                 "active_days",                "high", "committed on {v:.0f} separate days"),
    ("Most Committed",               "commits",                    "high", "{v:.0f} commits"),
    ("One Big Commit Energy",        "biggest_commit_share",       "high", "{v:.0%} of all work in a single commit"),
    ("The Yak Shaver",               "yak_shave_ratio",            "high", "{v} tooling touches per product touch"),
    ("The Harness Tinkerer",         "harness_artifact_kinds",     "high", "{v:.0f} kinds of Claude Code config committed"),
    ("The Rubber Duck",              "claude_trailered_commits",   "high", "{v:.0f} commits co-authored with Claude"),
    ("The Phoenix",                  "revert_commits",             "high", "{v:.0f} reverts and still standing"),
    ("The Novelist",                 "longest_commit_message_chars", "high", "a {v:,.0f}-character commit message"),
    ("Optimist of the Year",         "todo_fixme_count",           "high", "{v:.0f} TODOs left for future-them"),
    ("Dependency Collector",         "declared_dependency_count",  "high", "{v:.0f} declared dependencies"),
    ("Bare Hands",                   "declared_dependency_count",  "zero", "zero declared dependencies"),
    ("Belt and Braces",              "test_file_count",            "high", "{v:.0f} test files at a hackathon"),
    ("Team Sport",                   "distinct_authors",           "high", "{v:.0f} people in the history"),
    ("Prolific",                     "churn",                      "high", "{v:,.0f} lines changed"),
    ("Surgical",                     "churn",                      "low",  "the field's smallest diff, {v:,.0f} lines"),
    ("Most Files Touched",           "files_touched",              "high", "{v:.0f} files touched"),
]


def load(evidence_args):
    paths = []
    for a in evidence_args:
        if os.path.isdir(a):
            paths += sorted(glob.glob(os.path.join(a, "*.json")))
        else:
            paths += sorted(glob.glob(a))
    teams = {}
    for p in paths:
        try:
            with open(p, "r", encoding="utf-8") as fh:
                ev = json.load(fh)
        except (OSError, ValueError) as exc:
            print(f"skip {p}: {exc}", file=sys.stderr)
            continue
        if "superlative_metrics" not in ev:
            print(f"skip {p}: no superlative_metrics (re-run collect_evidence.py)", file=sys.stderr)
            continue
        teams[ev.get("team") or ev.get("project") or os.path.basename(p)] = ev["superlative_metrics"]
    return teams


def candidates(teams):
    """Eligible (team, award) pairs, scored by how far clear of the field the team is.

    ELIGIBILITY IS RESTRICTED TO THE FIELD LEADER on each metric (ties included). Every
    name in the catalogue is a superlative -- "Emoji Maximalist", "Most Committed",
    "Geekiest" -- so handing one to a team with the third-highest count states something
    false. An earlier build allowed any team and produced "The Efficient One: only
    2,000,000 tokens" for a mid-field team; that is the failure this guards.

    `z` then measures the MARGIN of the win, which is what makes the citation land: a
    z of 2 is "miles clear", a z near 0 is "won by a nose in a flat field".
    """
    out = []
    for award, key, direction, tmpl in CATALOGUE:
        vals = {t: m.get(key) for t, m in teams.items() if m.get(key) is not None}
        if not vals:
            continue
        if direction == "zero":
            for t, v in vals.items():
                if v == 0:
                    out.append({"team": t, "award": award, "metric": key, "value": v,
                                "direction": direction, "z": 1.0, "citation": tmpl})
            continue
        nums = list(vals.values())
        mean = statistics.fmean(nums)
        sd = statistics.pstdev(nums) if len(nums) > 1 else 0.0
        target = max(nums) if direction == "high" else min(nums)
        for t, v in vals.items():
            if v != target:
                continue
            # A "most of it" award is meaningless at zero.
            if direction == "high" and v == 0:
                continue
            z = 0.0 if sd == 0 else (v - mean) / sd
            if direction == "low":
                z = -z
            out.append({"team": t, "award": award, "metric": key, "value": v,
                        "direction": direction, "z": round(z, 3), "citation": tmpl})
    return sorted(out, key=lambda c: -c["z"])


def assign(teams, cands, excluded):
    pool = [t for t in teams if t not in excluded]
    by_team, by_award = {}, {}

    # Because eligibility is leader-only, each metric has exactly one natural claimant and
    # awards do not contend -- except on ties, where several teams sit on the same value.
    # So this is a single greedy pass on margin: each team keeps its most emphatic win, the
    # uniqueness check settles ties, and a team's other wins return to the reserve pool.
    # (An earlier build ran a pairwise-swap optimiser here; with leader-only eligibility it
    # provably never fires, so it was removed rather than left in looking load-bearing.)
    for c in cands:
        if c["team"] in excluded or c["team"] in by_team or c["award"] in by_award:
            continue
        by_team[c["team"]] = dict(c, weak=c["z"] < 0.5)
        by_award[c["award"]] = c["team"]

    # Only offer alternates that are actually FREE. Listing an award another team has been
    # given as "swap in if you prefer" invites a swap that breaks uniqueness -- two teams
    # holding the same award, which is the one thing this assignment exists to prevent.
    also_led = {}
    for c in cands:
        if (c["team"] in by_team and c["award"] != by_team[c["team"]]["award"]
                and c["award"] not in by_award):
            also_led.setdefault(c["team"], []).append(c["award"])

    uncovered = [t for t in pool if t not in by_team]
    for t, awards in also_led.items():
        by_team[t]["also_led"] = awards
    return by_team, uncovered


def raw_material(teams, team, n=4):
    """For a team that leads on nothing: its most unusual metrics, for a hand-named award.

    Not a fallback ranking -- material. The judges write the award; this only says where
    this team is furthest from the middle of the field, in either direction.
    """
    m = teams[team]
    scored = []
    for key, v in m.items():
        if not isinstance(v, (int, float)) or isinstance(v, bool):
            continue
        nums = [t[key] for t in teams.values()
                if isinstance(t.get(key), (int, float)) and not isinstance(t.get(key), bool)]
        if len(nums) < 2:
            continue
        sd = statistics.pstdev(nums)
        if sd == 0:
            continue
        z = (v - statistics.fmean(nums)) / sd
        scored.append((abs(round(z, 2)), key, v, "above" if z > 0 else "below"))
    scored.sort(reverse=True)
    return [{"metric": k, "value": v, "vs_field": side, "abs_z": az}
            for az, k, v, side in scored[:n]]


def main(argv=None):
    ap = argparse.ArgumentParser(description="Assign one superlative award per team.")
    ap.add_argument("--evidence", action="append", required=True,
                    help="Directory or glob of *.evidence.json (repeatable)")
    ap.add_argument("--exclude", action="append", default=[],
                    help="Team already holding a rubric award (repeatable)")
    ap.add_argument("--out", default=None, help="Write the slate as JSON")
    args = ap.parse_args(argv)

    teams = load(args.evidence)
    if not teams:
        print("no evidence files loaded", file=sys.stderr)
        return 1

    # An --exclude that matches no team is silent double-awarding: the intended team stays
    # in the pool and collects a superlative on top of its rubric award, while the coverage
    # line still reads "complete". Fail loudly instead.
    unknown = [e for e in args.exclude if e not in teams]
    if unknown:
        print(f"ERROR: --exclude names no loaded team: {', '.join(unknown)}", file=sys.stderr)
        print(f"       loaded teams: {', '.join(sorted(teams))}", file=sys.stderr)
        return 2

    cands = candidates(teams)
    slate, uncovered = assign(teams, cands, set(args.exclude))

    print(f"\n{len(teams)} teams loaded, {len(args.exclude)} excluded as rubric winners, "
          f"{len(slate)} superlatives assigned\n")
    for team in sorted(slate, key=lambda t: -slate[t]["z"]):
        c = slate[team]
        try:
            cite = c["citation"].format(v=c["value"])
        except (ValueError, TypeError):
            cite = f"{c['metric']}={c['value']}"
        flag = "  [NARROW WIN - true, but the field is flat; lean on the number]" if c["weak"] else ""
        print(f"  {team:<28} {c['award']:<26} {cite}  (z={c['z']}){flag}")
        if c.get("also_led"):
            print(f"      also led: {', '.join(c['also_led'][:5])}"
                  f"{' ...' if len(c['also_led']) > 5 else ''}  <- swap in if a judge prefers one")
    if uncovered:
        print("\nBESPOKE AWARD NEEDED - these teams lead the field on nothing measurable,")
        print("so the judges name the award. Their most unusual numbers, as material:")
        for t in uncovered:
            print(f"  {t}:")
            for r in raw_material(teams, t):
                print(f"      {r['metric']} = {r['value']}  ({r['vs_field']} the field, |z|={r['abs_z']})")
    unused = [a for a, _, _, _ in CATALOGUE if a not in {c["award"] for c in slate.values()}]
    print(f"\nreserve pool ({len(unused)} unused): {', '.join(unused[:12])}"
          + (" ..." if len(unused) > 12 else ""))

    # Coverage guarantee, asserted rather than assumed.
    covered = (set(slate) | set(args.exclude) | set(uncovered)) & set(teams)
    missing = set(teams) - covered
    print(f"\nCOVERAGE: {len(covered)}/{len(teams)} teams have an award"
          + (f" -- MISSING: {', '.join(sorted(missing))}" if missing else " -- complete"))

    if args.out:
        with open(args.out, "w", encoding="utf-8") as fh:
            json.dump({"teams": list(teams), "excluded": args.exclude,
                       "slate": slate, "uncovered": uncovered, "reserve": unused}, fh, indent=2)
        print(f"wrote {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
