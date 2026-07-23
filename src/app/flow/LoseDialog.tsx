import { XPButton } from '../../components/xp/XPButton'
import { XPDialog } from '../../components/xp/XPDialog'
import { useT } from '../../i18n/useT'
import styles from './LoseDialog.module.scss'

export interface LoseDialogProps {
  onReturnToSelection: () => void
}

/** Fase 2 del flujo de derrota (GDD §6.2): mismo XPDialog que el resto del juego, sin X. */
export function LoseDialog({ onReturnToSelection }: LoseDialogProps) {
  const t = useT()

  return (
    <XPDialog
      title={t('game.disagree')}
      footer={
        <XPButton variant="neutral" onClick={onReturnToSelection}>
          {t('game.returnToLevelSelection')}
        </XPButton>
      }
    >
      <p className={styles['lose-dialog__message']}>{t('meta.lose.message')}</p>
    </XPDialog>
  )
}
