import PhotoWall, { type Photo } from '../components/PhotoWall'
import photos from '../data/photos.json'

const list: Photo[] = Array.isArray(photos.photos) ? photos.photos : []

export default function Photos() {
  return (
    <PhotoWall
      title={photos.title}
      intro={photos.intro}
      dir="photos"
      photos={list}
      emptyTitle="No photos yet"
      emptyBody={
        <>
          Drop image files into <code className="rounded bg-navy-800 px-1.5 py-0.5 text-ink-400">public/photos/</code>{' '}
          and list them in <code className="rounded bg-navy-800 px-1.5 py-0.5 text-ink-400">src/data/photos.json</code>.
          They are compressed on the way in and appear here on the next deploy.
        </>
      }
    />
  )
}
