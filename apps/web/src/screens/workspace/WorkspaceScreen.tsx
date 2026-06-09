import { ArrowLeft, Lock, Save } from "lucide-react";
import { useState } from "react";

import { groups } from "../../data/mockFootball";
import { GroupPredictionBoard } from "./components/group-prediction-board/GroupPredictionBoard";
import styles from "./WorkspaceScreen.module.css";

type WorkspaceScreenProps = {
  deadlineLabel: string;
  onBackToLobby: () => void;
  roomName: string;
};

const createInitialGroupOrders = () =>
  Object.fromEntries(groups.map((group) => [group.id, [...group.teams]])) as Record<string, string[]>;

export function WorkspaceScreen({ deadlineLabel, onBackToLobby, roomName }: WorkspaceScreenProps) {
  const [groupOrders, setGroupOrders] = useState(createInitialGroupOrders);

  const reorderGroup = (groupId: string, teams: string[]) => {
    setGroupOrders((currentOrders) => ({
      ...currentOrders,
      [groupId]: teams
    }));
  };

  return (
    <main className={styles.shell}>
      <header className={styles.topbar}>
        <button type="button" className={styles.backButton} onClick={onBackToLobby}>
          <ArrowLeft size={18} aria-hidden="true" />
          Лобби
        </button>

        <div className={styles.titleBlock}>
          <p className={styles.eyebrow}>{roomName}</p>
          <h1 className={styles.title}>Мой прогноз</h1>
        </div>

        <div className={styles.deadlinePill}>
          <Lock size={16} aria-hidden="true" />
          {deadlineLabel}
        </div>
      </header>

      <section className={styles.predictionArea} aria-label="Доска прогноза">
        <div className={styles.statusStrip}>
          <div>
            <span>Участник</span>
            <strong>Вы</strong>
          </div>
          <div>
            <span>Статус</span>
            <strong>Черновик открыт</strong>
          </div>
          <div>
            <span>Группы</span>
            <strong>{groups.length} из {groups.length}</strong>
          </div>
          <button type="button" className={styles.saveButton}>
            <Save size={18} aria-hidden="true" />
            Сохранить прогноз
          </button>
        </div>

        <GroupPredictionBoard groups={groups} groupOrders={groupOrders} onReorderGroup={reorderGroup} />
      </section>
    </main>
  );
}
