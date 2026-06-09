import { History } from "lucide-react";

import type { CompletedMatchResult, Match } from "../../../../data/mockFootball";
import { teamFlagUrls } from "../../../../data/teamFlags";
import styles from "./MatchResultsHistory.module.css";

type MatchResultsHistoryProps = {
  matches: Match[];
  results: CompletedMatchResult[];
};

type CompletedMatch = {
  match: Match;
  result: CompletedMatchResult;
};

const formatMatchDate = (startsAtIso: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short"
  }).format(new Date(startsAtIso));

const getCompletedMatches = (matches: Match[], results: CompletedMatchResult[]): CompletedMatch[] => {
  const matchesById = new Map(matches.map((match) => [match.id, match]));

  return results
    .flatMap((result) => {
      const match = matchesById.get(result.matchId);

      return match ? [{ match, result }] : [];
    })
    .sort((leftMatch, rightMatch) => {
      const finishedAtDiff = Date.parse(rightMatch.result.finishedAtIso) - Date.parse(leftMatch.result.finishedAtIso);

      if (finishedAtDiff !== 0) {
        return finishedAtDiff;
      }

      return Date.parse(rightMatch.match.startsAtIso) - Date.parse(leftMatch.match.startsAtIso);
    });
};

const TeamLabel = ({ isWinner, team }: { isWinner: boolean; team: string }) => {
  const flagUrl = teamFlagUrls[team];

  return (
    <span className={`${styles.team} ${isWinner ? styles.winner : ""}`}>
      {flagUrl ? <img className={styles.flag} src={flagUrl} alt={`Флаг: ${team}`} draggable={false} /> : null}
      <span>{team}</span>
    </span>
  );
};

export function MatchResultsHistory({ matches, results }: MatchResultsHistoryProps) {
  const completedMatches = getCompletedMatches(matches, results);
  const completedMatchesLabel =
    completedMatches.length === 1 ? "1 матч сыгран" : `${completedMatches.length} матчей сыграно`;

  return (
    <section className={styles.panel} aria-labelledby="match-results-title">
      <header className={styles.header}>
        <div>
          <p>{completedMatchesLabel}</p>
          <h2 id="match-results-title">История матчей</h2>
        </div>
        <History size={22} aria-hidden="true" />
      </header>

      {completedMatches.length > 0 ? (
        <div className={styles.resultList}>
          {completedMatches.map(({ match, result }) => {
            const isHomeWinner = result.score.home > result.score.away;
            const isAwayWinner = result.score.away > result.score.home;

            return (
              <article className={styles.resultRow} key={match.id}>
                <div className={styles.metaLine}>
                  <span>{match.group}</span>
                  <span>{formatMatchDate(match.startsAtIso)}</span>
                </div>

                <div className={styles.scoreLine}>
                  <TeamLabel isWinner={isHomeWinner} team={match.home} />
                  <strong className={styles.finalScore}>
                    {result.score.home}:{result.score.away}
                  </strong>
                  <TeamLabel isWinner={isAwayWinner} team={match.away} />
                </div>

                <span className={styles.venue}>{match.venue}</span>
              </article>
            );
          })}
        </div>
      ) : (
        <div className={styles.emptyState} role="status">
          <strong>Матчи еще не сыграны</strong>
          <span>Результаты появятся здесь после завершения игр.</span>
        </div>
      )}
    </section>
  );
}
