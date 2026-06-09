import { Trophy } from "lucide-react";

import type { GlobalLeader } from "../../../../data/mockFootball";
import styles from "./RoomsLeaderboard.module.css";

type RoomsLeaderboardProps = {
  leaders: GlobalLeader[];
};

export function RoomsLeaderboard({ leaders }: RoomsLeaderboardProps) {
  const topLeaders = [...leaders]
    .sort((left, right) => {
      if (right.points !== left.points) {
        return right.points - left.points;
      }

      return right.exactScores - left.exactScores;
    })
    .slice(0, 5);

  return (
    <aside className={styles.sidebar} aria-labelledby="global-leaders-title">
      <div className={styles.header}>
        <div>
          <h2 id="global-leaders-title">ТОП-5 лидеров рейтинга</h2>
        </div>
        <Trophy size={22} aria-hidden="true" />
      </div>

      <ol className={styles.list}>
        {topLeaders.map((leader, index) => (
          <li key={`${leader.roomName}-${leader.name}`}>
            <span className={styles.rank}>{index + 1}</span>
            <span className={styles.person}>
              <strong>{leader.name}</strong>
              <span>{leader.roomName}</span>
            </span>
            <span className={styles.score}>
              <strong>{leader.points}</strong>
              <span>очков</span>
            </span>
          </li>
        ))}
      </ol>
    </aside>
  );
}
