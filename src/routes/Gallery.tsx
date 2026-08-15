import PhotoWall, { type Photo } from '../components/PhotoWall'
import gallery from '../data/gallery.json'

const list: Photo[] = Array.isArray(gallery.photos) ? gallery.photos : []

export default function Gallery() {
  return (
    <PhotoWall
      title={gallery.title}
      intro="the promo art that ran alongside the event."
      dir="gallery"
      photos={list}
      emptyTitle="Nothing here yet"
      emptyBody={
        <>
          Drop image files into <code className="rounded bg-navy-800 px-1.5 py-0.5 text-ink-400">public/gallery/</code>{' '}
          and list them in{' '}
          <code className="rounded bg-navy-800 px-1.5 py-0.5 text-ink-400">src/data/gallery.json</code>.
        </>
      }
    />
  )
}
