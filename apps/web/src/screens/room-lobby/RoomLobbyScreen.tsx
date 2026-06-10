import { ArrowLeft, Lock } from "lucide-react";

import { DeadlineCountdown } from "../../components/deadline-countdown/DeadlineCountdown";
import { ScoringRulesButton } from "../../components/scoring-rules/ScoringRulesButton";
import type { RoomParticipant, RoomSummary } from "../../data/rooms";
import { ParticipantsSidebar } from "./components/participants-sidebar/ParticipantsSidebar";
import { RoomOverview } from "./components/room-overview/RoomOverview";
import styles from "./RoomLobbyScreen.module.css";

type RoomLobbyScreenProps = {
  deadlineIso: string;
  matchCount: number;
  participants: RoomParticipant[];
  room: RoomSummary;
  onBackToRooms: () => void;
  onOpenMyPrediction: () => void;
  onOpenParticipantPrediction: (participant: RoomParticipant) => void;
  onOpenScoringRules: () => void;
};

export function RoomLobbyScreen({
  deadlineIso,
  matchCount,
  participants,
  room,
  onBackToRooms,
  onOpenMyPrediction,
  onOpenParticipantPrediction,
  onOpenScoringRules
}: RoomLobbyScreenProps) {
  return (
    <main className={styles.shell}>
      <header className={styles.topbar}>
        <button type="button" className={styles.backButton} onClick={onBackToRooms}>
          <ArrowLeft size={18} aria-hidden="true" />
          Комнаты
        </button>

        <div className={styles.roomTitle}>
          <h1>{room.name}</h1>
        </div>

        <div className={styles.roomStatus}>
          <Lock size={16} aria-hidden="true" />
          закрытая
        </div>

        <ScoringRulesButton className={styles.rulesButton} onClick={onOpenScoringRules} />
        <DeadlineCountdown className={styles.deadlineCountdown} startsAtIso={deadlineIso} />
      </header>

      <div className={styles.contentGrid}>
        <RoomOverview
          matchCount={matchCount}
          participants={participants}
          onOpenWorkspace={onOpenMyPrediction}
        />
        <ParticipantsSidebar
          participants={participants}
          onOpenParticipant={onOpenParticipantPrediction}
        />
      </div>
    </main>
  );
}
