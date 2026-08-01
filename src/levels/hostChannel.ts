import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  type ReactNode,
  type RefObject,
} from 'react'

export type SetFooter = (footer: ReactNode) => void
export type SetWindowTransform = (transform: string | null) => void
export type SetWindowZIndex = (zIndex: number | null) => void
export type SetBoard = (board: ReactNode) => void
export type SetOverlay = (overlay: ReactNode) => void

/**
 * Canal único nivel→host con ranuras con nombre (007-plan.md, "consolidar el
 * canal en vez de un tercer hook suelto"): sustituye a `levelFooter.ts`.
 * `LevelHost` provee el valor; los niveles lo consumen a través de los
 * envoltorios finos de más abajo, nunca con `useContext` directo.
 */
export interface HostChannelValue {
  setFooter: SetFooter
  /**
   * Valor CSS completo de `transform` (p. ej. `rotate(30deg)` o
   * `translate(10px, 20px)`), aplicado por `LevelHost` como la custom
   * property `--window-transform` en el contenedor que envuelve `XPWindow`
   * (nivel 3: rotación libre; nivel 10, 014-plan.md: traslación de la
   * ventana nº 1 al arrastrarla). Generalizada desde una ranura
   * rotación-específica (`${deg}deg` envuelto en `rotate()` por el propio
   * host) a un valor de `transform` ya resuelto: cada hook de más abajo
   * (`useWindowRotation`, `useWindowTranslation`) decide su propia función
   * CSS antes de publicarla.
   */
  setWindowTransform: SetWindowTransform
  /**
   * Orden de apilado de la ventana entera frente a lo que un nivel pinte en
   * `overlay` (014-plan.md, nivel 10, corregido tras revisión de Sofía:
   * "queremos que se arrastre la pantalla de delante y deje de ocultar la
   * de atrás"). `LevelHost` la aplica como la custom property
   * `--window-z-index` en el mismo contenedor que `windowTransform`. Sin
   * publicar (o `null`), el contenedor no fija ningún `z-index` propio
   * (`auto`) — comportamiento de siempre para el resto de niveles.
   */
  setWindowZIndex: SetWindowZIndex
  /**
   * Nodo raíz del contenedor que rota/traslada, para que un nivel enganche
   * `usePointer` sobre TODA la ventana (barra de título incluida) sin
   * manipularla directamente: solo observa gestos sobre un nodo que ya
   * existe, igual que cualquier otro nivel hace con su propio contenido.
   */
  windowRef: RefObject<HTMLElement | null>
  /**
   * Ref de solo lectura a la barra de título real de la ventana del host
   * (014-plan.md): a diferencia de `windowRef` (toda la ventana, nivel 3),
   * un nivel que solo quiere detectar arrastres empezados EN la barra de
   * título — no en cualquier punto de la ventana, p. ej. sobre sus propios
   * botones del pie — engancha `usePointer` aquí en vez de sobre `windowRef`.
   */
  titleBarRef: RefObject<HTMLDivElement>
  /**
   * Tablero de juego que `XPWindow` renderiza DEBAJO del marco azul, fuera de
   * él (ranura `boardBelowFrame`), en vez de dentro de `children` — para
   * niveles donde el marco azul solo debe envolver el texto de
   * consentimiento (nivel 3, corregido tras revisión de Sofía: "el borde
   * azul oscuro SOLO cubre los términos y condiciones").
   */
  setBoard: SetBoard
  /**
   * Capa a pantalla completa por encima de la ventana (014-plan.md, nivel
   * 10): para niveles que necesitan renderizar contenido fuera de los
   * límites de `XPWindow` (las copias 2-7 de una ventana que se duplica).
   * `LevelHost` la monta como hermana de `.level-host`, nunca dentro del
   * contenedor que rota/traslada — así el `transform` de la ventana nº 1 no
   * arrastra consigo a las copias.
   */
  setOverlay: SetOverlay
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
    channel?.setWindowTransform(`rotate(${deg}deg)`)
    return () => channel?.setWindowTransform(null)
  }, [deg, channel])
}

/**
 * Publica una traslación en px de la ventana entera (014-plan.md, nivel 10:
 * arrastrar la ventana del host por su barra de título). Misma ranura que
 * `useWindowRotation` — un nivel no usa las dos a la vez. Se limpia al
 * desmontar.
 */
export function useWindowTranslation(x: number, y: number): void {
  const channel = useContext(HostChannelContext)

  useEffect(() => {
    channel?.setWindowTransform(`translate(${x}px, ${y}px)`)
    return () => channel?.setWindowTransform(null)
  }, [x, y, channel])
}

/**
 * Publica el `z-index` de la ventana entera frente al `overlay` — ver
 * `HostChannelValue.setWindowZIndex`. Se limpia (vuelve a `auto`) al
 * desmontar.
 */
export function useWindowZIndex(zIndex: number): void {
  const channel = useContext(HostChannelContext)

  useEffect(() => {
    channel?.setWindowZIndex(zIndex)
    return () => channel?.setWindowZIndex(null)
  }, [zIndex, channel])
}

/** Ref de solo lectura al contenedor que rota/traslada — ver `HostChannelValue.windowRef`. */
export function useHostWindowRef(): RefObject<HTMLElement | null> | null {
  const channel = useContext(HostChannelContext)
  return channel?.windowRef ?? null
}

/** Ref de solo lectura a la barra de título real del host — ver `HostChannelValue.titleBarRef`. */
export function useHostTitleBarRef(): RefObject<HTMLDivElement> | null {
  const channel = useContext(HostChannelContext)
  return channel?.titleBarRef ?? null
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

/**
 * Publica una capa a pantalla completa por encima de la ventana — ver
 * `HostChannelValue.setOverlay` (014-plan.md, nivel 10: las copias 2-7 de
 * una ventana que se duplica). `useLayoutEffect` (no `useEffect`), mismo
 * motivo que `useLevelBoard`: evita un fotograma con la capa vacía antes de
 * que su contenido real quede montado.
 */
export function useLevelOverlay(overlay: ReactNode): void {
  const channel = useContext(HostChannelContext)

  useLayoutEffect(() => {
    channel?.setOverlay(overlay)
    return () => channel?.setOverlay(null)
  }, [overlay, channel])
}
