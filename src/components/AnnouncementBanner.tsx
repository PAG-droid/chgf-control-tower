import announcementData from '../data/announcements.json'

type Level = 'info' | 'success' | 'warning' | 'urgent'

type Announcement = {
  id: string
  level: Level
  message: string
  active: boolean
  since?: string
}

const LEVEL_STYLES: Record<Level, string> = {
  info: 'text-sky-300 border-sky-400/30 bg-sky-400/10',
  success: 'text-emerald-300 border-emerald-400/30 bg-emerald-400/10',
  warning: 'text-amber-glow border-amber-glow/30 bg-amber-glow/10',
  urgent: 'text-rose-300 border-rose-400/30 bg-rose-400/10',
}

const LEVEL_RANK: Record<Level, number> = {
  urgent: 0,
  warning: 1,
  success: 2,
  info: 3,
}

// The JSON is hand-edited by organisers, so widen it and re-validate rather than trusting the shape.
const { announcements } = announcementData as { announcements?: Announcement[] }

export default function AnnouncementBanner() {
  const active = (announcements ?? [])
    .filter((a) => a.active === true && LEVEL_STYLES[a.level] !== undefined)
    .sort((a, b) => LEVEL_RANK[a.level] - LEVEL_RANK[b.level])

  if (active.length === 0) return null

  return (
    <div role="status" aria-live="polite" className="space-y-2">
      {active.map((a) => (
        <div
          key={a.id}
          className={[
            'flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium',
            LEVEL_STYLES[a.level],
          ].join(' ')}
        >
          {a.level === 'urgent' && (
            <span className="live-dot size-2 shrink-0 rounded-full bg-rose-400" aria-hidden="true" />
          )}
          <span className="text-[10px] font-semibold tracking-[0.12em] uppercase opacity-70">{a.level}</span>
          <span className="min-w-0 flex-1">{a.message}</span>
        </div>
      ))}
    </div>
  )
}
