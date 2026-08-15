#!/usr/bin/env node
// What each team has handed over, and what is still missing.
//
//   node scripts/check-intake.mjs
//
// A "complete" team has a deck, somewhere to see the work (repo or shared
// folder), named presenters, a title and a summary. Video is tracked but never
// counted against a team, because no team submitted one.
//
// This never fails the build. It is a chase list, not a gate.

import { readFileSync } from 'node:fs'
import { dirname, resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA = resolve(__dirname, '..', 'src', 'data')

const demos = JSON.parse(readFileSync(join(DATA, 'demos.json'), 'utf8'))
const teams = JSON.parse(readFileSync(join(DATA, 'teams.json'), 'utf8'))

const bold = (s) => `\x1b[1m${s}\x1b[0m`
const green = (s) => `\x1b[32m${s}\x1b[0m`
const yellow = (s) => `\x1b[33m${s}\x1b[0m`
const red = (s) => `\x1b[31m${s}\x1b[0m`
const dim = (s) => `\x1b[2m${s}\x1b[0m`

/** Required for a team to count as complete. Video is deliberately excluded. */
const REQUIRED = ['deck', 'work', 'presenters', 'title', 'summary']

function teamName(letter) {
  const match = (teams.teams ?? []).find((t) => t.letter === letter)
  return match?.name ?? null
}

function teamMembers(letter) {
  const match = (teams.teams ?? []).find((t) => t.letter === letter)
  return (match?.members ?? []).map((m) => m.name)
}

const rows = (demos.order ?? []).map((slot) => {
  const name = teamName(slot.letter)
  const have = {
    deck: Boolean(slot.deck),
    // Either a repo or a shared folder counts: some teams shipped code, some
    // shipped a SharePoint folder, and both let a reviewer see the work.
    work: Boolean(slot.repo || slot.share),
    presenters: Boolean(slot.presenters || teamMembers(slot.letter).length),
    title: Boolean(slot.title),
    summary: Boolean(slot.summary),
    video: Boolean(slot.video),
  }
  const missing = REQUIRED.filter((k) => !have[k])
  return { letter: slot.letter, name, have, missing, named: Boolean(name), score: REQUIRED.length - missing.length }
})

// Closest to done first, so the short chases are obvious and the empty rows
// collect at the bottom where they read as one block of work.
rows.sort((a, b) => b.score - a.score || String(a.letter).localeCompare(String(b.letter)))

const mark = (v) => (v ? green('yes') : red(' - '))
const pad = (s, n) => String(s ?? '').padEnd(n)

console.log(`\n${bold('Presenter material — what we have')}\n`)
console.log(dim(`  ${pad('', 3)}${pad('team', 30)}${pad('deck', 7)}${pad('work', 7)}${pad('who', 7)}${pad('title', 7)}${pad('summary', 9)}video`))
console.log(dim('  ' + '-'.repeat(76)))

for (const r of rows) {
  const label = r.name ?? dim('(unnamed)')
  const namePad = r.name ? pad(label, 30) : label + ' '.repeat(Math.max(0, 30 - 10))
  console.log(
    `  ${pad(r.letter, 3)}${namePad}` +
      `${pad(mark(r.have.deck), 16)}${pad(mark(r.have.work), 16)}${pad(mark(r.have.presenters), 16)}` +
      `${pad(mark(r.have.title), 16)}${pad(mark(r.have.summary), 18)}${r.have.video ? green('yes') : dim(' - ')}`
  )
}

const complete = rows.filter((r) => r.missing.length === 0)
const partial = rows.filter((r) => r.missing.length > 0 && r.score > 1)
const empty = rows.filter((r) => r.score <= 1)

console.log(`\n${bold('Summary')}`)
console.log(`  ${green(`${complete.length} complete`)} · ${yellow(`${partial.length} partial`)} · ${red(`${empty.length} nothing yet`)} · ${rows.length} slots\n`)

if (partial.length) {
  console.log(bold('  Closest to done — chase these first:'))
  for (const r of partial) {
    console.log(`    ${r.letter} ${r.name ?? '(unnamed)'} — needs ${yellow(r.missing.join(', '))}`)
  }
  console.log('')
}

if (empty.length) {
  console.log(bold('  Nothing received:'))
  for (const r of empty) {
    const who = teamMembers(r.letter)
    const contact = who.length ? dim(` — ask ${who.join(', ')}`) : dim(' — no roster either')
    console.log(`    ${r.letter} ${r.name ?? '(unnamed)'}${contact}`)
  }
  console.log('')
}

const unnamed = rows.filter((r) => !r.named)
if (unnamed.length) {
  console.log(`  ${yellow(`${unnamed.length} team(s) still have no name in teams.json:`)} ${unnamed.map((r) => r.letter).join(', ')}\n`)
}
