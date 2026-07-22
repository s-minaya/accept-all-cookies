import { XPDialog } from '../../../components/xp/XPDialog'
import { useT } from '../../../i18n/useT'
import styles from './InfoModal.module.scss'

export interface InfoModalProps {
  onClose: () => void
}

export function InfoModal({ onClose }: InfoModalProps) {
  const t = useT()

  return (
    <XPDialog title={t('landing.info.title')} onClose={onClose} closeLabel={t('landing.close')}>
      <div className={styles['info-modal__content']}>
        <p>{t('landing.info.objective')}</p>
        <p>{t('landing.info.rules')}</p>
        <p>{t('landing.info.closing')}</p>
      </div>
    </XPDialog>
  )
}
