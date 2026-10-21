import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="font-mono text-5xl font-semibold text-slate-700">404</p>
      <p className="mt-3 text-sm text-slate-400">La página que buscas no existe.</p>
      <Link to="/" className="mt-6 text-sm font-medium text-sky-400 hover:text-sky-300">
        Volver al dashboard
      </Link>
    </div>
  )
}
