import type { ParticipantSummary } from "@footballvanga/shared";

import type { InMemoryFootballStore, StoredParticipant } from "./inMemoryRoomRepository.js";
import { calculateScoreBreakdown } from "./scoringCalculator.js";
import type { ScoringRepository } from "./scoringRepository.js";
import { getPredictionStatus } from "./tournamentMetadata.js";

const toParticipantSummary = (store: InMemoryFootballStore, participant: StoredParticipant): ParticipantSummary => {
  const prediction = store.predictions.get(participant.id);

  return {
    displayName: participant.displayName,
    exactScoreHits: participant.exactScoreHits,
    id: participant.id,
    predictionStatus: getPredictionStatus({
      groupStandingsCount: prediction?.groupStandings.length ?? 0,
      matchScoresCount: prediction?.matchScores.length ?? 0,
      submittedAtIso: prediction?.submittedAtIso ?? null
    }),
    totalScore: participant.totalScore
  };
};

export const createInMemoryScoringRepository = (store: InMemoryFootballStore): ScoringRepository => {
  const recalculateScores: ScoringRepository["recalculateScores"] = async () => {
    let recalculatedParticipants = 0;
    const matchResults = Array.from(store.matchResults.values());
    const groupStandingResults = Array.from(store.groupStandingResults.values());

    for (const participant of store.participants.values()) {
      const prediction = store.predictions.get(participant.id);
      const score = calculateScoreBreakdown({
        groupStandingResults,
        groupStandings: prediction?.groupStandings ?? [],
        matchResults,
        matchScores: prediction?.matchScores ?? []
      });

      participant.exactScoreHits = score.exactScoreHits;
      participant.totalScore = score.total;
      recalculatedParticipants += 1;
    }

    return {
      recalculatedParticipants
    };
  };

  const listRoomLeaderboard: ScoringRepository["listRoomLeaderboard"] = async (roomId) =>
    Array.from(store.participants.values())
      .filter((participant) => participant.roomId === roomId)
      .sort((leftParticipant, rightParticipant) => {
        if (rightParticipant.totalScore !== leftParticipant.totalScore) {
          return rightParticipant.totalScore - leftParticipant.totalScore;
        }

        if (rightParticipant.exactScoreHits !== leftParticipant.exactScoreHits) {
          return rightParticipant.exactScoreHits - leftParticipant.exactScoreHits;
        }

        return leftParticipant.createdOrder - rightParticipant.createdOrder;
      })
      .map((participant) => toParticipantSummary(store, participant));

  return {
    listRoomLeaderboard,
    recalculateScores
  };
};
