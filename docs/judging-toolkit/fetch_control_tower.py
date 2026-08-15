#!/usr/bin/env python
"""Pull the hackathon roster + submissions from the Control Tower, and report what's NEW.

Source of record (public raw JSON behind the client-side SPA):
  https://pag-droid.github.io/chgf-control-tower/#/teams

Submissions land late and out of order, so the useful output is not the roster itself but
the DELTA since the last poll: which team just attached a deck, a repo, or a video. Run it
with --watch during the event and it prints one line per change.

Optionally also lists submission folders in the shared monorepo via `gh` (private repo, so
this needs an authenticated gh CLI; skipped silently if unavailable).

Usage:
  python fetch_control_tower.py --out roster.json
  python fetch_control_tower.py --out roster.json --watch --interval 120
  python fetch_control_tower.py --out roster.json --monorepo gatesfoundation/gf-claude-hackathon-2026
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime

BASE = "https://raw.githubusercontent.com/pag-droid/chgf-control-tower/main/src/data"
FILES = ("teams", "demos", "judging")
FIELDS = ("deck", "repo", "video", "presenters")


def fetch(name):
    url = f"{BASE}/{name}.json"
    req = urllib.request.Request(url, headers={"User-Agent": "hackathon-judge/1.0",
                                               "Cache-Control": "no-cache"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def monorepo_dirs(slug):
    """Submission folders in the shared monorepo, via gh. Returns None if unavailable."""
    if not slug:
        return None
    try:
        p = subprocess.run(["gh", "api", f"repos/{slug}/contents",
                            "--jq", '.[] | select(.type=="dir") | .name'],
                           capture_output=True, text=True, timeout=60, shell=False)
    except (OSError, subprocess.TimeoutExpired):
        return None
    if p.returncode != 0:
        return None
    return sorted(d for d in p.stdout.split() if d)


def build(monorepo=None):
    teams = fetch("teams")
    demos = fetch("demos")
    judging = fetch("judging")

    order = {o["letter"]: o for o in demos.get("order", []) if o.get("letter")}
    roster = {}
    for t in teams.get("teams", []):
        L = t.get("letter")
        if not L:
            continue
        sub = order.get(L) or {}
        have = [f for f in FIELDS if sub.get(f)]
        roster[L] = {
            "letter": L,
            "name": t.get("name"),
            "member_count": t.get("member_count") or t.get("memberCount"),
            "members": [m.get("name") for m in (t.get("members") or []) if m.get("name")],
            "mode": t.get("mode"),
            "room": t.get("room"),
            "deck": sub.get("deck"),
            "repo": sub.get("repo"),
            "video": sub.get("video"),
            "presenters": sub.get("presenters"),
            "note": sub.get("note"),
            "share": sub.get("share"),
            "submitted": have,
            "has_any_submission": bool(have),
        }

    snap = {
        "fetched_at": datetime.now().astimezone().isoformat(timespec="seconds"),
        "team_count": len(roster),
        "seconds_per_demo": demos.get("secondsPerDemo"),
        "running_order": [o.get("letter") for o in demos.get("order", [])],
        "scale": (judging.get("scoring") or {}).get("scale"),
        "timeline": judging.get("timeline"),
        "judges": [j.get("name") for j in (judging.get("judges") or [])],
        "award_categories": [{"name": c.get("name"), "tagline": c.get("tagline")}
                             for c in (judging.get("categories") or [])],
        "roster": roster,
    }
    dirs = monorepo_dirs(monorepo)
    if dirs is not None:
        snap["monorepo"] = {"slug": monorepo, "submission_dirs": dirs}
    return snap


def diff(old, new):
    """Human-readable changes between two snapshots."""
    if not old:
        return []
    out = []
    o_ros, n_ros = old.get("roster", {}), new.get("roster", {})
    for L, team in sorted(n_ros.items()):
        prev = o_ros.get(L)
        if prev is None:
            out.append(f"NEW TEAM   {L}  {team['name']}")
            continue
        for f in FIELDS:
            before, after = prev.get(f), team.get(f)
            if before != after:
                if after and not before:
                    out.append(f"SUBMITTED  {L}  {team['name']}: {f} -> {after}")
                elif before and not after:
                    out.append(f"REMOVED    {L}  {team['name']}: {f} (was {before})")
                else:
                    out.append(f"CHANGED    {L}  {team['name']}: {f} -> {after}")
        if prev.get("note") != team.get("note") and team.get("note"):
            out.append(f"NOTE       {L}  {team['name']}: {team['note']}")
    gone = set(o_ros) - set(n_ros)
    for L in sorted(gone):
        out.append(f"DROPPED    {L}  {o_ros[L].get('name')}")
    o_dirs = set((old.get("monorepo") or {}).get("submission_dirs") or [])
    n_dirs = set((new.get("monorepo") or {}).get("submission_dirs") or [])
    for d in sorted(n_dirs - o_dirs):
        out.append(f"NEW FOLDER {d}  (monorepo)")
    return out


def report(snap, changes, first):
    ts = snap["fetched_at"][11:19]
    ros = snap["roster"]
    with_sub = [t for t in ros.values() if t["has_any_submission"]]
    decks = [t for t in ros.values() if t["deck"]]
    repos = [t for t in ros.values() if t["repo"]]
    print(f"[{ts}] {len(with_sub)}/{len(ros)} teams have submitted "
          f"({len(decks)} decks, {len(repos)} repos)", flush=True)
    if first:
        print(f"        scale: {snap.get('scale')}", flush=True)
        print(f"        timeline: {snap.get('timeline')}", flush=True)
        mono = snap.get("monorepo")
        if mono:
            dirs = mono["submission_dirs"]
            print(f"        monorepo {mono['slug']}: {len(dirs)} folders "
                  f"({', '.join(dirs) if dirs else 'none yet'})", flush=True)
        else:
            print("        monorepo: not listed (no --monorepo, or gh unavailable)", flush=True)
        for L, t in sorted(ros.items()):
            print(f"  {L}  {(t['name'] or '?')[:28]:<29} "
                  f"{','.join(t['submitted']) or 'nothing yet'}", flush=True)
    for c in changes:
        print(f"  >> {c}", flush=True)
    missing = [L for L, t in sorted(ros.items()) if not t["has_any_submission"]]
    if missing and (first or changes):
        print(f"        still outstanding: {', '.join(missing)}", flush=True)


def main(argv=None):
    ap = argparse.ArgumentParser(description="Fetch the hackathon roster + submissions.")
    ap.add_argument("--out", required=True, help="Snapshot JSON path (also the diff baseline)")
    ap.add_argument("--monorepo", default=None,
                    help="org/repo of the shared submission monorepo (needs authenticated gh)")
    ap.add_argument("--watch", action="store_true", help="Poll until interrupted")
    ap.add_argument("--interval", type=int, default=120, help="Seconds between polls")
    ap.add_argument("--log", default=None, help="Append change lines to this file too")
    args = ap.parse_args(argv)

    prev = None
    if os.path.isfile(args.out):
        try:
            with open(args.out, "r", encoding="utf-8") as fh:
                prev = json.load(fh)
        except (OSError, ValueError):
            prev = None

    first = True
    while True:
        try:
            snap = build(args.monorepo)
        except (urllib.error.URLError, urllib.error.HTTPError, ValueError, TimeoutError) as exc:
            print(f"[{datetime.now():%H:%M:%S}] fetch failed: {exc}", flush=True)
            if not args.watch:
                return 1
            time.sleep(args.interval)
            continue

        changes = diff(prev, snap)
        report(snap, changes, first)
        with open(args.out, "w", encoding="utf-8") as fh:
            json.dump(snap, fh, indent=2, ensure_ascii=False)
        if changes and args.log:
            with open(args.log, "a", encoding="utf-8") as fh:
                for c in changes:
                    fh.write(f"{snap['fetched_at']}  {c}\n")

        prev, first = snap, False
        if not args.watch:
            return 0
        time.sleep(args.interval)


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\nstopped", flush=True)
        sys.exit(0)
