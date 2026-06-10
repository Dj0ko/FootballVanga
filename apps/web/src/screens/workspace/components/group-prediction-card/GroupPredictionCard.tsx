import { ArrowRight } from "lucide-react";

import type { Group } from "../../../../data/tournament";
import { teamFlagUrls } from "../../../../data/teamFlags";
import styles from "./GroupPredictionCard.module.css";

type GroupPredictionCardProps = {
  filledScoresCount: number;
  group: Group;
  isSaved: boolean;
  onOpen: () => void;
  teams: string[];
  totalScoresCount: number;
};

type TeamRowProps = {
  position: number;
  team: string;
};

function TeamRow({ position, team }: TeamRowProps) {
  const flagUrl = teamFlagUrls[team];

  return (
    <span className={styles.teamRow}>
      <span className={styles.position}>{position}</span>
      {flagUrl ? (
        <img className={styles.flag} src={flagUrl} alt={`Флаг: ${team}`} draggable={false} />
      ) : null}
      <span className={styles.teamName}>{team}</span>
    </span>
  );
}

const getScoresStatusClassName = (filledScoresCount: number, totalScoresCount: number) => {
  if (filledScoresCount === totalScoresCount) {
    return styles.scoresComplete;
  }

  if (filledScoresCount > 2) {
    return styles.scoresInProgress;
  }

  return styles.scoresLow;
};

export function GroupPredictionCard({
  filledScoresCount,
  group,
  isSaved,
  onOpen,
  teams,
  totalScoresCount
}: GroupPredictionCardProps) {
  const isComplete = filledScoresCount === totalScoresCount;
  const isSavedComplete = isSaved && isComplete;

  return (
    <button type="button" className={styles.card} onClick={onOpen}>
      <span className={styles.cardHeader}>
        <span>{group.name}</span>
        <ArrowRight size={18} aria-hidden="true" />
      </span>

      <span className={styles.teamList}>
        {teams.map((team, index) => (
          <TeamRow key={team} position={index + 1} team={team} />
        ))}
      </span>

      <span className={styles.cardFooter}>
        <span className={isSavedComplete ? styles.savedStatus : styles.draftStatus}>
          {isSavedComplete ? "Сохранено" : "Черновик"}
        </span>
        <span className={getScoresStatusClassName(filledScoresCount, totalScoresCount)}>
          Счета {filledScoresCount}/{totalScoresCount}
        </span>
      </span>
    </button>
  );
}
