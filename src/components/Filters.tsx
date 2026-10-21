import { RadioTower, Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTowers } from '@/api/queries'

export function SearchInput({
  value,
  onChange,
  placeholder,
  delay = 350,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  delay?: number
}) {
  const [draft, setDraft] = useState(value)
  const [prevValue, setPrevValue] = useState(value)

  if (value !== prevValue) {
    setPrevValue(value)
    setDraft(value)
  }

  useEffect(() => {
    if (draft === value) return
    const t = setTimeout(() => onChange(draft.trim()), delay)
    return () => clearTimeout(t)
  }, [draft, value, onChange, delay])

  return (
    <div className="relative w-full sm:w-72">
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-slate-500" />
      <input
        type="search"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-700 bg-slate-900 py-2 pr-8 pl-8 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {draft && (
        <button
          type="button"
          aria-label="Limpiar búsqueda"
          onClick={() => {
            setDraft('')
            onChange('')
          }}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-slate-500 hover:text-slate-200"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}

export function TowerSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { data, isLoading } = useTowers()
  const towers = [...(data?.towers ?? [])].sort((a, b) => a.name.localeCompare(b.name))
  const known = towers.some((t) => t.name === value)

  return (
    <div className="relative w-full sm:w-64">
      <RadioTower className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-slate-500" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-lg border border-slate-700 bg-slate-900 py-2 pr-3 pl-8 text-sm text-slate-100 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none"
      >
        <option value="">{isLoading ? 'Cargando torres…' : 'Todas las torres'}</option>
        {value && !known && <option value={value}>{value}</option>}
        {towers.map((t) => (
          <option key={t.name} value={t.name}>
            {t.name}
          </option>
        ))}
      </select>
    </div>
  )
}
