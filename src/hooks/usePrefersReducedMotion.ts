import { useEffect, useState } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

function readPreference(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia(QUERY).matches
}

/**
 * Única pieza JS del soporte de `prefers-reduced-motion` (017-plan.md,
 * bloque F): el veredicto gigante y el confeti se resuelven enteros en CSS
 * (`@media (prefers-reduced-motion: reduce)`, no necesitan saber nada en
 * JS); la escritura del nivel 11 sí, porque lo que cambia no es una
 * animación CSS sino QUÉ TEXTO se renderiza (`useTypewriter.ts`). Escucha
 * cambios en vivo (el jugador puede activar la preferencia del sistema con
 * la partida ya abierta) en vez de leerla una sola vez al montar.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(readPreference)

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const mql = window.matchMedia(QUERY)
    const handleChange = () => setReduced(mql.matches)
    mql.addEventListener('change', handleChange)
    return () => mql.removeEventListener('change', handleChange)
  }, [])

  return reduced
}
