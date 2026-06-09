import { Users } from "lucide-react";

import type { PredictionStatus, RoomParticipant } from "../../../../data/mockFootball";
import styles from "./ParticipantsSidebar.module.css";

type ParticipantsSidebarProps = {
  onOpenParticipant: (participant: RoomParticipant) => void;
  participants: RoomParticipant[];
};

const statusLabel: Record<PredictionStatus, string> = {
  saved: "готов",
  draft: "черновик",
  empty: "нет прогноза"
};

export function ParticipantsSidebar({ onOpenParticipant, participants }: ParticipantsSidebarProps) {
  return (
    <aside className={styles.sidebar} aria-labelledby="participants-title">
      <div className={styles.header}>
        <div>
          <p>{participants.length} участников</p>
          <h2 id="participants-title">Участники</h2>
        </div>
        <Users size={22} aria-hidden="true" />
      </div>

      <ol className={styles.list}>
        {participants.map((participant) => (
          <li key={participant.name}>
            <button
              type="button"
              className={styles.participantButton}
              onClick={() => onOpenParticipant(participant)}
              aria-label={`Открыть прогноз: ${participant.name}`}
            >
              <span className={styles.person}>
                <strong>
                  {participant.name}
                  {participant.isCurrent ? <em>Вы</em> : null}
                </strong>
                <span>{statusLabel[participant.predictionStatus]}</span>
              </span>
              <span className={styles.score}>
                <strong>{participant.points}</strong>
                <span>очков</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </aside>
  );
}
