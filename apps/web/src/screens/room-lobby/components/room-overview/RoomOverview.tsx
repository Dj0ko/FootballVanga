import { CalendarClock, ClipboardList, Edit3, Trophy, Users } from "lucide-react";

import type { RoomParticipant } from "../../../../data/mockFootball";
import styles from "./RoomOverview.module.css";

type RoomOverviewProps = {
  deadlineLabel: string;
  matchCount: number;
  participants: RoomParticipant[];
  onOpenWorkspace: () => void;
};

const getSavedPredictionsCount = (participants: RoomParticipant[]) =>
  participants.filter((participant) => participant.predictionStatus === "saved").length;

export function RoomOverview({ deadlineLabel, matchCount, participants, onOpenWorkspace }: RoomOverviewProps) {
  const savedPredictionsCount = getSavedPredictionsCount(participants);

  return (
    <section className={styles.panel} aria-labelledby="room-overview-title">
      <div className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Обзор комнаты</p>
          <h2 id="room-overview-title">Прогнозы открыты</h2>
        </div>
        <button type="button" className={styles.primaryButton} onClick={onOpenWorkspace}>
          <Edit3 size={18} aria-hidden="true" />
          Мой прогноз
        </button>
      </div>

      <div className={styles.statsGrid}>
        <article className={styles.statCard}>
          <Users size={20} aria-hidden="true" />
          <span>Участники</span>
          <strong>{participants.length}</strong>
        </article>
        <article className={styles.statCard}>
          <ClipboardList size={20} aria-hidden="true" />
          <span>Прогнозы заполнены</span>
          <strong>
            {savedPredictionsCount} из {participants.length}
          </strong>
        </article>
        <article className={styles.statCard}>
          <CalendarClock size={20} aria-hidden="true" />
          <span>Дедлайн</span>
          <strong>{deadlineLabel}</strong>
        </article>
        <article className={styles.statCard}>
          <Trophy size={20} aria-hidden="true" />
          <span>Матчи группы</span>
          <strong>{matchCount}</strong>
        </article>
      </div>
    </section>
  );
}
