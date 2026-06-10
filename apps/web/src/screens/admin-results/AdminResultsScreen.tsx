import { ArrowLeft, LockKeyhole, LogOut, RotateCw, Save, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

import type { MatchResult } from "@footballvanga/shared";

import { fetchMatchHistory } from "../../api/rooms";
import { teamFlagUrls } from "../../data/teamFlags";
import type { Match, TournamentView } from "../../data/tournament";
import styles from "./AdminResultsScreen.module.css";

type DraftScore = {
  away: string;
  home: string;
};

type AdminSessionResponse = {
  authenticated?: boolean;
  configured?: boolean;
};

type AdminResultResponse = {
  message?: string;
  result?: MatchResult;
};

type AdminResultsScreenProps = {
  tournament: TournamentView;
};

const emptyDraftScore: DraftScore = {
  away: "",
  home: ""
};

const getDraftScoresFromResults = (results: MatchResult[]) =>
  Object.fromEntries(
    results.map((result) => [
      result.matchId,
      {
        away: result.score.away.toString(),
        home: result.score.home.toString()
      }
    ])
  ) as Record<string, DraftScore>;

const getGroupOptions = (sourceMatches: Match[]) => Array.from(new Set(sourceMatches.map((match) => match.group)));

const formatMatchStartsAt = (startsAtIso: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short"
  }).format(new Date(startsAtIso));

const parseDraftScore = (draftScore: DraftScore | undefined) => {
  if (!draftScore || draftScore.home === "" || draftScore.away === "") {
    return null;
  }

  const home = Number(draftScore.home);
  const away = Number(draftScore.away);

  if (!Number.isInteger(home) || !Number.isInteger(away) || home < 0 || away < 0 || home > 99 || away > 99) {
    return null;
  }

  return {
    away,
    home
  };
};

const upsertResult = (results: MatchResult[], nextResult: MatchResult) => {
  const currentResults = results.filter((result) => result.matchId !== nextResult.matchId);

  return [...currentResults, nextResult];
};

export function AdminResultsScreen({ tournament }: AdminResultsScreenProps) {
  const [draftScores, setDraftScores] = useState<Record<string, DraftScore>>({});
  const [error, setError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isConfigured, setIsConfigured] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [isResultsLoading, setIsResultsLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [results, setResults] = useState<MatchResult[]>([]);
  const [savingMatchId, setSavingMatchId] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [statusMessage, setStatusMessage] = useState("");

  const groupOptions = useMemo(() => getGroupOptions(tournament.matches), [tournament.matches]);
  const filteredMatches = useMemo(
    () =>
      [...tournament.matches]
        .filter((match) => selectedGroup === "all" || match.group === selectedGroup)
        .sort((leftMatch, rightMatch) => Date.parse(leftMatch.startsAtIso) - Date.parse(rightMatch.startsAtIso)),
    [selectedGroup, tournament.matches]
  );
  const resultsByMatchId = useMemo(() => new Map(results.map((result) => [result.matchId, result])), [results]);

  const loadResults = useCallback(async () => {
    setIsResultsLoading(true);

    try {
      const nextResults = await fetchMatchHistory();

      setResults(nextResults);
      setDraftScores(getDraftScoresFromResults(nextResults));
    } finally {
      setIsResultsLoading(false);
    }
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("/api/admin/session", {
          credentials: "include"
        });

        if (!response.ok) {
          throw new Error("Не удалось проверить админ-сессию.");
        }

        const data = (await response.json()) as AdminSessionResponse;

        setIsConfigured(Boolean(data.configured));
        setIsAuthenticated(Boolean(data.authenticated));

        if (data.authenticated) {
          await loadResults();
        }
      } catch {
        setError("API недоступен.");
      } finally {
        setIsCheckingSession(false);
      }
    };

    void checkSession();
  }, [loadResults]);

  const login = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setStatusMessage("");
    setIsLoggingIn(true);

    try {
      const response = await fetch("/api/admin/login", {
        body: JSON.stringify({ password }),
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });

      const data = (await response.json()) as AdminResultResponse;

      if (!response.ok) {
        setError(data.message ?? "Пароль не подошел.");
        return;
      }

      setIsAuthenticated(true);
      setPassword("");
      await loadResults();
    } catch {
      setError("API недоступен.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = async () => {
    await fetch("/api/admin/logout", {
      credentials: "include",
      method: "POST"
    });
    setIsAuthenticated(false);
  };

  const updateDraftScore = (matchId: string, side: keyof DraftScore, value: string) => {
    setStatusMessage("");
    setError("");
    setDraftScores((currentScores) => ({
      ...currentScores,
      [matchId]: {
        ...(currentScores[matchId] ?? emptyDraftScore),
        [side]: value
      }
    }));
  };

  const saveResult = async (matchId: string) => {
    const score = parseDraftScore(draftScores[matchId]);

    if (!score) {
      setError("Введите счет от 0 до 99.");
      return;
    }

    setError("");
    setStatusMessage("");
    setSavingMatchId(matchId);

    try {
      const response = await fetch(`/api/admin/matches/${matchId}/result`, {
        body: JSON.stringify(score),
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        method: "PUT"
      });

      const data = (await response.json()) as AdminResultResponse;

      if (!response.ok || !data.result) {
        setError(data.message ?? "Не удалось сохранить результат.");
        return;
      }

      const nextResult = data.result;

      setResults((currentResults) => upsertResult(currentResults, nextResult));
      setStatusMessage("Результат сохранен.");
    } catch {
      setError("API недоступен.");
    } finally {
      setSavingMatchId(null);
    }
  };

  const recalculate = async () => {
    setError("");
    setStatusMessage("");
    setIsRecalculating(true);

    try {
      const response = await fetch("/api/admin/scoring/recalculate", {
        credentials: "include",
        method: "POST"
      });

      const data = (await response.json()) as AdminResultResponse;

      if (!response.ok) {
        setError(data.message ?? "Не удалось пересчитать очки.");
        return;
      }

      setStatusMessage("Пересчет запущен.");
    } catch {
      setError("API недоступен.");
    } finally {
      setIsRecalculating(false);
    }
  };

  if (isCheckingSession) {
    return (
      <main className={styles.shell}>
        <section className={styles.authPanel} aria-live="polite">
          <ShieldCheck size={26} aria-hidden="true" />
          <h1>Проверка доступа</h1>
        </section>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className={styles.shell}>
        <section className={styles.authPanel} aria-labelledby="admin-login-title">
          <LockKeyhole size={28} aria-hidden="true" />
          <p className={styles.eyebrow}>Админка</p>
          <h1 id="admin-login-title">Результаты матчей</h1>

          <form className={styles.loginForm} onSubmit={login}>
            <label className={styles.field}>
              Пароль
              <input
                autoFocus
                disabled={!isConfigured || isLoggingIn}
                required
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError("");
                }}
              />
            </label>

            {error ? <p className={styles.error}>{error}</p> : null}
            {!isConfigured ? <p className={styles.error}>Админ-доступ не настроен.</p> : null}

            <button type="submit" className={styles.primaryButton} disabled={!isConfigured || isLoggingIn}>
              <LockKeyhole size={18} aria-hidden="true" />
              Войти
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.shell}>
      <header className={styles.topbar}>
        <button type="button" className={styles.secondaryButton} onClick={() => (window.location.href = "/")}>
          <ArrowLeft size={18} aria-hidden="true" />
          Комнаты
        </button>

        <div className={styles.titleBlock}>
          <p className={styles.eyebrow}>Админка</p>
          <h1>Результаты матчей</h1>
        </div>

        <button type="button" className={styles.secondaryButton} onClick={logout}>
          <LogOut size={18} aria-hidden="true" />
          Выйти
        </button>
      </header>

      <section className={styles.toolbar} aria-label="Фильтр матчей">
        <label className={styles.field}>
          Группа
          <select value={selectedGroup} onChange={(event) => setSelectedGroup(event.target.value)}>
            <option value="all">Все группы</option>
            {groupOptions.map((group) => (
              <option value={group} key={group}>
                {group}
              </option>
            ))}
          </select>
        </label>

        <button type="button" className={styles.recalculateButton} onClick={recalculate} disabled={isRecalculating}>
          <RotateCw size={18} aria-hidden="true" />
          Пересчитать очки
        </button>
      </section>

      {error ? <p className={styles.error}>{error}</p> : null}
      {statusMessage ? <p className={styles.status}>{statusMessage}</p> : null}
      {isResultsLoading ? <p className={styles.status}>Загружаем результаты.</p> : null}

      <section className={styles.resultsPanel} aria-label="Матчи">
        {filteredMatches.map((match) => {
          const draftScore = draftScores[match.id] ?? emptyDraftScore;
          const currentResult = resultsByMatchId.get(match.id);
          const homeFlagUrl = teamFlagUrls[match.home];
          const awayFlagUrl = teamFlagUrls[match.away];

          return (
            <article className={styles.matchRow} key={match.id}>
              <div className={styles.matchInfo}>
                <span className={styles.matchMeta}>
                  {match.group} · {formatMatchStartsAt(match.startsAtIso)}
                </span>
                <strong>
                  <span className={styles.teamLabel}>
                    {homeFlagUrl ? (
                      <img className={styles.flag} src={homeFlagUrl} alt={`Флаг: ${match.home}`} draggable={false} />
                    ) : null}
                    {match.home}
                  </span>
                  <span>vs</span>
                  <span className={styles.teamLabel}>
                    {awayFlagUrl ? (
                      <img className={styles.flag} src={awayFlagUrl} alt={`Флаг: ${match.away}`} draggable={false} />
                    ) : null}
                    {match.away}
                  </span>
                </strong>
                <span className={styles.venue}>{match.venue}</span>
              </div>

              <div className={styles.scoreEditor}>
                <input
                  aria-label={`${match.home}, голов`}
                  min="0"
                  max="99"
                  type="number"
                  value={draftScore.home}
                  onChange={(event) => updateDraftScore(match.id, "home", event.target.value)}
                />
                <span>:</span>
                <input
                  aria-label={`${match.away}, голов`}
                  min="0"
                  max="99"
                  type="number"
                  value={draftScore.away}
                  onChange={(event) => updateDraftScore(match.id, "away", event.target.value)}
                />
              </div>

              <div className={styles.actions}>
                {currentResult ? <span className={styles.savedBadge}>Сохранен</span> : <span />}
                <button
                  type="button"
                  className={styles.saveButton}
                  onClick={() => saveResult(match.id)}
                  disabled={savingMatchId === match.id}
                >
                  <Save size={18} aria-hidden="true" />
                  Сохранить
                </button>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
