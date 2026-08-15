# Inbox — drop presenter material here

Anything a team sends you goes in this folder. You never have to sort it,
rename it, or convert it. Drop and tell Claude "process the inbox".

## What you can drop

| Thing | Example | Where it ends up |
|---|---|---|
| A deck | `Q-deck.pptx`, `kb-queens final.pdf` | converted to PDF in `public/decks/<letter>-<slug>/` |
| A repo link | a `.txt` or `.url` with the URL pasted in | `repo` in `src/data/demos.json` |
| A shared folder link | SharePoint / OneDrive / Teams link | `share` in `src/data/demos.json` |
| A demo video | an `.mp4`, or a Stream/SharePoint link in a `.txt` | `video` in `src/data/demos.json` |
| Photos from the day | `.jpg`, `.png`, `.webp` | `public/gallery/` + an entry in `gallery.json` |
| A pasted email or Teams message | `.txt`, `.msg`, `.eml` | read for names, titles, summaries, links |
| Notes on what a team built | anything readable | `title` and `summary` in `src/data/demos.json` |

## The one convention

**Prefix the filename with the team letter when you know it.**

```
Q-deck.pptx
M-repo.txt
O-video-link.txt
```

That is the only thing that makes this automatic. Without a prefix nothing
breaks — Claude reads the file, guesses from the contents, and asks you when
the guess is not safe.

Team letters are in `src/data/teams.json`. As of now: A Green Donuts,
C MCP Hammer, D Git Blame, E 404 Bert Not Found, K Ctrl+F Strategy,
M Vector Borne, O Bleeding Edge, P Team Rocket, Q KB Queens,
R The Leftovers, S Prereq-uisites. F, G, H, I, J, L and N are still unnamed —
if something arrives from one of those, that is also how we learn their name.

## What happens after

Once a file is absorbed into the site, the original moves to
`inbox/_processed/`. So the rule is:

- **Files in `inbox/`** — not yet on the site.
- **Files in `inbox/_processed/`** — on the site, safe to ignore.

Nothing in here is deleted, and nothing in here ships. `inbox/` is gitignored
apart from this README, so raw uploads stay off the public bundle.

## Deck conversion

Browsers cannot render PowerPoint, so the site only ever serves PDF. Any
`.pptx` or `.ppt` is converted with the PowerPoint installed on this machine:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\convert-decks.ps1
```

If a deck cannot be converted (password-protected, or PowerPoint is not
available), the team's `share` link is used instead so the deck is still one
click away from the demos board.
