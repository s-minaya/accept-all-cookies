import { createContext, useContext, useEffect, type ReactNode } from 'react'

export type SetLevelFooter = (footer: ReactNode) => void

/** `LevelHost` provee el setter; lo consume `useLevelFooter` dentro del nivel. */
export const LevelFooterContext = createContext<SetLevelFooter | null>(null)

/**
 * Registra los botones inferiores del nivel (GDD §4.5) en el pie de
 * `XPWindow`, fuera del marco azul del área de juego — no como parte del
 * contenido del nivel. Se limpia solo al desmontar o si el nivel deja de
 * pasar contenido.
 */
export function useLevelFooter(footer: ReactNode): void {
  const setFooter = useContext(LevelFooterContext)

  useEffect(() => {
    setFooter?.(footer)
    return () => setFooter?.(null)
  }, [footer, setFooter])
}
