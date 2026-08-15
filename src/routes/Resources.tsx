import resources from '../data/resources.json'

function SubmissionCard() {
  const { submission } = resources
  return (
    <section className="rounded-2xl border border-navy-700 bg-navy-900/60 p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-xl font-bold text-ink-100">How teams submitted</h2>
        <span className="rounded-lg border border-navy-600 bg-navy-800 px-3 py-1 text-sm font-semibold text-ink-300">
          Deadline was {submission.deadline}
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
      <p className="mt-2 text-xs text-ink-500">
        Internal visibility — reachable by Gates Foundation org members.
      </p>
    </section>
  )
}

export default function Resources() {
  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink-100">Resources</h1>
        <p className="mt-2 max-w-2xl text-ink-400">
          Submission process, the feedback survey, and the questions that came up on the day.
        </p>
      </header>

      <SubmissionCard />

      <section className="rounded-xl border border-amber-glow/30 bg-amber-glow/[0.06] p-5">
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

      <p className="text-sm text-ink-500">
        Looking for the idea bank, Claude Code practice notes or documentation links? They moved to{' '}
        <a href="#/learning" className="text-sky-300 hover:underline">
          Learning
        </a>
        . Who ran the day is on{' '}
        <a href="#/people" className="text-sky-300 hover:underline">
          People
        </a>
        .
      </p>
    </div>
  )
}
