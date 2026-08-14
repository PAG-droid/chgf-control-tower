# Team logos

One emblem per named team. Briefs in [PROMPTS.md](PROMPTS.md); the design
system they all obey is at the bottom of this file.

| Team | Name | File | Accent |
|---|---|---|---|
| A | The Green Donuts | `a-the-green-donuts` | sea green |
| C | Journey | `c-journey` | vermilion |
| D | Git Blame (It's always HR) | `d-git-blame` | vermilion |
| E | 404: Bert Not Found | `e-404-bert-not-found` | vermilion |
| M | Vector Borne | `m-vector-borne` | sea green |
| O | Bleeding Edge | `o-bleeding-edge` | vermilion |
| P | Team Rocket | `p-team-rocket` | vermilion |
| Q | KB Queens | `q-kb-queens` | plum |
| R | The Leftovers | `r-the-leftovers` | ochre |
| S | Prereq-uisites | `s-prereq-uisites` | sea green + vermilion |

Teams F, G, H, I, J, K, L and N have `name: null` in
[`src/data/teams.json`](../../src/data/teams.json), so they have no logo yet.
Name them, add a brief to `PROMPTS.md`, draw an SVG into `svg/`, re-render.

## Two sets

There are two parallel sets in here. Pick one for the site rather than mixing
them — their background creams differ (`#F1EBE0` vs `#FCF9F0`).

- **`illustrated/`** — raster, cut out of an image-model sheet generated from
  the first-generation briefs. Warmer and more characterful, but PNG only, so
  it won't scale like the vectors, and four of the ten have clipped borders
  (see below).
- **everything else** — the hand-authored vector system described further down.

### illustrated/

Extracted from a 1254×1254 contact sheet with:

```bash
node scripts/extract-logos-from-sheet.mjs ~/Downloads/logos.png \
  public/team-logos/illustrated 3,3,4
```

The trailing `3,3,4` is the expected number of logos per row; the sheet's
bottom row holds four, and neighbouring marks there are drawn tangent, so the
script needs to be told how many to split a merged run into.

**A, C, D, E, M and O came out clean** — complete circular borders, 640×640.

**P, Q, R and S have clipped borders.** The generator squeezed four marks into
the width of three on the bottom row, so those ovals are squashed and their
rings run off the row edges *in the source image*. No crop recovers them. The
illustrations themselves are intact; only the decorative rings are cut. Fix by
regenerating those four as individual square images rather than as a sheet.

Other things to know: `BLAME` in the Git Blame mark has malformed letterforms,
and none of the ten has a monochrome or small-size variant.

## Layout

- `svg/` — source of truth. Hand-authored, 256×256 viewBox. Edit these only.
- `png/` — generated 512×512 colour rasters for decks, Teams, print.
- `mono/` — generated single-ink SVG + PNG per logo, for embroidery, laser
  cut, fax-quality print, or anywhere the accent can't survive.
- `contact-sheet.png` — the set as a family.
- `mono-sheet.png` — the same set in one ink.
- `legibility-64px.png` — every mark at badge size.

Everything outside `svg/` is generated. Don't hand-edit it.

## Re-rendering

```bash
node scripts/render-team-logos.mjs
```

Uses the `sharp` already in `node_modules`; no extra install.

## Using them on the site

The files ship in the public bundle, so they resolve at
`/team-logos/svg/<file>.svg` and `/team-logos/png/<file>.png` under both
deploy targets. Prefer the SVG on the web — crisp at any size, under 2 KB each.

## The system

Held constant across every mark. This is what makes ten drawings read as one
family rather than ten icons.

**Shared conceit.** Every mark is assembled from terminal and code primitives —
box-drawing rules, cursor blocks, prompt carets, bracket pairs, diff markers,
tree connectors. The set is unified by the *event*, not by each team name.

**Grid.** A 24px dot grid, ink at 16%, sits behind every mark and every
significant edge lands on it.

**Geometry.** 0°, 45° and 90° only, plus arcs of true circles. No freehand
bezier curves anywhere — that constraint is most of the difference between
this set and clip art.

**Stroke scale.** Three weights, nothing between: `14` primary, `9` secondary,
`5` detail.

**Palette.** Six colours total across all teams.

| Role | Hex |
|---|---|
| paper | `#F1EBE0` |
| ink | `#16232B` |
| vermilion | `#E4572E` |
| sea green | `#2F7D74` |
| ochre | `#D89B2C` |
| plum | `#6B4A7A` |

Each mark uses ink + paper + **one** accent. The only exception is where a
second accent encodes state rather than decoration — Prereq-uisites uses green
for resolved and vermilion for pending, and that distinction is the whole
point of the mark.

**Two tests every mark must pass.** Identifiable at 64px
(`legibility-64px.png`) and in a single ink (`mono-sheet.png`). Anything that
fails gets redrawn, not shipped. Meaning has to be carried by shape, so colour
is only ever reinforcement.

**Silhouettes must differ.** Check new marks against `legibility-64px.png` —
if two teams read the same at badge size, one of them is wrong. Vector Borne
switched from squares to circles for exactly this reason, having collided with
KB Queens.
