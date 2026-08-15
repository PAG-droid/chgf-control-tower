import { useCallback, useEffect, useRef, useState } from 'react'
import demos from '../data/demos.json'
import teams from '../data/teams.json'

type Slot = {
  letter?: string
  team?: string
  deck?: string | null
  repo?: string | null
  video?: string | null
  /** SharePoint / OneDrive folder a team shared instead of a file. */
  share?: string | null
  title?: string | null
  summary?: string | null
  presenters?: string | null
  note?: string | null
}

/**
 * Green and clickable once the team has handed something over, muted grey
 * while we are still waiting. Anchors sit outside the row button so they stay
 * independently clickable.
 */
function Pill({ label, href }: { label: string; href?: string | null }) {
  const base = 'rounded-md border px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase'
  if (!href) return <span className={`${base} border-navy-700 bg-navy-800/60 text-ink-500`}>{label} –</span>
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={`${base} border-emerald-400/40 bg-emerald-400/15 text-emerald-300 transition-colors hover:bg-emerald-400/30 hover:text-emerald-200`}
      title={`Open ${label.toLowerCase()}`}
    >
      {label} ↗
    </a>
  )
}

const order: Slot[] = Array.isArray(demos.order) ? demos.order : []
const TOTAL = typeof demos.secondsPerDemo === 'number' ? demos.secondsPerDemo : 120

function teamLabel(slot: Slot): string {
  if (slot.team) return slot.team
  const match = teams.teams.find((t) => t.letter === slot.letter)
  return match?.name ?? (slot.letter ? `Team ${slot.letter}` : 'Unnamed team')
}

/** Who is on the team, straight from the roster, so it tracks every reshuffle. */
function teamMembers(slot: Slot): string {
  const match = teams.teams.find((t) => t.letter === slot.letter)
  return match ? match.members.map((m) => m.name).join(' · ') : ''
}

function teamLogo(slot: Slot): string | null {
  const match = teams.teams.find((t) => t.letter === slot.letter)
  if (match && 'logo' in match && typeof match.logo === 'string') return `${import.meta.env.BASE_URL}${match.logo}`
  return null
}

function deckUrl(file: string): string {
  // #toolbar=0 hides the browser PDF chrome so the slide fills the screen.
  return `${import.meta.env.BASE_URL}decks/${file}#toolbar=0&navpanes=0&view=FitH`
}

/**
 * Videos are either a link somewhere else (Stream, SharePoint) or a file we
 * ship in public/. A shipped file needs the deploy base in front of it, because
 * GitHub Pages serves this site from /chgf-control-tower/ and a bare path would
 * resolve against the domain root and 404.
 */
function mediaUrl(value: string): string {
  if (/^https?:\/\//.test(value)) return value
  return `${import.meta.env.BASE_URL}${value.replace(/^\//, '')}`
}

function mmss(s: number): string {
  const clamped = Math.max(0, s)
  return `${Math.floor(clamped / 60)}:${String(clamped % 60).padStart(2, '0')}`
}

/** Timer lives here so it survives switching decks inside presenter mode. */
function useTimer() {
  const [left, setLeft] = useState(TOTAL)
  const [running, setRunning] = useState(false)
  const ref = useRef<number | null>(null)

  useEffect(() => {
    if (!running) return
    ref.current = window.setInterval(() => setLeft((v) => (v <= 0 ? 0 : v - 1)), 1000)
    return () => {
      if (ref.current) window.clearInterval(ref.current)
    }
  }, [running])

  const reset = useCallback(() => {
    setRunning(false)
    setLeft(TOTAL)
  }, [])

  return { left, running, setRunning, reset }
}

function Presenter({ index, onClose, onJump }: { index: number; onClose: () => void; onJump: (i: number) => void }) {
  const slot = order[index]
  const { left, running, setRunning, reset } = useTimer()

  // Restart the clock whenever a new team takes the stage.
  useEffect(() => {
    reset()
  }, [index, reset])

  const prev = useCallback(() => onJump((index - 1 + order.length) % order.length), [index, onJump])
  const next = useCallback(() => onJump((index + 1) % order.length), [index, onJump])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.code === 'Space') {
        e.preventDefault()
        setRunning((r) => !r)
      } else if (e.key.toLowerCase() === 'r') reset()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, next, prev, reset, setRunning])

  const urgent = left <= 30
  const over = left === 0

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-navy-950">
      <div className="flex shrink-0 flex-wrap items-center gap-4 border-b border-navy-800 px-5 py-3">
        {teamLogo(slot) && (
          <img src={teamLogo(slot)!} alt="" className="size-14 shrink-0 rounded-full ring-1 ring-navy-700" />
        )}
        <div className="min-w-0">
          <div className="text-[11px] tracking-[0.14em] text-ink-500 uppercase">
            Demo {index + 1} of {order.length}
          </div>
          <div className="truncate text-xl font-bold text-ink-100">
            {slot.letter && <span className="mr-2 text-amber-glow">{slot.letter}</span>}
            {teamLabel(slot)}
          </div>
          <div className="truncate text-sm text-ink-400">{slot.presenters ?? teamMembers(slot)}</div>
        </div>

        <div
          className={[
            'tnum ml-auto rounded-xl px-5 py-1.5 text-5xl font-bold',
            over ? 'bg-rose-500 text-white' : urgent ? 'bg-rose-400/15 text-rose-300' : 'text-amber-glow',
          ].join(' ')}
          aria-live="off"
        >
          {mmss(left)}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setRunning((r) => !r)}
            className="rounded-lg bg-navy-700 px-4 py-2 text-sm font-semibold hover:bg-navy-600"
          >
            {running ? 'Pause' : 'Start'}
          </button>
          <button type="button" onClick={reset} className="rounded-lg bg-navy-800 px-3 py-2 text-sm hover:bg-navy-700">
            Reset
          </button>
          <button type="button" onClick={prev} className="rounded-lg bg-navy-800 px-3 py-2 text-sm hover:bg-navy-700">
            ←
          </button>
          <button type="button" onClick={next} className="rounded-lg bg-navy-800 px-3 py-2 text-sm hover:bg-navy-700">
            →
          </button>
          <button type="button" onClick={onClose} className="rounded-lg bg-navy-800 px-3 py-2 text-sm hover:bg-navy-700">
            Esc
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        {slot.deck ? (
          <iframe src={deckUrl(slot.deck)} title={`${teamLabel(slot)} deck`} className="h-full w-full border-0" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <p className="text-3xl font-bold text-ink-200">{slot.title ?? 'Live demo'}</p>
            {slot.summary ? (
              <p className="max-w-3xl text-lg leading-relaxed text-ink-300">{slot.summary}</p>
            ) : (
              <p className="max-w-md text-ink-500">
                {slot.note ?? 'No slides for this team — they are presenting from their own screen.'}
              </p>
            )}
            {(slot.repo || slot.video || slot.share) && (
              <div className="flex flex-wrap justify-center gap-3">
                {slot.share && (
                  <a
                    href={slot.share}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg bg-amber-deep px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-amber-glow"
                  >
                    Open shared folder →
                  </a>
                )}
                {slot.repo && (
                  <a
                    href={slot.repo}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg bg-navy-700 px-4 py-2 text-sm font-semibold hover:bg-navy-600"
                  >
                    Open repo →
                  </a>
                )}
                {slot.video && (
                  <a
                    href={slot.video}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg bg-navy-700 px-4 py-2 text-sm font-semibold hover:bg-navy-600"
                  >
                    Play video →
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-navy-800 px-5 py-1.5 text-center text-[11px] text-ink-500">
        Space start/pause · R reset · ← → change team · Esc exit
      </div>
    </div>
  )
}

export default function Demos() {
  const [active, setActive] = useState<number | null>(null)

  if (order.length === 0) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold tracking-tight text-ink-100">Lightning demos</h1>
          <p className="mt-2 text-ink-400">2:15 PM · up to 10 teams · {TOTAL / 60} minutes each, gong-timed.</p>
        </header>
        <div className="rounded-xl border border-navy-800 bg-navy-900/50 px-6 py-14 text-center">
          <p className="text-lg font-semibold text-ink-300">Running order not set yet</p>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-ink-500">
            Drop decks into <code className="rounded bg-navy-800 px-1.5 py-0.5">public/decks/</code> and list the teams
            in <code className="rounded bg-navy-800 px-1.5 py-0.5">src/data/demos.json</code>. PowerPoint files are
            converted to PDF automatically.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink-100">Lightning demos</h1>
          <p className="mt-2 text-ink-400">
            {order.length} teams · {TOTAL / 60} minutes each · gong-timed
          </p>
          <p className="mt-1 text-sm text-ink-500">
            {order.filter((s) => s.deck).length} decks · {order.filter((s) => s.repo).length} repos ·{' '}
            {order.filter((s) => s.video).length} videos received
          </p>
        </div>
        <button
          type="button"
          onClick={() => setActive(0)}
          className="rounded-lg bg-amber-deep px-5 py-2.5 font-bold text-navy-950 transition-colors hover:bg-amber-glow"
        >
          Start demos →
        </button>
      </header>

      <ul className="space-y-2">
        {order.map((slot, i) => (
          <li
            key={`${slot.letter ?? i}-${i}`}
            className="flex items-center gap-4 rounded-xl border border-navy-800 bg-navy-900/50 px-4 py-3.5 transition-colors hover:border-amber-glow/50 hover:bg-navy-800/60"
          >
            <button
              type="button"
              onClick={() => setActive(i)}
              className="flex min-w-0 flex-1 items-center gap-4 text-left"
            >
              <span className="tnum w-7 shrink-0 text-lg font-bold text-ink-500">{i + 1}</span>
              {teamLogo(slot) ? (
                <img src={teamLogo(slot)!} alt="" className="size-10 shrink-0 rounded-full ring-1 ring-navy-700" />
              ) : (
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-navy-800 text-lg font-bold text-amber-glow">
                  {slot.letter}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-ink-100">
                  <span className="mr-2 text-amber-glow">{slot.letter}</span>
                  {teamLabel(slot)}
                </span>
                <span className="mt-0.5 block text-xs leading-snug text-ink-500">
                  {slot.presenters ?? teamMembers(slot) ?? ''}
                </span>
                {slot.title && <span className="mt-1 block text-sm text-sky-300">{slot.title}</span>}
              </span>
            </button>

            <span className="flex shrink-0 flex-wrap justify-end gap-1.5">
              <Pill label="Deck" href={slot.deck ? `${import.meta.env.BASE_URL}decks/${slot.deck}` : null} />
              <Pill label="Files" href={slot.share} />
              <Pill label="Repo" href={slot.repo} />
              <Pill label="Video" href={slot.video} />
            </span>
          </li>
        ))}
      </ul>

      {active !== null && order[active] && (
        <Presenter index={active} onClose={() => setActive(null)} onJump={setActive} />
      )}
    </div>
  )
}
