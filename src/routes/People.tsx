import judging from '../data/judging.json'
import ops from '../data/ops.json'
import resources from '../data/resources.json'
import teams from '../data/teams.json'

type Role = { name: string; role: string; status?: string }

const roles: Role[] = Array.isArray(ops.roles) ? ops.roles : []
const helpDesk = Array.isArray(resources.helpDesk) ? resources.helpDesk : []

function Card({ name, detail, tag }: { name: string; detail: string; tag?: string }) {
  return (
    <li className="rounded-xl border border-navy-800 bg-navy-900/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <span className="font-semibold text-ink-100">{name}</span>
        {tag && (
          <span className="shrink-0 rounded-md border border-navy-600 bg-navy-800 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-ink-400 uppercase">
            {tag}
          </span>
        )}
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-400">{detail}</p>
    </li>
  )
}

function Section({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="text-xl font-bold text-ink-100">{title}</h2>
        {count !== undefined && <span className="tnum text-xs text-ink-500">{count}</span>}
      </div>
      {children}
    </section>
  )
}

export default function People() {
  const builders = teams.teams.reduce((n, t) => n + t.members.length, 0)
  // Everyone who ran the day, minus the people already shown on the judging panel.
  const judgeNames = new Set(judging.judges.map((j) => j.name))
  const crew = roles.filter((r) => !judgeNames.has(r.name))

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink-100">People</h1>
        <p className="mt-2 max-w-2xl text-ink-400">
          {builders} builders across {teams.teams.length} teams, {judging.judges.length} judges, and the crew who ran
          the day.
        </p>
      </header>

      <Section title="Judging panel" count={judging.judges.length}>
        <ul className="grid gap-3 sm:grid-cols-2">
          {judging.judges.map((j) => (
            <Card key={j.name} name={j.name} detail={j.org} tag={j.role} />
          ))}
        </ul>
      </Section>

      <Section title="Organisers & crew" count={crew.length}>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {crew.map((r) => (
            <Card key={r.name} name={r.name} detail={r.role} tag={r.status === 'confirmed' ? undefined : r.status} />
          ))}
        </ul>
      </Section>

      {helpDesk.length > 0 && (
        <Section title="Support on the day" count={helpDesk.length}>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {helpDesk.map((h) => (
              <Card key={h.name} name={h.name} detail={h.helpsWith} tag={h.where} />
            ))}
          </ul>
        </Section>
      )}

      <Section title="Builders" count={builders}>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {teams.teams.map((t) => (
            <li key={t.letter} className="rounded-xl border border-navy-800 bg-navy-900/50 p-4">
              <div className="flex items-center gap-2.5">
                {'logo' in t && typeof t.logo === 'string' ? (
                  <img src={`${import.meta.env.BASE_URL}${t.logo}`} alt="" className="size-8 rounded-md ring-1 ring-navy-700" />
                ) : (
                  <span className="flex size-8 items-center justify-center rounded-md bg-navy-800 text-sm font-bold text-amber-glow">
                    {t.letter}
                  </span>
                )}
                <span className="truncate font-semibold text-ink-100">
                  {t.name ?? <span className="text-ink-500 italic">Team {t.letter}</span>}
                </span>
              </div>
              <ul className="mt-3 space-y-1 border-t border-navy-800 pt-2.5">
                {t.members.map((m) => (
                  <li key={m.name} className="text-sm text-ink-400">
                    {m.name}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  )
}
