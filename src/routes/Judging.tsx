import judging from '../data/judging.json'

const LEVEL_ACCENT = ['border-ink-500/40', 'border-sky-400/40', 'border-amber-glow/50']

export default function Judging() {
  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink-100">Judging</h1>
        <p className="mt-2 max-w-3xl text-ink-400">
          Four criteria, weighted equally. {judging.scoring.scale}.
        </p>
      </header>

      {judging.results && (
        <section>
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-xl font-bold text-ink-100">Award slate</h2>
            <span className="text-xs text-ink-500">{judging.results.source}</span>
          </div>
          <p className="mb-5 max-w-3xl text-sm leading-relaxed text-ink-400">{judging.results.caveat}</p>

          <ul className="space-y-3">
            {judging.results.slate.map((s) => (
              <li
                key={s.award}
                className={[
                  'rounded-xl border p-5',
                  s.status === 'decided' ? 'border-navy-700 bg-navy-900/60' : 'border-navy-800 bg-navy-900/30',
                ].join(' ')}
              >
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="tnum text-sm font-bold text-ink-500">#{s.rank}</span>
                  <h3 className="text-lg font-bold text-amber-glow">{s.award}</h3>
                  <span className="font-semibold text-ink-100">
                    <span className="mr-1.5 text-amber-glow">{s.letter}</span>
                    {s.team}
                  </span>
                  <span className="ml-auto flex gap-1.5">
                    <span className="rounded-md border border-navy-600 bg-navy-800 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-ink-400 uppercase">
                      {s.confidence}
                    </span>
                    <span
                      className={[
                        'rounded-md border px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase',
                        s.status === 'decided'
                          ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                          : 'border-sky-400/30 bg-sky-400/10 text-sky-300',
                      ].join(' ')}
                    >
                      {s.status === 'decided' ? 'Decided' : 'To the huddle'}
                    </span>
                  </span>
                </div>

                <div className="mt-1.5 text-xs text-ink-500">Deciding basis: {s.basis}</div>
                <p className="mt-3 text-sm leading-relaxed text-ink-300">{s.why}</p>
                {s.challenge && s.challenge !== 'None.' && (
                  <p className="mt-3 border-l-2 border-navy-600 pl-3 text-xs leading-relaxed text-ink-500">
                    <span className="font-semibold text-ink-400">Must survive: </span>
                    {s.challenge}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {judging.results && (
        <section>
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-xl font-bold text-ink-100">Scorecard</h2>
            <span className="text-xs text-ink-500">{judging.results.scale}</span>
          </div>
          <div className="overflow-x-auto rounded-xl border border-navy-800">
            <table className="w-full min-w-[52rem] text-sm">
              <thead>
                <tr className="bg-navy-800/60 text-left text-[10px] tracking-wide text-ink-400 uppercase">
                  <th className="px-3 py-2.5">Team</th>
                  <th className="px-3 py-2.5">Project</th>
                  <th className="px-3 py-2.5 text-right">Impact</th>
                  <th className="px-3 py-2.5 text-right">Staying</th>
                  <th className="px-3 py-2.5 text-right">Craft</th>
                  <th className="px-3 py-2.5 text-right">Demo</th>
                  <th className="px-3 py-2.5 text-right">Total</th>
                  <th className="px-3 py-2.5">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {judging.results.scores.map((s, i) => (
                  <tr key={`${s.letter}-${s.project}`} className={i % 2 ? 'bg-navy-900/30' : ''}>
                    <td className="px-3 py-2.5 font-semibold text-ink-100">
                      <span className="mr-1.5 text-amber-glow">{s.letter}</span>
                      {s.team}
                    </td>
                    <td className="px-3 py-2.5 text-ink-400">{s.project}</td>
                    <td className="tnum px-3 py-2.5 text-right text-ink-300">{s.impact}</td>
                    <td className="tnum px-3 py-2.5 text-right text-ink-300">{s.staying}</td>
                    <td className="tnum px-3 py-2.5 text-right text-ink-300">{s.craft}</td>
                    <td className="tnum px-3 py-2.5 text-right text-ink-300">{s.execution}</td>
                    <td className="tnum px-3 py-2.5 text-right font-bold text-amber-glow">{s.total}</td>
                    <td className="px-3 py-2.5 text-xs text-ink-500">{s.confidence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="mt-3 space-y-1.5">
            {judging.results.scores
              .filter((s) => s.notes)
              .map((s) => (
                <li key={`${s.letter}-note`} className="text-xs leading-relaxed text-ink-500">
                  <span className="font-semibold text-ink-400">
                    {s.letter} {s.team}:{' '}
                  </span>
                  {s.notes}
                </li>
              ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-xs font-semibold tracking-[0.14em] text-amber-glow uppercase">Award categories</h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {judging.categories.map((c) => (
            <li key={c.id} className="rounded-xl border border-navy-800 bg-navy-900/50 p-5">
              <h3 className="text-lg font-bold text-ink-100">{c.name}</h3>
              <div className="mt-0.5 text-xs font-semibold tracking-[0.1em] text-amber-glow uppercase">{c.tagline}</div>
              <p className="mt-3 text-sm leading-relaxed text-ink-400">{c.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-4 text-xs font-semibold tracking-[0.14em] text-amber-glow uppercase">What judges score</h2>
        <ul className="space-y-4">
          {judging.criteria.map((c) => (
            <li key={c.name} className="rounded-xl border border-navy-800 bg-navy-900/50 p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h3 className="text-base font-bold text-ink-100">{c.name}</h3>
                {c.weight && (
                  <span className="rounded-md border border-navy-600 bg-navy-800 px-2 py-0.5 text-xs font-semibold text-ink-300">
                    {c.weight}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-ink-400">{c.description}</p>

              {c.levels?.length > 0 && (
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {c.levels.map((lvl, i) => {
                    const [label, ...rest] = lvl.split(':')
                    return (
                      <div key={lvl} className={['rounded-lg border-l-2 bg-navy-950/50 px-3 py-2', LEVEL_ACCENT[i] ?? LEVEL_ACCENT[0]].join(' ')}>
                        <div className="text-[11px] font-bold tracking-wide text-ink-300 uppercase">{label}</div>
                        <div className="mt-0.5 text-xs leading-relaxed text-ink-500">{rest.join(':').trim()}</div>
                      </div>
                    )
                  })}
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-navy-800 bg-navy-900/50 p-5">
          <h2 className="text-xs font-semibold tracking-[0.14em] text-amber-glow uppercase">Judging panel</h2>
          <ul className="mt-3 space-y-2.5">
            {judging.judges.map((j) => (
              <li key={j.name} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-navy-800 pb-2.5 last:border-0 last:pb-0">
                <span className="font-semibold text-ink-100">{j.name}</span>
                <span className="text-xs text-ink-500">
                  {j.org}
                  {j.role ? ` · ${j.role}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-navy-800 bg-navy-900/50 p-5">
          <h2 className="text-xs font-semibold tracking-[0.14em] text-amber-glow uppercase">Afternoon timeline</h2>
          <ul className="mt-3 space-y-2.5">
            {[
              ['Submissions close', judging.timeline.submissionsClose],
              ['Lightning demos', judging.timeline.demos],
              ['Judging huddle', judging.timeline.judgingHuddle],
              ['Awards', judging.timeline.awards],
            ].map(([label, time]) => (
              <li key={label} className="flex items-baseline justify-between gap-3 border-b border-navy-800 pb-2.5 text-sm last:border-0 last:pb-0">
                <span className="text-ink-300">{label}</span>
                <span className="tnum font-semibold text-amber-glow">{time}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <details className="rounded-xl border border-navy-800 bg-navy-900/50 p-5">
        <summary className="cursor-pointer text-xs font-semibold tracking-[0.14em] text-amber-glow uppercase">
          How scoring works — full detail
        </summary>
        <p className="mt-3 text-sm leading-relaxed text-ink-400">{judging.scoring.notes}</p>
      </details>

      {judging.toolkit && (
        <section>
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-xl font-bold text-ink-100">Judging toolkit</h2>
            <span className="text-xs text-ink-500">Built by {judging.toolkit.author} on the day</span>
          </div>

          <p className="mb-5 max-w-3xl text-sm leading-relaxed text-ink-400">{judging.toolkit.intro}</p>

          <blockquote className="mb-5 border-l-2 border-amber-glow/50 bg-navy-900/50 px-5 py-4 text-sm leading-relaxed text-ink-300 italic">
            {judging.toolkit.quote}
          </blockquote>

          <ul className="grid gap-4 md:grid-cols-2">
            {judging.toolkit.items.map((t) => (
              <li key={t.name} className="rounded-xl border border-navy-800 bg-navy-900/50 p-5">
                <div className="flex items-start justify-between gap-3">
                  <a
                    href={t.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-sm font-bold text-sky-300 hover:underline"
                  >
                    {t.name} ↗
                  </a>
                  <span className="shrink-0 rounded-md border border-navy-600 bg-navy-800 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-ink-400 uppercase">
                    {t.role}
                  </span>
                </div>
                <p className="mt-2.5 text-sm leading-relaxed text-ink-400">{t.description}</p>
              </li>
            ))}
          </ul>

          <a
            href={judging.toolkit.readmeUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-block rounded-lg bg-navy-700 px-4 py-2 text-sm font-semibold text-ink-100 hover:bg-navy-600"
          >
            Read the toolkit notes →
          </a>
        </section>
      )}
    </div>
  )
}
