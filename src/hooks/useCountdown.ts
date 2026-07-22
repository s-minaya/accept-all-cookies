import { useCallback, useEffect, useRef, useState } from 'react'

export interface UseCountdownOptions {
  autoStart?: boolean
  onComplete?: () => void
}

export interface UseCountdownResult {
  remaining: number
  isRunning: boolean
  pause: () => void
  resume: () => void
  reset: (seconds?: number) => void
}

const TICK_MS = 1000

/** El único mecanismo de temporizador permitido en el proyecto (ver AGENTS.md). */
export function useCountdown(
  initialSeconds: number,
  { autoStart = true, onComplete }: UseCountdownOptions = {},
): UseCountdownResult {
  const [remaining, setRemaining] = useState(initialSeconds)
  const [isRunning, setIsRunning] = useState(autoStart)
  const onCompleteRef = useRef(onComplete)
  const hasCompletedRef = useRef(false)

  onCompleteRef.current = onComplete

  useEffect(() => {
    if (!isRunning) return

    const id = window.setInterval(() => {
      setRemaining((current) => {
        if (current <= 1) {
          window.clearInterval(id)
          return 0
        }
        return current - 1
      })
    }, TICK_MS)

    return () => window.clearInterval(id)
  }, [isRunning])

  useEffect(() => {
    if (remaining === 0 && !hasCompletedRef.current) {
      hasCompletedRef.current = true
      setIsRunning(false)
      onCompleteRef.current?.()
    }
  }, [remaining])

  const pause = useCallback(() => setIsRunning(false), [])

  const resume = useCallback(() => {
    if (remaining > 0) setIsRunning(true)
  }, [remaining])

  const reset = useCallback(
    (seconds: number = initialSeconds) => {
      hasCompletedRef.current = false
      setRemaining(seconds)
      setIsRunning(autoStart)
    },
    [initialSeconds, autoStart],
  )

  return { remaining, isRunning, pause, resume, reset }
}
