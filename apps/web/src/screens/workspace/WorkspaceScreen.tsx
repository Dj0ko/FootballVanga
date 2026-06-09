import { ArrowLeft, Save } from "lucide-react";
import { useState } from "react";

import { DeadlineCountdown } from "../../components/deadline-countdown/DeadlineCountdown";
import {
  createEmptyPredictionSnapshot,
  groups,
  matches,
  participantPredictionSnapshots,
  type MatchScore
} from "../../data/mockFootball";
import { GroupPredictionBoard } from "./components/group-prediction-board/GroupPredictionBoard";
import { GroupPredictionDetail } from "./components/group-prediction-detail/GroupPredictionDetail";
import styles from "./WorkspaceScreen.module.css";

type WorkspaceScreenProps = {
  isReadOnly: boolean;
  onBackToLobby: () => void;
  participantName: string;
  roomName: string;
};

const cloneGroupOrders = (groupOrders: Record<string, string[]>) =>
  Object.fromEntries(Object.entries(groupOrders).map(([groupId, teams]) => [groupId, [...teams]])) as Record<
    string,
    string[]
  >;

const cloneMatchScores = (matchScores: Record<string, MatchScore>) =>
  Object.fromEntries(Object.entries(matchScores).map(([matchId, score]) => [matchId, { ...score }])) as Record<
    string,
    MatchScore
  >;

export function WorkspaceScreen({
  isReadOnly,
  onBackToLobby,
  participantName,
  roomName
}: WorkspaceScreenProps) {
  const predictionSnapshot = participantPredictionSnapshots[participantName] ?? createEmptyPredictionSnapshot();
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [groupOrders, setGroupOrders] = useState(() => cloneGroupOrders(predictionSnapshot.groupOrders));
  const [matchScores, setMatchScores] = useState<Record<string, MatchScore>>(() =>
    cloneMatchScores(predictionSnapshot.matchScores)
  );
  const [savedGroupIds, setSavedGroupIds] = useState<string[]>(() => [...predictionSnapshot.savedGroupIds]);

  const activeGroup = groups.find((group) => group.id === activeGroupId) ?? null;
  const activeGroupIndex = activeGroup ? groups.findIndex((group) => group.id === activeGroup.id) : -1;
  const activeGroupMatches = activeGroup
    ? matches
        .filter((match) => match.id.startsWith(`${activeGroup.id}-`))
        .sort((leftMatch, rightMatch) => Date.parse(leftMatch.startsAtIso) - Date.parse(rightMatch.startsAtIso))
    : [];
  const filledScoresCount = Object.values(matchScores).filter((score) => score.home !== "" && score.away !== "").length;
  const savedGroupsCount = savedGroupIds.length;

  const reorderGroup = (groupId: string, teams: string[]) => {
    if (isReadOnly) {
      return;
    }

    setGroupOrders((currentOrders) => ({
      ...currentOrders,
      [groupId]: teams
    }));
    setSavedGroupIds((currentIds) => currentIds.filter((savedGroupId) => savedGroupId !== groupId));
  };

  const updateScore = (matchId: string, side: keyof MatchScore, value: number | "") => {
    if (isReadOnly) {
      return;
    }

    const [groupId] = matchId.split("-");

    setMatchScores((currentScores) => ({
      ...currentScores,
      [matchId]: {
        ...(currentScores[matchId] ?? { home: "", away: "" }),
        [side]: value
      }
    }));

    if (groupId) {
      setSavedGroupIds((currentIds) => currentIds.filter((savedGroupId) => savedGroupId !== groupId));
    }
  };

  const saveActiveGroup = () => {
    if (!activeGroup || isReadOnly) {
      return;
    }

    setSavedGroupIds((currentIds) =>
      currentIds.includes(activeGroup.id) ? currentIds : [...currentIds, activeGroup.id]
    );
  };

  const openAdjacentGroup = (direction: -1 | 1) => {
    if (activeGroupIndex === -1) {
      return;
    }

    const nextIndex = (activeGroupIndex + direction + groups.length) % groups.length;
    setActiveGroupId(groups[nextIndex]?.id ?? null);
  };

  return (
    <main className={styles.shell}>
      <header className={styles.topbar}>
        <button type="button" className={styles.backButton} onClick={onBackToLobby}>
          <ArrowLeft size={18} aria-hidden="true" />
          Лобби
        </button>

        <div className={styles.titleBlock}>
          <h1 className={styles.title}>
            <span className={styles.titleText}>{roomName}</span>
          </h1>
        </div>

        <DeadlineCountdown className={styles.deadlineCountdown} />
      </header>

      <section className={styles.predictionArea} aria-label="Доска прогноза">
        <div className={`${styles.statusStrip} ${isReadOnly ? styles.statusStripReadOnly : ""}`}>
          <div>
            <span>Участник</span>
            <strong>{participantName}</strong>
          </div>
          <div>
            <span>Статус</span>
            <strong>{isReadOnly ? "Только просмотр" : "Черновик открыт"}</strong>
          </div>
          <div>
            <span>Сохранено</span>
            <strong>{savedGroupsCount} из {groups.length}</strong>
          </div>
          <div>
            <span>Счета</span>
            <strong>{filledScoresCount} из {matches.length}</strong>
          </div>
          {isReadOnly ? null : (
            <button type="button" className={styles.saveButton}>
              <Save size={18} aria-hidden="true" />
              Сохранить прогноз
            </button>
          )}
        </div>

        {activeGroup ? (
          <GroupPredictionDetail
            group={activeGroup}
            isSaved={savedGroupIds.includes(activeGroup.id)}
            matches={activeGroupMatches}
            matchScores={matchScores}
            isReadOnly={isReadOnly}
            teams={groupOrders[activeGroup.id] ?? activeGroup.teams}
            onBackToOverview={() => setActiveGroupId(null)}
            onNextGroup={() => openAdjacentGroup(1)}
            onPreviousGroup={() => openAdjacentGroup(-1)}
            onSaveGroup={saveActiveGroup}
            onScoreChange={updateScore}
            onTeamsChange={(teams) => reorderGroup(activeGroup.id, teams)}
          />
        ) : (
          <GroupPredictionBoard
            groups={groups}
            groupOrders={groupOrders}
            matchScores={matchScores}
            savedGroupIds={savedGroupIds}
            onOpenGroup={setActiveGroupId}
          />
        )}
      </section>
    </main>
  );
}
