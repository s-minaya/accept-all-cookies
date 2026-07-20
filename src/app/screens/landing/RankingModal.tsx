import { XPDialog } from '../../../components/xp/XPDialog'
import { useT } from '../../../i18n/useT'
import { useRankingStore } from '../../../state/rankingStore'
import { sortRanking } from '../../rankingSort'
import { getCharacter } from '../../characters'
import styles from './RankingModal.module.css'

export interface RankingModalProps {
  onClose: () => void
}

export function RankingModal({ onClose }: RankingModalProps) {
  const t = useT()
  const entries = useRankingStore((state) => state.entries)
  const ranked = sortRanking(entries)

  return (
    <XPDialog title={t('landing.ranking.title')} onClose={onClose} closeLabel={t('landing.close')}>
      {ranked.length === 0 ? (
        <p>{t('landing.ranking.empty')}</p>
      ) : (
        <ul className={styles.list}>
          {ranked.map((entry) => (
            <li key={entry.username} className={styles.row}>
              <img src={getCharacter(entry.character).sprite} alt="" className={styles.avatar} />
              <span className={styles.username}>{entry.username}</span>
              <span className={styles.level}>
                {t('shell.select.levelLabel')} {entry.maxLevel}
              </span>
              <span className={styles.date}>{entry.date}</span>
            </li>
          ))}
        </ul>
      )}
    </XPDialog>
  )
}
