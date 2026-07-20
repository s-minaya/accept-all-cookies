import { XPDialog } from '../../../components/xp/XPDialog'
import { useT } from '../../../i18n/useT'
import { useRankingStore } from '../../../state/rankingStore'
import { sortRanking } from '../../rankingSort'
import { getCharacter } from '../../characters'
import styles from './RankingModal.module.scss'

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
        <ul className={styles['ranking-modal__list']}>
          {ranked.map((entry) => (
            <li key={entry.username} className={styles['ranking-modal__row']}>
              <img
                src={getCharacter(entry.character).sprite}
                alt=""
                className={styles['ranking-modal__avatar']}
              />
              <span className={styles['ranking-modal__username']}>{entry.username}</span>
              <span className={styles['ranking-modal__level']}>
                {t('shell.select.levelLabel')} {entry.maxLevel}
              </span>
              <span className={styles['ranking-modal__date']}>{entry.date}</span>
            </li>
          ))}
        </ul>
      )}
    </XPDialog>
  )
}
