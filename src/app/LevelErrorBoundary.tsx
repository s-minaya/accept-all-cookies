import { Component, type ReactNode } from 'react'
import { XPButton } from '../components/xp/XPButton'
import { XPDialog } from '../components/xp/XPDialog'
import { useT, type TranslateFn } from '../i18n/useT'

interface InnerProps {
  children: ReactNode
  t: TranslateFn
  onCrash: () => void
}

interface InnerState {
  hasError: boolean
}

/**
 * Los límites de error de React solo existen como componentes de clase
 * (`getDerivedStateFromError`/`componentDidCatch` no tienen equivalente en
 * hooks): esta clase hace de "motor" y recibe `t` ya resuelto por props
 * desde el envoltorio funcional de abajo, que sí puede usar `useT()`.
 */
class LevelErrorBoundaryInner extends Component<InnerProps, InnerState> {
  state: InnerState = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    // Único `console.error` intencional del juego: un chunk que falla al
    // cargar (hipo de red en Pages) es información real de depuración, no
    // ruido — 017-plan.md, bloque G.
    console.error('Level failed to load:', error)
  }

  render() {
    if (!this.state.hasError) return this.props.children
    const { t, onCrash } = this.props
    return (
      <XPDialog
        title={t('meta.error.title')}
        footer={
          <XPButton variant="neutral" onClick={onCrash}>
            {t('meta.error.backButton')}
          </XPButton>
        }
      >
        <p>{t('meta.error.message')}</p>
      </XPDialog>
    )
  }
}

export interface LevelErrorBoundaryProps {
  children: ReactNode
  /** Se llama al pulsar el botón de volver — el shell resuelve la navegación real. */
  onCrash: () => void
}

/**
 * Envuelve el nivel activo (`LevelHost.tsx`, 017-plan.md, bloque G): si el
 * `import()` dinámico de un nivel falla al cargar su chunk (un hipo de red
 * real en GitHub Pages, no algo que ocurra en desarrollo con todo servido en
 * local), el jugador ve un diálogo XP con salida en vez de una pantalla en
 * blanco. No ofrece reintentar — un solo botón, volver a la selección
 * (017-spec.md): más simple, y el jugador siempre puede volver a intentarlo
 * desde ahí sin perder el progreso ya guardado (ver `abandonLevel`,
 * `runStore.ts` — a diferencia de una derrota real, esto no cuenta como tal).
 */
export function LevelErrorBoundary({ children, onCrash }: LevelErrorBoundaryProps) {
  const t = useT()
  return (
    <LevelErrorBoundaryInner t={t} onCrash={onCrash}>
      {children}
    </LevelErrorBoundaryInner>
  )
}
