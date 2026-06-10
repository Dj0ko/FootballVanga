import type { InMemoryFootballStore, StoredMatchResult } from "./inMemoryRoomRepository.js";
import type { MatchResultRepository } from "./matchResultRepository.js";
import { TOURNAMENT_MATCH_IDS } from "./tournamentMetadata.js";

const cloneMatchResult = (result: StoredMatchResult): StoredMatchResult => ({
  finishedAtIso: result.finishedAtIso,
  matchId: result.matchId,
  score: {
    away: result.score.away,
    home: result.score.home
  }
});

export const createInMemoryMatchResultRepository = (store: InMemoryFootballStore): MatchResultRepository => {
  const knownMatchIds = new Set(TOURNAMENT_MATCH_IDS);

  const listMatchResults: MatchResultRepository["listMatchResults"] = async () =>
    Array.from(store.matchResults.values())
      .sort((leftResult, rightResult) => Date.parse(rightResult.finishedAtIso) - Date.parse(leftResult.finishedAtIso))
      .map(cloneMatchResult);

  const saveMatchResult: MatchResultRepository["saveMatchResult"] = async ({ matchId, score }) => {
    if (!knownMatchIds.has(matchId)) {
      return null;
    }

    const previousResult = store.matchResults.get(matchId);
    const result: StoredMatchResult = {
      finishedAtIso: previousResult?.finishedAtIso ?? new Date().toISOString(),
      matchId,
      score: {
        away: score.away,
        home: score.home
      }
    };

    store.matchResults.set(matchId, result);

    return cloneMatchResult(result);
  };

  return {
    listMatchResults,
    saveMatchResult
  };
};
