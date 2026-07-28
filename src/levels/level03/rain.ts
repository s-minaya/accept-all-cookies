import * as Matter from 'matter-js'
import { gravityVectorForRotation } from './gravity'

/** Población máxima simultánea de Disagree en la lluvia (GDD §14, ajustable por playtesting). */
export const RAIN_MAX_POPULATION = 25
/** Población en dispositivos táctiles (GDD §14): menos sitio en pantalla, menos Disagree a la vez. */
export const RAIN_MAX_POPULATION_MOBILE = 12
/** Cada cuánto (ms) puede activarse un Disagree más, hasta el máximo (GDD §14). */
export const RAIN_SPAWN_INTERVAL_MS = 350
/** Cuánto tiempo (ms) reposando antes de reciclar un Disagree de la lluvia. */
export const RAIN_REST_THRESHOLD_MS = 4000
/**
 * Ancho (px) de la cámara oculta donde reposa el Agree, a la derecha del
 * recuadro visible (GDD §14): mismo espacio físico continuo que la lluvia,
 * sin pared separadora — solo recortada por el `overflow: hidden` del propio
 * recuadro (007-plan.md, "El Agree como cuerpo físico oculto").
 */
export const AGREE_HIDDEN_CHAMBER_WIDTH_PX = 140
/** Velocidad (px/tick) por debajo de la cual un cuerpo se considera "reposando". */
const REST_SPEED_THRESHOLD = 0.05
/** Grosor de las paredes invisibles del recuadro de lluvia. */
const WALL_THICKNESS = 40

export interface RainOptions {
  /** Recuadro de lluvia VISIBLE: sus dimensiones (medidas una vez, al crear) delimitan la parte que se ve. */
  container: HTMLElement
  /** Pool fijo de botones Disagree ya montados, uno por cuerpo — nunca se crean ni destruyen botones. */
  buttons: HTMLButtonElement[]
  /** Botón Agree, único, ya montado dentro del mismo recuadro que los Disagree. */
  agreeButton: HTMLButtonElement
  maxPopulation?: number
  spawnIntervalMs?: number
  restThresholdMs?: number
  hiddenChamberWidth?: number
  /** Rotación actual de la ventana en grados; se lee en cada paso, no es reactiva. */
  getRotationDeg: () => number
}

export interface RainSimulation {
  setPaused: (paused: boolean) => void
  /** Runner parado, listeners desconectados y engine destruido — nada vivo tras llamarlo. */
  destroy: () => void
}

interface RainBody {
  body: Matter.Body
  el: HTMLButtonElement
  halfWidth: number
  halfHeight: number
  active: boolean
  restSince: number | null
}

function randomSpawnX(rangeWidth: number, halfWidth: number, offsetX = 0): number {
  const margin = halfWidth + 4
  return offsetX + margin + Math.random() * Math.max(rangeWidth - margin * 2, 0)
}

function elementHalfSize(el: HTMLElement): { halfWidth: number; halfHeight: number } {
  const rect = el.getBoundingClientRect()
  return { halfWidth: rect.width / 2 || 24, halfHeight: rect.height / 2 || 24 }
}

function syncButtonPosition(
  el: HTMLButtonElement,
  body: Matter.Body,
  halfWidth: number,
  halfHeight: number,
): void {
  const pos = body.position
  el.style.transform =
    `translate(${pos.x - halfWidth}px, ${pos.y - halfHeight}px) ` + `rotate(${body.angle}rad)`
}

/**
 * Lluvia de Disagrees (y el Agree oculto) con física real (007-plan.md):
 * matter.js importado dinámicamente dentro de este chunk (nunca en el
 * bundle principal). Los botones son elementos DOM reales ya montados por
 * `Level03` — este módulo solo mueve sus cuerpos y sincroniza `transform` en
 * cada paso; los clics los gestiona el propio botón (React), no este módulo.
 */
export function createRainSimulation({
  container,
  buttons,
  agreeButton,
  maxPopulation = RAIN_MAX_POPULATION,
  spawnIntervalMs = RAIN_SPAWN_INTERVAL_MS,
  restThresholdMs = RAIN_REST_THRESHOLD_MS,
  hiddenChamberWidth = AGREE_HIDDEN_CHAMBER_WIDTH_PX,
  getRotationDeg,
}: RainOptions): RainSimulation {
  const rect = container.getBoundingClientRect()
  const boxWidth = rect.width
  const boxHeight = rect.height
  const totalWidth = boxWidth + hiddenChamberWidth

  const engine = Matter.Engine.create({ gravity: { x: 0, y: 1, scale: 0.001 } })
  const runner = Matter.Runner.create()

  // Suelo, izquierda, derecha y techo — sin pared entre el recuadro visible
  // y la cámara oculta del Agree (a la derecha, `totalWidth` incluye
  // ambas): es el mismo espacio físico continuo, solo recortado
  // visualmente por el `overflow: hidden` del recuadro (007-plan.md). El
  // techo va muy por encima del recuadro visible (mismo margen que ya
  // usaban la pared izquierda/derecha para su propio extremo superior,
  // `boxHeight / 2`), para no estorbar la caída normal desde fuera de la
  // vista — pero sin él, un Agree ya revelado (visible, respondiendo a la
  // gravedad como cualquier Disagree) podía salir volando por arriba y
  // perderse fuera del recuadro si el jugador seguía girando la ventana
  // después de encontrarlo, sin nada que lo frenara en esa dirección (bug
  // real, corregido tras revisión de Sofía: "una vez aparezca el agree no
  // puede salirse de la pantalla").
  const walls = [
    Matter.Bodies.rectangle(
      totalWidth / 2,
      boxHeight + WALL_THICKNESS / 2,
      totalWidth * 2,
      WALL_THICKNESS,
      {
        isStatic: true,
      },
    ),
    Matter.Bodies.rectangle(-WALL_THICKNESS / 2, boxHeight / 2, WALL_THICKNESS, boxHeight * 2, {
      isStatic: true,
    }),
    Matter.Bodies.rectangle(
      totalWidth + WALL_THICKNESS / 2,
      boxHeight / 2,
      WALL_THICKNESS,
      boxHeight * 2,
      {
        isStatic: true,
      },
    ),
    Matter.Bodies.rectangle(
      totalWidth / 2,
      -boxHeight / 2 - WALL_THICKNESS / 2,
      totalWidth * 2,
      WALL_THICKNESS,
      {
        isStatic: true,
      },
    ),
  ]
  Matter.Composite.add(engine.world, walls)

  // El área REAL del recuadro (medida arriba, no un número fijo pensado
  // para un recuadro más grande) limita cuántos Disagree caben a la vez
  // sin dejar el recuadro pared con pared, sin ningún hueco para que el
  // Agree se pueda ver una vez revelado — corregido tras revisión de
  // Sofía: "los botones de disagree si tienen que desaparecer si no se
  // llena la pantalla y no deja espacio para que aparezca el agree". Con
  // el recuadro a su tamaño de siempre (`min-height: 10rem`,
  // `Level03.module.scss`) y `RAIN_MAX_POPULATION` (25) sin este límite,
  // el área de los propios botones llegaba a duplicar la del recuadro —
  // confirmado con Playwright: el recuadro quedaba cubierto pared con
  // pared, sin un solo hueco visible. `RAIN_TARGET_FILL_RATIO` es cuánto
  // del área del recuadro pueden cubrir, COMO MUCHO, sus siluetas si
  // estuvieran todas quietas a la vez — en la práctica se ve menos lleno
  // todavía, porque no todas están quietas al mismo tiempo. Se adapta
  // solo a cualquier tamaño de recuadro futuro (breakpoint nuevo, ajuste
  // de `min-height`…), no hace falta retocar un número fijo a mano.
  const RAIN_TARGET_FILL_RATIO = 0.6
  const sampleButton =
    buttons.length > 0 ? elementHalfSize(buttons[0]) : { halfWidth: 24, halfHeight: 24 }
  const sampleButtonArea = sampleButton.halfWidth * 2 * sampleButton.halfHeight * 2
  const areaBasedPopulationCap = Math.max(
    1,
    Math.floor((boxWidth * boxHeight * RAIN_TARGET_FILL_RATIO) / sampleButtonArea),
  )

  const population = Math.min(maxPopulation, buttons.length, areaBasedPopulationCap)
  const rainBodies: RainBody[] = []

  // El pool de botones es fijo (siempre `maxPopulation` elementos montados,
  // ver `Level03.tsx`) pero el límite por área puede dejar algunos SIN
  // cuerpo físico nunca — sin esto, esos botones sobrantes se quedan
  // clavados en su posición CSS por defecto (`top: 0; left: 0`, la esquina
  // superior izquierda del recuadro, `Level03.module.scss`), visibles y
  // clicables, porque `syncButtonPosition` nunca llega a tocarlos (bug real,
  // reportado por Sofía tras el límite de población: "se queda un disagree
  // pegado en la parte superior izquierda de la pantalla").
  for (const unusedButton of buttons.slice(population)) {
    unusedButton.style.display = 'none'
  }

  for (let i = 0; i < population; i++) {
    const el = buttons[i]
    const { halfWidth, halfHeight } = elementHalfSize(el)
    const startX = randomSpawnX(boxWidth, halfWidth)
    // Todos existen desde el principio pero quietos muy por encima del
    // recuadro: "spawn continuo" es solo activarlos a intervalos, sin
    // altas/bajas de cuerpos en el mundo físico. OJO: `isStatic` se marca
    // con `Body.setStatic` DESPUÉS de crear el cuerpo, nunca como opción del
    // constructor — `Body.setStatic(body, false)` solo restaura la masa e
    // inercia reales si `_original` quedó guardado, y matter.js solo lo
    // guarda la primera vez que el cuerpo pasa de dinámico a estático vía
    // esa misma función. Un cuerpo nacido ya estático por opción se queda
    // con masa `Infinity` para siempre: al reactivarlo, la gravedad
    // (`fuerza = masa × aceleración`) da `Infinity`, y al multiplicarla por
    // `inverseMass = 0` da `NaN` (bug real, detectado en QA con Playwright).
    const body = Matter.Bodies.rectangle(
      startX,
      -halfHeight - i * (halfHeight * 2 + 8),
      halfWidth * 2,
      halfHeight * 2,
      { restitution: 0.6, friction: 0.15 },
    )
    Matter.Body.setStatic(body, true)
    Matter.Composite.add(engine.world, body)
    rainBodies.push({ body, el, halfWidth, halfHeight, active: false, restSince: null })
  }

  // El Agree: nace YA en su posición de reposo dentro de la cámara oculta,
  // quieto (`isStatic`) — nada de caída animada al cargar el nivel (antes se
  // veía "esconderse" un instante, feedback de Sofía tras QA). Se libera
  // (empieza a responder a la gravedad, como cualquier Disagree) en cuanto
  // el jugador gira la ventana por primera vez, sea cual sea el sentido.
  const agreeHalf = elementHalfSize(agreeButton)
  const agreeRestX = boxWidth + hiddenChamberWidth / 2
  const agreeBody = Matter.Bodies.rectangle(
    agreeRestX,
    boxHeight - agreeHalf.halfHeight,
    agreeHalf.halfWidth * 2,
    agreeHalf.halfHeight * 2,
    { restitution: 0.6, friction: 0.15 },
  )
  Matter.Body.setStatic(agreeBody, true)
  Matter.Composite.add(engine.world, agreeBody)
  let agreeReleased = false

  // Invisible de verdad, no solo recortado por el `overflow: hidden` del
  // recuadro (corregido tras revisión de Sofía: "el botón agree cae y se
  // esconde, dando al usuario una pista de dónde está") — al rebotar cerca
  // del borde de la cámara oculta, un trocito del propio botón podía asomar
  // por el recorte visual y volver a escapar, revelando en qué lado está
  // antes de que el jugador lo encuentre de verdad. Se hace visible recién
  // en el momento en que queda sellado dentro del recuadro visible (más
  // abajo), no antes.
  agreeButton.style.visibility = 'hidden'

  // Pared que sella la cámara oculta la primera vez que el Agree cruza por
  // completo al recuadro visible (Sofía, feedback tras QA: "a veces se
  // pierde [otra vez] al rebotar" — una vez descubierto, no debe poder
  // volver a esconderse). No se añade al mundo hasta ese momento: si
  // existiera desde el principio, el Agree quedaría atrapado en su propia
  // cámara y nunca podría cruzar.
  const sealWall = Matter.Bodies.rectangle(
    boxWidth + WALL_THICKNESS / 2,
    boxHeight / 2,
    WALL_THICKNESS,
    boxHeight * 2,
    { isStatic: true },
  )
  let agreeSealed = false

  // Sincroniza la posición inicial YA, antes del primer paso de física: sin
  // esto, los botones se pintan un instante en su posición por defecto
  // (0,0, la esquina superior izquierda del recuadro) hasta que el motor
  // arranca — un parpadeo visible, sobre todo en el Agree (verde, destaca
  // sobre el rosa de los Disagree). Ver también `Level03.tsx`, que llama a
  // `createRainSimulation` desde `useLayoutEffect` por el mismo motivo.
  for (const rainBody of rainBodies) {
    syncButtonPosition(rainBody.el, rainBody.body, rainBody.halfWidth, rainBody.halfHeight)
  }
  syncButtonPosition(agreeButton, agreeBody, agreeHalf.halfWidth, agreeHalf.halfHeight)

  function activate(rainBody: RainBody, timestamp: number): void {
    Matter.Body.setStatic(rainBody.body, false)
    Matter.Body.setPosition(rainBody.body, {
      x: randomSpawnX(boxWidth, rainBody.halfWidth),
      y: -rainBody.halfHeight,
    })
    Matter.Body.setVelocity(rainBody.body, { x: 0, y: 0 })
    Matter.Body.setAngularVelocity(rainBody.body, 0)
    rainBody.active = true
    rainBody.restSince = timestamp
  }

  let lastSpawnTime = 0
  let activeCount = 0

  const handleAfterUpdate = (event: { timestamp: number }) => {
    const timestamp = event.timestamp

    const rotationDeg = getRotationDeg()
    const gravity = gravityVectorForRotation(rotationDeg)
    engine.gravity.x = gravity.x
    engine.gravity.y = gravity.y

    if (!agreeReleased && rotationDeg !== 0) {
      Matter.Body.setStatic(agreeBody, false)
      agreeReleased = true
    }

    if (!agreeSealed && agreeBody.position.x + agreeHalf.halfWidth < boxWidth) {
      Matter.Composite.add(engine.world, sealWall)
      agreeSealed = true
      agreeButton.style.visibility = 'visible'
    }

    if (activeCount < population && timestamp - lastSpawnTime >= spawnIntervalMs) {
      const next = rainBodies.find((rainBody) => !rainBody.active)
      if (next) {
        activate(next, timestamp)
        activeCount++
        lastSpawnTime = timestamp
      }
    }

    for (const rainBody of rainBodies) {
      if (!rainBody.active) continue

      const speed = Matter.Vector.magnitude(rainBody.body.velocity)
      if (speed < REST_SPEED_THRESHOLD) {
        if (rainBody.restSince === null) rainBody.restSince = timestamp
        else if (timestamp - rainBody.restSince >= restThresholdMs) {
          activate(rainBody, timestamp) // recicla: reaparece arriba, sigue "activo"
        }
      } else {
        rainBody.restSince = null
      }

      syncButtonPosition(rainBody.el, rainBody.body, rainBody.halfWidth, rainBody.halfHeight)
    }

    syncButtonPosition(agreeButton, agreeBody, agreeHalf.halfWidth, agreeHalf.halfHeight)
  }

  Matter.Events.on(engine, 'afterUpdate', handleAfterUpdate)

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
      Matter.Composite.clear(engine.world, false)
      Matter.Engine.clear(engine)
    },
  }
}
