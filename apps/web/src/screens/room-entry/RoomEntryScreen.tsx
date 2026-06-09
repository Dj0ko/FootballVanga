import { ArrowLeft, KeyRound, LogIn, UserPlus } from "lucide-react";
import { useState, type FormEvent } from "react";

import { DeadlineCountdown } from "../../components/deadline-countdown/DeadlineCountdown";
import type { RoomSummary } from "../../data/mockFootball";
import styles from "./RoomEntryScreen.module.css";

export type ParticipantEntryInput = {
  code: string;
  name: string;
};

export type ParticipantEntryResult = "success" | "invalid-code";
export type RoomPasswordResult = "success" | "invalid-password" | "unavailable";

type RoomEntryScreenProps = {
  onBackToRooms: () => void;
  onEnterParticipant: (input: ParticipantEntryInput) => ParticipantEntryResult;
  onVerifyRoomPassword: (password: string) => Promise<RoomPasswordResult>;
  room: RoomSummary;
};

const MIN_SECRET_LENGTH = 4;

export function RoomEntryScreen({
  onBackToRooms,
  onEnterParticipant,
  onVerifyRoomPassword,
  room
}: RoomEntryScreenProps) {
  const [roomPassword, setRoomPassword] = useState("");
  const [participantName, setParticipantName] = useState("");
  const [participantCode, setParticipantCode] = useState("");
  const [isRoomUnlocked, setIsRoomUnlocked] = useState(false);
  const [isVerifyingRoom, setIsVerifyingRoom] = useState(false);
  const [error, setError] = useState("");

  const trimmedParticipantName = participantName.trim();
  const canVerifyRoom = roomPassword.length >= MIN_SECRET_LENGTH;
  const canEnterParticipant = trimmedParticipantName.length > 0 && participantCode.length >= MIN_SECRET_LENGTH;

  const verifyRoom = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canVerifyRoom) {
      return;
    }

    setIsVerifyingRoom(true);

    const result = await onVerifyRoomPassword(roomPassword);

    if (result === "invalid-password") {
      setError("Пароль комнаты не подходит.");
      setIsVerifyingRoom(false);
      return;
    }

    if (result === "unavailable") {
      setError("Не удалось проверить комнату. Попробуйте еще раз.");
      setIsVerifyingRoom(false);
      return;
    }

    setError("");
    setIsRoomUnlocked(true);
    setIsVerifyingRoom(false);
  };

  const enterParticipant = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canEnterParticipant) {
      return;
    }

    const result = onEnterParticipant({
      code: participantCode,
      name: trimmedParticipantName
    });

    if (result === "invalid-code") {
      setError("Имя уже занято. Если это вы, проверьте код участника.");
    }
  };

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

        <DeadlineCountdown className={styles.deadlineCountdown} />
      </header>

      <section className={styles.panel} aria-labelledby="room-entry-title">
        <div className={styles.header}>
          <p>Вход в комнату</p>
          <h2 id="room-entry-title">{isRoomUnlocked ? "Участник" : "Пароль комнаты"}</h2>
        </div>

        {isRoomUnlocked ? (
          <form className={styles.form} onSubmit={enterParticipant}>
            <label className={styles.field}>
              Имя участника
              <input
                autoFocus
                required
                value={participantName}
                onChange={(event) => {
                  setParticipantName(event.target.value);
                  setError("");
                }}
                placeholder="Например, Никита"
              />
            </label>

            <label className={styles.field}>
              Код участника
              <input
                minLength={MIN_SECRET_LENGTH}
                required
                type="password"
                value={participantCode}
                onChange={(event) => {
                  setParticipantCode(event.target.value);
                  setError("");
                }}
                placeholder="Минимум 4 символа"
              />
            </label>

            {error ? <p className={styles.error}>{error}</p> : null}

            <button type="submit" className={styles.primaryButton} disabled={!canEnterParticipant}>
              <UserPlus size={18} aria-hidden="true" />
              Войти участником
            </button>
          </form>
        ) : (
          <form className={styles.form} onSubmit={verifyRoom}>
            <label className={styles.field}>
              Пароль комнаты
              <input
                autoFocus
                minLength={MIN_SECRET_LENGTH}
                required
                type="password"
                disabled={isVerifyingRoom}
                value={roomPassword}
                onChange={(event) => {
                  setRoomPassword(event.target.value);
                  setError("");
                }}
                placeholder="Минимум 4 символа"
              />
            </label>

            {error ? <p className={styles.error}>{error}</p> : null}

            <button type="submit" className={styles.primaryButton} disabled={!canVerifyRoom || isVerifyingRoom}>
              <KeyRound size={18} aria-hidden="true" />
              {isVerifyingRoom ? "Проверяем..." : "Проверить пароль"}
            </button>
          </form>
        )}

        <div className={styles.note}>
          <LogIn size={18} aria-hidden="true" />
          <span>Пароль открывает комнату, код участника открывает редактирование своего прогноза.</span>
        </div>
      </section>
    </main>
  );
}
