import type { ReactNode } from 'react'
import { TitleBar } from '../TitleBar'
import styles from './XPWindow.module.css'

export interface XPWindowProps {
  title: string
  counter: number
  closeLabel: string
  onClose: () => void
  consentText: ReactNode
  children: ReactNode
  footer?: ReactNode
}

export function XPWindow({
  title,
  counter,
  closeLabel,
  onClose,
  consentText,
  children,
  footer,
}: XPWindowProps) {
  return (
    <div className={styles.window}>
      <TitleBar title={title} counter={counter} onClose={onClose} closeLabel={closeLabel} />

      <div className={styles.body}>
        <div className={styles.consentBox}>{consentText}</div>

        <div className={styles.frame}>
          <div className={styles.interior}>{children}</div>
        </div>

        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  )
}
