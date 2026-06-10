import { ArrowLeft, Save } from "lucide-react";
import { useEffect, useState } from "react";

import { fetchGlobalLeaderboardPrediction, fetchParticipantPrediction, saveMyPrediction } from "../../api/predictions";
import { DeadlineCountdown } from "../../components/deadline-countdown/DeadlineCountdown";
import { ScoringRulesButton } from "../../components/scoring-rules/ScoringRulesButton";
import {
  createEmptyPredictionSnapshot,
  createPredictionSnapshotFromParticipantPrediction,
  createSavePredictionInput,
  getCompleteGroupIds,
  getPredictionStatusFromParticipantPrediction,
  type MatchScore
} from "../../data/tournament";
import type { TournamentView } from "../../data/tournament";
import { GroupPredictionBoard } from "./components/group-prediction-board/GroupPredictionBoard";
import { GroupPredictionDetail } from "./components/group-prediction-detail/GroupPredictionDetail";
import styles from "./WorkspaceScreen.module.css";

type WorkspaceScreenProps = {
  backButtonLabel?: string;
  isReadOnly: boolean;
  isPublicReadOnly?: boolean;
  onParticipantPredictionStatusChange?: (participantId: string, predictionStatus: "saved" | "draft" | "empty") => void;
  onBackToLobby: () => void;
  onOpenScoringRules: () => void;
  participantId: string;
  participantName: string;
  roomId: string;
  roomName: string;
  sessionToken?: string;
  tournament: TournamentView;
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
  backButtonLabel = "Лобби",
  isReadOnly,
  isPublicReadOnly = false,
  onParticipantPredictionStatusChange,
  onBackToLobby,
  onOpenScoringRules,
  participantId,
  participantName,
  roomId,
  roomName,
  sessionToken,
  tournament
}: WorkspaceScreenProps) {
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [groupOrders, setGroupOrders] = useState(() =>
    cloneGroupOrders(createEmptyPredictionSnapshot(tournament).groupOrders)
  );
  const [matchScores, setMatchScores] = useState<Record<string, MatchScore>>(() =>
    cloneMatchScores(createEmptyPredictionSnapshot(tournament).matchScores)
  );
  const [savedGroupIds, setSavedGroupIds] = useState<string[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [isPredictionLoading, setIsPredictionLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [predictionError, setPredictionError] = useState("");
  const [saveError, setSaveError] = useState("");

  const activeGroup = tournament.groups.find((group) => group.id === activeGroupId) ?? null;
  const activeGroupIndex = activeGroup ? tournament.groups.findIndex((group) => group.id === activeGroup.id) : -1;
  const activeGroupMatches = activeGroup
    ? tournament.matches
        .filter((match) => match.groupId === activeGroup.id)
        .sort((leftMatch, rightMatch) => Date.parse(leftMatch.startsAtIso) - Date.parse(rightMatch.startsAtIso))
    : [];
  const filledScoresCount = Object.values(matchScores).filter((score) => score.home !== "" && score.away !== "").length;
  const savedGroupsCount = savedGroupIds.length;
  const canEdit = !isReadOnly && !isLocked && Boolean(sessionToken);
  const canSave = canEdit && !isPredictionLoading && !predictionError;

  useEffect(() => {
    let isCurrentRequest = true;
    const emptySnapshot = createEmptyPredictionSnapshot(tournament);

    setActiveGroupId(null);
    setGroupOrders(cloneGroupOrders(emptySnapshot.groupOrders));
    setMatchScores(cloneMatchScores(emptySnapshot.matchScores));
    setSavedGroupIds([]);
    setIsLocked(false);
    setIsPredictionLoading(true);
    setPredictionError("");
    setSaveError("");

    const loadPrediction = async () => {
      try {
        const response = isPublicReadOnly
          ? await fetchGlobalLeaderboardPrediction(roomId, participantId)
          : sessionToken
            ? await fetchParticipantPrediction(roomId, participantId, sessionToken)
            : null;

        if (!response) {
          throw new Error("Не удалось загрузить прогноз.");
        }

        const snapshot = createPredictionSnapshotFromParticipantPrediction(tournament, response.prediction);

        if (!isCurrentRequest) {
          return;
        }

        setGroupOrders(cloneGroupOrders(snapshot.groupOrders));
        setMatchScores(cloneMatchScores(snapshot.matchScores));
        setSavedGroupIds([...snapshot.savedGroupIds]);
        setIsLocked(response.isLocked);
        onParticipantPredictionStatusChange?.(
          participantId,
          getPredictionStatusFromParticipantPrediction(tournament, response.prediction)
        );
      } catch (error) {
        if (!isCurrentRequest) {
          return;
        }

        setPredictionError(error instanceof Error ? error.message : "Не удалось загрузить прогноз.");
      } finally {
        if (isCurrentRequest) {
          setIsPredictionLoading(false);
        }
      }
    };

    void loadPrediction();

    return () => {
      isCurrentRequest = false;
    };
  }, [isPublicReadOnly, onParticipantPredictionStatusChange, participantId, roomId, sessionToken, tournament]);

  const reorderGroup = (groupId: string, teams: string[]) => {
    if (!canEdit) {
      return;
    }

    setGroupOrders((currentOrders) => ({
      ...currentOrders,
      [groupId]: teams
    }));
    setSavedGroupIds((currentIds) => currentIds.filter((savedGroupId) => savedGroupId !== groupId));
  };

  const updateScore = (matchId: string, side: keyof MatchScore, value: number | "") => {
    if (!canEdit) {
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

  const savePrediction = async (savedGroupId?: string) => {
    if (!canSave || isSaving || !sessionToken) {
      return;
    }

    setIsSaving(true);
    setSaveError("");

    try {
      const response = await saveMyPrediction(
        roomId,
        sessionToken,
        createSavePredictionInput(tournament, groupOrders, matchScores)
      );
      const snapshot = createPredictionSnapshotFromParticipantPrediction(tournament, response.prediction);
      const nextSavedGroupIds = new Set(getCompleteGroupIds(tournament, snapshot));

      if (savedGroupId) {
        nextSavedGroupIds.add(savedGroupId);
      }

      setGroupOrders(cloneGroupOrders(snapshot.groupOrders));
      setMatchScores(cloneMatchScores(snapshot.matchScores));
      setSavedGroupIds([...nextSavedGroupIds]);
      setIsLocked(response.isLocked);
      onParticipantPredictionStatusChange?.(
        participantId,
        getPredictionStatusFromParticipantPrediction(tournament, response.prediction)
      );
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Не удалось сохранить прогноз.");
    } finally {
      setIsSaving(false);
    }
  };

  const saveActiveGroup = () => {
    if (!activeGroup) {
      return;
    }

    void savePrediction(activeGroup.id);
  };

  const openAdjacentGroup = (direction: -1 | 1) => {
    if (activeGroupIndex === -1) {
      return;
    }

    const nextIndex = (activeGroupIndex + direction + tournament.groups.length) % tournament.groups.length;
    setActiveGroupId(tournament.groups[nextIndex]?.id ?? null);
  };
  const statusText = isReadOnly
    ? "Только просмотр"
    : isLocked
      ? "Прогнозы закрыты"
      : isSaving
        ? "Сохраняем"
        : "Черновик открыт";

  return (
    <main className={styles.shell}>
      <header className={styles.topbar}>
        <button type="button" className={styles.backButton} onClick={onBackToLobby}>
          <ArrowLeft size={18} aria-hidden="true" />
          {backButtonLabel}
        </button>

        <div className={styles.titleBlock}>
          <h1 className={styles.title}>
            <span className={styles.titleText}>{roomName}</span>
          </h1>
        </div>

        <ScoringRulesButton className={styles.rulesButton} onClick={onOpenScoringRules} />
        <DeadlineCountdown className={styles.deadlineCountdown} startsAtIso={tournament.deadlineIso} />
      </header>

      <section className={styles.predictionArea} aria-label="Доска прогноза">
        <div className={`${styles.statusStrip} ${isReadOnly ? styles.statusStripReadOnly : ""}`}>
          <div>
            <span>Участник</span>
            <strong>{participantName}</strong>
          </div>
          <div>
            <span>Статус</span>
            <strong>{statusText}</strong>
          </div>
          <div>
            <span>Сохранено</span>
            <strong>{savedGroupsCount} из {tournament.groups.length}</strong>
          </div>
          <div>
            <span>Счета</span>
            <strong>{filledScoresCount} из {tournament.matches.length}</strong>
          </div>
          {isReadOnly ? null : (
            <button
              type="button"
              className={styles.saveButton}
              disabled={!canSave || isSaving}
              onClick={() => void savePrediction()}
            >
              <Save size={18} aria-hidden="true" />
              {isSaving ? "Сохраняем" : "Сохранить прогноз"}
            </button>
          )}
        </div>

        {predictionError ? <div className={`${styles.feedback} ${styles.feedbackError}`}>{predictionError}</div> : null}
        {saveError ? <div className={`${styles.feedback} ${styles.feedbackError}`}>{saveError}</div> : null}

        {predictionError ? null : isPredictionLoading ? (
          <div className={styles.feedback}>Загружаем прогноз...</div>
        ) : activeGroup ? (
          <GroupPredictionDetail
            group={activeGroup}
            isSaved={savedGroupIds.includes(activeGroup.id)}
            matches={activeGroupMatches}
            matchScores={matchScores}
            isReadOnly={!canEdit}
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
            groups={tournament.groups}
            groupOrders={groupOrders}
            matches={tournament.matches}
            matchScores={matchScores}
            savedGroupIds={savedGroupIds}
            onOpenGroup={setActiveGroupId}
          />
        )}
      </section>
    </main>
  );
}
