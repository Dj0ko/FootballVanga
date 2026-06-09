import { ArrowRight, Lock, LogIn, Plus, ShieldCheck, Users } from "lucide-react";
import { useState } from "react";

import { globalLeaders, type CreateRoomInput, type RoomSummary } from "../../data/mockFootball";
import { CreateRoomForm } from "./components/create-room-form/CreateRoomForm";
import { RoomsLeaderboard } from "./components/rooms-leaderboard/RoomsLeaderboard";
import styles from "./RoomsScreen.module.css";

type RoomsScreenProps = {
  rooms: RoomSummary[];
  onCreateRoom: (room: CreateRoomInput) => void;
  onOpenRoom: (room: RoomSummary) => void;
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

export function RoomsScreen({ rooms, onCreateRoom, onOpenRoom }: RoomsScreenProps) {
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const hasRooms = rooms.length > 0;

  const openCreateRoom = () => setIsCreatingRoom(true);
  const closeCreateRoom = () => setIsCreatingRoom(false);

  const createRoom = (room: CreateRoomInput) => {
    onCreateRoom(room);
    closeCreateRoom();
  };

  return (
    <main className={styles.shell}>
      <header className={styles.topbar}>
        <div>
          <p className={styles.eyebrow}>Прогнозы группового этапа</p>
          <h1 className={styles.title}>Комнаты</h1>
        </div>
        <button type="button" className={styles.createButton} onClick={openCreateRoom} disabled={isCreatingRoom}>
          <Plus size={18} aria-hidden="true" />
          Создать комнату
        </button>
      </header>

      <div className={styles.contentGrid}>
        <section className={styles.panel} aria-labelledby="rooms-title">
          <div className={styles.heading}>
            <div className={styles.sectionTitle}>
              <ShieldCheck size={18} aria-hidden="true" />
              <h2 id="rooms-title">Доступные комнаты</h2>
            </div>
            <span>{getActiveRoomsLabel(rooms.length)}</span>
          </div>

          {isCreatingRoom ? <CreateRoomForm onCancel={closeCreateRoom} onSubmit={createRoom} /> : null}

          {hasRooms ? (
            <div className={styles.roomList}>
              {rooms.map((room) => (
                <article className={styles.roomCard} key={room.id}>
                  <div>
                    <h3>{room.name}</h3>
                    <p>{room.deadlineLabel}</p>
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

        <RoomsLeaderboard leaders={globalLeaders} />
      </div>
    </main>
  );
}
