import { useMemo, useState } from 'react'
import resources from '../data/resources.json'

const DIFFICULTY_STYLES: Record<string, string> = {
  Starter: 'text-emerald-300 border-emerald-400/30 bg-emerald-400/10',
  Moderate: 'text-sky-300 border-sky-400/30 bg-sky-400/10',
  Ambitious: 'text-rose-300 border-rose-400/30 bg-rose-400/10',
}

const materials = Array.isArray(resources.sessionMaterials) ? resources.sessionMaterials : []
const tips = Array.isArray(resources.tips) ? resources.tips : []
const quickstart = Array.isArray(resources.quickstart) ? resources.quickstart : []
const ideaBank = Array.isArray(resources.ideaBank) ? resources.ideaBank : []

export default function Learning() {
  const [tag, setTag] = useState('All')

  const tags = useMemo(() => {
    const set = new Set<string>()
    for (const idea of ideaBank) for (const t of idea.tags ?? []) set.add(t)
    return ['All', ...[...set].sort()]
  }, [])

  const ideas = tag === 'All' ? ideaBank : ideaBank.filter((i) => (i.tags ?? []).includes(tag))

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink-100">Learning</h1>
        <p className="mt-2 max-w-2xl text-ink-400">
          What the room worked out on the day — practice that made Claude Code go faster, and the ideas people started
          from.
        </p>
      </header>

      {materials.length > 0 && (
        <section>
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-xl font-bold text-ink-100">Session materials</h2>
            <span className="text-xs text-ink-500">Taught live on the day</span>
          </div>
          <ul className="grid gap-4 md:grid-cols-2">
            {materials.map((m) => (
              <li key={m.file} className="rounded-xl border border-navy-800 bg-navy-900/50 p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-bold text-ink-100">{m.title}</h3>
                  <span className="shrink-0 rounded-md border border-navy-600 bg-navy-800 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-ink-400 uppercase">
                    PDF
                  </span>
                </div>
                <div className="mt-1 text-xs text-ink-500">
                  {m.presenter} · {m.session}
                </div>
                <p className="mt-2.5 text-sm leading-relaxed text-ink-400">{m.description}</p>
                <a
                  href={`${import.meta.env.BASE_URL}${m.file}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-block rounded-lg bg-navy-700 px-4 py-2 text-sm font-semibold text-ink-100 transition-colors hover:bg-navy-600"
                >
                  Open the deck →
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-xl font-bold text-ink-100">Working with Claude Code</h2>
          <span className="text-xs text-ink-500">Shared in the Teams chat during the build</span>
        </div>
        <ul className="grid gap-3 md:grid-cols-2">
          {tips.map((t) => (
            <li key={t.tip} className="rounded-xl border-l-2 border-amber-glow/50 bg-navy-900/50 px-4 py-3">
              <div className="font-semibold text-ink-100">{t.tip}</div>
              <p className="mt-1 text-sm leading-relaxed text-ink-400">{t.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold text-ink-100">Documentation</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {quickstart.map((q) => (
            <li key={q.url} className="rounded-xl border border-navy-800 bg-navy-900/50 p-4">
              <a href={q.url} target="_blank" rel="noreferrer" className="font-semibold text-sky-300 hover:underline">
                {q.label} →
              </a>
              <p className="mt-1 text-sm text-ink-500">{q.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-xl font-bold text-ink-100">Idea bank</h2>
          <span className="text-xs text-ink-500">{ideaBank.length} starting points from Neil and Xiaoxue</span>
        </div>

        <div className="mb-4 flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTag(t)}
              aria-pressed={tag === t}
              className={[
                'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                tag === t ? 'bg-navy-700 text-ink-100' : 'bg-navy-900 text-ink-500 hover:text-ink-300',
              ].join(' ')}
            >
              {t}
            </button>
          ))}
        </div>

        <ul className="grid gap-4 md:grid-cols-2">
          {ideas.map((idea) => (
            <li key={idea.title} className="rounded-xl border border-navy-800 bg-navy-900/50 p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-bold text-ink-100">{idea.title}</h3>
                {idea.difficulty && (
                  <span
                    className={[
                      'shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase',
                      DIFFICULTY_STYLES[idea.difficulty] ?? DIFFICULTY_STYLES.Moderate,
                    ].join(' ')}
                  >
                    {idea.difficulty}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink-400">{idea.summary}</p>
              {idea.tags?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {idea.tags.map((t) => (
                    <span key={t} className="rounded bg-navy-800 px-1.5 py-0.5 text-[10px] text-ink-500">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
