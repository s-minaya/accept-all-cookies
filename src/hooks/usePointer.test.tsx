import { useRef } from 'react'
import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { usePointer, type UsePointerOptions } from './usePointer'

function Harness(props: UsePointerOptions) {
  const ref = useRef<HTMLDivElement>(null)
  usePointer(ref, props)
  return <div ref={ref} data-testid="target" style={{ width: 100, height: 100 }} />
}

function fire(el: Element, type: string, init: PointerEventInit = {}) {
  act(() => {
    el.dispatchEvent(
      new PointerEvent(type, { bubbles: true, cancelable: true, clientX: 0, clientY: 0, ...init }),
    )
  })
}

describe('usePointer — quietud (nivel 9, 013-plan.md)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('fires onStill after remaining still on hover, with NO pointerdown at all (ratón)', () => {
    const onStill = vi.fn()
    const { getByTestId } = render(<Harness stillnessMs={1000} onStill={onStill} />)
    const el = getByTestId('target')

    fire(el, 'pointerenter', { clientX: 10, clientY: 10 })
    fire(el, 'pointermove', { clientX: 10, clientY: 10 })
    vi.advanceTimersByTime(500)
    expect(onStill).not.toHaveBeenCalled()

    vi.advanceTimersByTime(600)
    expect(onStill).toHaveBeenCalled()
    expect(onStill.mock.calls.at(-1)?.[0]).toEqual({ x: 10, y: 10 })
  })

  it('does not fire onStill before the threshold elapses', () => {
    const onStill = vi.fn()
    const { getByTestId } = render(<Harness stillnessMs={1000} onStill={onStill} />)
    const el = getByTestId('target')

    fire(el, 'pointerenter', { clientX: 10, clientY: 10 })
    vi.advanceTimersByTime(900)
    expect(onStill).not.toHaveBeenCalled()
  })

  it('keeps firing onStill on every frame while it remains still (idempotent freeze, no single-shot edge)', () => {
    const onStill = vi.fn()
    const { getByTestId } = render(<Harness stillnessMs={1000} onStill={onStill} />)
    const el = getByTestId('target')

    fire(el, 'pointerenter', { clientX: 10, clientY: 10 })
    vi.advanceTimersByTime(1500)
    expect(onStill.mock.calls.length).toBeGreaterThan(1)
  })

  it('calls onUnstill exactly once when movement past the drag threshold breaks an established stillness', () => {
    const onStill = vi.fn()
    const onUnstill = vi.fn()
    const { getByTestId } = render(
      <Harness stillnessMs={1000} onStill={onStill} onUnstill={onUnstill} />,
    )
    const el = getByTestId('target')

    fire(el, 'pointerenter', { clientX: 10, clientY: 10 })
    vi.advanceTimersByTime(1100)
    expect(onStill).toHaveBeenCalled()

    fire(el, 'pointermove', { clientX: 50, clientY: 50 }) // se aleja bien por encima del umbral de jitter
    vi.advanceTimersByTime(16)
    expect(onUnstill).toHaveBeenCalledTimes(1)

    onStill.mockClear()
    vi.advanceTimersByTime(500)
    expect(onStill).not.toHaveBeenCalled() // el reloj de quietud se reinició con el nuevo punto
  })

  it('small jitter under the drag threshold does not break stillness', () => {
    const onUnstill = vi.fn()
    const { getByTestId } = render(<Harness stillnessMs={1000} onUnstill={onUnstill} />)
    const el = getByTestId('target')

    fire(el, 'pointerenter', { clientX: 10, clientY: 10 })
    vi.advanceTimersByTime(1100)
    fire(el, 'pointermove', { clientX: 12, clientY: 11 }) // dentro del umbral de 8px
    vi.advanceTimersByTime(100)
    expect(onUnstill).not.toHaveBeenCalled()
  })

  it('pointerleave stops tracking stillness entirely (no stray onStill afterward)', () => {
    const onStill = vi.fn()
    const { getByTestId } = render(<Harness stillnessMs={1000} onStill={onStill} />)
    const el = getByTestId('target')

    fire(el, 'pointerenter', { clientX: 10, clientY: 10 })
    vi.advanceTimersByTime(500)
    fire(el, 'pointerleave')
    vi.advanceTimersByTime(1000)
    expect(onStill).not.toHaveBeenCalled()
  })

  it('touch-style press-and-hold (pointerdown, no drag, no pointerenter beforehand) also triggers onStill', () => {
    const onStill = vi.fn()
    const { getByTestId } = render(<Harness stillnessMs={1000} onStill={onStill} />)
    const el = getByTestId('target')

    fire(el, 'pointerdown', { clientX: 20, clientY: 20, pointerId: 1 })
    vi.advanceTimersByTime(1100)
    expect(onStill).toHaveBeenCalled()
  })

  it('pointerup stops the stillness loop (lifting the finger un-arms it)', () => {
    const onStill = vi.fn()
    const { getByTestId } = render(<Harness stillnessMs={1000} onStill={onStill} />)
    const el = getByTestId('target')

    fire(el, 'pointerdown', { clientX: 20, clientY: 20, pointerId: 1 })
    vi.advanceTimersByTime(500)
    fire(el, 'pointerup', { clientX: 20, clientY: 20, pointerId: 1 })
    vi.advanceTimersByTime(1000)
    expect(onStill).not.toHaveBeenCalled()
  })

  it('lifting the finger after it froze fires onUnstill (touch has no "move away" to detect the break otherwise)', () => {
    // Bug real (nivel 9, encontrado con Playwright simulando un toque
    // mantenido): en táctil no hay hover, así que la única forma de
    // "soltar" es levantar el dedo — si `stopStillnessLoop` no avisara de
    // esto, un consumidor que use `onUnstill` para des-congelar (nivel 9)
    // se quedaría con la congelación pegada para siempre en cuanto el
    // jugador levantara el dedo sin pulsar nada.
    const onUnstill = vi.fn()
    const { getByTestId } = render(<Harness stillnessMs={1000} onUnstill={onUnstill} />)
    const el = getByTestId('target')

    fire(el, 'pointerdown', { clientX: 20, clientY: 20, pointerId: 1 })
    vi.advanceTimersByTime(1100) // se congela
    fire(el, 'pointerup', { clientX: 20, clientY: 20, pointerId: 1 }) // levanta sin moverse
    expect(onUnstill).toHaveBeenCalledTimes(1)
  })

  it('lifting the finger before it ever froze does NOT fire a spurious onUnstill', () => {
    const onUnstill = vi.fn()
    const { getByTestId } = render(<Harness stillnessMs={1000} onUnstill={onUnstill} />)
    const el = getByTestId('target')

    fire(el, 'pointerdown', { clientX: 20, clientY: 20, pointerId: 1 })
    vi.advanceTimersByTime(300) // por debajo del umbral, nunca llegó a congelarse
    fire(el, 'pointerup', { clientX: 20, clientY: 20, pointerId: 1 })
    expect(onUnstill).not.toHaveBeenCalled()
  })

  it('does not double-fire onUnstill when movement already broke stillness before lifting', () => {
    const onUnstill = vi.fn()
    const { getByTestId } = render(<Harness stillnessMs={1000} onUnstill={onUnstill} />)
    const el = getByTestId('target')

    fire(el, 'pointerdown', { clientX: 20, clientY: 20, pointerId: 1 })
    vi.advanceTimersByTime(1100) // se congela
    fire(el, 'pointermove', { clientX: 60, clientY: 60, pointerId: 1 }) // se mueve: onUnstill #1
    vi.advanceTimersByTime(16)
    fire(el, 'pointerup', { clientX: 60, clientY: 60, pointerId: 1 }) // levanta: no debe volver a disparar
    expect(onUnstill).toHaveBeenCalledTimes(1)
  })

  it('existing tap/drag classification keeps working unchanged alongside stillness tracking', () => {
    const onTap = vi.fn()
    const onDragStart = vi.fn()
    const { getByTestId } = render(<Harness onTap={onTap} onDragStart={onDragStart} />)
    const el = getByTestId('target')

    fire(el, 'pointerdown', { clientX: 5, clientY: 5, pointerId: 1 })
    fire(el, 'pointerup', { clientX: 5, clientY: 5, pointerId: 1 })
    expect(onTap).toHaveBeenCalledTimes(1)
    expect(onDragStart).not.toHaveBeenCalled()

    fire(el, 'pointerdown', { clientX: 5, clientY: 5, pointerId: 1 })
    fire(el, 'pointermove', { clientX: 50, clientY: 50, pointerId: 1 })
    expect(onDragStart).toHaveBeenCalledTimes(1)
  })

  it('unmount stops the stillness rAF loop (no leaks)', () => {
    const onStill = vi.fn()
    const { getByTestId, unmount } = render(<Harness stillnessMs={1000} onStill={onStill} />)
    const el = getByTestId('target')

    fire(el, 'pointerenter', { clientX: 10, clientY: 10 })
    vi.advanceTimersByTime(500)
    unmount()
    expect(() => vi.advanceTimersByTime(2000)).not.toThrow()
    expect(onStill).not.toHaveBeenCalled()
  })
})
