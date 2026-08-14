import { useEffect, useState } from 'react'

type Submission = {
  folder?: string
  url?: string
  lastCommitAt?: string
  commitCount?: number
  contributors?: string[]
  hasReadme?: boolean
}

type Commit = {
  sha?: string
  message?: string
  author?: string
  at?: string
  url?: string
}

type Status = {
  generatedAt?: string
  repo?: string
  repoUrl?: string
  status?: 'ok' | 'not-found' | 'error'
  message?: string | null
  totals?: { submissions?: number; commits?: number; contributors?: number }
  submissions?: Submission[]
  recentCommits?: Commit[]
}

const RAW_URL = 'https://raw.githubusercontent.com/pag992007/chgf-control-tower/main/public/github-status.json'
const POLL_MS = 60_000

function relativeTime(iso: string): string {
  const t = Date.parse(iso)
  if (!iso || Number.isNaN(t)) return 'unknown'

  const secs = Math.round((Date.now() - t) / 1000)
  if (secs < 0) return 'just now'
  if (secs < 60) return 'just now'

  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins} min ago`

  const hrs = Math.floor(mins / 60)
  const rem = mins % 60
  if (hrs < 24) return rem === 0 ? `${hrs} hr ago` : `${hrs} hr ${rem} min ago`

  const days = Math.floor(hrs / 24)
  return days === 1 ? '1 day ago' : `${days} days ago`
}

async function loadStatus(): Promise<Status> {
  try {
    const res = await fetch(`${RAW_URL}?cb=${Date.now()}`, { cache: 'no-store' })
    if (res.ok) return (await res.json()) as Status
  } catch {
    /* fall through to the bundled copy */
  }

  const res = await fetch(`${import.meta.env.BASE_URL}github-status.json?cb=${Date.now()}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`status feed unavailable (${res.status})`)
  return (await res.json()) as Status
}

function Panel({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-navy-800 bg-navy-900/50 p-5">
      <div className="mb-3.5 flex items-baseline justify-between gap-3">
        <h2 className="text-xs font-semibold tracking-[0.14em] text-amber-glow uppercase">{title}</h2>
        {count !== undefined && <span className="tnum text-xs text-ink-500">{count}</span>}
      </div>
      {children}
    </section>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-navy-800 bg-navy-900/50 px-5 py-4">
      <div className="tnum text-3xl font-bold text-amber-glow">{value}</div>
      <div className="mt-1 text-[11px] font-semibold tracking-[0.14em] text-ink-500 uppercase">{label}</div>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[86px] animate-pulse rounded-xl border border-navy-800 bg-navy-900/50" />
        ))}
      </div>
      <div className="h-40 animate-pulse rounded-xl border border-navy-800 bg-navy-900/40" />
    </div>
  )
}

function Idle({ repo, message }: { repo?: string; message?: string | null }) {
  return (
    <section className="rounded-xl border border-navy-700/70 bg-navy-900/50 p-6 sm:p-8">
      <div className="flex items-center gap-2.5">
        <span className="size-2.5 rounded-full bg-ink-500" aria-hidden="true" />
        <span className="text-xs font-semibold tracking-[0.16em] text-ink-400 uppercase">Standing by</span>
      </div>

      <h2 className="mt-3 text-2xl font-bold tracking-tight text-ink-100">Not watching a repo yet</h2>
      <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-ink-400">
        Once teams start pushing folders to the submission repo, this page fills in with a card per submission,
        commit counts, contributor logins and a live feed of the most recent commits. Nothing is wrong — the watcher
        just has nothing to report.
      </p>

      <dl className="mt-5 grid gap-3 border-t border-navy-800 pt-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-[11px] font-semibold tracking-[0.12em] text-ink-500 uppercase">Target repo</dt>
          <dd className="mt-1 break-all text-ink-300">{repo ?? 'not configured'}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold tracking-[0.12em] text-ink-500 uppercase">Watcher says</dt>
          <dd className="mt-1 text-ink-300">{message ?? 'Repository not readable yet.'}</dd>
        </div>
      </dl>

      <p className="mt-4 text-xs text-ink-500">Rechecking every 60 seconds — leave this tab open.</p>
    </section>
  )
}

function SubmissionCard({ s }: { s: Submission }) {
  const contributors = Array.isArray(s.contributors) ? s.contributors : []

  return (
    <li className="rounded-xl border border-navy-800 bg-navy-900/50 p-5 transition-colors hover:border-navy-600">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {s.url ? (
            <a
              href={s.url}
              target="_blank"
              rel="noreferrer"
              className="truncate text-base font-semibold text-ink-100 hover:text-amber-glow"
            >
              {s.folder ?? 'unnamed folder'}
            </a>
          ) : (
            <span className="truncate text-base font-semibold text-ink-100">{s.folder ?? 'unnamed folder'}</span>
          )}
          <div className="mt-1 text-xs text-ink-500">
            {s.commitCount ?? 0} {(s.commitCount ?? 0) === 1 ? 'commit' : 'commits'} · last push{' '}
            {s.lastCommitAt ? relativeTime(s.lastCommitAt) : 'unknown'}
          </div>
        </div>
        {s.hasReadme === false && (
          <span className="shrink-0 rounded-md border border-amber-glow/40 bg-amber-glow/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-amber-glow uppercase">
            No readme
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5 border-t border-navy-800 pt-3.5">
        {contributors.length === 0 ? (
          <span className="text-xs text-ink-500">No contributors listed</span>
        ) : (
          contributors.map((c) => (
            <span key={c} className="rounded-md bg-navy-800 px-2 py-0.5 text-[11px] text-ink-300">
              {c}
            </span>
          ))
        )}
      </div>
    </li>
  )
}

export default function Monitor() {
  const [data, setData] = useState<Status | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshedAt, setRefreshedAt] = useState<string | null>(null)

  useEffect(() => {
    let alive = true

    const run = async () => {
      try {
        const next = await loadStatus()
        if (!alive) return
        setData(next && typeof next === 'object' ? next : { status: 'error' })
      } catch (err) {
        if (!alive) return
        setData({
          status: 'error',
          message: err instanceof Error ? err.message : 'Status feed unreachable.',
        })
      } finally {
        if (alive) {
          setLoading(false)
          setRefreshedAt(new Date().toISOString())
        }
      }
    }

    run()
    const id = setInterval(run, POLL_MS)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [])

  const status = data?.status ?? 'error'
  const totals = data?.totals ?? {}
  const submissions = Array.isArray(data?.submissions) ? data.submissions : []
  const commits = Array.isArray(data?.recentCommits) ? data.recentCommits : []

  return (
    <div className="space-y-7">
      <header>
        <div className="flex items-center gap-2.5">
          <span
            className={['size-2.5 rounded-full', status === 'ok' ? 'live-dot bg-amber-glow' : 'bg-ink-500'].join(' ')}
            aria-hidden="true"
          />
          <span
            className={[
              'text-xs font-semibold tracking-[0.16em] uppercase',
              status === 'ok' ? 'text-amber-glow' : 'text-ink-400',
            ].join(' ')}
          >
            {loading ? 'Connecting' : status === 'ok' ? 'Watching' : 'Standing by'}
          </span>
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink-100">Submission monitor</h1>
        <p className="mt-2 text-ink-400">
          {data?.repoUrl ? (
            <a href={data.repoUrl} target="_blank" rel="noreferrer" className="text-ink-300 hover:text-amber-glow">
              {data.repo ?? data.repoUrl}
            </a>
          ) : (
            (data?.repo ?? 'Submission repo')
          )}
          <span className="mx-2 text-ink-500">·</span>
          {loading ? 'Connecting…' : refreshedAt ? `refreshed ${relativeTime(refreshedAt)}` : 'not refreshed yet'}
          {data?.generatedAt && (
            <>
              <span className="mx-2 text-ink-500">·</span>
              scanned {relativeTime(data.generatedAt)}
            </>
          )}
        </p>
      </header>

      {loading && !data ? (
        <Skeleton />
      ) : status !== 'ok' ? (
        <Idle repo={data?.repo} message={data?.message} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Submissions" value={totals.submissions ?? submissions.length} />
            <Stat label="Commits" value={totals.commits ?? 0} />
            <Stat label="Contributors" value={totals.contributors ?? 0} />
          </div>

          {submissions.length === 0 ? (
            <section className="rounded-xl border border-navy-800 bg-navy-900/50 px-5 py-8 text-center">
              <p className="text-base font-semibold text-ink-100">No submissions yet</p>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-ink-400">
                The repo is readable and the watcher is live — first folder in wins the bragging rights. Push early,
                push rough; you can keep committing right up to the deadline.
              </p>
            </section>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {submissions.map((s, i) => (
                <SubmissionCard key={s.folder ?? i} s={s} />
              ))}
            </ul>
          )}

          <Panel title="Recent commits" count={commits.length}>
            {commits.length === 0 ? (
              <p className="text-sm text-ink-500">Nothing pushed yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {commits.map((c, i) => (
                  <li
                    key={c.sha ?? i}
                    className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-lg border border-navy-800 bg-navy-950/40 px-3.5 py-2.5"
                  >
                    {c.url ? (
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noreferrer"
                        className="tnum shrink-0 text-xs text-ink-500 hover:text-amber-glow"
                      >
                        {(c.sha ?? '').slice(0, 7) || '—'}
                      </a>
                    ) : (
                      <span className="tnum shrink-0 text-xs text-ink-500">{(c.sha ?? '').slice(0, 7) || '—'}</span>
                    )}
                    <span className="min-w-0 flex-1 truncate text-sm text-ink-300">
                      {(c.message ?? '').split('\n')[0] || 'no message'}
                    </span>
                    <span className="shrink-0 text-xs text-ink-500">{c.author ?? 'unknown'}</span>
                    <span className="shrink-0 text-xs text-ink-500">{c.at ? relativeTime(c.at) : ''}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </>
      )}
    </div>
  )
}
