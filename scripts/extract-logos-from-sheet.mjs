// Cut individual logos out of a contact-sheet style image.
//
//   node scripts/extract-logos-from-sheet.mjs <sheet.png> [outDir] [cellsPerRow]
//
//   node scripts/extract-logos-from-sheet.mjs ~/Downloads/logos.png \
//     public/team-logos/illustrated 3,3,4
//
// Rows are found from horizontal bands of pure background. Within a row,
// columns are split the same way — but marks drawn tangent to each other merge
// into one run, so passing the expected cells per row ("3,3,4") splits a merged
// run at its emptiest columns. Each split is then snapped to the true local
// minimum, and every cell is finally cropped to its own tight ink bounds, so a
// neighbour's border never bleeds in and a mark's own border never gets shaved.

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const sheetPath = process.argv[2];
const outDir =
  process.argv[3] ?? path.resolve(import.meta.dirname, '..', 'public', 'team-logos', 'illustrated');
const expected = process.argv[4]?.split(',').map(Number);

// Reading order of the sheet, left to right, top to bottom.
const NAMES = [
  'a-the-green-donuts',
  'c-journey',
  'd-git-blame',
  'e-404-bert-not-found',
  'm-vector-borne',
  'o-bleeding-edge',
  'p-team-rocket',
  'q-kb-queens',
  'r-the-leftovers',
  's-prereq-uisites',
];

const OUT = 640; // full-size crop, for print and stickers
const WEB = 160; // what the site actually loads; cards render at 56px max
const TOL = 18; // channel distance from background that counts as ink
const MIN_RUN = 60; // ignore specks
const PAD = 10; // breathing room inside the square
const SNAP = 28; // window for refining a split to its true local minimum

const img = sharp(sheetPath).removeAlpha();
const { width, height } = await img.metadata();
const { data } = await img.raw().toBuffer({ resolveWithObject: true });

console.log(`sheet ${width}x${height}`);

const at = (x, y) => {
  const i = (y * width + x) * 3;
  return [data[i], data[i + 1], data[i + 2]];
};
const bg = at(2, 2);
const isInk = (x, y) => {
  const p = at(x, y);
  return (
    Math.abs(p[0] - bg[0]) > TOL || Math.abs(p[1] - bg[1]) > TOL || Math.abs(p[2] - bg[2]) > TOL
  );
};

const runs = (counts, minCount) => {
  const out = [];
  let start = null;
  counts.forEach((c, i) => {
    if (c >= minCount) {
      if (start === null) start = i;
    } else if (start !== null) {
      if (i - start >= MIN_RUN) out.push([start, i - 1]);
      start = null;
    }
  });
  if (start !== null && counts.length - start >= MIN_RUN) out.push([start, counts.length - 1]);
  return out;
};

const rowCounts = Array.from({ length: height }, (_, y) => {
  let n = 0;
  for (let x = 0; x < width; x++) if (isInk(x, y)) n++;
  return n;
});
const bands = runs(rowCounts, 3);
console.log(`${bands.length} row bands: ${bands.map((b) => b.join('-')).join(', ')}`);

// Split a run into k parts at its emptiest columns, then nudge each split to
// the true local minimum nearby — a broad shallow dip otherwise puts the wall
// slightly inside one of the neighbours and shaves its border.
const splitRun = ([left, right], k, colCounts) => {
  const minSep = Math.floor((right - left + 1) / (k * 2));
  const chosen = [];
  for (let n = 0; n < k - 1; n++) {
    let best = -1;
    let bestCount = Infinity;
    for (let x = left + minSep; x <= right - minSep; x++) {
      if (chosen.some((c) => Math.abs(c - x) < minSep)) continue;
      if (colCounts[x] < bestCount) {
        bestCount = colCounts[x];
        best = x;
      }
    }
    if (best < 0) break;

    let snapped = best;
    for (let x = Math.max(left, best - SNAP); x <= Math.min(right, best + SNAP); x++) {
      if (colCounts[x] < colCounts[snapped]) snapped = x;
    }
    console.log(`  split at x=${snapped} (occupancy ${colCounts[snapped]}, from ${best})`);
    chosen.push(snapped);
  }
  chosen.sort((a, b) => a - b);
  const edges = [left, ...chosen, right];
  return edges.slice(0, -1).map((l, i) => [i === 0 ? l : l + 1, edges[i + 1]]);
};

const boxes = [];
bands.forEach(([bandTop, bandBottom], bandIndex) => {
  const colCounts = Array.from({ length: width }, (_, x) => {
    let n = 0;
    for (let y = bandTop; y <= bandBottom; y++) if (isInk(x, y)) n++;
    return n;
  });

  let cells = runs(colCounts, 1);
  const want = expected?.[bandIndex];
  if (want && cells.length < want) {
    const widest = cells.reduce((a, b) => (b[1] - b[0] > a[1] - a[0] ? b : a));
    const k = want - cells.length + 1;
    console.log(`band ${bandIndex + 1}: ${cells.length} run(s), want ${want} — splitting widest into ${k}`);
    cells = cells.flatMap((run) => (run === widest ? splitRun(run, k, colCounts) : [run]));
  }

  // Tight ink bounds within each cell's own column range.
  for (const [cl, cr] of cells) {
    let left = Infinity;
    let right = -1;
    let top = Infinity;
    let bottom = -1;
    for (let y = bandTop; y <= bandBottom; y++) {
      for (let x = cl; x <= cr; x++) {
        if (!isInk(x, y)) continue;
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
    if (right > 0) boxes.push({ left, top, right, bottom });
  }
});

console.log(`${boxes.length} cells found`);
if (boxes.length !== NAMES.length) {
  console.warn(`WARNING: ${boxes.length} cells but ${NAMES.length} names — check the mapping.`);
}

await mkdir(outDir, { recursive: true });
await mkdir(path.join(outDir, 'web'), { recursive: true });
const hex = `#${bg.map((c) => c.toString(16).padStart(2, '0')).join('')}`;

const tiles = [];
for (let i = 0; i < boxes.length; i++) {
  const { left, top, right, bottom } = boxes[i];
  const w = right - left + 1;
  const h = bottom - top + 1;
  const side = Math.max(w, h) + PAD * 2;
  const name = NAMES[i] ?? `cell-${i + 1}`;

  // Two passes on purpose: sharp applies extend *after* resize within a single
  // pipeline, which would squash the crop to OUT square and then pad it.
  const padded = await sharp(sheetPath)
    .removeAlpha()
    .extract({ left, top, width: w, height: h })
    .extend({
      top: Math.floor((side - h) / 2),
      bottom: Math.ceil((side - h) / 2),
      left: Math.floor((side - w) / 2),
      right: Math.ceil((side - w) / 2),
      background: hex,
    })
    .png()
    .toBuffer();

  const cell = await sharp(padded).resize(OUT, OUT).png().toBuffer();
  await writeFile(path.join(outDir, `${name}.png`), cell);

  // Quantised copy for the site — these are decorative thumbnails, and ten
  // full-size crops would be several megabytes of page weight.
  const web = await sharp(padded)
    .resize(WEB, WEB)
    .png({ palette: true, quality: 80, compressionLevel: 9 })
    .toBuffer();
  await writeFile(path.join(outDir, 'web', `${name}.png`), web);

  tiles.push(await sharp(cell).resize(220, 220).png().toBuffer());
  console.log(`${name}  ${w}x${h} at ${left},${top}  (web ${(web.length / 1024).toFixed(1)} kB)`);
}

const COLS = 5;
await sharp({
  create: {
    width: COLS * 220,
    height: Math.ceil(tiles.length / COLS) * 220,
    channels: 4,
    background: '#ffffff',
  },
})
  .composite(
    tiles.map((input, i) => ({ input, left: (i % COLS) * 220, top: Math.floor(i / COLS) * 220 })),
  )
  .png()
  .toFile(path.join(outDir, 'contact-sheet.png'));

console.log(`\nwrote ${boxes.length} logos to ${outDir}`);
