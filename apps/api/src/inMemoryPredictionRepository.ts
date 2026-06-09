import type { MatchPrediction, ParticipantPrediction } from "@footballvanga/shared";

import type { InMemoryFootballStore, StoredParticipantPrediction } from "./inMemoryRoomRepository.js";
import type { PredictionRepository } from "./predictionRepository.js";
import { createStaticTournamentPredictionMetadata } from "./tournamentMetadata.js";

const cloneMatchPrediction = (prediction: MatchPrediction): MatchPrediction => ({
  matchId: prediction.matchId,
  score: {
    away: prediction.score.away,
    home: prediction.score.home
  }
});

const toParticipantPrediction = (
  store: InMemoryFootballStore,
  roomId: string,
  participantId: string
): ParticipantPrediction | null => {
  const participant = store.participants.get(participantId);

  if (!participant || participant.roomId !== roomId) {
    return null;
  }

  const prediction = store.predictions.get(participantId);

  return {
    groupStandings: prediction?.groupStandings.map((standing) => ({ ...standing })) ?? [],
    matchScores: prediction?.matchScores.map(cloneMatchPrediction) ?? [],
    participantId,
    roomId,
    submittedAtIso: prediction?.submittedAtIso ?? null,
    updatedAtIso: prediction?.updatedAtIso ?? null
  };
};

export const createInMemoryPredictionRepository = (store: InMemoryFootballStore): PredictionRepository => {
  const getTournamentMetadata: PredictionRepository["getTournamentMetadata"] = async () =>
    createStaticTournamentPredictionMetadata(store.deadlineIso);

  const getParticipantPrediction: PredictionRepository["getParticipantPrediction"] = async ({ participantId, roomId }) =>
    toParticipantPrediction(store, roomId, participantId);

  const saveParticipantPrediction: PredictionRepository["saveParticipantPrediction"] = async ({
    groupStandings,
    matchScores,
    participantId,
    roomId
  }) => {
    const participant = store.participants.get(participantId);

    if (!participant || participant.roomId !== roomId) {
      return null;
    }

    const previousPrediction = store.predictions.get(participantId);
    const nowIso = new Date().toISOString();
    const prediction: StoredParticipantPrediction = {
      groupStandings: groupStandings.map((standing) => ({ ...standing })),
      matchScores: matchScores.map(cloneMatchPrediction),
      participantId,
      roomId,
      submittedAtIso: previousPrediction?.submittedAtIso ?? nowIso,
      updatedAtIso: nowIso
    };

    store.predictions.set(participantId, prediction);

    return toParticipantPrediction(store, roomId, participantId);
  };

  return {
    getParticipantPrediction,
    getTournamentMetadata,
    saveParticipantPrediction
  };
};
