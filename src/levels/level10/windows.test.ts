import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  bringToFront,
  clampToViewport,
  createInitialWindows,
  HOST_WINDOW_ID,
  MAX_WINDOWS,
  minVisibleXFor,
  MOBILE_MIN_VISIBLE_RATIO,
  moveWindow,
  pickAgreeWindow,
  spawnFrom,
} from './windows'

describe('windows (nivel 10 — modelo puro de duplicación, 014-plan.md)', () => {
  it('createInitialWindows starts with a single, unspawned host window on top', () => {
    const windows = createInitialWindows()
    expect(windows).toEqual([{ id: HOST_WINDOW_ID, x: 0, y: 0, hasSpawned: false, zIndex: 1 }])
  })

  it('spawnFrom creates a clone at the given position and marks the source as spawned', () => {
    const initial = createInitialWindows()
    const { windows, spawnedId } = spawnFrom(initial, HOST_WINDOW_ID, { x: 10, y: 20 })

    expect(spawnedId).not.toBeNull()
    expect(windows).toHaveLength(2)
    expect(windows[0]).toMatchObject({ id: HOST_WINDOW_ID, x: 0, y: 0, hasSpawned: true })
    expect(windows[1]).toMatchObject({ id: spawnedId, x: 10, y: 20, hasSpawned: false })
  })

  it('spawning then bringing the source to front (as the caller always does, in the same drag-start transaction) leaves the clone behind', () => {
    const initial = createInitialWindows()
    const { windows, spawnedId } = spawnFrom(initial, HOST_WINDOW_ID, { x: 10, y: 20 })
    const final = bringToFront(windows, HOST_WINDOW_ID)

    const host = final.find((w) => w.id === HOST_WINDOW_ID)!
    const clone = final.find((w) => w.id === spawnedId)!
    // La copia se queda por debajo de la ventana origen (que sigue "encima",
    // alejándose con el arrastre) — corregido tras revisión de Sofía.
    expect(clone.zIndex).toBeLessThan(host.zIndex)
  })

  it('a window that already spawned does not spawn again', () => {
    const initial = createInitialWindows()
    const first = spawnFrom(initial, HOST_WINDOW_ID, { x: 10, y: 20 })
    const second = spawnFrom(first.windows, HOST_WINDOW_ID, { x: 99, y: 99 })

    expect(second.spawnedId).toBeNull()
    expect(second.windows).toEqual(first.windows)
  })

  it('spawning from an id that does not exist is a no-op', () => {
    const initial = createInitialWindows()
    const result = spawnFrom(initial, 999, { x: 1, y: 1 })

    expect(result.spawnedId).toBeNull()
    expect(result.windows).toEqual(initial)
  })

  it('caps the total at MAX_WINDOWS: the 7th spawn attempt onwards is a no-op', () => {
    let windows = createInitialWindows()
    // Cada ventana solo pare una vez: hay que arrastrar una ventana DISTINTA
    // cada vez para llegar a 7 (1 host + 6 copias sucesivas de la última
    // copia nacida).
    let lastSpawnedId = HOST_WINDOW_ID
    for (let i = 0; i < 6; i++) {
      const outcome = spawnFrom(windows, lastSpawnedId, { x: i, y: i })
      expect(outcome.spawnedId).not.toBeNull()
      windows = outcome.windows
      lastSpawnedId = outcome.spawnedId as number
    }
    expect(windows).toHaveLength(MAX_WINDOWS)

    const overCap = spawnFrom(windows, lastSpawnedId, { x: 50, y: 50 })
    expect(overCap.spawnedId).toBeNull()
    expect(overCap.windows).toHaveLength(MAX_WINDOWS)
  })

  it('moveWindow updates only the target window position', () => {
    const initial = spawnFrom(createInitialWindows(), HOST_WINDOW_ID, { x: 5, y: 5 }).windows
    const spawnedId = initial[1].id

    const moved = moveWindow(initial, spawnedId, { x: 42, y: 84 })

    expect(moved[0]).toEqual(initial[0])
    expect(moved[1]).toMatchObject({ id: spawnedId, x: 42, y: 84, hasSpawned: false })
  })

  describe('bringToFront', () => {
    it('raises the target above every other window', () => {
      const withTwo = spawnFrom(createInitialWindows(), HOST_WINDOW_ID, { x: 0, y: 0 }).windows
      const cloneId = withTwo[1].id

      const raised = bringToFront(withTwo, cloneId)

      const maxOfOthers = Math.max(...raised.filter((w) => w.id !== cloneId).map((w) => w.zIndex))
      const target = raised.find((w) => w.id === cloneId)!
      expect(target.zIndex).toBeGreaterThan(maxOfOthers)
    })

    it('bringing the already-topmost window to front again is idempotent in effect (still on top)', () => {
      const withTwo = spawnFrom(createInitialWindows(), HOST_WINDOW_ID, { x: 0, y: 0 }).windows
      const raisedOnce = bringToFront(withTwo, HOST_WINDOW_ID)
      const raisedTwice = bringToFront(raisedOnce, HOST_WINDOW_ID)

      const host = raisedTwice.find((w) => w.id === HOST_WINDOW_ID)!
      const others = raisedTwice.filter((w) => w.id !== HOST_WINDOW_ID)
      expect(host.zIndex).toBeGreaterThan(Math.max(...others.map((w) => w.zIndex)))
    })

    it('grabbing a window that already spawned still brings it to front (no clone, only reorder)', () => {
      const spawned = spawnFrom(createInitialWindows(), HOST_WINDOW_ID, { x: 0, y: 0 }).windows
      // El host ya parió: un segundo intento de spawnFrom es un no-op...
      const noSpawn = spawnFrom(spawned, HOST_WINDOW_ID, { x: 5, y: 5 })
      expect(noSpawn.spawnedId).toBeNull()
      // ...pero agarrarlo igualmente debe traerlo al frente.
      const raised = bringToFront(noSpawn.windows, HOST_WINDOW_ID)
      const host = raised.find((w) => w.id === HOST_WINDOW_ID)!
      const clone = raised.find((w) => w.id !== HOST_WINDOW_ID)!
      expect(host.zIndex).toBeGreaterThan(clone.zIndex)
    })
  })

  describe('clampToViewport', () => {
    const size = { width: 100, height: 60 }
    const viewport = { width: 400, height: 300 }

    it('leaves a position that already fits untouched', () => {
      expect(clampToViewport({ x: 150, y: 100 }, size, viewport)).toEqual({ x: 150, y: 100 })
    })

    it('clamps the top-left corner (full containment by default)', () => {
      expect(clampToViewport({ x: -50, y: -50 }, size, viewport)).toEqual({ x: 0, y: 0 })
    })

    it('clamps the top-right corner (full containment by default)', () => {
      expect(clampToViewport({ x: 1000, y: -50 }, size, viewport)).toEqual({
        x: viewport.width - size.width,
        y: 0,
      })
    })

    it('clamps the bottom-left corner', () => {
      expect(clampToViewport({ x: -50, y: 1000 }, size, viewport)).toEqual({
        x: 0,
        y: viewport.height - size.height,
      })
    })

    it('clamps the bottom-right corner', () => {
      expect(clampToViewport({ x: 1000, y: 1000 }, size, viewport)).toEqual({
        x: viewport.width - size.width,
        y: viewport.height - size.height,
      })
    })

    it('never goes negative when the window is bigger than the viewport', () => {
      const hugeSize = { width: 500, height: 500 }
      expect(clampToViewport({ x: 1000, y: 1000 }, hugeSize, viewport)).toEqual({ x: 0, y: 0 })
    })

    describe('minVisibleX (asomo parcial por los lados, GDD §15.2)', () => {
      it('allows the window to hang off the left edge, keeping only minVisibleX on screen', () => {
        const result = clampToViewport({ x: -1000, y: 0 }, size, viewport, 30)
        expect(result.x).toBe(30 - size.width) // asoma 70px por la izquierda, quedan 30px visibles
      })

      it('allows the window to hang off the right edge, keeping only minVisibleX on screen', () => {
        const result = clampToViewport({ x: 10_000, y: 0 }, size, viewport, 30)
        expect(result.x).toBe(viewport.width - 30)
      })

      it('never lets the visible sliver reach zero (always reachable)', () => {
        const result = clampToViewport({ x: -1_000_000, y: 0 }, size, viewport, 30)
        const visibleLeft = Math.max(result.x, 0)
        const visibleRight = Math.min(result.x + size.width, viewport.width)
        expect(visibleRight - visibleLeft).toBeGreaterThanOrEqual(30)
      })

      it('the Y axis stays fully contained regardless of minVisibleX (asomo solo lateral)', () => {
        const result = clampToViewport({ x: 0, y: -1000 }, size, viewport, 30)
        expect(result.y).toBe(0)
      })

      it('omitting minVisibleX preserves the original full-containment behaviour', () => {
        const withDefault = clampToViewport({ x: -1000, y: 0 }, size, viewport)
        expect(withDefault.x).toBe(0)
      })
    })
  })

  describe('minVisibleXFor (umbral móvil, corregido tras revisión de Sofía)', () => {
    afterEach(() => {
      vi.unstubAllGlobals()
    })

    function stubInnerWidth(width: number) {
      vi.stubGlobal('innerWidth', width)
    }

    it('full containment above the mobile threshold (tablet/desktop, unchanged)', () => {
      stubInnerWidth(1280)
      expect(minVisibleXFor(270)).toBe(270)
    })

    it('partial hide at a real phone width (390px — was excluded before this fix, xs alone was too narrow)', () => {
      stubInnerWidth(390)
      expect(minVisibleXFor(280)).toBeCloseTo(280 * MOBILE_MIN_VISIBLE_RATIO)
    })

    it('partial hide at the exact xs breakpoint (375px)', () => {
      stubInnerWidth(375)
      expect(minVisibleXFor(270)).toBeCloseTo(270 * MOBILE_MIN_VISIBLE_RATIO)
    })

    it('partial hide at the wide edge of sm (480px)', () => {
      stubInnerWidth(480)
      expect(minVisibleXFor(300)).toBeCloseTo(300 * MOBILE_MIN_VISIBLE_RATIO)
    })

    it('full containment just above the mobile threshold (481px)', () => {
      stubInnerWidth(481)
      expect(minVisibleXFor(300)).toBe(300)
    })
  })

  describe('pickAgreeWindow', () => {
    const ids = [1, 2, 3, 4, 5, 6, 7]

    it('is deterministic for a given seed', () => {
      expect(pickAgreeWindow(12345, ids)).toBe(pickAgreeWindow(12345, ids))
    })

    it('always returns one of the given ids', () => {
      for (let seed = 0; seed < 50; seed++) {
        expect(ids).toContain(pickAgreeWindow(seed, ids))
      }
    })

    it('picks a different window across different seeds (dispersion)', () => {
      // Semillas pequeñas y consecutivas arrancan xorshift32 casi sin
      // mezclar (mismo caso que `shuffle.test.ts` del nivel 8): un hash
      // multiplicativo las dispersa por los 32 bits antes de sembrar, igual
      // que en juego real (`Math.floor(Math.random() * 0xffffffff)`).
      const picks = new Set(
        Array.from({ length: 50 }, (_, i) =>
          pickAgreeWindow(Math.imul(i + 1, 2654435761) >>> 0, ids),
        ),
      )
      expect(picks.size).toBeGreaterThan(1)
    })

    it('never returns an excluded id when the caller filters the last-created window out', () => {
      // El nivel excluye la última ventana (id 7) antes de llamar — aquí se
      // comprueba que, dada esa lista ya filtrada, el sorteo nunca "cuela" el 7.
      const eligible = ids.filter((id) => id !== 7)
      for (let seed = 0; seed < 50; seed++) {
        expect(pickAgreeWindow(seed, eligible)).not.toBe(7)
      }
    })
  })
})
