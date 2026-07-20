import type { ReactNode } from 'react'
import { TitleBar } from '../TitleBar'
import styles from './XPDialog.module.scss'

export interface XPDialogProps {
  title: string
  children: ReactNode
  footer?: ReactNode
  /** Landing modals (003) close on X like a normal window; level dialogs (001 demo) omit it on purpose. */
  onClose?: () => void
  closeLabel?: string
  /** Extra class(es) on the dialog box — e.g. a modifier that widens it (CharacterModal). */
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
