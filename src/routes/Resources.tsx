import { useMemo, useState } from 'react'
import resources from '../data/resources.json'

const DIFFICULTY_STYLES: Record<string, string> = {
  Starter: 'text-emerald-300 border-emerald-400/30 bg-emerald-400/10',
  Moderate: 'text-sky-300 border-sky-400/30 bg-sky-400/10',
  Ambitious: 'text-rose-300 border-rose-400/30 bg-rose-400/10',
}

function SubmissionCard() {
  const { submission } = resources
  return (
    <section className="rounded-2xl border border-rose-400/30 bg-rose-400/[0.06] p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-xl font-bold text-ink-100">How to submit</h2>
        <span className="rounded-lg border border-rose-400/40 bg-rose-400/10 px-3 py-1 text-sm font-bold text-rose-300">
          Deadline {submission.deadline}
        </span>
      </div>

      <ol className="mt-4 space-y-2.5">
        {submission.steps.map((step, i) => (
          <li key={step} className="flex gap-3 text-sm text-ink-300">
            <span className="tnum mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md bg-navy-800 text-[11px] font-bold text-ink-400">
              {i + 1}
            </span>
            <span className="leading-relaxed">{step}</span>
          </li>
        ))}
      </ol>

      <a
        href={submission.repoUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-navy-700 px-4 py-2.5 text-sm font-semibold text-ink-100 transition-colors hover:bg-navy-600"
      >
        Open the hackathon repo →
      </a>

      <p className="mt-4 border-t border-rose-400/20 pt-3.5 text-xs leading-relaxed text-ink-400">
        <span className="font-semibold text-ink-300">Can&apos;t push? </span>
        {submission.fallback}
      </p>
    </section>
  )
}

export default function Resources() {
  const [tag, setTag] = useState<string>('All')

  const tags = useMemo(() => {
    const set = new Set<string>()
    for (const idea of resources.ideaBank) for (const t of idea.tags ?? []) set.add(t)
    return ['All', ...[...set].sort()]
  }, [])

  const ideas = tag === 'All' ? resources.ideaBank : resources.ideaBank.filter((i) => (i.tags ?? []).includes(tag))

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink-100">Resources</h1>
        <p className="mt-2 text-ink-400">Everything you need to build, submit, and get unstuck.</p>
      </header>

      <SubmissionCard />

      <section>
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-xl font-bold text-ink-100">Idea bank</h2>
          <span className="text-xs text-ink-500">{resources.ideaBank.length} starting points — yours doesn&apos;t have to be here</span>
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

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-navy-800 bg-navy-900/50 p-5">
          <h2 className="text-xs font-semibold tracking-[0.14em] text-amber-glow uppercase">Quickstart links</h2>
          <ul className="mt-3 space-y-3">
            {resources.quickstart.map((q) => (
              <li key={q.url}>
                <a href={q.url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-sky-300 hover:underline">
                  {q.label} →
                </a>
                <p className="mt-0.5 text-xs text-ink-500">{q.description}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-amber-glow/30 bg-amber-glow/[0.06] p-5">
          <h2 className="text-xs font-semibold tracking-[0.14em] text-amber-glow uppercase">{resources.survey.label}</h2>
          <p className="mt-2 text-sm text-ink-400">{resources.survey.note}</p>
          <a
            href={resources.survey.url}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block rounded-lg bg-amber-deep px-4 py-2 text-sm font-semibold text-navy-950 transition-colors hover:bg-amber-glow"
          >
            Open the survey →
          </a>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold text-ink-100">FAQ</h2>
        <ul className="space-y-2">
          {resources.faq.map((f) => (
            <li key={f.q}>
              <details className="rounded-xl border border-navy-800 bg-navy-900/50 px-5 py-3.5">
                <summary className="cursor-pointer text-sm font-semibold text-ink-200">{f.q}</summary>
                <p className="mt-2.5 text-sm leading-relaxed text-ink-400">{f.a}</p>
              </details>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
