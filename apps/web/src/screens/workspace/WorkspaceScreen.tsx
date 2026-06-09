import { Lock, LogIn, Plus, Save, ShieldCheck, Trophy, Users } from "lucide-react";
import { useMemo, useState } from "react";

import { groups, initialScores, initialStandings, matches, participants } from "../../data/mockFootball";
import type { MatchScore } from "../../data/mockFootball";
import styles from "./WorkspaceScreen.module.css";

type WorkspaceScreenProps = {
  initialRoomCode: string;
};

export function WorkspaceScreen({ initialRoomCode }: WorkspaceScreenProps) {
  const [roomCode, setRoomCode] = useState(initialRoomCode);
  const [joinCode, setJoinCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [activeParticipant, setActiveParticipant] = useState("Вы");
  const [standings, setStandings] = useState<Record<string, number>>(initialStandings);
  const [scores, setScores] = useState<Record<string, MatchScore>>(initialScores);

  const sortedParticipants = useMemo(
    () =>
      [...participants, { name: activeParticipant, points: 0, exactScores: 0 }].sort((left, right) => {
        if (right.points !== left.points) {
          return right.points - left.points;
        }

        return right.exactScores - left.exactScores;
      }),
    [activeParticipant]
  );

  const submitParticipant = () => {
    const nextName = displayName.trim();
    if (!nextName) {
      return;
    }

    setActiveParticipant(nextName);
    setDisplayName("");
  };

  return (
    <main className={styles.shell}>
      <header className={styles.topbar}>
        <div>
          <p className={styles.eyebrow}>Прогнозы группового этапа</p>
          <h1 className={styles.title}>FootballVanga</h1>
        </div>
        <div className={styles.deadlinePill}>
          <Lock size={16} aria-hidden="true" />
          Дедлайн до старта турнира
        </div>
      </header>

      <section className={styles.workspace} aria-label="Рабочая область FootballVanga">
        <aside className={styles.sidePanel}>
          <section className={styles.toolPanel} aria-labelledby="room-entry-title">
            <div className={styles.sectionTitle}>
              <ShieldCheck size={18} aria-hidden="true" />
              <h2 id="room-entry-title">Вход в комнату</h2>
            </div>

            <label className={styles.fieldLabel}>
              Комната
              <input value={roomCode} onChange={(event) => setRoomCode(event.target.value)} />
            </label>

            <label className={styles.fieldLabel}>
              Код входа
              <input
                type="password"
                value={joinCode}
                onChange={(event) => setJoinCode(event.target.value)}
                placeholder="Пароль комнаты"
              />
            </label>

            <button type="button" className={styles.primaryButton}>
              <LogIn size={18} aria-hidden="true" />
              Войти в комнату
            </button>
          </section>

          <section className={styles.toolPanel} aria-labelledby="participants-title">
            <div className={styles.sectionTitle}>
              <Users size={18} aria-hidden="true" />
              <h2 id="participants-title">Лобби</h2>
            </div>

            <div className={styles.participantList}>
              {participants.map((participant) => (
                <button className={styles.participantRow} type="button" key={participant.name}>
                  <span>{participant.name}</span>
                  <span>Смотреть</span>
                </button>
              ))}
            </div>

            <div className={styles.newParticipant}>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Уникальное имя"
              />
              <button type="button" onClick={submitParticipant} aria-label="Создать участника">
                <Plus size={18} aria-hidden="true" />
              </button>
            </div>
          </section>
        </aside>

        <section className={styles.predictionArea} aria-label="Доска прогнозов">
          <div className={styles.statusStrip}>
            <div>
              <span>Активный участник</span>
              <strong>{activeParticipant}</strong>
            </div>
            <div>
              <span>Статус</span>
              <strong>Черновик открыт</strong>
            </div>
            <button type="button" className={styles.saveButton}>
              <Save size={18} aria-hidden="true" />
              Сохранить прогноз
            </button>
          </div>

          <div className={styles.boardGrid}>
            <section className={styles.groupGrid} aria-labelledby="groups-title">
              <div className={styles.sectionTitle}>
                <Trophy size={18} aria-hidden="true" />
                <h2 id="groups-title">Места в группах</h2>
              </div>

              <div className={styles.groups}>
                {groups.map((group) => (
                  <article className={styles.groupCard} key={group.id}>
                    <h3>{group.name}</h3>
                    {group.teams.map((team) => (
                      <label className={styles.standingRow} key={team}>
                        <span>{team}</span>
                        <select
                          value={standings[team]}
                          onChange={(event) =>
                            setStandings((current) => ({
                              ...current,
                              [team]: Number(event.target.value)
                            }))
                          }
                        >
                          {group.teams.map((_, index) => (
                            <option value={index + 1} key={index + 1}>
                              {index + 1}
                            </option>
                          ))}
                        </select>
                      </label>
                    ))}
                  </article>
                ))}
              </div>
            </section>

            <section className={styles.matchGrid} aria-labelledby="matches-title">
              <div className={styles.sectionTitle}>
                <ShieldCheck size={18} aria-hidden="true" />
                <h2 id="matches-title">Счёт матчей</h2>
              </div>

              <div className={styles.matches}>
                {matches.map((match) => (
                  <article className={styles.matchCard} key={match.id}>
                    <span className={styles.matchGroup}>{match.group}</span>
                    <div className={styles.scoreLine}>
                      <span>{match.home}</span>
                      <input
                        min="0"
                        type="number"
                        value={scores[match.id]?.home ?? 0}
                        onChange={(event) =>
                          setScores((current) => ({
                            ...current,
                            [match.id]: {
                              ...(current[match.id] ?? { home: 0, away: 0 }),
                              home: Number(event.target.value)
                            }
                          }))
                        }
                      />
                      <span className={styles.scoreDivider}>:</span>
                      <input
                        min="0"
                        type="number"
                        value={scores[match.id]?.away ?? 0}
                        onChange={(event) =>
                          setScores((current) => ({
                            ...current,
                            [match.id]: {
                              ...(current[match.id] ?? { home: 0, away: 0 }),
                              away: Number(event.target.value)
                            }
                          }))
                        }
                      />
                      <span>{match.away}</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </section>

        <aside className={styles.leaderboardPanel} aria-labelledby="leaderboard-title">
          <div className={styles.sectionTitle}>
            <Trophy size={18} aria-hidden="true" />
            <h2 id="leaderboard-title">Рейтинг</h2>
          </div>

          <ol className={styles.leaderboard}>
            {sortedParticipants.map((participant, index) => (
              <li key={participant.name}>
                <span className={styles.rank}>{index + 1}</span>
                <span>{participant.name}</span>
                <strong>{participant.points}</strong>
              </li>
            ))}
          </ol>
        </aside>
      </section>
    </main>
  );
}
