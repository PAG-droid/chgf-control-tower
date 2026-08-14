// Cut individual logos out of a contact-sheet style image.
//
//   node scripts/extract-logos-from-sheet.mjs <sheet.png> [outDir] [cellsPerRow]
//
// Segments by finding rows and columns that are entirely background, which
// copes with uneven grids. Where neighbouring marks touch and merge into one
// run, pass the expected cells per row (e.g. "3,3,4") and the merged run is
// split at its lowest-occupancy columns. Each cell is cropped, padded to square
// on the sheet's own background colour, and written at 640px.

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const sheetPath = process.argv[2];
const outDir = process.argv[3] ?? path.resolve(import.meta.dirname, '..', 'public', 'team-logos', 'illustrated');

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

const OUT = 640;
const TOL = 18; // channel distance from background that counts as ink
const MIN_RUN = 60; // ignore specks
const PAD = 8;
const BLEED = 12; // marks sitting tangent to each other get their borders shaved otherwise

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

// Contiguous runs of occupied indices, given a per-index occupancy count.
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

const expected = process.argv[4]?.split(',').map(Number);

// Split one run into k parts at the k-1 emptiest columns, keeping splits well
// clear of each other and of the run's edges.
const splitRun = ([left, right], k, colCounts) => {
  const span = right - left + 1;
  const minSep = Math.floor(span / (k * 2));
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
    chosen.push(best);
    console.log(`  split at x=${best} (occupancy ${bestCount})`);
  }
  chosen.sort((a, b) => a - b);
  const edges = [left, ...chosen, right];
  return edges.slice(0, -1).map((l, i) => [i === 0 ? l : l + 1, edges[i + 1]]);
};

const boxes = [];
bands.forEach(([top, bottom], bandIndex) => {
  const colCounts = Array.from({ length: width }, (_, x) => {
    let n = 0;
    for (let y = top; y <= bottom; y++) if (isInk(x, y)) n++;
    return n;
  });

  let cells = runs(colCounts, 3);
  const want = expected?.[bandIndex];
  if (want && cells.length < want) {
    // Grow the widest run until the band yields the expected number of cells.
    const widest = cells.reduce((a, b) => (b[1] - b[0] > a[1] - a[0] ? b : a));
    const k = want - cells.length + 1;
    console.log(`band ${bandIndex + 1}: ${cells.length} runs, want ${want} — splitting widest into ${k}`);
    cells = cells.flatMap((run) => (run === widest ? splitRun(run, k, colCounts) : [run]));
  }

  for (const [left, right] of cells) boxes.push({ left, top, right, bottom });
});
console.log(`${boxes.length} cells found`);

if (boxes.length !== NAMES.length) {
  console.warn(`WARNING: ${boxes.length} cells but ${NAMES.length} names — check the mapping.`);
}

await mkdir(outDir, { recursive: true });
const hex = `#${bg.map((c) => c.toString(16).padStart(2, '0')).join('')}`;

const tiles = [];
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

for (let i = 0; i < boxes.length; i++) {
  const left = clamp(boxes[i].left - BLEED, 0, width - 1);
  const top = clamp(boxes[i].top - BLEED, 0, height - 1);
  const right = clamp(boxes[i].right + BLEED, 0, width - 1);
  const bottom = clamp(boxes[i].bottom + BLEED, 0, height - 1);
  const w = right - left + 1;
  const h = bottom - top + 1;
  const side = Math.max(w, h) + PAD * 2;
  const name = NAMES[i] ?? `cell-${i + 1}`;

  const cell = await sharp(sheetPath)
    .removeAlpha()
    .extract({ left, top, width: w, height: h })
    .extend({
      top: Math.floor((side - h) / 2),
      bottom: Math.ceil((side - h) / 2),
      left: Math.floor((side - w) / 2),
      right: Math.ceil((side - w) / 2),
      background: hex,
    })
    .resize(OUT, OUT)
    .png()
    .toBuffer();

  await writeFile(path.join(outDir, `${name}.png`), cell);
  tiles.push(await sharp(cell).resize(220, 220).png().toBuffer());
  console.log(`${name}  ${w}x${h} at ${left},${top}`);
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
  .composite(tiles.map((input, i) => ({ input, left: (i % COLS) * 220, top: Math.floor(i / COLS) * 220 })))
  .png()
  .toFile(path.join(outDir, 'contact-sheet.png'));

console.log(`\nwrote ${boxes.length} logos to ${outDir}`);
