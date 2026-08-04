import { createRng } from '../../utils/prng'

export interface Point {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

/**
 * Ventana del nivel 10 (014-plan.md). `x`/`y` es una posición en px: para la
 * ventana del host (id `HOST_WINDOW_ID`) es el desplazamiento acumulado
 * (`transform: translate`, ranura `windowTransform`) desde su reposo; para
 * una copia (posición fija en viewport) es su esquina superior izquierda
 * absoluta — el modelo no distingue entre los dos casos, es el componente
 * quien decide cómo pintar cada uno.
 */
export interface WindowState {
  id: number
  x: number
  y: number
  /** Ya generó su única copia — arrastrarla de nuevo la mueve pero no duplica. */
  hasSpawned: boolean
  /**
   * Orden de apilado (mayor = más arriba). El apilado NO es fijo por orden
   * de creación — la ventana que se agarra pasa al frente al instante
   * (`bringToFront`), para que sea inequívocamente ella la que se ve
   * moverse, nunca la de detrás.
   */
  zIndex: number
}

/** GDD §14: tope de ventanas del nivel 10. */
export const MAX_WINDOWS = 7

/**
 * Umbral "móvil" de esta feature: `xs` + `sm` (GDD §15.1, ≤480px), no solo
 * `xs` (≤375px). Corregido tras probar en un móvil real: con el umbral en
 * 375px, los teléfonos normales (390-430px de ancho, la
 * inmensa mayoría) no recibían ni la ventana compacta (`compactOnMobile`)
 * ni el asomo parcial — se quedaban con ventanas a tamaño casi completo y
 * contención total, que en una pantalla estrecha es prácticamente el mismo
 * ancho que el viewport: un arrastre normal de dedo no las separaba lo
 * bastante como para dejar de tapar a la ventana de debajo (confirmado
 * simulando toques reales por CDP, no solo ratón — ver `014-tasks.md`).
 */
export const MOBILE_BREAKPOINT_PX = 480

/** Fracción mínima del ancho de una ventana que debe quedar siempre visible en móvil (GDD §15.2). */
export const MOBILE_MIN_VISIBLE_RATIO = 0.3

/**
 * `minVisibleX` a pasarle a `clampToViewport` según el ancho actual del
 * viewport: contención total salvo en móvil, donde se permite el asomo
 * parcial (ver `clampToViewport`). Única excepción a "sin DOM" de este
 * archivo — es una política de un solo número, no vale la pena una ranura
 * de canal ni duplicarla entre `Level10.tsx` y `LevelWindow.tsx`.
 */
export function minVisibleXFor(width: number): number {
  return window.innerWidth <= MOBILE_BREAKPOINT_PX ? width * MOBILE_MIN_VISIBLE_RATIO : width
}

/** La ventana del host (la real, dentro de `XPWindow`) es siempre la primera. */
export const HOST_WINDOW_ID = 1

export function createInitialWindows(): WindowState[] {
  return [{ id: HOST_WINDOW_ID, x: 0, y: 0, hasSpawned: false, zIndex: 1 }]
}

/**
 * Trae una ventana al frente de la pila: la que se arrastra debe dejar de
 * ocultar a las de atrás. Se llama al EMPEZAR cada arrastre, duplique o
 * no — agarrar una ventana ya parida también debe traerla al frente.
 */
export function bringToFront(windows: WindowState[], id: number): WindowState[] {
  const maxZ = windows.reduce((max, win) => Math.max(max, win.zIndex), 0)
  return windows.map((win) => (win.id === id ? { ...win, zIndex: maxZ + 1 } : win))
}

export interface SpawnOutcome {
  windows: WindowState[]
  /** `null` si no se generó copia (tope alcanzado o la ventana ya había parido la suya). */
  spawnedId: number | null
}

/**
 * Arrastrar una ventana la duplica una única vez (014-plan.md, "cada
 * ventana solo puede generar una copia una única vez"), hasta un tope total
 * de `MAX_WINDOWS`. La copia nace en `spawnPos` — la posición que ocupaba la
 * ventana origen al EMPEZAR el arrastre (decisión de diseño: "me llevo esta
 * y queda otra debajo"), nunca en cascada ni al azar.
 */
export function spawnFrom(windows: WindowState[], sourceId: number, spawnPos: Point): SpawnOutcome {
  if (windows.length >= MAX_WINDOWS) return { windows, spawnedId: null }

  const source = windows.find((win) => win.id === sourceId)
  if (!source || source.hasSpawned) return { windows, spawnedId: null }

  const nextId = windows.reduce((max, win) => Math.max(max, win.id), 0) + 1
  const nextZ = windows.reduce((max, win) => Math.max(max, win.zIndex), 0) + 1
  const updated = windows.map((win) => (win.id === sourceId ? { ...win, hasSpawned: true } : win))
  // Nace por DEBAJO de la que se está arrastrando (`bringToFront` la sube
  // todavía más justo después, en la misma transacción del llamador): la
  // copia se queda quieta "debajo" mientras la original se aleja por encima.
  const clone: WindowState = {
    id: nextId,
    x: spawnPos.x,
    y: spawnPos.y,
    hasSpawned: false,
    zIndex: nextZ,
  }

  return { windows: [...updated, clone], spawnedId: nextId }
}

/** Confirma la posición final de una ventana (solo al soltar el arrastre, 014-plan.md). */
export function moveWindow(windows: WindowState[], id: number, pos: Point): WindowState[] {
  return windows.map((win) => (win.id === id ? { ...win, x: pos.x, y: pos.y } : win))
}

/**
 * Limita una posición propuesta (esquina superior izquierda) para que un
 * rectángulo de `size` no se pierda fuera de `viewport` — ninguna ventana
 * puede quedar inalcanzable (014-plan.md, mismo criterio que la cubierta del
 * nivel 7). Pura: sin DOM, solo aritmética.
 *
 * `minVisibleX` (opcional, por defecto `size.width` = contención total,
 * comportamiento original): cuánto ancho como mínimo debe quedar SIEMPRE
 * dentro del viewport en el eje X. En móvil las ventanas pueden asomar
 * parcialmente por los lados (parte del
 * caos), pero nunca deben poder desaparecer del todo — con un valor menor
 * que `size.width` se permite ese asomo sin perder nunca la garantía de
 * alcanzabilidad. El eje Y se mantiene siempre con contención total (el
 * asomo es solo lateral, GDD §15.2).
 */
export function clampToViewport(
  pos: Point,
  size: Size,
  viewport: Size,
  minVisibleX: number = size.width,
): Point {
  const minX = minVisibleX - size.width
  const maxX = Math.max(minX, viewport.width - minVisibleX)
  const maxY = Math.max(0, viewport.height - size.height)
  return {
    x: Math.min(Math.max(pos.x, minX), maxX),
    y: Math.min(Math.max(pos.y, 0), maxY),
  }
}

/**
 * Al llegar a la séptima ventana, sortea cuál de las `ids` lleva el Agree
 * (014-plan.md, "sorteo reproducible por semilla"). PRNG compartido
 * (`src/utils/prng.ts`), sembrado una vez por partida. El llamador decide
 * qué `ids` son candidatas — el nivel excluye la última ventana creada:
 * la recién nacida nunca lleva el Agree, para que no se resuelva "sola"
 * nada más aparecer.
 */
export function pickAgreeWindow(seed: number, ids: number[]): number {
  const rng = createRng(seed)
  const index = Math.floor(rng() * ids.length)
  return ids[index]
}
