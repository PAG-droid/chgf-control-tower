import { useState } from 'react'
import ops from '../data/ops.json'

const PRIORITY_STYLES: Record<string, string> = {
  high: 'text-rose-300 border-rose-400/40 bg-rose-400/10',
  medium: 'text-amber-glow border-amber-glow/40 bg-amber-glow/10',
  low: 'text-ink-400 border-ink-500/40 bg-ink-500/10',
}

const STATUS_STYLES: Record<string, string> = {
  open: 'text-ink-300',
  'at-risk': 'text-rose-300 font-semibold',
  done: 'text-emerald-300 line-through opacity-60',
}

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 }

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

export default function Ops() {
  const [onlyHigh, setOnlyHigh] = useState(false)

  const items = [...ops.openItems]
    .filter((i) => (onlyHigh ? i.priority === 'high' : true))
    .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 3) - (PRIORITY_ORDER[b.priority] ?? 3))

  const counts = ops.openItems.reduce<Record<string, number>>((acc, i) => {
    acc[i.priority] = (acc[i.priority] ?? 0) + 1
    return acc
  }, {})

  const confirmed = ops.roles.filter((r) => r.status === 'confirmed')
  const proposed = ops.roles.filter((r) => r.status !== 'confirmed')

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink-100">Ops board</h1>
        <p className="mt-2 text-ink-400">
          {counts.high ?? 0} high · {counts.medium ?? 0} medium · {counts.low ?? 0} low · {ops.gaps.length} open gaps
        </p>
      </header>

      {proposed.length > 0 && (
        <div className="rounded-xl border border-rose-400/40 bg-rose-400/[0.08] p-5">
          <h2 className="text-sm font-bold text-rose-300">Unconfirmed day-of roles — chase these first</h2>
          <p className="mt-1.5 text-sm text-ink-400">
            Proposed on 2026-08-12 but not in the note that went out. These people may not know they are assigned.
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {proposed.map((r) => (
              <li key={r.name} className="rounded-lg bg-navy-950/50 px-3 py-2 text-sm">
                <span className="font-semibold text-ink-100">{r.name}</span>
                <span className="mt-0.5 block text-xs text-ink-400">{r.role}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Panel title="Open items" count={items.length}>
        <button
          type="button"
          onClick={() => setOnlyHigh((v) => !v)}
          aria-pressed={onlyHigh}
          className={[
            'mb-3.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
            onlyHigh ? 'bg-rose-400/20 text-rose-300' : 'bg-navy-800 text-ink-400 hover:text-ink-100',
          ].join(' ')}
        >
          {onlyHigh ? 'Showing high priority only' : 'Show high priority only'}
        </button>

        <ul className="space-y-1.5">
          {items.map((i) => (
            <li
              key={i.item}
              className="flex flex-wrap items-start gap-x-3 gap-y-1 rounded-lg border border-navy-800 bg-navy-950/40 px-3.5 py-2.5"
            >
              <span
                className={[
                  'shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase',
                  PRIORITY_STYLES[i.priority] ?? PRIORITY_STYLES.low,
                ].join(' ')}
              >
                {i.priority}
              </span>
              <span className={['min-w-0 flex-1 text-sm', STATUS_STYLES[i.status] ?? STATUS_STYLES.open].join(' ')}>
                {i.item}
              </span>
              <span className="shrink-0 text-xs text-ink-500">{i.owner}</span>
            </li>
          ))}
        </ul>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Escalation matrix">
          <ul className="space-y-2.5">
            {ops.escalation.map((e) => (
              <li key={e.issue} className="border-b border-navy-800 pb-2.5 last:border-0 last:pb-0">
                <div className="text-sm text-ink-300">{e.issue}</div>
                <div className="mt-0.5 text-xs text-ink-500">
                  → {e.contact} · via {e.channel}
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Confirmed roles" count={confirmed.length}>
          <ul className="space-y-2">
            {confirmed.map((r) => (
              <li key={r.name} className="flex flex-wrap items-baseline justify-between gap-x-3 border-b border-navy-800 pb-2 text-sm last:border-0 last:pb-0">
                <span className="font-semibold text-ink-200">{r.name}</span>
                <span className="text-xs text-ink-500">{r.role}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Open gaps & unresolved questions" count={ops.gaps.length}>
        <ul className="space-y-2">
          {ops.gaps.map((g) => (
            <li key={g} className="flex gap-2.5 text-sm text-ink-300">
              <span className="mt-1.5 size-1 shrink-0 rounded-full bg-rose-400" aria-hidden="true" />
              <span>{g}</span>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Decisions on record" count={ops.decisions.length}>
        <ul className="space-y-3.5">
          {ops.decisions.map((d) => (
            <li key={d.decision} className="border-b border-navy-800 pb-3.5 last:border-0 last:pb-0">
              <div className="tnum text-[11px] tracking-wide text-ink-500 uppercase">{d.date}</div>
              <div className="mt-1 text-sm text-ink-200">{d.decision}</div>
              {d.rationale && <div className="mt-1 text-xs leading-relaxed text-ink-500">{d.rationale}</div>}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  )
}
