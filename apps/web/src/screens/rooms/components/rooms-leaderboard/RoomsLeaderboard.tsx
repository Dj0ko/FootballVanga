import { Trophy } from "lucide-react";

import type { GlobalLeaderboardEntry } from "@footballvanga/shared";

import styles from "./RoomsLeaderboard.module.css";

type RoomsLeaderboardProps = {
  error: string;
  isLoading: boolean;
  leaders: GlobalLeaderboardEntry[];
  onOpenLeader: (leader: GlobalLeaderboardEntry) => void;
  onRetry: () => void;
};

export function RoomsLeaderboard({ error, isLoading, leaders, onOpenLeader, onRetry }: RoomsLeaderboardProps) {
  return (
    <aside className={styles.sidebar} aria-labelledby="global-leaders-title">
      <div className={styles.header}>
        <div>
          <h2 id="global-leaders-title">ТОП-5 лидеров рейтинга</h2>
        </div>
        <Trophy size={22} aria-hidden="true" />
      </div>

      {error ? (
        <div className={styles.state} role="alert">
          <p>{error}</p>
          <button type="button" onClick={onRetry}>
            Повторить
          </button>
        </div>
      ) : isLoading ? (
        <div className={styles.state} role="status">
          <p>Загружаем лидеров</p>
        </div>
      ) : leaders.length === 0 ? (
        <div className={styles.state} role="status">
          <p>Лидеры появятся после первых результатов.</p>
        </div>
      ) : (
        <ol className={styles.list}>
          {leaders.map((leader, index) => (
            <li key={`${leader.roomId}-${leader.participantId}`}>
              <button type="button" className={styles.leaderButton} onClick={() => onOpenLeader(leader)}>
                <span className={styles.rank}>{index + 1}</span>
                <span className={styles.person}>
                  <strong>{leader.displayName}</strong>
                  <span>{leader.roomName}</span>
                </span>
                <span className={styles.score}>
                  <strong>{leader.totalScore}</strong>
                  <span>{leader.exactScoreHits} точн.</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </aside>
  );
}
