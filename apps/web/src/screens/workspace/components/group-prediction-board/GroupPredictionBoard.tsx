import { Trophy } from "lucide-react";

import type { Group, Match, MatchScore } from "../../../../data/tournament";
import { GroupPredictionCard } from "../group-prediction-card/GroupPredictionCard";
import styles from "./GroupPredictionBoard.module.css";

type GroupPredictionBoardProps = {
  groupOrders: Record<string, string[]>;
  groups: Group[];
  matches: Match[];
  matchScores: Record<string, MatchScore>;
  savedGroupIds: string[];
  onOpenGroup: (groupId: string) => void;
};

const getScoresStats = (groupId: string, matches: Match[], matchScores: Record<string, MatchScore>) => {
  const groupMatches = matches.filter((match) => match.groupId === groupId);

  return {
    filled: groupMatches.filter((match) => {
      const score = matchScores[match.id];

      return Boolean(score && score.home !== "" && score.away !== "");
    }).length,
    total: groupMatches.length
  };
};

export function GroupPredictionBoard({
  groupOrders,
  groups,
  matches,
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
          const scoresStats = getScoresStats(group.id, matches, matchScores);

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
