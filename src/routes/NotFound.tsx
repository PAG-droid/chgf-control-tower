import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="py-24 text-center">
      <p className="text-sm font-semibold tracking-[0.14em] text-amber-glow uppercase">404</p>
      <h1 className="mt-3 text-3xl font-bold text-ink-100">Nothing scheduled here</h1>
      <Link to="/" className="mt-6 inline-block rounded-lg bg-navy-700 px-5 py-2.5 text-sm font-semibold hover:bg-navy-600">
        Back to the live agenda
      </Link>
    </div>
  )
}
