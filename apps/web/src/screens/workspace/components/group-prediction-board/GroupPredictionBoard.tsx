import { Trophy } from "lucide-react";

import type { Group } from "../../../../data/mockFootball";
import { GroupPredictionCard } from "../group-prediction-card/GroupPredictionCard";
import styles from "./GroupPredictionBoard.module.css";

type GroupPredictionBoardProps = {
  groupOrders: Record<string, string[]>;
  groups: Group[];
  onReorderGroup: (groupId: string, teams: string[]) => void;
};

export function GroupPredictionBoard({ groupOrders, groups, onReorderGroup }: GroupPredictionBoardProps) {
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
        {groups.map((group) => (
          <GroupPredictionCard
            group={group}
            key={group.id}
            teams={groupOrders[group.id] ?? group.teams}
            onTeamsChange={(teams) => onReorderGroup(group.id, teams)}
          />
        ))}
      </div>
    </section>
  );
}
