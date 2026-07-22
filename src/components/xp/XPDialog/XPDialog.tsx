import type { ReactNode } from 'react'
import { TitleBar } from '../TitleBar'
import styles from './XPDialog.module.scss'

export interface XPDialogProps {
  title: string
  children: ReactNode
  footer?: ReactNode
  /** Las modales de la landing (003) cierran con la X como una ventana normal; los diálogos de nivel (demo 001) la omiten a propósito. */
  onClose?: () => void
  closeLabel?: string
  /** Clase(s) extra en la caja del diálogo — p. ej. un modificador que la ensancha (CharacterModal). */
  className?: string
}

export function XPDialog({
  title,
  children,
  footer,
  onClose,
  closeLabel,
  className,
}: XPDialogProps) {
  const boxClasses = [styles['xp-dialog__box'], className].filter(Boolean).join(' ')

  return (
    <div className={styles['xp-dialog__overlay']}>
      <div className={boxClasses} role="dialog" aria-modal="true" aria-label={title}>
        <TitleBar title={title} onClose={onClose} closeLabel={closeLabel} />
        <div className={styles['xp-dialog__body']}>{children}</div>
        {footer && <div className={styles['xp-dialog__footer']}>{footer}</div>}
      </div>
    </div>
  )
}
