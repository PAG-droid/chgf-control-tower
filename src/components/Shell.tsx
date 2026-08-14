import type { ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import agenda from '../data/agenda.json'
import { useClock } from '../lib/clock'
import AnnouncementBanner from './AnnouncementBanner'

const NAV = [
  { to: '/', label: 'Live', end: true },
  { to: '/teams', label: 'Teams' },
  { to: '/judging', label: 'Judging' },
  { to: '/resources', label: 'Resources' },
  { to: '/monitor', label: 'Submissions' },
  { to: '/demos', label: 'Demos' },
  { to: '/gallery', label: 'Gallery' },
]

function LiveBadge() {
  const { current, phase } = useClock()

  const label =
    phase === 'before' ? 'Starting soon' : phase === 'after' ? "That's a wrap" : (current?.title ?? 'Between sessions')

  return (
    <div className="flex items-center gap-2 rounded-full border border-amber-glow/30 bg-amber-glow/10 px-3 py-1.5">
      <span className="live-dot size-2 rounded-full bg-amber-glow" aria-hidden="true" />
      <span className="text-xs font-semibold tracking-wide text-amber-glow uppercase">{label}</span>
    </div>
  )
}

export default function Shell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const unlisted: Record<string, string> = {
    '/ops': 'Organiser view — unlisted, not linked publicly',
  }
  const unlistedNote = unlisted[pathname]

  return (
    <div className="relative z-10 flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-navy-700/60 bg-navy-950/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3.5">
          <NavLink to="/" className="group flex items-baseline gap-3">
            <span className="text-lg font-bold tracking-tight text-ink-100">Control Tower</span>
            <span className="hidden text-[11px] font-medium tracking-[0.14em] text-ink-500 uppercase sm:inline">
              {agenda.event.orgs}
            </span>
          </NavLink>

          <nav className="order-3 flex flex-1 items-center gap-1 sm:order-none" aria-label="Primary">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  [
                    'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-navy-700/70 text-ink-100'
                      : 'text-ink-400 hover:bg-navy-800/60 hover:text-ink-100',
                  ].join(' ')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto">
            <LiveBadge />
          </div>
        </div>

        {unlistedNote && (
          <div className="border-t border-amber-deep/30 bg-amber-deep/10 px-5 py-1.5 text-center text-[11px] font-semibold tracking-[0.12em] text-amber-glow uppercase">
            {unlistedNote}
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-8">
        <AnnouncementBanner />
        {children}
      </main>

      <footer className="border-t border-navy-800 px-5 py-5">
        <div className="mx-auto flex max-w-7xl flex-col gap-1.5 text-xs text-ink-500 sm:flex-row sm:justify-between">
          <span>
            {agenda.event.title} · {agenda.event.dateLabel} · Gates Foundation, Seattle
          </span>
          <span>
            Questions? {agenda.event.questionsChannel} · Host: {agenda.event.host}
          </span>
        </div>
      </footer>
    </div>
  )
}
