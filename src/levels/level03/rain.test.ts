import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRainSimulation, type RainSimulation } from './rain'

function makeButtons(count: number): HTMLButtonElement[] {
  const buttons: HTMLButtonElement[] = []
  for (let i = 0; i < count; i++) {
    const button = document.createElement('button')
    document.body.appendChild(button)
    buttons.push(button)
  }
  return buttons
}

function makeAgreeButton(): HTMLButtonElement {
  const button = document.createElement('button')
  document.body.appendChild(button)
  return button
}

/** jsdom no hace layout real: `getBoundingClientRect` da ceros salvo que se rellene a mano. */
function mockRect(el: HTMLElement, rect: Partial<DOMRect>): void {
  el.getBoundingClientRect = () =>
    ({
      width: 0,
      height: 0,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      x: 0,
      y: 0,
      toJSON: () => {},
      ...rect,
    }) as DOMRect
}

function translateX(el: HTMLElement): number {
  const match = el.style.transform.match(/translate\(([-\d.]+)px/)
  return match ? Number.parseFloat(match[1]) : Number.NaN
}

describe('createRainSimulation (007-plan.md, física de la lluvia)', () => {
  let container: HTMLElement
  let buttons: HTMLButtonElement[]
  let agreeButton: HTMLButtonElement
  let simulation: RainSimulation | null

  beforeEach(() => {
    vi.useFakeTimers()
    container = document.createElement('div')
    document.body.appendChild(container)
    buttons = makeButtons(5)
    agreeButton = makeAgreeButton()
    simulation = null
  })

  afterEach(() => {
    simulation?.destroy()
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('starts moving the pooled buttons once running', () => {
    simulation = createRainSimulation({ container, buttons, agreeButton, getRotationDeg: () => 0 })

    vi.advanceTimersByTime(2000)

    const moved = buttons.some((button) => button.style.transform !== '')
    expect(moved).toBe(true)
  })

  it('setPaused(true) freezes all further movement; setPaused(false) resumes it', () => {
    simulation = createRainSimulation({ container, buttons, agreeButton, getRotationDeg: () => 0 })
    vi.advanceTimersByTime(1000)

    simulation.setPaused(true)
    const frozenTransforms = buttons.map((button) => button.style.transform)
    vi.advanceTimersByTime(2000)
    expect(buttons.map((button) => button.style.transform)).toEqual(frozenTransforms)

    simulation.setPaused(false)
    vi.advanceTimersByTime(2000)
    const movedAfterResume = buttons.some(
      (button, i) => button.style.transform !== frozenTransforms[i],
    )
    expect(movedAfterResume).toBe(true)
  })

  it('destroy() stops the Runner: nothing keeps moving the buttons afterward (no leaked rAF loop)', () => {
    simulation = createRainSimulation({ container, buttons, agreeButton, getRotationDeg: () => 0 })
    vi.advanceTimersByTime(1000)

    simulation.destroy()
    const transformsAtDestroy = buttons.map((button) => button.style.transform)

    vi.advanceTimersByTime(5000)

    expect(buttons.map((button) => button.style.transform)).toEqual(transformsAtDestroy)
    simulation = null // ya destruido, que afterEach no lo destruya otra vez
  })

  it('reads the current rotation on every step to keep gravity oriented to screen-down', () => {
    const getRotationDeg = vi.fn(() => 0)
    simulation = createRainSimulation({ container, buttons, agreeButton, getRotationDeg })

    vi.advanceTimersByTime(500)

    expect(getRotationDeg.mock.calls.length).toBeGreaterThan(0)
  })

  describe('el Agree oculto (007-plan.md, corregido tras revisión de Sofía)', () => {
    const BOX_WIDTH = 300
    const BOX_HEIGHT = 160
    const AGREE_WIDTH = 100

    beforeEach(() => {
      mockRect(container, { width: BOX_WIDTH, height: BOX_HEIGHT })
      mockRect(agreeButton, { width: AGREE_WIDTH, height: 48 })
    })

    it('stays in its hidden chamber (beyond the visible box width) when the window is not rotated', () => {
      simulation = createRainSimulation({
        container,
        buttons,
        agreeButton,
        getRotationDeg: () => 0,
      })

      vi.advanceTimersByTime(6000)

      // El borde izquierdo del Agree sigue más allá del ancho visible: oculto.
      expect(translateX(agreeButton)).toBeGreaterThanOrEqual(BOX_WIDTH - 5)
    })

    it('does not move at all while unrotated: nace ya en su posición de reposo, no cae animado (Sofía, feedback tras QA)', () => {
      simulation = createRainSimulation({
        container,
        buttons,
        agreeButton,
        getRotationDeg: () => 0,
      })

      const transformAtMount = agreeButton.style.transform
      expect(transformAtMount).not.toBe('') // ya tiene posición fijada desde el primer instante

      vi.advanceTimersByTime(6000)

      expect(agreeButton.style.transform).toBe(transformAtMount) // sigue exactamente igual: nunca se soltó
    })

    it('only starts moving once the window has rotated at least once (either direction)', () => {
      let rotation = 0
      simulation = createRainSimulation({
        container,
        buttons,
        agreeButton,
        getRotationDeg: () => rotation,
      })

      vi.advanceTimersByTime(3000)
      const transformBeforeRotating = agreeButton.style.transform

      rotation = -60
      vi.advanceTimersByTime(3000)

      expect(agreeButton.style.transform).not.toBe(transformBeforeRotating)
    })

    it('once revealed inside the visible box, cannot roll back into hiding even if the window rotates the other way', () => {
      let rotation = -60 // antihorario: lo revela
      simulation = createRainSimulation({
        container,
        buttons,
        agreeButton,
        getRotationDeg: () => rotation,
      })

      vi.advanceTimersByTime(8000)
      expect(translateX(agreeButton)).toBeLessThan(BOX_WIDTH - AGREE_WIDTH / 2) // revelado

      rotation = 60 // horario: antes lo escondía, ahora no debería poder
      vi.advanceTimersByTime(8000)

      expect(translateX(agreeButton)).toBeLessThan(BOX_WIDTH - AGREE_WIDTH / 2) // sigue a la vista
    })

    it('rotating counter-clockwise (negative degrees) eventually rolls the Agree into the visible box', () => {
      simulation = createRainSimulation({
        container,
        buttons,
        agreeButton,
        getRotationDeg: () => -60,
      })

      vi.advanceTimersByTime(8000)

      expect(translateX(agreeButton)).toBeLessThan(BOX_WIDTH - AGREE_WIDTH / 2)
    })

    it('rotating clockwise (positive degrees) does not reveal the Agree', () => {
      simulation = createRainSimulation({
        container,
        buttons,
        agreeButton,
        getRotationDeg: () => 60,
      })

      vi.advanceTimersByTime(8000)

      expect(translateX(agreeButton)).toBeGreaterThanOrEqual(BOX_WIDTH - 5)
    })
  })
})
