import { Lock, LogIn, Plus, Save, ShieldCheck, Trophy, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { SCORING_RULES } from "@footballvanga/shared";

type Group = {
  id: string;
  name: string;
  teams: string[];
};

type Match = {
  id: string;
  group: string;
  home: string;
  away: string;
};

const groups: Group[] = [
  {
    id: "a",
    name: "Группа A",
    teams: ["A1", "A2", "A3", "A4"]
  },
  {
    id: "b",
    name: "Группа B",
    teams: ["B1", "B2", "B3", "B4"]
  }
];

const matches: Match[] = [
  { id: "a-1", group: "Группа A", home: "A1", away: "A2" },
  { id: "a-2", group: "Группа A", home: "A3", away: "A4" },
  { id: "b-1", group: "Группа B", home: "B1", away: "B2" },
  { id: "b-2", group: "Группа B", home: "B3", away: "B4" }
];

const participants = [
  { name: "Алексей", points: 18, exactScores: 4 },
  { name: "Марта", points: 16, exactScores: 3 },
  { name: "Никита", points: 16, exactScores: 2 }
];

const initialStandings = Object.fromEntries(
  groups.flatMap((group) => group.teams.map((team, index) => [team, index + 1]))
);

const initialScores = Object.fromEntries(matches.map((match) => [match.id, { home: 0, away: 0 }]));

const formatExactScores = (count: number) => {
  const lastTwoDigits = count % 100;
  const lastDigit = count % 10;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return `${count} точных счетов`;
  }

  if (lastDigit === 1) {
    return `${count} точный счет`;
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return `${count} точных счета`;
  }

  return `${count} точных счетов`;
};

export default function App() {
  const [roomCode, setRoomCode] = useState("chm-druzya");
  const [joinCode, setJoinCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [activeParticipant, setActiveParticipant] = useState("Вы");
  const [standings, setStandings] = useState<Record<string, number>>(initialStandings);
  const [scores, setScores] = useState<Record<string, { home: number; away: number }>>(initialScores);

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
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Прогнозы группового этапа</p>
          <h1>FootballVanga</h1>
        </div>
        <div className="deadline-pill">
          <Lock size={16} aria-hidden="true" />
          Дедлайн до старта турнира
        </div>
      </header>

      <section className="workspace" aria-label="Рабочая область FootballVanga">
        <aside className="side-panel">
          <section className="tool-panel" aria-labelledby="room-entry-title">
            <div className="section-title">
              <ShieldCheck size={18} aria-hidden="true" />
              <h2 id="room-entry-title">Вход в комнату</h2>
            </div>

            <label>
              Комната
              <input value={roomCode} onChange={(event) => setRoomCode(event.target.value)} />
            </label>

            <label>
              Код входа
              <input
                type="password"
                value={joinCode}
                onChange={(event) => setJoinCode(event.target.value)}
                placeholder="Пароль комнаты"
              />
            </label>

            <button type="button" className="primary-button">
              <LogIn size={18} aria-hidden="true" />
              Войти в комнату
            </button>
          </section>

          <section className="tool-panel" aria-labelledby="participants-title">
            <div className="section-title">
              <Users size={18} aria-hidden="true" />
              <h2 id="participants-title">Лобби</h2>
            </div>

            <div className="participant-list">
              {participants.map((participant) => (
                <button className="participant-row" type="button" key={participant.name}>
                  <span>{participant.name}</span>
                  <span>Смотреть</span>
                </button>
              ))}
            </div>

            <div className="new-participant">
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

        <section className="prediction-area" aria-label="Доска прогнозов">
          <div className="status-strip">
            <div>
              <span>Активный участник</span>
              <strong>{activeParticipant}</strong>
            </div>
            <div>
              <span>Очки</span>
              <strong>
                {SCORING_RULES.exactGroupPlace}/{SCORING_RULES.matchOutcome}/+
                {SCORING_RULES.exactScore}
              </strong>
            </div>
            <button type="button" className="save-button">
              <Save size={18} aria-hidden="true" />
              Сохранить прогноз
            </button>
          </div>

          <div className="board-grid">
            <section className="group-grid" aria-labelledby="groups-title">
              <div className="section-title">
                <Trophy size={18} aria-hidden="true" />
                <h2 id="groups-title">Места в группах</h2>
              </div>

              <div className="groups">
                {groups.map((group) => (
                  <article className="group-card" key={group.id}>
                    <h3>{group.name}</h3>
                    {group.teams.map((team) => (
                      <label className="standing-row" key={team}>
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

            <section className="match-grid" aria-labelledby="matches-title">
              <div className="section-title">
                <ShieldCheck size={18} aria-hidden="true" />
                <h2 id="matches-title">Счёт матчей</h2>
              </div>

              <div className="matches">
                {matches.map((match) => (
                  <article className="match-card" key={match.id}>
                    <span className="match-group">{match.group}</span>
                    <div className="score-line">
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
                      <span className="score-divider">:</span>
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

        <aside className="leaderboard-panel" aria-labelledby="leaderboard-title">
          <div className="section-title">
            <Trophy size={18} aria-hidden="true" />
            <h2 id="leaderboard-title">Рейтинг</h2>
          </div>

          <ol className="leaderboard">
            {sortedParticipants.map((participant, index) => (
              <li key={participant.name}>
                <span className="rank">{index + 1}</span>
                <span>{participant.name}</span>
                <strong>{participant.points}</strong>
                <small>{formatExactScores(participant.exactScores)}</small>
              </li>
            ))}
          </ol>
        </aside>
      </section>
    </main>
  );
}
