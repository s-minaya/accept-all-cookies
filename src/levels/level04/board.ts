import * as Matter from 'matter-js'
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from '../../components/GameArea'
import { clampPaddleX, stepKeyboardX, type KeyboardDirection } from './control'
import { createRng, nextSpawnPoint, type FallingType } from './spawner'

/** Distribución clásica de Plinko al tresbolillo (GDD §14: 30 pegs exactos). */
export const PEG_ROWS = 6
export const PEGS_PER_ROW = 5
export const PEG_COUNT = PEG_ROWS * PEGS_PER_ROW
export const PEG_RADIUS = 5
const PEG_TOP_MARGIN = 50
// > FALLING_HEIGHT (más abajo): si las filas quedan más juntas que la
// altura de un botón, uno puede quedar tocando DOS filas de pegs a la vez y
// encajarse de verdad, sin energía para seguir cayendo (bug real: al subir
// FALLING_HEIGHT de 20 a 40 sin subir esto a la vez, varios botones
// quedaban permanentemente atascados en el campo de pegs). Subido de 46 a
// 52 junto con `LOGICAL_HEIGHT` (360→420, `GameArea.tsx`): mismos 30 pegs
// (GDD §14, sin tocar), repartidos en más alto real en vez de dejar el
// espacio nuevo vacío entre el campo de pegs y la paleta.
const PEG_ROW_SPACING = 52
const PEG_SIDE_MARGIN = 60

/** Población máxima simultánea de botones cayendo (GDD §14, ajustable). */
export const FALL_MAX_POPULATION = 14
/** Población en dispositivos táctiles: menos sitio en pantalla (mismo criterio que el nivel 3). */
export const FALL_MAX_POPULATION_MOBILE = 8
/** Cada cuánto (ms) puede activarse un botón más, hasta el máximo (GDD §14). */
export const FALL_SPAWN_INTERVAL_MS = 300
/** Velocidad (px/tick) por debajo de la cual un botón se considera "reposando". */
const REST_SPEED_THRESHOLD = 0.05
/**
 * Tiempo (ms) reposando antes de reciclar un botón que caía, por DEBAJO del
 * campo de pegs (`PEG_FIELD_BOTTOM_Y`) — ahí solo hay paleta y aire, así
 * que quedarse quieto significa encajado de verdad (p. ej. contra una
 * pared), sin ambigüedad posible.
 */
const REST_THRESHOLD_BELOW_PEGS_MS = 2000
/** Y por debajo de la cual ya se ha cruzado el campo de pegs. */
const PEG_FIELD_BOTTOM_Y = PEG_TOP_MARGIN + (PEG_ROWS - 1) * PEG_ROW_SPACING + 20
/**
 * Dentro del campo de pegs NO se usa el umbral de velocidad (más abajo):
 * un cuerpo encajado entre dos pegs puede seguir "temblando" con velocidad
 * por encima de `REST_SPEED_THRESHOLD` sin avanzar de verdad hacia abajo —
 * con ese criterio, el empujón de liberación (ver más abajo) casi nunca
 * llegaba a dispararse (corregido tras revisión de Sofía: "no están
 * rebotando en los puntos cuando se quedan pillados"). En su lugar se mide
 * el PROGRESO neto en Y: cuánto tiempo lleva sin bajar al menos
 * `STUCK_PROGRESS_EPSILON_PX`, se mueva como se mueva mientras tanto.
 */
const STUCK_KICK_THRESHOLD_MS = 700
/** Bajada mínima (px lógicos) en ese tiempo para no contar como "sin progreso". */
const STUCK_PROGRESS_EPSILON_PX = 5
/**
 * Dentro del campo de pegs, un botón sin progreso recibe un empujón para
 * liberarse (en vez de desaparecer y reaparecer arriba en silencio) hasta
 * este número de veces antes de reciclarlo de verdad como red de seguridad
 * final (corregido tras revisión de Sofía: "cuando un agree o disagree que
 * se quede enganchado debe rebotar en los puntitos un poco").
 */
const MAX_STUCK_KICKS = 3
/** Velocidad del empujón al liberar un botón encajado contra un peg. */
const STUCK_KICK_SPEED = 1.4

/**
 * Tamaño lógico del botón grande (paleta): EXACTO al de un botón Agree/
 * Disagree habitual del juego (`XPButton`, `--xp-button-height: 3rem` por
 * defecto = 48px, ancho = alto × 2.3 = 110.4px) — bajado de 220×44 tras
 * revisión de Sofía: "es demasiado grande. Debe ser del tamaño exacto de
 * los agree/disagree habituales". El sistema de escalado del juego (GDD:
 * "resolución lógica fija + escala") hace que 1px lógico de `GameArea`
 * equivalga a 1px real de la ventana sin escalar, igual que cualquier
 * botón normal fuera de un nivel con tablero — de ahí que reutilizar el
 * mismo número de píxeles sea, literalmente, el mismo tamaño.
 */
export const PADDLE_WIDTH = 48 * 2.3
export const PADDLE_HEIGHT = 48
export const PADDLE_Y = LOGICAL_HEIGHT - 30
/**
 * El anillo exterior de la paleta (`Level04.module.scss`, `box-shadow: 0 0
 * 0 3px ...`) se dibuja 3px por FUERA de su propia caja — con la paleta en
 * uno u otro extremo de la guía, esos 3px quedaban más allá del borde del
 * lienzo lógico y el propio `overflow: hidden` de `GameArea` los recortaba,
 * dejando el anillo invisible en ese extremo (corregido tras revisión de
 * Sofía: "no se ve el borde del final"). El clamping dentro de la guía
 * (`clampPaddleX`, más abajo) reserva este margen para que el anillo entero
 * quepa siempre dentro del lienzo.
 */
const PADDLE_OUTER_RING_PX = 3
/**
 * Tamaño lógico de cada botón que cae. Subido de 38×16 tras revisión de
 * Sofía: "deben tener el texto de agree y disagree, con la fuente habitual
 * y el estilo" + "hazlos un poco más grandes y largos, ahora caen demasiado
 * y no rebotan" — a 38×16, sin texto, apenas rozaban los pegs. No vuelve a
 * los 92×40 originales (ese ancho tan plano fue lo que causó el
 * amontonamiento de la ronda anterior): en su lugar el texto usa una fuente
 * más pequeña que la de un botón real (`Level04.module.scss`,
 * `&__falling-label`) para que quepa en un cuerpo bastante más compacto.
 * Altura bajada de 32 a 22 tras nueva revisión de Sofía ("más finos"),
 * ancho sin cambios.
 */
export const FALLING_WIDTH = 72
export const FALLING_HEIGHT = 22
/**
 * La zona de captura (cuerpo físico) puede ser más estrecha que el ancho
 * visual del botón (008-plan.md, riesgo "capturas injustas") — parámetro
 * pensado para afinarse en el checkpoint visual/de dificultad con Sofía.
 */
export const PADDLE_SENSOR_WIDTH_RATIO = 1

const WALL_THICKNESS = 40
/**
 * Margen a los lados del tablero donde no nace ningún botón. Derivado del
 * propio semiancho del botón (no un número suelto): si el margen fuera más
 * estrecho que `FALLING_WIDTH / 2`, un botón podría nacer ya solapado con
 * la pared — matter.js resuelve una interpenetración profunda con un
 * impulso enorme en un solo paso, lanzando el cuerpo a una velocidad
 * absurda (bug real: al subir `FALLING_WIDTH` de 46 a 92 sin subir este
 * margen a la vez, la simulación entera se quedaba congelada al poco de
 * empezar).
 */
const SPAWN_MARGIN_X = FALLING_WIDTH / 2 + 10

export interface PegPosition {
  x: number
  y: number
}

/**
 * Posiciones de los 30 pegs, al tresbolillo (filas iguales, desplazadas media
 * columna en las filas impares) — pura y determinista, para que el DOM
 * (`Level04.tsx`) y la física (`createBoardSimulation`) usen exactamente las
 * mismas coordenadas sin duplicarlas a mano.
 */
export function generatePegPositions(canvasWidth: number = LOGICAL_WIDTH): PegPosition[] {
  const positions: PegPosition[] = []
  // `PEGS_PER_ROW - 0.5` (no `- 1`): las filas impares se desplazan media
  // columna, así que la fila MÁS ANCHA es una impar (llega media columna más
  // lejos que una fila par de 5 columnas normales) — dimensionar el espaciado
  // por esa fila es lo que mantiene a los pegs desplazados dentro del lienzo
  // en vez de salirse por la derecha.
  const colSpacing = (canvasWidth - PEG_SIDE_MARGIN * 2) / (PEGS_PER_ROW - 0.5)

  for (let row = 0; row < PEG_ROWS; row++) {
    const offset = row % 2 === 1 ? colSpacing / 2 : 0
    const y = PEG_TOP_MARGIN + row * PEG_ROW_SPACING
    for (let col = 0; col < PEGS_PER_ROW; col++) {
      positions.push({ x: PEG_SIDE_MARGIN + offset + col * colSpacing, y })
    }
  }

  return positions
}

export interface BoardOptions {
  /** Pool fijo de elementos para los botones que caen, ya montados — nunca se crean ni destruyen. */
  fallingSlots: HTMLElement[]
  paddleEl: HTMLElement
  /** Recibe la X actual (0..canvasWidth) en cada paso, para la guía beige. */
  guideFillEl?: HTMLElement
  maxPopulation?: number
  spawnIntervalMs?: number
  /** Semilla del PRNG de `spawner.ts` — inyectable para tests y reproducciones (008-plan.md). */
  seed?: number
  /** X deseada actual (lógica), escrita por `usePointer`/teclado en `Level04.tsx`. */
  getControlX: () => number
  setControlX: (x: number) => void
  /** -1/0/1: qué flecha está pulsada ahora mismo. */
  getKeyboardDirection: () => KeyboardDirection
  /** Un botón caído ha tocado el botón grande: retirarlo y anotar el segmento. */
  onCapture: (type: FallingType) => void
  /** El pool ha reasignado el slot `index` a un tipo nuevo (React actualiza su variante visual). */
  onSlotType: (index: number, type: FallingType) => void
}

export interface BoardSimulation {
  setPaused: (paused: boolean) => void
  /** Runner parado, listeners desconectados y engine destruido — nada vivo tras llamarlo. */
  destroy: () => void
}

interface FallingSlot {
  body: Matter.Body
  el: HTMLElement
  index: number
  halfWidth: number
  halfHeight: number
  active: boolean
  type: FallingType
  /** Solo para DEBAJO del campo de pegs: umbral de velocidad, sin ambigüedad ahí. */
  restSince: number | null
  /** Solo para DENTRO del campo de pegs: última Y en la que hubo progreso neto hacia abajo. */
  lastProgressY: number | null
  progressSince: number | null
  stuckKicks: number
}

function syncTransform(
  el: HTMLElement,
  x: number,
  y: number,
  halfWidth: number,
  halfHeight: number,
  angle = 0,
): void {
  el.style.transform = `translate(${x - halfWidth}px, ${y - halfHeight}px) rotate(${angle}rad)`
}

/**
 * Empuja el cuerpo en la dirección opuesta al peg más cercano (rebote
 * "de verdad" contra el que está encajado), con un mínimo de velocidad
 * hacia abajo para que no se quede subiendo en vez de seguir cayendo si el
 * peg queda justo encima.
 */
function kickAwayFromNearestPeg(body: Matter.Body, pegs: Matter.Body[]): void {
  let nearest: Matter.Body | null = null
  let nearestDistSq = Infinity
  for (const peg of pegs) {
    const dx = body.position.x - peg.position.x
    const dy = body.position.y - peg.position.y
    const distSq = dx * dx + dy * dy
    if (distSq < nearestDistSq) {
      nearestDistSq = distSq
      nearest = peg
    }
  }
  if (!nearest) return

  const dx = body.position.x - nearest.position.x
  const dy = body.position.y - nearest.position.y
  const dist = Math.sqrt(dx * dx + dy * dy) || 1
  Matter.Body.setVelocity(body, {
    x: (dx / dist) * STUCK_KICK_SPEED,
    y: Math.max(0.3, (dy / dist) * STUCK_KICK_SPEED),
  })
}

/**
 * Física del Plinko (008-plan.md): matter.js dinámico, compartido con el
 * mismo chunk-por-nivel que estrenó la 007. 30 pegs estáticos, un pool fijo
 * de botones que caen (reciclados, nunca creados/destruidos — mismo patrón
 * que `rain.ts`), y el botón grande como cuerpo "cinemático": estático de
 * verdad para matter.js (nunca responde a la gravedad), pero se teletransporta
 * a la posición del control en cada paso — participa en las colisiones
 * (rebotes realistas contra los botones que caen) sin que la física decida
 * su posición.
 */
export function createBoardSimulation({
  fallingSlots,
  paddleEl,
  guideFillEl,
  maxPopulation = FALL_MAX_POPULATION,
  spawnIntervalMs = FALL_SPAWN_INTERVAL_MS,
  seed = Date.now(),
  getControlX,
  setControlX,
  getKeyboardDirection,
  onCapture,
  onSlotType,
}: BoardOptions): BoardSimulation {
  const canvasWidth = LOGICAL_WIDTH
  const canvasHeight = LOGICAL_HEIGHT
  const rng = createRng(seed)

  // Más lenta que la 0.002 original (corregido tras revisión de Sofía: "los
  // botones deberían bajar más lentamente" — la caída rápida no dejaba
  // tiempo a seguir el recorrido con la vista). No tan baja como un primer
  // ajuste (0.0011): con tan poca energía, los botones se quedaban
  // reposando encima de los pegs en vez de rebotar y seguir cayendo —
  // apenas se veían botones nuevos porque los que había tardaban demasiado
  // en liberar su hueco de población (bug real, detectado en QA jugando).
  const engine = Matter.Engine.create({ gravity: { x: 0, y: 1, scale: 0.0016 } })
  const runner = Matter.Runner.create()

  // Rebote suave (no 0.6): con más, la trayectoria se vuelve tan errática
  // que ni un jugador atento consigue anticiparla — el GDD pide "el jugador
  // puede anticipar aproximadamente las trayectorias, nunca con total
  // precisión", no un pinball caótico (corregido tras revisión de Sofía:
  // "es imposible seguir el recorrido"). Tampoco tan bajo como un primer
  // ajuste (0.25): combinado con la gravedad reducida, dejaba a los
  // botones sin energía suficiente para separarse de un peg tras tocarlo.
  const pegs = generatePegPositions(canvasWidth).map(({ x, y }) =>
    Matter.Bodies.circle(x, y, PEG_RADIUS, { isStatic: true, restitution: 0.35 }),
  )

  // Izquierda, derecha (sin techo ni suelo: los botones nacen por encima y
  // se retiran a mano al cruzar por debajo — mismo espíritu que `rain.ts`,
  // "es más sencillo comprobar la posición que modelar un suelo real").
  const walls = [
    Matter.Bodies.rectangle(-WALL_THICKNESS / 2, canvasHeight, WALL_THICKNESS, canvasHeight * 4, {
      isStatic: true,
    }),
    Matter.Bodies.rectangle(
      canvasWidth + WALL_THICKNESS / 2,
      canvasHeight,
      WALL_THICKNESS,
      canvasHeight * 4,
      { isStatic: true },
    ),
  ]

  // Tamaño FIJO (constantes, no `getBoundingClientRect()`): el lienzo de
  // `GameArea` se escala con `transform: scale()`, así que medir el tamaño
  // real en pantalla de un botón daría un valor ya escalado (más pequeño en
  // móvil, por ejemplo) — mezclado con las coordenadas lógicas (640×420)
  // del resto de la física, eso desalinearía cuerpo y sprite. La paleta ya
  // usa sus propias constantes por el mismo motivo.
  const halfWidth = FALLING_WIDTH / 2
  const halfHeight = FALLING_HEIGHT / 2

  const population = Math.min(maxPopulation, fallingSlots.length)
  const slots: FallingSlot[] = []
  for (let i = 0; i < population; i++) {
    const el = fallingSlots[i]
    // Aparcados muy por encima y fuera de la vista, apilados para no
    // solaparse entre sí mientras esperan su turno (nunca se ven: el propio
    // `overflow: hidden` del lienzo lógico los recorta).
    const body = Matter.Bodies.rectangle(
      canvasWidth / 2,
      -halfHeight - i * (halfHeight * 2 + 8),
      halfWidth * 2,
      halfHeight * 2,
      // Rebote suave y fricción de aire para que no se pongan a girar sin
      // parar tras un golpe de refilón (corregido tras revisión de Sofía:
      // trayectorias predecibles, no un pinball) — pero con energía
      // suficiente para no quedarse reposando encima de un peg nada más
      // tocarlo.
      { restitution: 0.35, friction: 0.05, frictionAir: 0.01 },
    )
    Matter.Body.setStatic(body, true) // ver rain.ts: nunca `isStatic` en el constructor de un cuerpo que se reactivará
    slots.push({
      body,
      el,
      index: i,
      halfWidth,
      halfHeight,
      active: false,
      type: 'agree',
      restSince: null,
      lastProgressY: null,
      progressSince: null,
      stuckKicks: 0,
    })
    syncTransform(el, body.position.x, body.position.y, halfWidth, halfHeight)
  }

  const paddleHalfWidth = (PADDLE_WIDTH * PADDLE_SENSOR_WIDTH_RATIO) / 2
  const paddleHalfHeight = PADDLE_HEIGHT / 2
  const paddleVisualHalfWidth = PADDLE_WIDTH / 2
  // Clamping con margen para el anillo exterior (ver PADDLE_OUTER_RING_PX):
  // no solo el cuerpo de la paleta, también su anillo decorativo deben caber
  // dentro del lienzo en ambos extremos de la guía.
  const paddleClampHalfWidth = paddleHalfWidth + PADDLE_OUTER_RING_PX
  const paddleBody = Matter.Bodies.rectangle(
    canvasWidth / 2,
    PADDLE_Y,
    PADDLE_WIDTH * PADDLE_SENSOR_WIDTH_RATIO,
    PADDLE_HEIGHT,
    { isStatic: true, restitution: 0.3, friction: 0.1 },
  )

  Matter.Composite.add(engine.world, [
    ...pegs,
    ...walls,
    paddleBody,
    ...slots.map((slot) => slot.body),
  ])

  function syncPaddle(x: number): void {
    syncTransform(paddleEl, x, PADDLE_Y, paddleVisualHalfWidth, paddleHalfHeight)
    guideFillEl?.style.setProperty('--guide-fill', String(x))
  }
  syncPaddle(clampPaddleX(getControlX(), paddleClampHalfWidth, canvasWidth))

  function activate(slot: FallingSlot): void {
    const spawn = nextSpawnPoint(rng, canvasWidth, SPAWN_MARGIN_X)
    Matter.Body.setStatic(slot.body, false)
    Matter.Body.setPosition(slot.body, { x: spawn.x, y: -slot.halfHeight })
    Matter.Body.setVelocity(slot.body, { x: 0, y: 0 })
    Matter.Body.setAngularVelocity(slot.body, 0)
    slot.active = true
    slot.type = spawn.type
    slot.restSince = null
    slot.lastProgressY = null
    slot.progressSince = null
    slot.stuckKicks = 0
    onSlotType(slot.index, spawn.type)
  }

  function deactivate(slot: FallingSlot): void {
    Matter.Body.setStatic(slot.body, true)
    Matter.Body.setPosition(slot.body, { x: -1000, y: -1000 })
    slot.active = false
  }

  let activeCount = 0
  let nextSpawnDue = 0
  let lastTimestamp = 0

  const handleAfterUpdate = (event: { timestamp: number }) => {
    const timestamp = event.timestamp
    const dtSeconds = lastTimestamp === 0 ? 0 : (timestamp - lastTimestamp) / 1000
    lastTimestamp = timestamp

    // Clampado ANTES de guardarlo (no solo al leerlo para la física, más
    // abajo): si no, mantener una flecha pulsada tras llegar al borde de la
    // guía sigue acumulando sin límite en `controlX` (bug real) — al soltar
    // y pulsar la contraria, la paleta tardaría en "deshacer" toda esa
    // deriva invisible antes de empezar a responder de verdad.
    const direction = getKeyboardDirection()
    if (direction !== 0) {
      const stepped = stepKeyboardX(getControlX(), direction, dtSeconds)
      setControlX(clampPaddleX(stepped, paddleClampHalfWidth, canvasWidth))
    }

    const clampedX = clampPaddleX(getControlX(), paddleClampHalfWidth, canvasWidth)
    Matter.Body.setPosition(paddleBody, { x: clampedX, y: PADDLE_Y })
    syncPaddle(clampedX)

    if (activeCount < population && timestamp >= nextSpawnDue) {
      const next = slots.find((slot) => !slot.active)
      if (next) {
        activate(next)
        activeCount++
        nextSpawnDue = timestamp + spawnIntervalMs
      }
    }

    for (const slot of slots) {
      if (!slot.active) continue

      if (slot.body.position.y > canvasHeight + slot.halfHeight * 2) {
        deactivate(slot)
        activeCount--
        continue
      }

      const inPegs = slot.body.position.y < PEG_FIELD_BOTTOM_Y

      if (inPegs) {
        // Dentro del campo de pegs: detector por PROGRESO neto en Y, no por
        // velocidad instantánea — un cuerpo encajado entre dos pegs puede
        // seguir "temblando" con velocidad por encima de
        // `REST_SPEED_THRESHOLD` sin bajar de verdad, y con el criterio de
        // velocidad el empujón casi nunca llegaba a dispararse (corregido
        // tras revisión de Sofía: "no están rebotando en los puntos cuando
        // se quedan pillados").
        slot.restSince = null
        if (slot.progressSince === null || slot.lastProgressY === null) {
          slot.progressSince = timestamp
          slot.lastProgressY = slot.body.position.y
        } else if (slot.body.position.y - slot.lastProgressY > STUCK_PROGRESS_EPSILON_PX) {
          slot.lastProgressY = slot.body.position.y
          slot.progressSince = timestamp
        } else if (timestamp - slot.progressSince >= STUCK_KICK_THRESHOLD_MS) {
          if (slot.stuckKicks < MAX_STUCK_KICKS) {
            // Sin progreso: un empujón para liberarse en vez de desaparecer
            // en silencio (corregido tras revisión de Sofía: "debe rebotar
            // en los puntitos un poco").
            kickAwayFromNearestPeg(slot.body, pegs)
            slot.stuckKicks++
          } else {
            // Sin más margen de reintento: se recicla igual que un fallo,
            // no cuenta como captura.
            deactivate(slot)
            activeCount--
            continue
          }
          slot.progressSince = timestamp
          slot.lastProgressY = slot.body.position.y
        }
      } else {
        // Por debajo de los pegs: solo paleta y aire, sin ambigüedad
        // posible — aquí sí basta la velocidad (no hay pegs contra los que
        // rebotar ni progreso "esperable": la paleta puede detenerlo del
        // todo de forma legítima).
        slot.stuckKicks = 0
        slot.lastProgressY = null
        slot.progressSince = null
        const speed = Matter.Vector.magnitude(slot.body.velocity)
        if (speed < REST_SPEED_THRESHOLD) {
          if (slot.restSince === null) slot.restSince = timestamp
          else if (timestamp - slot.restSince >= REST_THRESHOLD_BELOW_PEGS_MS) {
            deactivate(slot)
            activeCount--
            continue
          }
        } else {
          slot.restSince = null
        }
      }

      syncTransform(
        slot.el,
        slot.body.position.x,
        slot.body.position.y,
        slot.halfWidth,
        slot.halfHeight,
        slot.body.angle,
      )
    }
  }

  Matter.Events.on(engine, 'afterUpdate', handleAfterUpdate)

  const handleCollisionStart = (event: Matter.IEventCollision<Matter.Engine>) => {
    for (const pair of event.pairs) {
      const other =
        pair.bodyA === paddleBody ? pair.bodyB : pair.bodyB === paddleBody ? pair.bodyA : null
      if (!other) continue

      const slot = slots.find((candidate) => candidate.body === other)
      if (!slot || !slot.active) continue

      onCapture(slot.type)
      deactivate(slot)
      activeCount--
    }
  }

  Matter.Events.on(engine, 'collisionStart', handleCollisionStart)

  let running = false
  function start(): void {
    if (running) return
    running = true
    Matter.Runner.run(runner, engine)
  }
  function stop(): void {
    if (!running) return
    running = false
    Matter.Runner.stop(runner)
  }

  start()

  return {
    setPaused(paused: boolean) {
      if (paused) stop()
      else start()
    },
    destroy() {
      stop()
      Matter.Events.off(engine, 'afterUpdate', handleAfterUpdate)
      Matter.Events.off(engine, 'collisionStart', handleCollisionStart)
      Matter.Composite.clear(engine.world, false)
      Matter.Engine.clear(engine)
    },
  }
}
