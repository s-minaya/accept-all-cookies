import { readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return listSourceFiles(path)
    // Tests are allowed to poke window.localStorage directly for setup/teardown;
    // the boundary this guards is application source, not test scaffolding.
    return /\.(ts|tsx)$/.test(entry.name) && !entry.name.includes('.test.') ? [path] : []
  })
}

describe('localStorage access boundary', () => {
  it('is only touched from src/state/storage.ts (AGENTS.md)', () => {
    const storageFile = resolve('src/state/storage.ts')

    const offenders = listSourceFiles('src')
      .filter((file) => resolve(file) !== storageFile)
      .filter((file) => readFileSync(file, 'utf-8').includes('localStorage'))

    expect(offenders).toEqual([])
  })
})
