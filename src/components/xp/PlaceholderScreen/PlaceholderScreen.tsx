import type { ReactNode } from 'react'
import styles from './PlaceholderScreen.module.scss'

export interface PlaceholderScreenProps {
  title: string
  children: ReactNode
  /** Optional accessory anchored to the top-left corner (e.g. a back button). */
  topLeft?: ReactNode
}

/**
 * Minimal XP-flavored full-screen card shared by the shell's placeholder
 * screens (landing/select/credits) until each gets real content in
 * features 003/004/016.
 */
export function PlaceholderScreen({ title, children, topLeft }: PlaceholderScreenProps) {
  return (
    <main className={styles['placeholder-screen']}>
      {topLeft && <div className={styles['placeholder-screen__top-left']}>{topLeft}</div>}
      <div className={styles['placeholder-screen__card']}>
        <h1 className={styles['placeholder-screen__title']}>{title}</h1>
        <div className={styles['placeholder-screen__body']}>{children}</div>
      </div>
    </main>
  )
}
