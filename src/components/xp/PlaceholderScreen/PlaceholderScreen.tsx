import type { ReactNode } from 'react'
import styles from './PlaceholderScreen.module.scss'

export interface PlaceholderScreenProps {
  title: string
  children: ReactNode
  /** Accesorio opcional anclado a la esquina superior izquierda (p. ej. un botón de volver). */
  topLeft?: ReactNode
}

/**
 * Tarjeta a pantalla completa, mínima y con estética XP, compartida por las
 * pantallas placeholder del shell (landing/selección/créditos) hasta que
 * cada una tenga contenido real en las features 003/004/016.
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
