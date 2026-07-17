/**
 * Single source of truth for the 5 responsive breakpoints, mirrored as
 * CSS custom properties in tokens.css. Keep both in sync.
 */
export const breakpoints = {
  xs: 375,
  sm: 376,
  md: 481,
  lg: 1025,
  xl: 1441,
} as const

export type BreakpointName = keyof typeof breakpoints
