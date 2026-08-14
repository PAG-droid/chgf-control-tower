import { useEffect, useState } from 'react'
import agenda from '../data/agenda.json'

export type Session = (typeof agenda.sessions)[number]

export type ClockState = {
  /** Seconds elapsed since midnight in event-local time (PT). */
  secondsOfDay: number
  current: Session | null
  next: Session | null
  /** Seconds until the current session ends, or until the next one starts. */
  secondsToTransition: number | null
  phase: 'before' | 'during' | 'between' | 'after'
}

const TZ = agenda.event.timezone

/**
 * Everyone sees the same clock. Virtual attendees may be in any timezone, so the
 * schedule is always evaluated in event-local time rather than the viewer's.
 */
export function secondsOfDayInEventTz(now: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(now)

  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? '0')
  // Intl can render midnight as hour 24 in some runtimes; normalise it.
  const hour = get('hour') % 24
  return hour * 3600 + get('minute') * 60 + get('second')
}

export function parseHm(hm: string): number {
  const [h, m] = hm.split(':').map(Number)
  return h * 3600 + m * 60
}

export function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`
}

export function to12h(hm: string): string {
  const [h, m] = hm.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`
}

/**
 * `?t=13:45` freezes the clock at a chosen time. Lets an organiser rehearse the
 * afternoon views during the morning without waiting for the day to catch up.
 */
function readTimeOverride(): number | null {
  if (typeof window === 'undefined') return null
  const raw = new URLSearchParams(window.location.search).get('t')
  if (!raw || !/^\d{1,2}:\d{2}$/.test(raw)) return null
  return parseHm(raw)
}

export function computeClock(secondsOfDay: number): ClockState {
  const sessions = agenda.sessions
  let current: Session | null = null
  let next: Session | null = null

  for (const s of sessions) {
    const start = parseHm(s.start)
    const end = parseHm(s.end)
    if (secondsOfDay >= start && secondsOfDay < end) current = s
    if (secondsOfDay < start && next === null) next = s
  }

  const firstStart = parseHm(sessions[0].start)
  const lastEnd = parseHm(sessions[sessions.length - 1].end)

  let phase: ClockState['phase']
  if (secondsOfDay < firstStart) phase = 'before'
  else if (secondsOfDay >= lastEnd) phase = 'after'
  else if (current) phase = 'during'
  else phase = 'between'

  let secondsToTransition: number | null = null
  if (current) secondsToTransition = parseHm(current.end) - secondsOfDay
  else if (next) secondsToTransition = parseHm(next.start) - secondsOfDay

  return { secondsOfDay, current, next, secondsToTransition, phase }
}

export function useClock(): ClockState {
  const override = readTimeOverride()
  const [state, setState] = useState<ClockState>(() =>
    computeClock(override ?? secondsOfDayInEventTz(new Date())),
  )

  useEffect(() => {
    if (override !== null) return
    const tick = () => setState(computeClock(secondsOfDayInEventTz(new Date())))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [override])

  return state
}
