# Team logos

One emblem per named team, drawn from the briefs in [PROMPTS.md](PROMPTS.md).

| Team | Name | File |
|---|---|---|
| A | The Green Donuts | `a-the-green-donuts` |
| C | Journey | `c-journey` |
| D | Git Blame (It's always HR) | `d-git-blame` |
| E | 404: Bert Not Found | `e-404-bert-not-found` |
| M | Vector Borne | `m-vector-borne` |
| O | Bleeding Edge | `o-bleeding-edge` |
| P | Team Rocket | `p-team-rocket` |
| Q | KB Queens | `q-kb-queens` |
| R | The Leftovers | `r-the-leftovers` |
| S | Prereq-uisites | `s-prereq-uisites` |

Teams F, G, H, I, J, K and L and N have `name: null` in
[`src/data/teams.json`](../../src/data/teams.json), so they have no logo yet.
Name them, add a brief to `PROMPTS.md`, drop an SVG in `svg/`, re-render.

## Layout

- `svg/` — source of truth. Hand-authored flat vector, 256×256 viewBox,
  off-white `#FAF7F0` ground. Edit these.
- `png/` — generated 512×512 rasters for slide decks, Teams, print.
- `contact-sheet.png` — generated grid of all ten, for checking the set reads
  as one family.
- `legibility-64px.png` — generated strip at badge size. If a mark stops being
  identifiable here, it's too fussy.

## Re-rendering

```bash
node scripts/render-team-logos.mjs
```

Rewrites everything in `png/` and both review sheets from `svg/`. Uses the
`sharp` already in `node_modules`; no extra install.

## Using them on the site

The files ship in the public bundle, so they resolve at
`/team-logos/png/<file>.png` (and `/team-logos/svg/<file>.svg`) under both
deploy targets. Prefer the SVG on the web — it stays crisp at any size and
each file is under 2 KB.

## House style

Held constant across the set so the grid reads as one system:

- 256×256 square, single centered emblem, `#FAF7F0` ground
- flat fills only — no gradients, no shadows
- thick uniform stroke weight, 2–3 colours plus one accent per mark
- legible at 64px; every mark checked at that size
- text appears in only three marks (`BLAME`, `404`, `kb`, `EAT ME`) and always
  in a monospace face
