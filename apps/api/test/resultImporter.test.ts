import assert from "node:assert/strict";
import test from "node:test";

import { createInMemoryFootballStore } from "../src/inMemoryRoomRepository.ts";
import { createInMemoryGroupStandingResultRepository } from "../src/inMemoryGroupStandingResultRepository.ts";
import { createInMemoryMatchResultRepository } from "../src/inMemoryMatchResultRepository.ts";
import { createInMemoryScoringRepository } from "../src/inMemoryScoringRepository.ts";
import { createResultImporter } from "../src/resultImporter.ts";
import type { ResultImportProvider } from "../src/resultImportTypes.ts";
import { createStaticTournamentRepository } from "../src/tournamentRepository.ts";

test("result importer maps provider data, preserves manual scores, and skips pending group tables", async () => {
  const store = createInMemoryFootballStore();
  const matchResultRepository = createInMemoryMatchResultRepository(store);
  const groupStandingResultRepository = createInMemoryGroupStandingResultRepository(store);
  const provider: ResultImportProvider = {
    fetchResults: async () => ({
      matches: [
        {
          awayTeamName: "South Africa",
          finishedAtIso: "2026-06-11T21:00:00Z",
          homeTeamName: "Mexico",
          providerId: "provider-a-1",
          score: {
            away: 1,
            home: 2
          }
        },
        {
          awayTeamName: "Czech Republic",
          finishedAtIso: "2026-06-12T04:00:00Z",
          homeTeamName: "Korea Republic",
          providerId: "provider-a-2",
          score: {
            away: 0,
            home: 0
          }
        }
      ],
      standings: [
        {
          providerGroupName: "GROUP_A",
          rows: [
            { position: 1, teamName: "Mexico" },
            { position: 2, teamName: "South Africa" },
            { position: 3, teamName: "Korea Republic" },
            { position: 4, teamName: "Czech Republic" }
          ]
        },
        {
          providerGroupName: "GROUP_B",
          rows: [
            { position: 1, teamName: "Canada" },
            { position: 2, teamName: "Switzerland" },
            { position: 3, teamName: "Qatar" },
            { position: 4, teamName: "Bosnia and Herzegovina" }
          ]
        }
      ],
      warnings: []
    }),
    name: "test-provider"
  };
  const importer = createResultImporter({
    groupStandingResultRepository,
    matchResultRepository,
    provider,
    scoringRepository: createInMemoryScoringRepository(store),
    tournamentRepository: createStaticTournamentRepository()
  });

  await matchResultRepository.saveMatchResult({
    matchId: "a-1",
    score: {
      away: 4,
      home: 4
    }
  });

  const summary = await importer.syncResults();
  const matchResults = await matchResultRepository.listMatchResults();
  const groupStandings = await groupStandingResultRepository.listGroupStandingResults();

  assert.equal(summary.status, "success");
  assert.equal(summary.matchesSeen, 2);
  assert.equal(summary.matchesCreated, 1);
  assert.equal(summary.matchesSkippedManual, 1);
  assert.equal(summary.standingsSeen, 2);
  assert.equal(summary.standingsCreated, 1);
  assert.equal(summary.standingsSkippedPending, 1);
  assert.deepEqual(summary.finalGroups, []);
  assert.deepEqual(matchResults.find((result) => result.matchId === "a-1")?.score, {
    away: 4,
    home: 4
  });
  assert.deepEqual(matchResults.find((result) => result.matchId === "a-2")?.score, {
    away: 0,
    home: 0
  });
  assert.deepEqual(groupStandings, [
    { groupId: "a", position: 1, teamId: "mexico" },
    { groupId: "a", position: 2, teamId: "south-africa" },
    { groupId: "a", position: 3, teamId: "korea-republic" },
    { groupId: "a", position: 4, teamId: "czechia" }
  ]);
});
