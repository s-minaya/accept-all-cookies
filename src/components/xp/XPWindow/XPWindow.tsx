import type { ReactNode } from 'react'
import { TitleBar } from '../TitleBar'
import styles from './XPWindow.module.scss'

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
    <div className={styles['xp-window']}>
      <TitleBar title={title} counter={counter} onClose={onClose} closeLabel={closeLabel} />

      <div className={styles['xp-window__body']}>
        <div className={styles['xp-window__consent-box']}>{consentText}</div>

        <div className={styles['xp-window__frame']}>
          <div className={styles['xp-window__interior']}>{children}</div>
        </div>

        {footer && <div className={styles['xp-window__footer']}>{footer}</div>}
      </div>
    </div>
  )
}
