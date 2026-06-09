import { randomUUID } from "node:crypto";

import type { ParticipantSummary } from "@footballvanga/shared";

import type { ParticipantRepository, ParticipantRecord } from "./participantRepository.js";
import type { InMemoryFootballStore, StoredParticipant } from "./inMemoryRoomRepository.js";
import { getPredictionStatus } from "./tournamentMetadata.js";

const normalizeDisplayName = (displayName: string) => displayName.toLocaleLowerCase("ru-RU");

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

const toParticipantRecord = (participant: StoredParticipant): ParticipantRecord => ({
  codeHash: participant.codeHash,
  displayName: participant.displayName,
  id: participant.id
});

export const createInMemoryParticipantRepository = (store: InMemoryFootballStore): ParticipantRepository => {
  const listParticipants: ParticipantRepository["listParticipants"] = async (roomId) =>
    Array.from(store.participants.values())
      .filter((participant) => participant.roomId === roomId)
      .sort((leftParticipant, rightParticipant) => leftParticipant.createdOrder - rightParticipant.createdOrder)
      .map((participant) => toParticipantSummary(store, participant));

  const createParticipant: ParticipantRepository["createParticipant"] = async ({ codeHash, displayName, roomId }) => {
    if (!store.rooms.has(roomId)) {
      throw new Error("Room was not found.");
    }

    const existingParticipant = Array.from(store.participants.values()).find(
      (participant) =>
        participant.roomId === roomId &&
        normalizeDisplayName(participant.displayName) === normalizeDisplayName(displayName)
    );

    if (existingParticipant) {
      throw new Error("Participant display name is already taken.");
    }

    const participant: StoredParticipant = {
      codeHash,
      createdOrder: store.nextParticipantOrder,
      displayName,
      exactScoreHits: 0,
      id: randomUUID(),
      roomId,
      totalScore: 0
    };

    store.nextParticipantOrder += 1;
    store.participants.set(participant.id, participant);

    return toParticipantSummary(store, participant);
  };

  const createParticipantSession: ParticipantRepository["createParticipantSession"] = async ({
    expiresAt,
    participantId,
    tokenHash
  }) => {
    store.participantSessions.set(tokenHash, {
      expiresAtIso: expiresAt.toISOString(),
      lastUsedAtIso: new Date().toISOString(),
      participantId,
      revokedAtIso: null,
      tokenHash
    });
  };

  const getParticipantByDisplayName: ParticipantRepository["getParticipantByDisplayName"] = async ({
    displayName,
    roomId
  }) => {
    const participant = Array.from(store.participants.values()).find(
      (currentParticipant) =>
        currentParticipant.roomId === roomId &&
        normalizeDisplayName(currentParticipant.displayName) === normalizeDisplayName(displayName)
    );

    return participant ? toParticipantRecord(participant) : null;
  };

  const getParticipantBySessionTokenHash: ParticipantRepository["getParticipantBySessionTokenHash"] = async ({
    roomId,
    tokenHash
  }) => {
    const session = store.participantSessions.get(tokenHash);

    if (!session || session.revokedAtIso || Date.parse(session.expiresAtIso) <= Date.now()) {
      return null;
    }

    const participant = store.participants.get(session.participantId);

    if (!participant || participant.roomId !== roomId) {
      return null;
    }

    session.lastUsedAtIso = new Date().toISOString();

    return toParticipantSummary(store, participant);
  };

  return {
    createParticipant,
    createParticipantSession,
    getParticipantByDisplayName,
    getParticipantBySessionTokenHash,
    listParticipants
  };
};
