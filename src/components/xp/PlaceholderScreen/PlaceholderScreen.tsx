import type { ReactNode } from 'react'
import styles from './PlaceholderScreen.module.css'

export interface PlaceholderScreenProps {
  title: string
  children: ReactNode
}

/**
 * Minimal XP-flavored full-screen card shared by the shell's placeholder
 * screens (landing/select/credits) until each gets real content in
 * features 003/004/016.
 */
export function PlaceholderScreen({ title, children }: PlaceholderScreenProps) {
  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>{title}</h1>
        <div className={styles.body}>{children}</div>
      </div>
    </main>
  )
}
