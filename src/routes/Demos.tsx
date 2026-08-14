import { useCallback, useEffect, useRef, useState } from 'react'
import demos from '../data/demos.json'
import teams from '../data/teams.json'

type Slot = {
  letter?: string
  team?: string
  deck?: string | null
  presenters?: string
  note?: string
}

const order: Slot[] = Array.isArray(demos.order) ? demos.order : []
const TOTAL = typeof demos.secondsPerDemo === 'number' ? demos.secondsPerDemo : 120

function teamLabel(slot: Slot): string {
  if (slot.team) return slot.team
  const match = teams.teams.find((t) => t.letter === slot.letter)
  return match?.name ?? (slot.letter ? `Team ${slot.letter}` : 'Unnamed team')
}

function deckUrl(file: string): string {
  // #toolbar=0 hides the browser PDF chrome so the slide fills the screen.
  return `${import.meta.env.BASE_URL}decks/${file}#toolbar=0&navpanes=0&view=FitH`
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
        <div className="min-w-0">
          <div className="text-[11px] tracking-[0.14em] text-ink-500 uppercase">
            Demo {index + 1} of {order.length}
          </div>
          <div className="truncate text-xl font-bold text-ink-100">
            {slot.letter && <span className="mr-2 text-amber-glow">{slot.letter}</span>}
            {teamLabel(slot)}
          </div>
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
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <p className="text-3xl font-bold text-ink-200">Live demo</p>
            <p className="max-w-md text-ink-500">
              {slot.note ?? 'No slides for this team — they are presenting from their screen.'}
            </p>
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
          <li key={`${slot.letter ?? i}-${i}`}>
            <button
              type="button"
              onClick={() => setActive(i)}
              className="flex w-full items-center gap-4 rounded-xl border border-navy-800 bg-navy-900/50 px-4 py-3.5 text-left transition-colors hover:border-amber-glow/50 hover:bg-navy-800/60"
            >
              <span className="tnum w-7 shrink-0 text-lg font-bold text-ink-500">{i + 1}</span>
              <span className="w-7 shrink-0 text-lg font-bold text-amber-glow">{slot.letter}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-ink-100">{teamLabel(slot)}</span>
                {slot.presenters && <span className="block truncate text-xs text-ink-500">{slot.presenters}</span>}
              </span>
              <span
                className={[
                  'shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase',
                  slot.deck
                    ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                    : 'border-sky-400/30 bg-sky-400/10 text-sky-300',
                ].join(' ')}
              >
                {slot.deck ? 'Deck ready' : 'Live demo'}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {active !== null && order[active] && (
        <Presenter index={active} onClose={() => setActive(null)} onJump={setActive} />
      )}
    </div>
  )
}
