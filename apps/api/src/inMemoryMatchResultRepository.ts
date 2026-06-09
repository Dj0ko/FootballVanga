import type { MatchResult } from "@footballvanga/shared";

import type { InMemoryFootballStore, StoredMatchResult } from "./inMemoryRoomRepository.js";
import type { MatchResultRepository } from "./matchResultRepository.js";
import { TOURNAMENT_MATCH_IDS } from "./tournamentMetadata.js";

const DEFAULT_MATCH_RESULTS: MatchResult[] = [
  {
    matchId: "a-1",
    finishedAtIso: "2026-06-11T21:00:00Z",
    score: {
      home: 2,
      away: 1
    }
  },
  {
    matchId: "a-2",
    finishedAtIso: "2026-06-12T04:00:00Z",
    score: {
      home: 1,
      away: 1
    }
  },
  {
    matchId: "b-1",
    finishedAtIso: "2026-06-12T21:00:00Z",
    score: {
      home: 0,
      away: 2
    }
  },
  {
    matchId: "d-1",
    finishedAtIso: "2026-06-13T03:00:00Z",
    score: {
      home: 3,
      away: 1
    }
  },
  {
    matchId: "b-2",
    finishedAtIso: "2026-06-13T21:00:00Z",
    score: {
      home: 1,
      away: 0
    }
  }
];

const cloneMatchResult = (result: MatchResult): MatchResult => ({
  finishedAtIso: result.finishedAtIso,
  matchId: result.matchId,
  score: {
    away: result.score.away,
    home: result.score.home
  }
});

const seedDefaultMatchResults = (store: InMemoryFootballStore) => {
  if (store.matchResults.size > 0) {
    return;
  }

  for (const result of DEFAULT_MATCH_RESULTS) {
    store.matchResults.set(result.matchId, cloneMatchResult(result));
  }
};

export const createInMemoryMatchResultRepository = (store: InMemoryFootballStore): MatchResultRepository => {
  seedDefaultMatchResults(store);

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
