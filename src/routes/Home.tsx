import agenda from '../data/agenda.json'
import teams from '../data/teams.json'
import { formatCountdown, to12h, useClock, type Session } from '../lib/clock'

const KIND_STYLES: Record<string, string> = {
  plenary: 'text-sky-300 border-sky-400/30 bg-sky-400/10',
  build: 'text-emerald-300 border-emerald-400/30 bg-emerald-400/10',
  logistics: 'text-ink-400 border-ink-500/30 bg-ink-500/10',
  teams: 'text-violet-300 border-violet-400/30 bg-violet-400/10',
  deadline: 'text-rose-300 border-rose-400/30 bg-rose-400/10',
  judging: 'text-amber-glow border-amber-glow/30 bg-amber-glow/10',
}

function ArchiveHero() {
  const teamCount = teams.teams.length
  const builderCount = teams.teams.reduce((n, t) => n + t.members.length, 0)

  return (
    <section className="overflow-hidden rounded-2xl border border-navy-700/70 bg-gradient-to-br from-navy-900 via-navy-900 to-navy-800 p-7 sm:p-10">
      <div className="text-xs font-semibold tracking-[0.16em] text-ink-500 uppercase">Event archive</div>
      <h1 className="mt-3 text-4xl leading-tight font-bold tracking-tight text-ink-100 sm:text-5xl">
        {agenda.event.title}
      </h1>
      <p className="mt-3 max-w-2xl text-base text-ink-300 sm:text-lg">
        {agenda.event.subtitle} · {agenda.event.dateLabel} · {agenda.event.location}
      </p>

      <dl className="mt-8 flex flex-wrap gap-x-12 gap-y-5">
        {[
          ['Teams', String(teamCount)],
          ['Builders', String(builderCount)],
          ['Award categories', '4'],
          ['Build time', '2h 45m'],
        ].map(([label, value]) => (
          <div key={label}>
            <dd className="tnum text-3xl font-bold text-amber-glow">{value}</dd>
            <dt className="mt-0.5 text-[11px] tracking-[0.12em] text-ink-500 uppercase">{label}</dt>
          </div>
        ))}
      </dl>

      <p className="mt-8 max-w-2xl text-sm text-ink-500">
        This is the record of the day as it actually ran. The schedule below is what happened, not a live countdown.
      </p>

      {/* Content lives in agenda.json so the link checker can see it and nobody
          has to edit a component to swap the file. Absent = no button. */}
      {agenda.event.runOfShow?.file && (
        <a
          href={`${import.meta.env.BASE_URL}${agenda.event.runOfShow.file}`}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex items-center gap-2 rounded-lg border border-navy-700 bg-navy-800/60 px-4 py-2 text-sm font-semibold text-ink-200 transition-colors hover:border-amber-glow/50 hover:bg-navy-700 hover:text-ink-100"
        >
          {agenda.event.runOfShow.label ?? 'Run of show'} (PDF) ↗
        </a>
      )}
    </section>
  )
}

function Hero() {
  const { current, next, secondsToTransition, phase } = useClock()

  if (phase === 'archive') return <ArchiveHero />

  const headline =
    phase === 'before'
      ? 'Doors open soon'
      : phase === 'after'
        ? "That's a wrap — thank you"
        : (current?.title ?? 'Between sessions')

  const detail =
    phase === 'before'
      ? `First session at ${to12h(agenda.sessions[0].start)} PT`
      : phase === 'after'
        ? 'Winners announced. Keep building.'
        : (current?.detail ?? `Up next: ${next?.title ?? '—'}`)

  const countdownLabel = current ? 'Time left in this session' : next ? `Until ${next.title}` : null

  return (
    <section className="overflow-hidden rounded-2xl border border-navy-700/70 bg-gradient-to-br from-navy-900 via-navy-900 to-navy-800 p-7 sm:p-10">
      <div className="flex flex-wrap items-start justify-between gap-x-10 gap-y-8">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <span className="live-dot size-2.5 rounded-full bg-amber-glow" aria-hidden="true" />
            <span className="text-xs font-semibold tracking-[0.16em] text-amber-glow uppercase">
              {phase === 'during' ? 'Now' : phase === 'before' ? 'Pre-event' : phase === 'after' ? 'Complete' : 'Transition'}
            </span>
          </div>

          <h1 className="mt-3 text-4xl leading-tight font-bold tracking-tight text-ink-100 sm:text-5xl">
            {headline}
          </h1>
          <p className="mt-3 max-w-2xl text-base text-ink-300 sm:text-lg">{detail}</p>

          {current && (
            <p className="mt-4 text-sm text-ink-500">
              {to12h(current.start)} – {to12h(current.end)} PT · {current.durationLabel}
            </p>
          )}
        </div>

        {secondsToTransition !== null && countdownLabel && (
          <div className="shrink-0 text-right">
            <div className="text-[11px] font-semibold tracking-[0.14em] text-ink-500 uppercase">{countdownLabel}</div>
            <div className="tnum mt-1.5 text-6xl font-bold text-amber-glow sm:text-7xl">
              {formatCountdown(secondsToTransition)}
            </div>
            {current && next && <div className="mt-2 text-sm text-ink-400">Next: {next.title}</div>}
          </div>
        )}
      </div>
    </section>
  )
}

function Row({ session, state }: { session: Session; state: 'past' | 'now' | 'future' | 'archive' }) {
  const kind = KIND_STYLES[session.kind] ?? KIND_STYLES.logistics

  return (
    <li
      className={[
        'relative flex flex-col gap-1.5 rounded-xl border px-4 py-3.5 transition-colors sm:flex-row sm:items-center sm:gap-5',
        state === 'now'
          ? 'border-amber-glow/50 bg-amber-glow/[0.07]'
          : state === 'past'
            ? 'border-navy-800 bg-navy-900/30 opacity-55'
            : 'border-navy-800 bg-navy-900/50',
      ].join(' ')}
    >
      <div className="tnum flex w-full shrink-0 items-center gap-2 sm:w-28">
        {state === 'now' && <span className="live-dot size-2 rounded-full bg-amber-glow" aria-hidden="true" />}
        <span className={state === 'now' ? 'font-bold text-amber-glow' : 'font-semibold text-ink-300'}>
          {to12h(session.start)}
        </span>

      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <h3 className={['font-semibold', state === 'now' ? 'text-ink-100' : 'text-ink-300'].join(' ')}>
            {session.title}
          </h3>
          <span className={['rounded-md border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase', kind].join(' ')}>
            {session.kind}
          </span>
          {state === 'past' && <span className="text-[10px] tracking-wide text-ink-500 uppercase">done</span>}
        </div>
        <p className="mt-1 text-sm text-ink-500">{session.detail}</p>
      </div>

      <div className="shrink-0 text-xs text-ink-500 sm:w-20 sm:text-right">{session.durationLabel}</div>
    </li>
  )
}

function InfoCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-navy-800 bg-navy-900/50 p-5">
      <h3 className="text-xs font-semibold tracking-[0.12em] text-amber-glow uppercase">{title}</h3>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5 text-sm text-ink-300">
            <span className="mt-1.5 size-1 shrink-0 rounded-full bg-ink-500" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Home() {
  const { current, secondsOfDay, phase } = useClock()
  const archived = phase === 'archive'

  return (
    <div className="space-y-10">
      <Hero />

      <section>
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 className="text-xl font-bold text-ink-100">{archived ? 'How the day ran' : 'Run of show'}</h2>
          <span className="text-xs text-ink-500">{agenda.event.timeLabel}</span>
        </div>

        <ul className="space-y-2">
          {agenda.sessions.map((s) => {
            const [h, m] = s.end.split(':').map(Number)
            const ended = secondsOfDay >= h * 3600 + m * 60
            // In the archive every session reads equally; nothing is "now" or dimmed as past.
            const state = archived ? 'archive' : current?.id === s.id ? 'now' : ended ? 'past' : 'future'
            return <Row key={s.id} session={s} state={state} />
          })}
        </ul>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <InfoCard title="Before you start" items={agenda.beforeYouArrive} />
        <InfoCard title="How teams work" items={agenda.howTeamsWork} />
      </section>

      <section className="rounded-xl border border-navy-800 bg-navy-900/50 p-5 text-sm text-ink-400">
        <span className="font-semibold text-ink-300">{agenda.event.location}</span>
        <span className="mx-2 text-ink-500">·</span>
        {agenda.event.format}
      </section>
    </div>
  )
}
