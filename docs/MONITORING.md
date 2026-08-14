# GitHub submission monitoring

The `/monitor` page ("Submissions" in the nav) shows live activity in the
hackathon submission repo: which teams have pushed, when they last committed,
how many commits, who contributed, and whether they added the required README.

## How it works, and why it works that way

```
every 5 min ──▶ github-status.yml ──▶ scripts/fetch-github-status.mjs
                                              │
                                              ▼
                              public/github-status.json (committed)
                                              │
                    browser polls raw.githubusercontent.com every 60s
                                              │
                                              ▼
                                        /monitor page
```

**No GitHub token ever reaches the browser.** The Action holds the credential
and publishes a plain JSON file; the page only ever reads that file. A
client-side fetch would have meant shipping a token in a public bundle, which
is why the work happens in the Action instead.

**The page reads from `raw.githubusercontent.com`, not from the deployed
site.** That means new status appears within 60 seconds without redeploying.
`deploy-pages.yml` therefore ignores pushes that only touch
`public/github-status.json` — otherwise the poller would trigger 12 full site
deploys an hour for data the site does not need rebuilt.

## Pointing it at a different repo

Default target is `gatesfoundation/gf-claude-hackathon-2026`. To change it,
edit `TARGET_REPO` in `.github/workflows/github-status.yml`.

## If the target repo is private

The default `GITHUB_TOKEN` is scoped to *this* repo and cannot read another
organisation's private repo. Add a personal access token with `repo` scope:

**Repo → Settings → Secrets and variables → Actions → New repository secret**

| Field | Value |
|---|---|
| Name | `GH_MONITOR_TOKEN` |
| Secret | a PAT with read access to the target repo |

The script prefers `GH_MONITOR_TOKEN` and falls back to `GITHUB_TOKEN`.

## Expected states

| What you see | What it means |
|---|---|
| "Not watching a repo yet" | The target repo does not exist, or the token cannot read it. **This is the normal state until submissions open.** |
| "No submissions yet" | Repo is readable and empty. Correct before ~1:00 PM. |
| Submission cards | Teams are pushing. |

A monitoring failure never fails the workflow and never breaks the site — the
script always writes valid JSON and exits 0.

## Running it by hand

```bash
gh workflow run github-status.yml     # force a refresh now
gh run watch
```

Locally, without a token, it will write the not-found state:

```bash
node scripts/fetch-github-status.mjs
```

## Turning it off

If the polling becomes noise during judging:

```bash
gh workflow disable github-status.yml
```
