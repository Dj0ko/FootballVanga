import assert from "node:assert/strict";
import test from "node:test";

import { calculateScoreBreakdown } from "../src/scoringCalculator.ts";

test("calculateScoreBreakdown applies group standings, match outcomes, exact scores, and exact hit counts", () => {
  const score = calculateScoreBreakdown({
    groupStandingResults: [
      {
        groupId: "a",
        position: 1,
        teamId: "mexico"
      },
      {
        groupId: "a",
        position: 2,
        teamId: "south-africa"
      }
    ],
    groupStandings: [
      {
        groupId: "a",
        position: 1,
        teamId: "mexico"
      },
      {
        groupId: "a",
        position: 3,
        teamId: "south-africa"
      }
    ],
    matchResults: [
      {
        finishedAtIso: "2026-06-11T21:00:00Z",
        matchId: "a-1",
        score: {
          away: 1,
          home: 2
        }
      },
      {
        finishedAtIso: "2026-06-12T04:00:00Z",
        matchId: "a-2",
        score: {
          away: 1,
          home: 1
        }
      }
    ],
    matchScores: [
      {
        matchId: "a-1",
        score: {
          away: 1,
          home: 2
        }
      },
      {
        matchId: "a-2",
        score: {
          away: 0,
          home: 0
        }
      }
    ]
  });

  assert.deepEqual(score, {
    exactScoreHits: 1,
    exactScorePoints: 2,
    groupStandingPoints: 1,
    matchOutcomePoints: 2,
    total: 5
  });
});
