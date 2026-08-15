#!/usr/bin/env node
// Verifies every link the site renders.
//
//   node scripts/check-links.mjs           # local assets + routes, no network
//   node scripts/check-links.mjs --external # also probe every external URL
//
// Exit code is 1 only for links we can PROVE are broken: a missing local file,
// a deck that is not a PDF, a nav route with no route to match, or an external
// URL that a credentialed request still could not reach. Links we merely cannot
// verify from here (SharePoint, anything needing a login) are reported and
// never fail the run, because calling them broken would be a guess.

import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const PUBLIC = join(ROOT, 'public')
const DATA = join(ROOT, 'src', 'data')

const CHECK_EXTERNAL = process.argv.includes('--external')
const TIMEOUT_MS = 15000

const problems = []   // proven broken -> exit 1
const unverified = [] // needs credentials we do not have here
const notices = []    // nothing is broken, but something is wasteful
const ok = []

const red = (s) => `\x1b[31m${s}\x1b[0m`
const green = (s) => `\x1b[32m${s}\x1b[0m`
const yellow = (s) => `\x1b[33m${s}\x1b[0m`
const dim = (s) => `\x1b[2m${s}\x1b[0m`

function readJson(name) {
  return JSON.parse(readFileSync(join(DATA, name), 'utf8'))
}

function readText(rel) {
  return readFileSync(join(ROOT, rel), 'utf8')
}

// ---------------------------------------------------------------- local files

/** A public/ asset referenced from data. Missing means a visibly broken page. */
function checkAsset(label, relPath, { mustBePdf = false } = {}) {
  const full = join(PUBLIC, relPath)
  if (!existsSync(full)) {
    problems.push(`${label}: public/${relPath} does not exist`)
    return
  }
  if (mustBePdf && !relPath.toLowerCase().endsWith('.pdf')) {
    // The deck viewer is an <iframe>. Browsers cannot render PowerPoint, so a
    // non-PDF here renders as a download prompt or a blank frame.
    problems.push(`${label}: public/${relPath} is not a PDF — the deck viewer can only render PDF`)
    return
  }
  if (statSync(full).size === 0) {
    problems.push(`${label}: public/${relPath} is empty (0 bytes)`)
    return
  }
  ok.push(`${label}: public/${relPath}`)
}

function checkLocalAssets() {
  const demos = readJson('demos.json')
  for (const slot of demos.order ?? []) {
    if (slot.deck) checkAsset(`demos[${slot.letter}].deck`, join('decks', slot.deck), { mustBePdf: true })
    // A video is either an external URL (checked in the external pass) or a
    // file we ship, in which case it has to actually be there.
    if (slot.video && !/^https?:\/\//.test(slot.video)) {
      checkAsset(`demos[${slot.letter}].video`, slot.video)
    }
  }

  // Every photo wall is the same shape: a JSON file listing filenames, and a
  // public/ directory holding them. Keep this list in step with the <PhotoWall>
  // routes — right now Gallery (dir="gallery") and Photos (dir="photos").
  for (const [json, dir] of [
    ['gallery.json', 'gallery'],
    ['photos.json', 'photos'],
  ]) {
    checkPhotoWall(json, dir)
  }

  const teams = readJson('teams.json')
  for (const team of teams.teams ?? []) {
    if (team.logo) checkAsset(`teams[${team.letter}].logo`, team.logo)
  }

  checkShippedFiles()
}

/**
 * Anything anywhere in resources.json carrying a `file` key is a document we
 * ship — session slides on /learning, and whatever gets added next. Walking for
 * the key rather than naming the sections means a new one is covered the day it
 * lands, instead of the day someone remembers to update this script.
 */
function checkShippedFiles() {
  const walk = (node, path) => {
    if (Array.isArray(node)) return node.forEach((v, i) => walk(v, `${path}[${i}]`))
    if (!node || typeof node !== 'object') return
    for (const [k, v] of Object.entries(node)) {
      if (k === 'file' && typeof v === 'string' && !/^https?:\/\//.test(v)) {
        checkAsset(`${path}.file`, v)
      } else {
        walk(v, `${path}.${k}`)
      }
    }
  }
  walk(readJson('resources.json'), 'resources')
}

/**
 * Checks a photo wall in both directions: every listed file exists (a missing
 * one renders as a broken image), and every file present is listed (an unlisted
 * one ships in the bundle and displays nowhere). The first is fatal, the second
 * is only waste.
 */
function checkPhotoWall(jsonName, dirName) {
  let data
  try {
    data = readJson(jsonName)
  } catch {
    // A wall can be added to the site before its data file exists. Not an error.
    return
  }

  const listed = new Set()
  for (const photo of data.photos ?? []) {
    if (!photo.file) continue
    listed.add(photo.file)
    checkAsset(`${dirName}[${photo.file}]`, join(dirName, photo.file))
  }

  const dir = join(PUBLIC, dirName)
  if (!existsSync(dir)) return
  for (const file of readdirSync(dir)) {
    if (!/\.(webp|png|jpe?g|gif|avif)$/i.test(file)) continue
    if (listed.has(file)) continue
    const kb = Math.round(statSync(join(dir, file)).size / 1024)
    notices.push(`public/${dirName}/${file} (${kb} KB) ships but no ${jsonName} entry shows it`)
  }
}

// -------------------------------------------------------------------- routes

/** Nav entries that point at a path App.tsx does not route land on NotFound. */
function checkRoutes() {
  const app = readText('src/App.tsx')
  const routes = new Set([...app.matchAll(/<Route\s+path="([^"]+)"/g)].map((m) => m[1]))
  const shell = readText('src/components/Shell.tsx')
  // Two shapes to catch: the NAV array (to: '/teams') and inline JSX (to="/").
  const targets = [
    ...[...shell.matchAll(/\bto:\s*'([^']+)'/g)].map((m) => m[1]),
    ...[...shell.matchAll(/\bto="(\/[^"]*)"/g)].map((m) => m[1]),
  ]
  if (targets.length === 0) problems.push('found no nav targets in Shell.tsx — the route check is not looking at the right thing')

  for (const target of new Set(targets)) {
    if (routes.has(target) || routes.has('*')) ok.push(`nav ${target} -> routed`)
    else problems.push(`nav points at ${target}, which App.tsx does not route`)
  }
}

// ------------------------------------------------------------------ external

function collectExternal() {
  const found = new Map() // url -> [labels]
  const add = (url, label) => {
    if (typeof url !== 'string' || !/^https?:\/\//.test(url)) return
    if (!found.has(url)) found.set(url, [])
    found.get(url).push(label)
  }

  const demos = readJson('demos.json')
  for (const slot of demos.order ?? []) {
    add(slot.repo, `demos[${slot.letter}].repo`)
    add(slot.share, `demos[${slot.letter}].share`)
    add(slot.video, `demos[${slot.letter}].video`)
  }

  // resources.json nests links at several depths; walk it rather than hardcode.
  const walk = (node, path) => {
    if (typeof node === 'string') return add(node, path)
    if (Array.isArray(node)) return node.forEach((v, i) => walk(v, `${path}[${i}]`))
    if (node && typeof node === 'object') {
      for (const [k, v] of Object.entries(node)) walk(v, `${path}.${k}`)
    }
  }
  walk(readJson('resources.json'), 'resources')

  return found
}

let ghAvailable = null
function hasGh() {
  if (ghAvailable !== null) return ghAvailable
  try {
    execFileSync('gh', ['auth', 'status'], { stdio: 'ignore' })
    ghAvailable = true
  } catch {
    ghAvailable = false
  }
  return ghAvailable
}

function ghApi(path) {
  const out = execFileSync('gh', ['api', path], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
  return JSON.parse(out)
}

/**
 * GitHub links need a token to answer honestly: every gatesfoundation repo is
 * `internal`, so an anonymous fetch 404s on repos that are perfectly fine. When
 * gh is installed we ask the API properly, including whether the branch and
 * sub-path in a /tree/ URL actually exist.
 */
function checkGithub(url, labels) {
  const m = url.match(/^https:\/\/github\.com\/([^/]+)\/([^/?#]+)(?:\/tree\/([^/?#]+)(?:\/(.*))?)?/)
  if (!m) return { state: 'unverified', detail: 'not a repo URL shape' }
  const [, owner, repoRaw, ref, subPath] = m
  const repo = repoRaw.replace(/\.git$/, '')

  if (!hasGh()) return { state: 'unverified', detail: 'gh CLI not available; internal repos 404 anonymously' }

  let meta
  try {
    meta = ghApi(`repos/${owner}/${repo}`)
  } catch {
    return { state: 'broken', detail: `repo ${owner}/${repo} not found or not visible to your gh account` }
  }

  if (ref) {
    try {
      ghApi(`repos/${owner}/${repo}/branches/${encodeURIComponent(ref)}`)
    } catch {
      return { state: 'broken', detail: `branch "${ref}" does not exist in ${owner}/${repo}` }
    }
  }

  if (subPath) {
    try {
      ghApi(`repos/${owner}/${repo}/contents/${subPath}?ref=${encodeURIComponent(ref)}`)
    } catch {
      return { state: 'broken', detail: `path "${subPath}" not found on ${ref}` }
    }
  }

  // Internal/private repos resolve for org members and 404 for everyone else.
  const note = meta.visibility === 'public' ? 'public' : `${meta.visibility} — org members only`
  return { state: 'ok', detail: note }
}

async function checkPlain(url) {
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { 'User-Agent': 'chgf-control-tower-linkcheck' },
    })
    if (res.ok) return { state: 'ok', detail: `HTTP ${res.status}` }
    // A login wall is not a broken link.
    if ([401, 403].includes(res.status)) {
      return { state: 'unverified', detail: `HTTP ${res.status} — needs a signed-in session` }
    }
    return { state: 'broken', detail: `HTTP ${res.status}` }
  } catch (err) {
    return { state: 'unverified', detail: `could not connect: ${err?.message || err}` }
  }
}

async function checkExternal() {
  const found = collectExternal()
  console.log(dim(`  probing ${found.size} external URLs...\n`))

  for (const [url, labels] of found) {
    const where = labels.join(', ')
    let result
    if (url.startsWith('https://github.com/')) {
      result = checkGithub(url, labels)
    } else if (/sharepoint\.com|bmgf-my/.test(url)) {
      // SharePoint always redirects an unauthenticated agent to a login page and
      // answers 200 for links that are dead for the user. Never guess.
      result = { state: 'unverified', detail: 'SharePoint — only a signed-in browser can confirm this' }
    } else {
      result = await checkPlain(url)
    }

    const line = `${where}\n    ${url}\n    ${result.detail}`
    if (result.state === 'broken') problems.push(line)
    else if (result.state === 'unverified') unverified.push(line)
    else ok.push(`${where} — ${result.detail}`)
  }
}

// ---------------------------------------------------------------------- main

console.log('\nChecking local assets and routes...\n')
checkLocalAssets()
checkRoutes()

if (CHECK_EXTERNAL) {
  console.log('Checking external links...\n')
  await checkExternal()
} else {
  console.log(dim('  (skipping external links — pass --external to probe them)\n'))
}

console.log(green(`  ${ok.length} link(s) verified`))
for (const item of ok) console.log(dim(`    ✓ ${item}`))

if (unverified.length) {
  console.log(`\n${yellow(`  ${unverified.length} link(s) could not be verified from here`)}`)
  console.log(dim('  These need a signed-in browser. Not counted as failures.\n'))
  for (const item of unverified) console.log(yellow(`    ? ${item}\n`))
}

if (notices.length) {
  console.log(`\n${yellow(`  ${notices.length} unused asset(s)`)}`)
  console.log(dim('  Nothing is broken; these just ship for no reason.\n'))
  for (const item of notices) console.log(yellow(`    · ${item}`))
  console.log('')
}

if (problems.length) {
  console.log(`\n${red(`  ${problems.length} BROKEN link(s)`)}\n`)
  for (const item of problems) console.log(red(`    ✗ ${item}\n`))
  process.exitCode = 1
} else {
  console.log(`\n${green('  No broken links.')}\n`)
}
