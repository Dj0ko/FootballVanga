import { Trophy } from "lucide-react";

import type { Group, MatchScore } from "../../../../data/mockFootball";
import { GroupPredictionCard } from "../group-prediction-card/GroupPredictionCard";
import styles from "./GroupPredictionBoard.module.css";

type GroupPredictionBoardProps = {
  groupOrders: Record<string, string[]>;
  groups: Group[];
  matchScores: Record<string, MatchScore>;
  savedGroupIds: string[];
  onOpenGroup: (groupId: string) => void;
};

const getScoresStats = (groupId: string, matchScores: Record<string, MatchScore>) => {
  const groupScores = Object.entries(matchScores).filter(([matchId]) => matchId.startsWith(`${groupId}-`));

  return {
    filled: groupScores.filter(([, score]) => score.home !== "" && score.away !== "").length,
    total: groupScores.length
  };
};

export function GroupPredictionBoard({
  groupOrders,
  groups,
  matchScores,
  savedGroupIds,
  onOpenGroup
}: GroupPredictionBoardProps) {
  return (
    <section className={styles.board} aria-labelledby="groups-title">
      <div className={styles.heading}>
        <div className={styles.sectionTitle}>
          <Trophy size={18} aria-hidden="true" />
          <h2 id="groups-title">Места в группах</h2>
        </div>
        <span>{groups.length} групп</span>
      </div>

      <div className={styles.groupGrid}>
        {groups.map((group) => {
          const scoresStats = getScoresStats(group.id, matchScores);

          return (
            <GroupPredictionCard
              group={group}
              isSaved={savedGroupIds.includes(group.id)}
              key={group.id}
              filledScoresCount={scoresStats.filled}
              teams={groupOrders[group.id] ?? group.teams}
              totalScoresCount={scoresStats.total}
              onOpen={() => onOpenGroup(group.id)}
            />
          );
        })}
      </div>
    </section>
  );
}
