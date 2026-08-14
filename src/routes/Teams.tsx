import { useMemo, useState } from 'react'
import teams from '../data/teams.json'

const MODE_STYLES: Record<string, string> = {
  'All In-Person': 'text-emerald-300 border-emerald-400/30 bg-emerald-400/10',
  'All Virtual': 'text-sky-300 border-sky-400/30 bg-sky-400/10',
  Mixed: 'text-violet-300 border-violet-400/30 bg-violet-400/10',
}

const FILTERS = ['All', 'All In-Person', 'All Virtual', 'Mixed'] as const

export default function Teams() {
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState<(typeof FILTERS)[number]>('All')

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return teams.teams.filter((t) => {
      if (mode !== 'All' && t.mode !== mode) return false
      if (!q) return true
      return (
        t.letter.toLowerCase() === q ||
        (t.name ?? '').toLowerCase().includes(q) ||
        t.members.some((m) => m.name.toLowerCase().includes(q))
      )
    })
  }, [query, mode])

  const totalMembers = teams.teams.reduce((n, t) => n + t.members.length, 0)

  return (
    <div className="space-y-7">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink-100">Teams</h1>
        <p className="mt-2 text-ink-400">
          {teams.teams.length} teams · {totalMembers} builders. {teams.breakoutRoomNote}
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find your name or team…"
          aria-label="Search teams and members"
          className="w-full max-w-xs rounded-lg border border-navy-700 bg-navy-900 px-3.5 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:border-amber-glow/50 focus:ring-1 focus:ring-amber-glow/40 focus:outline-none"
        />
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setMode(f)}
              aria-pressed={mode === f}
              className={[
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                mode === f ? 'bg-navy-700 text-ink-100' : 'bg-navy-900 text-ink-400 hover:text-ink-100',
              ].join(' ')}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-xl border border-navy-800 bg-navy-900/50 px-5 py-8 text-center text-ink-400">
          No teams match that. Not on a team? Ask a floor helper — solo-friendly tasks are available.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((t) => (
            <li key={t.letter} className="rounded-xl border border-navy-800 bg-navy-900/50 p-5 transition-colors hover:border-navy-600">
              <div className="flex items-start gap-3">
                {/* Named teams have a logo; the rest fall back to the letter tile.
                    The logos are circular marks on a cream ground, so they get
                    masked to a circle — square tiles leave cream corners. */}
                {'logo' in t && typeof t.logo === 'string' ? (
                  <img
                    src={`${import.meta.env.BASE_URL}${t.logo}`}
                    alt=""
                    className="size-12 shrink-0 rounded-full ring-1 ring-navy-700"
                  />
                ) : (
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-navy-800 text-xl font-bold text-amber-glow">
                    {t.letter}
                  </span>
                )}

                <div className="min-w-0 flex-1">
                  <div className="truncate text-base font-semibold text-ink-100">
                    {t.name ?? <span className="text-ink-500 italic">not yet named</span>}
                  </div>
                  <div className="mt-1 text-xs text-ink-500">
                    {t.room} · {t.members.length} members
                    {/* Only some in-person teams have told us a table number. */}
                    {'table' in t && typeof t.table === 'number' ? ` · Table ${t.table}` : ''}
                  </div>
                </div>
                <span
                  className={[
                    'shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase',
                    MODE_STYLES[t.mode] ?? MODE_STYLES.Mixed,
                  ].join(' ')}
                >
                  {t.mode.replace('All ', '')}
                </span>
              </div>

              <ul className="mt-4 space-y-1.5 border-t border-navy-800 pt-3.5">
                {t.members.map((m) => (
                  <li key={m.name} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate text-ink-300">{m.name}</span>
                    <span className="shrink-0 text-[11px] text-ink-500">{m.mode}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
