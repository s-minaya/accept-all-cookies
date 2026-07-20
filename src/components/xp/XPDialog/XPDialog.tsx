import type { ReactNode } from 'react'
import { TitleBar } from '../TitleBar'
import styles from './XPDialog.module.css'

export interface XPDialogProps {
  title: string
  children: ReactNode
  footer?: ReactNode
  /** Landing modals (003) close on X like a normal window; level dialogs (001 demo) omit it on purpose. */
  onClose?: () => void
  closeLabel?: string
  /** Overrides the default 24rem cap. On mobile/tablet the viewport clamps width anyway, so this only matters on desktop. */
  maxWidth?: string
}

export function XPDialog({
  title,
  children,
  footer,
  onClose,
  closeLabel,
  maxWidth,
}: XPDialogProps) {
  return (
    <div className={styles.overlay}>
      <div
        className={styles.dialog}
        style={maxWidth ? { maxWidth } : undefined}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <TitleBar title={title} onClose={onClose} closeLabel={closeLabel} />
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  )
}
