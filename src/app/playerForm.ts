const MAX_NAME_LENGTH = 16

/**
 * Applied when confirming the character modal's name field (GDD §1.1 / 003-spec.md):
 * trim, clamp to 16 chars, and fall back to the character's default name if
 * that leaves nothing — never blocks the flow with a validation error.
 */
export function resolveConfirmedName(rawInput: string, defaultName: string): string {
  const trimmed = rawInput.trim().slice(0, MAX_NAME_LENGTH)
  return trimmed.length > 0 ? trimmed : defaultName
}
