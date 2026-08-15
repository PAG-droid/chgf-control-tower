import { useCallback, useEffect, useState } from 'react'

export type Photo = {
  file: string
  caption?: string
  credit?: string
  time?: string
}

type Props = {
  title: string
  intro?: string
  /** Folder under public/, e.g. "gallery" or "photos". */
  dir: string
  photos: Photo[]
  /** Shown when the wall is empty. */
  emptyTitle: string
  emptyBody: React.ReactNode
}

function Lightbox({
  photo,
  src,
  onClose,
  onPrev,
  onNext,
}: {
  photo: Photo
  src: string
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'ArrowRight') onNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, onPrev, onNext])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-navy-950/95 p-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={photo.caption ?? 'Photo'}
      onClick={onClose}
    >
      <img
        src={src}
        alt={photo.caption ?? ''}
        className="max-h-[80vh] max-w-full rounded-lg object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      {(photo.caption || photo.credit || photo.time) && (
        <div className="mt-4 max-w-2xl text-center">
          {photo.caption && <p className="text-ink-100">{photo.caption}</p>}
          <p className="mt-1 text-xs text-ink-500">{[photo.credit, photo.time].filter(Boolean).join(' · ')}</p>
        </div>
      )}
      <p className="mt-4 text-xs text-ink-500">← → to browse · Esc to close</p>
    </div>
  )
}

export default function PhotoWall({ title, intro, dir, photos, emptyTitle, emptyBody }: Props) {
  const [open, setOpen] = useState<number | null>(null)

  const src = useCallback((file: string) => `${import.meta.env.BASE_URL}${dir}/${file}`, [dir])
  const prev = useCallback(
    () => setOpen((i) => (i === null ? null : (i - 1 + photos.length) % photos.length)),
    [photos.length],
  )
  const next = useCallback(() => setOpen((i) => (i === null ? null : (i + 1) % photos.length)), [photos.length])

  return (
    <div className="space-y-7">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink-100">{title}</h1>
        <p className="mt-2 max-w-2xl text-ink-400">
          {photos.length > 0
            ? `${photos.length} ${photos.length === 1 ? 'image' : 'images'}${intro ? ` — ${intro}` : '.'}`
            : (intro ?? 'Nothing here yet.')}
        </p>
      </header>

      {photos.length === 0 ? (
        <div className="rounded-xl border border-navy-800 bg-navy-900/50 px-6 py-16 text-center">
          <p className="text-lg font-semibold text-ink-300">{emptyTitle}</p>
          <div className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-500">{emptyBody}</div>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((p, i) => (
            <li key={p.file}>
              <button
                type="button"
                onClick={() => setOpen(i)}
                className="group block w-full overflow-hidden rounded-xl border border-navy-800 bg-navy-900/50 text-left transition-colors hover:border-amber-glow/40"
              >
                <img
                  src={src(p.file)}
                  alt={p.caption ?? ''}
                  loading="lazy"
                  className="aspect-4/3 w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
                {(p.caption || p.time) && (
                  <div className="px-3.5 py-2.5">
                    {p.caption && <p className="text-sm text-ink-300">{p.caption}</p>}
                    {(p.credit || p.time) && (
                      <p className="mt-0.5 text-[11px] text-ink-500">
                        {[p.credit, p.time].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {open !== null && photos[open] && (
        <Lightbox
          photo={photos[open]}
          src={src(photos[open].file)}
          onClose={() => setOpen(null)}
          onPrev={prev}
          onNext={next}
        />
      )}
    </div>
  )
}
