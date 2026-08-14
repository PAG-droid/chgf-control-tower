// Render the team logo SVGs in public/team-logos/svg/ to PNGs.
//
//   node scripts/render-team-logos.mjs
//
// Writes a 512px PNG per logo into public/team-logos/png/, plus two review
// aids: contact-sheet.png for eyeballing the whole set as a family, and
// legibility-64px.png for checking each mark still reads at badge size.

import { readdir, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..', 'public', 'team-logos');
const svgDir = path.join(root, 'svg');
const pngDir = path.join(root, 'png');

const SIZE = 512;
const CELL = 220;
const COLS = 5;
const BADGE = 64;

await mkdir(pngDir, { recursive: true });

const files = (await readdir(svgDir)).filter((f) => f.endsWith('.svg')).sort();

const cells = [];
const badges = [];
for (const file of files) {
  const svg = await readFile(path.join(svgDir, file));
  const base = file.replace(/\.svg$/, '');

  await sharp(svg, { density: 300 })
    .resize(SIZE, SIZE)
    .png()
    .toFile(path.join(pngDir, `${base}.png`));

  cells.push(await sharp(svg, { density: 300 }).resize(CELL, CELL).png().toBuffer());
  badges.push(
    await sharp(svg, { density: 300 })
      .resize(BADGE, BADGE)
      .extend({ top: 8, bottom: 8, left: 8, right: 8, background: '#ffffff' })
      .png()
      .toBuffer(),
  );
  console.log(`rendered ${base}.png`);
}

const rows = Math.ceil(cells.length / COLS);
await sharp({
  create: {
    width: COLS * CELL,
    height: rows * CELL,
    channels: 4,
    background: '#ffffff',
  },
})
  .composite(
    cells.map((input, i) => ({
      input,
      left: (i % COLS) * CELL,
      top: Math.floor(i / COLS) * CELL,
    })),
  )
  .png()
  .toFile(path.join(root, 'contact-sheet.png'));

const pad = BADGE + 16;
await sharp({
  create: {
    width: badges.length * pad,
    height: pad,
    channels: 4,
    background: '#ffffff',
  },
})
  .composite(badges.map((input, i) => ({ input, left: i * pad, top: 0 })))
  .png()
  .toFile(path.join(root, 'legibility-64px.png'));

console.log(`\n${cells.length} logos rendered; review sheets written.`);
