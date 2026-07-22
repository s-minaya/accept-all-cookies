/**
 * Fuente única de verdad para los 5 breakpoints responsive, reflejados como
 * custom properties CSS en tokens.css. Mantener ambos sincronizados.
 */
export const breakpoints = {
  xs: 375,
  sm: 376,
  md: 481,
  lg: 1025,
  xl: 1441,
} as const

export type BreakpointName = keyof typeof breakpoints
