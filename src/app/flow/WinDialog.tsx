import { XPButton } from '../../components/xp/XPButton'
import { XPDialog } from '../../components/xp/XPDialog'
import { useT } from '../../i18n/useT'
import styles from './WinDialog.module.scss'

export interface WinDialogProps {
  /** Nombre traducido de la categoría del nivel recién completado. */
  categoryName: string
  /** El nivel 12 usa un mensaje de cierre distinto (GDD §7.2); el botón sigue siendo Next (Credits llega en la 016). */
  isFinalLevel: boolean
  onNext: () => void
}

/** Fase 2 del flujo de victoria (GDD §7.2): mismo XPDialog que el resto del juego, sin X. */
export function WinDialog({ categoryName, isFinalLevel, onNext }: WinDialogProps) {
  const t = useT()

  return (
    <XPDialog
      title={t('game.cookiesAccepted')}
      footer={
        <XPButton variant="neutral" onClick={onNext}>
          {t('meta.win.nextButton')}
        </XPButton>
      }
    >
      <p className={styles['win-dialog__message']}>
        {t('meta.win.intro')}
        {'\n\n'}
        {categoryName}
        {'\n\n'}
        {isFinalLevel ? t('meta.win.outroFinal') : t('meta.win.outro')}
      </p>
    </XPDialog>
  )
}
