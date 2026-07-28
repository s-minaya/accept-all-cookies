import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from '../../components/GameArea'
import {
  createBoardSimulation,
  generatePegPositions,
  PEG_COUNT,
  type BoardSimulation,
} from './board'
import type { FallingType } from './spawner'

function makeSlots(count: number): HTMLElement[] {
  const slots: HTMLElement[] = []
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div')
    document.body.appendChild(el)
    slots.push(el)
  }
  return slots
}

function transformY(el: HTMLElement): number {
  const match = el.style.transform.match(/translate\([-\d.]+px, ([-\d.]+)px\)/)
  return match ? Number.parseFloat(match[1]) : Number.NaN
}

describe('generatePegPositions (008-plan.md, tresbolillo)', () => {
  it('generates exactly PEG_COUNT (30) pegs, all within the logical canvas bounds', () => {
    const pegs = generatePegPositions(LOGICAL_WIDTH)
    expect(pegs.length).toBe(PEG_COUNT)
    expect(PEG_COUNT).toBe(30)

    for (const peg of pegs) {
      expect(peg.x).toBeGreaterThanOrEqual(0)
      expect(peg.x).toBeLessThanOrEqual(LOGICAL_WIDTH)
      expect(peg.y).toBeGreaterThanOrEqual(0)
      expect(peg.y).toBeLessThan(LOGICAL_HEIGHT)
    }
  })

  it('is deterministic (pure function of canvasWidth)', () => {
    expect(generatePegPositions(640)).toEqual(generatePegPositions(640))
  })
})

describe('createBoardSimulation (008-plan.md, física del Plinko)', () => {
  let fallingSlots: HTMLElement[]
  let paddleEl: HTMLElement
  let guideFillEl: HTMLElement
  let simulation: BoardSimulation | null
  let controlX: number

  beforeEach(() => {
    vi.useFakeTimers()
    fallingSlots = makeSlots(10)
    paddleEl = document.createElement('div')
    document.body.appendChild(paddleEl)
    guideFillEl = document.createElement('div')
    document.body.appendChild(guideFillEl)
    simulation = null
    controlX = LOGICAL_WIDTH / 2
  })

  afterEach(() => {
    simulation?.destroy()
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  function create(overrides: Partial<Parameters<typeof createBoardSimulation>[0]> = {}) {
    const onCapture = vi.fn()
    const onSlotType = vi.fn()
    simulation = createBoardSimulation({
      fallingSlots,
      paddleEl,
      guideFillEl,
      seed: 1,
      getControlX: () => controlX,
      setControlX: (x) => {
        controlX = x
      },
      getKeyboardDirection: () => 0,
      onCapture,
      onSlotType,
      ...overrides,
    })
    return { onCapture, onSlotType }
  }

  it('starts moving the pooled falling elements once running', () => {
    create()
    vi.advanceTimersByTime(3000)

    const moved = fallingSlots.some((el) => el.style.transform !== '')
    expect(moved).toBe(true)
  })

  it('assigns a valid Agree/Disagree type to a slot as soon as it spawns', () => {
    const { onSlotType } = create()
    vi.advanceTimersByTime(1000)

    expect(onSlotType).toHaveBeenCalled()
    const calls = onSlotType.mock.calls as [number, FallingType][]
    const types = calls.map(([, type]) => type)
    expect(types.every((type) => type === 'agree' || type === 'disagree')).toBe(true)
  })

  it('syncs the paddle position from getControlX from the very first frame (no flash at a default position)', () => {
    controlX = 500
    create()
    // Sincronizado de forma síncrona al crear, antes de cualquier paso de física.
    expect(paddleEl.style.transform).not.toBe('')
  })

  it('setPaused(true) freezes all further movement; setPaused(false) resumes it', () => {
    create()
    vi.advanceTimersByTime(1000)

    simulation?.setPaused(true)
    const frozen = fallingSlots.map((el) => el.style.transform)
    vi.advanceTimersByTime(3000)
    expect(fallingSlots.map((el) => el.style.transform)).toEqual(frozen)

    simulation?.setPaused(false)
    vi.advanceTimersByTime(3000)
    const movedAfterResume = fallingSlots.some((el, i) => el.style.transform !== frozen[i])
    expect(movedAfterResume).toBe(true)
  })

  it('destroy() stops the Runner: nothing keeps moving the elements afterward (no leaked rAF loop)', () => {
    create()
    vi.advanceTimersByTime(1000)

    simulation?.destroy()
    const atDestroy = fallingSlots.map((el) => el.style.transform)

    vi.advanceTimersByTime(5000)

    expect(fallingSlots.map((el) => el.style.transform)).toEqual(atDestroy)
    simulation = null // ya destruido, que afterEach no lo destruya otra vez
  })

  it('recycles a falling element once it crosses past the bottom without being captured', () => {
    // Un único slot: en el tiempo simulado debería haber caído, cruzado el
    // fondo y "reaparecido" arriba (Y negativa) más de una vez — muestrear
    // muchas veces en vez de mirar solo el instante final, que puede pillarlo
    // a media caída (positivo) sin que eso signifique que nunca se recicló.
    // 400×200ms (80s simulados, no 20s): un botón encajado contra un peg
    // ahora recibe hasta `MAX_STUCK_KICKS` empujones (5s de reposo cada uno
    // antes del siguiente) en vez de reciclarse al instante (corregido tras
    // revisión de Sofía: "debe rebotar en los puntitos un poco") — con mala
    // suerte, un único slot puede encadenar varios episodios así antes de
    // llegar al fondo.
    fallingSlots = makeSlots(1)
    create({ fallingSlots })

    let sawNegativeY = false
    for (let i = 0; i < 400; i++) {
      vi.advanceTimersByTime(200)
      if (transformY(fallingSlots[0]) < 0) {
        sawNegativeY = true
        break
      }
    }

    expect(sawNegativeY).toBe(true)
  })

  it('captures a falling element on collision with the paddle: removes it and reports its type', () => {
    // El botón grande barre todo el ancho del lienzo repetidamente: con
    // población máxima y tiempo de sobra, intercepta antes o después a
    // alguno de los botones que caen (semilla fija para que sea repetible).
    // 90 s de tiempo SIMULADO (no 30): la gravedad se bajó tras revisión de
    // Sofía ("deberían bajar más lentamente"), así que cada botón tarda más
    // en completar su recorrido. Esto es tiempo de `vi.advanceTimersByTime`,
    // no de reloj real — pero avanzarlo ejecuta de verdad ~5600 pasos de
    // física (uno por frame simulado de ~16ms) de forma síncrona, lo que sí
    // consume varios segundos de CPU real: se sube también el timeout real
    // del test (tercer argumento) para no confundir "más lento a propósito"
    // con "test colgado".
    let elapsed = 0
    const { onCapture } = create({
      seed: 7,
      getControlX: () => controlX,
      getKeyboardDirection: () => {
        elapsed += 16
        // Ping-pong entre los dos extremos de la guía cada ~4s (más lento
        // que la caída, para no alejarse justo antes de que un botón llegue).
        return Math.floor(elapsed / 4000) % 2 === 0 ? 1 : -1
      },
    })

    vi.advanceTimersByTime(90000)

    expect(onCapture).toHaveBeenCalled()
    const calls = onCapture.mock.calls as [FallingType][]
    const types = calls.map(([type]) => type)
    expect(types.every((type) => type === 'agree' || type === 'disagree')).toBe(true)
  }, 20000)
})
