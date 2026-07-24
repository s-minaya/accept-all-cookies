import { createContext, useContext, useEffect, useLayoutEffect, type ReactNode, type RefObject } from 'react'

export type SetFooter = (footer: ReactNode) => void
export type SetWindowTransform = (transform: string | null) => void
export type SetBoard = (board: ReactNode) => void

/**
 * Canal único nivel→host con ranuras con nombre (007-plan.md, "consolidar el
 * canal en vez de un tercer hook suelto"): sustituye a `levelFooter.ts`.
 * `LevelHost` provee el valor; los niveles lo consumen a través de los
 * envoltorios finos de más abajo, nunca con `useContext` directo.
 */
export interface HostChannelValue {
  setFooter: SetFooter
  /** Aplicado por `LevelHost` como la custom property `--window-rotation` en el contenedor que rota. */
  setWindowTransform: SetWindowTransform
  /**
   * Nodo raíz del contenedor que rota, para que un nivel enganche `usePointer`
   * sobre TODA la ventana (barra de título incluida) sin manipularla
   * directamente: solo observa gestos sobre un nodo que ya existe, igual que
   * cualquier otro nivel hace con su propio contenido.
   */
  windowRef: RefObject<HTMLElement | null>
  /**
   * Tablero de juego que `XPWindow` renderiza DEBAJO del marco azul, fuera de
   * él (ranura `boardBelowFrame`), en vez de dentro de `children` — para
   * niveles donde el marco azul solo debe envolver el texto de
   * consentimiento (nivel 3, corregido tras revisión de Sofía: "el borde
   * azul oscuro SOLO cubre los términos y condiciones").
   */
  setBoard: SetBoard
}

export const HostChannelContext = createContext<HostChannelValue | null>(null)

/**
 * Registra los botones inferiores del nivel (GDD §4.5) en el pie de
 * `XPWindow`, fuera del marco azul del área de juego — no como parte del
 * contenido del nivel. Se limpia solo al desmontar o si el nivel deja de
 * pasar contenido. Envoltorio fino sobre la ranura `footer` del canal
 * (firma y semántica sin cambios desde la 005).
 */
export function useLevelFooter(footer: ReactNode): void {
  const channel = useContext(HostChannelContext)

  useEffect(() => {
    channel?.setFooter(footer)
    return () => channel?.setFooter(null)
  }, [footer, channel])
}

/**
 * Publica los grados de rotación de la ventana entera (007-plan.md): el
 * nivel solo dice "cuánto", `LevelHost` es quien aplica la transformación.
 * Se limpia (vuelve a 0°) al desmontar.
 */
export function useWindowRotation(deg: number): void {
  const channel = useContext(HostChannelContext)

  useEffect(() => {
    channel?.setWindowTransform(`${deg}deg`)
    return () => channel?.setWindowTransform(null)
  }, [deg, channel])
}

/** Ref de solo lectura al contenedor que rota — ver `HostChannelValue.windowRef`. */
export function useHostWindowRef(): RefObject<HTMLElement | null> | null {
  const channel = useContext(HostChannelContext)
  return channel?.windowRef ?? null
}

/**
 * Publica el tablero de juego que se renderiza debajo del marco azul, fuera
 * de él — ver `HostChannelValue.setBoard`. A diferencia de `useLevelFooter`
 * usa `useLayoutEffect`: el nivel 3 depende de que su tablero quede montado
 * (y su física sincronizada) antes del primer pintado, para no repetir el
 * "flash" de carga ya corregido una vez (007-plan.md, segunda ronda).
 */
export function useLevelBoard(board: ReactNode): void {
  const channel = useContext(HostChannelContext)

  useLayoutEffect(() => {
    channel?.setBoard(board)
    return () => channel?.setBoard(null)
  }, [board, channel])
}
