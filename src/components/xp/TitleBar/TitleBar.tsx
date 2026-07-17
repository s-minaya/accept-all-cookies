import styles from './TitleBar.module.css'

export interface TitleBarProps {
  title: string
  counter?: number
  onClose?: () => void
  closeLabel?: string
}

export function TitleBar({ title, counter, onClose, closeLabel }: TitleBarProps) {
  return (
    <div className={styles.titleBar}>
      <span className={styles.counter}>{counter ?? ''}</span>
      <span className={styles.title}>{title}</span>
      {onClose ? (
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label={closeLabel}
        >
          <span className={styles.closeChip}>
            <svg viewBox="0 0 10 10" aria-hidden="true" className={styles.closeIcon}>
              <line x1="1" y1="1" x2="9" y2="9" />
              <line x1="9" y1="1" x2="1" y2="9" />
            </svg>
          </span>
        </button>
      ) : (
        <span aria-hidden="true" />
      )}
    </div>
  )
}
