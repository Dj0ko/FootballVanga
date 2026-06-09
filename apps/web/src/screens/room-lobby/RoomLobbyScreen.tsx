import { ArrowLeft, Lock } from "lucide-react";

import { groupStageMatchCount, roomParticipants, type RoomSummary } from "../../data/mockFootball";
import { ParticipantsSidebar } from "./components/participants-sidebar/ParticipantsSidebar";
import { RoomOverview } from "./components/room-overview/RoomOverview";
import styles from "./RoomLobbyScreen.module.css";

type RoomLobbyScreenProps = {
  room: RoomSummary;
  onBackToRooms: () => void;
  onOpenWorkspace: () => void;
};

export function RoomLobbyScreen({ room, onBackToRooms, onOpenWorkspace }: RoomLobbyScreenProps) {
  return (
    <main className={styles.shell}>
      <header className={styles.topbar}>
        <button type="button" className={styles.backButton} onClick={onBackToRooms}>
          <ArrowLeft size={18} aria-hidden="true" />
          Комнаты
        </button>

        <div className={styles.roomTitle}>
          <p>Комната</p>
          <h1>{room.name}</h1>
        </div>

        <div className={styles.roomStatus}>
          <Lock size={16} aria-hidden="true" />
          закрытая
        </div>
      </header>

      <div className={styles.contentGrid}>
        <RoomOverview
          deadlineLabel={room.deadlineLabel}
          matchCount={groupStageMatchCount}
          participants={roomParticipants}
          onOpenWorkspace={onOpenWorkspace}
        />
        <ParticipantsSidebar participants={roomParticipants} />
      </div>
    </main>
  );
}
