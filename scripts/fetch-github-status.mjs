#!/usr/bin/env node
// Polls the hackathon submission repo and writes public/github-status.json.
//
// This runs in GitHub Actions ONLY (see .github/workflows/github-status.yml).
// The token never reaches the browser: the site reads the committed JSON, which
// contains nothing but public metadata.
//
// Contract: this script ALWAYS writes a valid status file and ALWAYS exits 0.
// A monitoring hiccup must never fail the workflow or take the live site down.

import { writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_PATH = resolve(__dirname, '..', 'public', 'github-status.json')

const TARGET_REPO = process.env.TARGET_REPO || 'gatesfoundation/gf-claude-hackathon-2026'
const TOKEN = process.env.GH_MONITOR_TOKEN || process.env.GITHUB_TOKEN || ''

const API = 'https://api.github.com'
const REQUEST_TIMEOUT_MS = 15000
const MAX_RECENT_COMMITS = 20
const MAX_FOLDERS = 60 // guard rail: never fan out to hundreds of requests
const FOLDER_CONCURRENCY = 5
// Directories that are plumbing, not team submissions.
const SKIP_DIRS = new Set(['node_modules', 'docs', '.github'])

/** Thrown for any non-OK HTTP response so callers can branch on status. */
class HttpError extends Error {
  constructor(status, url, body) {
    super(`GitHub API ${status} for ${url}`)
    this.status = status
    this.url = url
    this.body = body
  }
}

function headers() {
  const h = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'chgf-control-tower-monitor',
  }
  if (TOKEN) h.Authorization = `Bearer ${TOKEN}`
  return h
}

async function api(path) {
  const url = path.startsWith('http') ? path : `${API}${path}`
  const res = await fetch(url, {
    headers: headers(),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  if (!res.ok) {
    let body = ''
    try {
      body = (await res.text()).slice(0, 300)
    } catch {
      /* body is best-effort only */
    }
    throw new HttpError(res.status, url, body)
  }
  return res.json()
}

/** Runs `worker` over `items` with a bounded number of in-flight requests. */
async function mapPool(items, limit, worker) {
  const results = new Array(items.length)
  let cursor = 0
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++
      results[i] = await worker(items[i], i)
    }
  })
  await Promise.all(runners)
  return results
}

function firstLine(message) {
  return String(message || '').split('\n')[0].trim().slice(0, 200)
}

/** GitHub commits carry both an account (may be null) and raw git author data. */
function authorLogin(commit) {
  return commit?.author?.login || commit?.commit?.author?.name || 'unknown'
}

function commitTime(commit) {
  return commit?.commit?.author?.date || commit?.commit?.committer?.date || null
}

function emptyPayload(status, message) {
  return {
    generatedAt: new Date().toISOString(),
    repo: TARGET_REPO,
    repoUrl: `https://github.com/${TARGET_REPO}`,
    status,
    message,
    totals: { submissions: 0, commits: 0, contributors: 0 },
    submissions: [],
    recentCommits: [],
  }
}

async function write(payload) {
  await mkdir(dirname(OUT_PATH), { recursive: true })
  // Serialise first: if this ever threw we would rather crash before truncating
  // the existing (valid) file than leave malformed JSON behind.
  const json = JSON.stringify(payload, null, 2) + '\n'
  await writeFile(OUT_PATH, json, 'utf8')
}

async function collect() {
  // 1. Repo metadata — the access check, and the source of the default branch.
  const repo = await api(`/repos/${TARGET_REPO}`)
  const branch = repo.default_branch || 'main'
  const repoUrl = repo.html_url || `https://github.com/${TARGET_REPO}`

  // 2. Top-level directories = one submission folder per team.
  let contents = []
  try {
    contents = await api(`/repos/${TARGET_REPO}/contents`)
  } catch (err) {
    if (err instanceof HttpError && err.status === 404) contents = [] // empty repo
    else throw err
  }
  const folders = (Array.isArray(contents) ? contents : [])
    .filter((e) => e && e.type === 'dir')
    .map((e) => e.name)
    .filter((name) => !name.startsWith('.') && !SKIP_DIRS.has(name.toLowerCase()))
    .sort()
    .slice(0, MAX_FOLDERS)

  // 3. One recursive tree call tells us which folders have a README, instead of
  //    one contents call per folder.
  const readmeFolders = new Set()
  try {
    const tree = await api(`/repos/${TARGET_REPO}/git/trees/${encodeURIComponent(branch)}?recursive=1`)
    for (const node of tree.tree || []) {
      if (node.type !== 'blob') continue
      const parts = String(node.path).split('/')
      if (parts.length === 2 && /^readme(\.|$)/i.test(parts[1])) readmeFolders.add(parts[0])
    }
  } catch {
    // Tree unavailable (empty repo, huge repo, transient) — hasReadme degrades
    // to false rather than costing one extra request per folder.
  }

  // 4. Recent repo-wide commits (single page, up to 100).
  let allCommits = []
  try {
    allCommits = await api(`/repos/${TARGET_REPO}/commits?per_page=100`)
    if (!Array.isArray(allCommits)) allCommits = []
  } catch (err) {
    // 409 = empty repository; anything else is a real problem.
    if (!(err instanceof HttpError && err.status === 409)) throw err
  }

  // 5. Per-folder commit history: bounded at MAX_FOLDERS requests.
  const perFolder = await mapPool(folders, FOLDER_CONCURRENCY, async (folder) => {
    try {
      const commits = await api(
        `/repos/${TARGET_REPO}/commits?path=${encodeURIComponent(folder)}&per_page=100`
      )
      return Array.isArray(commits) ? commits : []
    } catch {
      return [] // one bad folder must not sink the whole report
    }
  })

  const seenShas = new Set()
  const allContributors = new Set()
  for (const c of allCommits) {
    if (c?.sha) seenShas.add(c.sha)
    allContributors.add(authorLogin(c))
  }

  const submissions = folders.map((folder, i) => {
    const commits = perFolder[i]
    const contributors = new Set()
    let lastCommitAt = null
    for (const c of commits) {
      if (c?.sha) seenShas.add(c.sha)
      const login = authorLogin(c)
      contributors.add(login)
      allContributors.add(login)
      const at = commitTime(c)
      if (at && (!lastCommitAt || at > lastCommitAt)) lastCommitAt = at
    }
    return {
      folder,
      url: `${repoUrl}/tree/${branch}/${encodeURIComponent(folder)}`,
      lastCommitAt,
      commitCount: commits.length,
      contributors: [...contributors].sort(),
      hasReadme: readmeFolders.has(folder),
    }
  })

  // Most recently active team first; folders with no commits sink to the bottom.
  submissions.sort((a, b) => {
    if (a.lastCommitAt === b.lastCommitAt) return a.folder.localeCompare(b.folder)
    if (!a.lastCommitAt) return 1
    if (!b.lastCommitAt) return -1
    return a.lastCommitAt < b.lastCommitAt ? 1 : -1
  })

  const recentCommits = allCommits.slice(0, MAX_RECENT_COMMITS).map((c) => ({
    sha: String(c.sha || '').slice(0, 7),
    message: firstLine(c?.commit?.message),
    author: authorLogin(c),
    at: commitTime(c),
    url: c.html_url || `${repoUrl}/commit/${c.sha}`,
  }))

  return {
    generatedAt: new Date().toISOString(),
    repo: repo.full_name || TARGET_REPO,
    repoUrl,
    status: 'ok',
    message: null,
    totals: {
      submissions: submissions.length,
      commits: seenShas.size,
      contributors: allContributors.size,
    },
    submissions,
    recentCommits,
  }
}

async function main() {
  let payload
  try {
    payload = await collect()
  } catch (err) {
    if (err instanceof HttpError && err.status === 404) {
      payload = emptyPayload(
        'not-found',
        `Repository ${TARGET_REPO} was not found, or the monitoring token cannot see it. ` +
          `If it is private, add a GH_MONITOR_TOKEN secret with read access.`
      )
    } else if (err instanceof HttpError && (err.status === 401 || err.status === 403)) {
      payload = emptyPayload(
        'error',
        `Access to ${TARGET_REPO} was denied (HTTP ${err.status}). ` +
          `The monitoring token may be missing, expired, or rate limited.`
      )
    } else if (err instanceof HttpError) {
      payload = emptyPayload('error', `GitHub API returned HTTP ${err.status} for ${TARGET_REPO}.`)
    } else {
      payload = emptyPayload(
        'error',
        `Could not reach the GitHub API: ${err?.message || String(err)}`
      )
    }
  }

  try {
    await write(payload)
    console.log(
      `[github-status] ${payload.status} — ${payload.totals.submissions} submissions, ` +
        `${payload.totals.commits} commits -> ${OUT_PATH}`
    )
  } catch (err) {
    // Could not write at all. Say so loudly, but still exit 0: the previously
    // committed file stays in place and the site keeps serving.
    console.error(`[github-status] failed to write ${OUT_PATH}: ${err?.message || err}`)
  }

  // Deliberately NOT process.exit(0): forcing exit while undici still has
  // sockets closing trips a libuv assertion on Windows and returns a non-zero
  // code. Setting exitCode lets the loop drain (~1s) and always exits 0.
  process.exitCode = 0

  // Last resort, in case a socket somehow keeps the loop alive. Unref'd, so it
  // never delays a normal exit.
  const bail = setTimeout(() => process.exit(0), 30000)
  bail.unref()
}

// Belt and braces: nothing this monitoring script can do is worth failing the
// workflow or blocking a deploy.
main().catch((err) => {
  console.error(`[github-status] unexpected failure: ${err?.message || err}`)
  process.exitCode = 0
})
