// Render the team logo SVGs in public/team-logos/svg/ to PNGs.
//
//   node scripts/render-team-logos.mjs
//
// Outputs, all derived from svg/ so that stays the single source of truth:
//   png/       512px colour raster per logo
//   mono/      single-ink SVG + 512px PNG per logo, accents collapsed to ink
//   contact-sheet.png     the set as a family
//   mono-sheet.png        the same set in one ink
//   legibility-64px.png   every mark at badge size

import { readdir, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..', 'public', 'team-logos');
const svgDir = path.join(root, 'svg');
const pngDir = path.join(root, 'png');
const monoDir = path.join(root, 'mono');

const SIZE = 512;
const CELL = 220;
const COLS = 5;
const BADGE = 64;

const INK = '#16232B';
// The accents carry team identity in colour and state in shape, so collapsing
// them to ink is lossless as long as each mark also encodes its meaning
// geometrically. legibility-64px.png and mono-sheet.png are how we check that.
const ACCENTS = ['#E4572E', '#2F7D74', '#D89B2C', '#6B4A7A'];

const toMono = (svg) =>
  ACCENTS.reduce((acc, hex) => acc.replaceAll(hex, INK), svg.toString());

await mkdir(pngDir, { recursive: true });
await mkdir(monoDir, { recursive: true });

const files = (await readdir(svgDir)).filter((f) => f.endsWith('.svg')).sort();

const cells = [];
const monoCells = [];
const badges = [];

for (const file of files) {
  const svg = await readFile(path.join(svgDir, file));
  const mono = Buffer.from(toMono(svg));
  const base = file.replace(/\.svg$/, '');

  await sharp(svg, { density: 300 }).resize(SIZE, SIZE).png().toFile(path.join(pngDir, `${base}.png`));

  await writeFile(path.join(monoDir, file), mono);
  await sharp(mono, { density: 300 })
    .resize(SIZE, SIZE)
    .png()
    .toFile(path.join(monoDir, `${base}.png`));

  cells.push(await sharp(svg, { density: 300 }).resize(CELL, CELL).png().toBuffer());
  monoCells.push(await sharp(mono, { density: 300 }).resize(CELL, CELL).png().toBuffer());
  badges.push(
    await sharp(svg, { density: 300 })
      .resize(BADGE, BADGE)
      .extend({ top: 8, bottom: 8, left: 8, right: 8, background: '#ffffff' })
      .png()
      .toBuffer(),
  );

  console.log(`rendered ${base}`);
}

const sheet = async (tiles, out) => {
  const rows = Math.ceil(tiles.length / COLS);
  await sharp({
    create: { width: COLS * CELL, height: rows * CELL, channels: 4, background: '#ffffff' },
  })
    .composite(
      tiles.map((input, i) => ({
        input,
        left: (i % COLS) * CELL,
        top: Math.floor(i / COLS) * CELL,
      })),
    )
    .png()
    .toFile(path.join(root, out));
};

await sheet(cells, 'contact-sheet.png');
await sheet(monoCells, 'mono-sheet.png');

const pad = BADGE + 16;
await sharp({
  create: { width: badges.length * pad, height: pad, channels: 4, background: '#ffffff' },
})
  .composite(badges.map((input, i) => ({ input, left: i * pad, top: 0 })))
  .png()
  .toFile(path.join(root, 'legibility-64px.png'));

console.log(`\n${files.length} logos rendered; mono set and review sheets written.`);
