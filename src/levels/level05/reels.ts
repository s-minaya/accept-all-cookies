/** Casillas por tira (GDD §14). */
export const REEL_LENGTH = 12
/** Proporción de Agree por tira (GDD §14: ~40%, "complicado pero no frustrante"). */
export const REEL_AGREE_RATIO = 0.4

export type ReelSymbol = 'agree' | 'disagree'

/**
 * Reparación determinista (009-plan.md, "Decisiones"): con `REEL_LENGTH`
 * casillas al `REEL_AGREE_RATIO`, la probabilidad de una tira degenerada
 * (todo Agree o todo Disagree) es minúscula pero no nula — una tira sin
 * Agrees haría el nivel literalmente imposible en ese rodillo. En vez de
 * reintentar generar hasta que salga válida, se fuerza la última casilla al
 * símbolo contrario: elimina la clase entera de bug con un coste fijo.
 */
function repairDegenerateReel(symbols: ReelSymbol[]): ReelSymbol[] {
  const hasAgree = symbols.includes('agree')
  const hasDisagree = symbols.includes('disagree')
  if (hasAgree && hasDisagree) return symbols

  const repaired = [...symbols]
  repaired[repaired.length - 1] = hasAgree ? 'disagree' : 'agree'
  return repaired
}

/**
 * Genera una tira cíclica de una tragaperras (GDD Nivel 5): pura, con PRNG
 * inyectado (`src/utils/prng.ts`, semilla compartida con el nivel 4) para
 * que sea determinista en tests y reproducible en bugs reales.
 */
export function generateReel(
  rng: () => number,
  length: number = REEL_LENGTH,
  agreeRatio: number = REEL_AGREE_RATIO,
): ReelSymbol[] {
  const symbols: ReelSymbol[] = Array.from({ length }, () =>
    rng() < agreeRatio ? 'agree' : 'disagree',
  )
  return repairDegenerateReel(symbols)
}
