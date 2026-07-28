import { describe, expect, it } from 'vitest'
import { createRng, nextSpawnPoint, SPAWN_AGREE_RATIO } from './spawner'

// Las propiedades del propio PRNG (determinismo, semillas distintas, rango
// [0,1)) se cubren en `src/utils/prng.test.ts` desde que se extrajo ahí
// (009-plan.md) — aquí solo lo que es específico de este módulo: `createRng`
// se reexporta desde `./spawner` para no romper a quien ya lo importaba de
// aquí (`board.ts`).
describe('spawner (GDD Nivel 4 — generador de botones que caen, 008-plan.md)', () => {
  it('splits Agree/Disagree ~50/50 (SPAWN_AGREE_RATIO) over a large sample', () => {
    expect(SPAWN_AGREE_RATIO).toBe(0.5)
    const rng = createRng(1234)
    const SAMPLE = 4000
    let agreeCount = 0

    for (let i = 0; i < SAMPLE; i++) {
      const { type } = nextSpawnPoint(rng, 640, 30)
      if (type === 'agree') agreeCount++
    }

    const ratio = agreeCount / SAMPLE
    expect(ratio).toBeGreaterThan(0.45)
    expect(ratio).toBeLessThan(0.55)
  })

  it('always spawns within [marginX, canvasWidth - marginX]', () => {
    const rng = createRng(99)
    const canvasWidth = 640
    const marginX = 30

    for (let i = 0; i < 500; i++) {
      const { x } = nextSpawnPoint(rng, canvasWidth, marginX)
      expect(x).toBeGreaterThanOrEqual(marginX)
      expect(x).toBeLessThanOrEqual(canvasWidth - marginX)
    }
  })

  it('the same seed reproduces the exact same sequence of spawn points (bug repro / deterministic tests)', () => {
    const rngA = createRng(555)
    const rngB = createRng(555)

    const pointsA = Array.from({ length: 15 }, () => nextSpawnPoint(rngA, 640, 30))
    const pointsB = Array.from({ length: 15 }, () => nextSpawnPoint(rngB, 640, 30))

    expect(pointsA).toEqual(pointsB)
  })
})
