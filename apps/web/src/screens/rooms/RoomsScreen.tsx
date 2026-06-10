import { ArrowRight, Lock, LogIn, Plus, ShieldCheck, Users } from "lucide-react";
import { useState } from "react";

import type { GlobalLeaderboardEntry, MatchResult } from "@footballvanga/shared";

import { DeadlineCountdown } from "../../components/deadline-countdown/DeadlineCountdown";
import { type CreateRoomInput, type RoomSummary } from "../../data/rooms";
import type { Match } from "../../data/tournament";
import { CreateRoomForm } from "./components/create-room-form/CreateRoomForm";
import { MatchResultsHistory } from "./components/match-results-history/MatchResultsHistory";
import { RoomsLeaderboard } from "./components/rooms-leaderboard/RoomsLeaderboard";
import styles from "./RoomsScreen.module.css";

type RoomsScreenProps = {
  error: string;
  globalLeaderboard: GlobalLeaderboardEntry[];
  globalLeaderboardError: string;
  isCreatePending: boolean;
  isGlobalLeaderboardLoading: boolean;
  isLoading: boolean;
  deadlineIso: string;
  matches: Match[];
  matchResults: MatchResult[];
  matchResultsError: string;
  rooms: RoomSummary[];
  onCreateRoom: (room: CreateRoomInput) => Promise<boolean>;
  onOpenGlobalLeader: (leader: GlobalLeaderboardEntry) => void;
  onOpenRoom: (room: RoomSummary) => void;
  onRetryGlobalLeaderboard: () => void;
  onRetry: () => void;
};

const getActiveRoomsLabel = (count: number) => {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;

  if (count === 0) {
    return "0 активных";
  }

  if (lastDigit === 1 && lastTwoDigits !== 11) {
    return `${count} активная`;
  }

  if ([2, 3, 4].includes(lastDigit) && ![12, 13, 14].includes(lastTwoDigits)) {
    return `${count} активные`;
  }

  return `${count} активных`;
};

export function RoomsScreen({
  error,
  globalLeaderboard,
  globalLeaderboardError,
  isCreatePending,
  isGlobalLeaderboardLoading,
  isLoading,
  deadlineIso,
  matches,
  matchResults,
  matchResultsError,
  rooms,
  onCreateRoom,
  onOpenGlobalLeader,
  onOpenRoom,
  onRetryGlobalLeaderboard,
  onRetry
}: RoomsScreenProps) {
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const hasRooms = rooms.length > 0;

  const openCreateRoom = () => setIsCreatingRoom(true);
  const closeCreateRoom = () => setIsCreatingRoom(false);

  const createRoom = async (room: CreateRoomInput) => {
    const wasCreated = await onCreateRoom(room);

    if (wasCreated) {
      closeCreateRoom();
    }
  };

  return (
    <main className={styles.shell}>
      <header className={styles.topbar}>
        <div>
          <p className={styles.eyebrow}>Прогнозы группового этапа</p>
          <h1 className={styles.title}>Комнаты</h1>
        </div>
        <DeadlineCountdown className={styles.deadlineCountdown} startsAtIso={deadlineIso} />
        <button
          type="button"
          className={styles.createButton}
          onClick={openCreateRoom}
          disabled={isCreatingRoom || isCreatePending}
        >
          <Plus size={18} aria-hidden="true" />
          Создать комнату
        </button>
      </header>

      <div className={styles.contentGrid}>
        <div className={styles.mainColumn}>
          <section className={styles.panel} aria-labelledby="rooms-title">
            <div className={styles.heading}>
              <div className={styles.sectionTitle}>
                <ShieldCheck size={18} aria-hidden="true" />
                <h2 id="rooms-title">Доступные комнаты</h2>
              </div>
              <span>{getActiveRoomsLabel(rooms.length)}</span>
            </div>

            {isCreatingRoom ? (
              <CreateRoomForm isSubmitting={isCreatePending} onCancel={closeCreateRoom} onSubmit={createRoom} />
            ) : null}

            {error && hasRooms ? <p className={styles.inlineError}>{error}</p> : null}

            {hasRooms ? (
              <div className={styles.roomList}>
                {rooms.map((room) => (
                  <article className={styles.roomCard} key={room.id}>
                    <div>
                      <h3>{room.name}</h3>
                    </div>
                    <div className={styles.roomMeta}>
                      <span>
                        <Users size={16} aria-hidden="true" />
                        {room.participantsCount}
                      </span>
                      <span>
                        <Lock size={16} aria-hidden="true" />
                        закрытая
                      </span>
                    </div>
                    <button type="button" className={styles.openButton} onClick={() => onOpenRoom(room)}>
                      <LogIn size={18} aria-hidden="true" />
                      Войти
                    </button>
                  </article>
                ))}
              </div>
            ) : isLoading ? (
              <div className={styles.emptyState} role="status">
                <h2>Загружаем комнаты</h2>
              </div>
            ) : error ? (
              <div className={styles.emptyState} role="alert">
                <h2>Комнаты недоступны</h2>
                <p>{error}</p>
                <button type="button" className={styles.emptyButton} onClick={onRetry}>
                  Повторить
                  <ArrowRight size={20} aria-hidden="true" />
                </button>
              </div>
            ) : !isCreatingRoom ? (
              <div className={styles.emptyState} role="status">
                <h2>Комнат еще нет</h2>
                <p>Откройте первую и зовите свою футбольную компанию.</p>
                <button type="button" className={styles.emptyButton} onClick={openCreateRoom}>
                  Создать комнату
                  <ArrowRight size={20} aria-hidden="true" />
                </button>
              </div>
            ) : null}
          </section>

          {matchResultsError ? <p className={styles.inlineError}>{matchResultsError}</p> : null}
          <MatchResultsHistory matches={matches} results={matchResults} />
        </div>

        <RoomsLeaderboard
          error={globalLeaderboardError}
          isLoading={isGlobalLeaderboardLoading}
          leaders={globalLeaderboard}
          onOpenLeader={onOpenGlobalLeader}
          onRetry={onRetryGlobalLeaderboard}
        />
      </div>
    </main>
  );
}
