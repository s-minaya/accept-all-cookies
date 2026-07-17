import type { ReactNode } from 'react'
import { TitleBar } from '../TitleBar'
import styles from './XPDialog.module.css'

export interface XPDialogProps {
  title: string
  children: ReactNode
  footer?: ReactNode
}

export function XPDialog({ title, children, footer }: XPDialogProps) {
  return (
    <div className={styles.overlay}>
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-label={title}>
        <TitleBar title={title} />
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  )
}
