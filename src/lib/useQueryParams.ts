import { useCallback } from 'react'
import { useSearchParams } from 'react-router'

/**
 * Filtros guardados en la URL (?status=&torre=&q=&page=) para que las vistas
 * se puedan compartir y sobrevivan a un refresco del navegador.
 */
export function useQueryParams<K extends string>() {
  const [params, setParams] = useSearchParams()

  const get = useCallback((key: K | 'page') => params.get(key) ?? '', [params])

  const getNumber = useCallback(
    (key: K | 'page', fallback: number) => {
      const n = Number(params.get(key))
      return Number.isInteger(n) && n > 0 ? n : fallback
    },
    [params],
  )

  /** Actualiza claves; cualquier cambio que no sea de `page` vuelve a la página 1. */
  const update = useCallback(
    (changes: Partial<Record<K | 'page', string | number | null>>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          for (const [k, v] of Object.entries(changes)) {
            if (v === null || v === undefined || v === '') next.delete(k)
            else next.set(k, String(v))
          }
          if (!('page' in changes)) next.delete('page')
          return next
        },
        { replace: true },
      )
    },
    [setParams],
  )

  return { get, getNumber, update }
}
