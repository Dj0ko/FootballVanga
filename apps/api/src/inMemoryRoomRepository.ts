import { randomUUID } from "node:crypto";

import type {
  GroupStandingPrediction,
  MatchPrediction,
  MatchResult,
  RoomStatus,
  RoomSummary
} from "@footballvanga/shared";

import type { RoomRepository } from "./roomRepository.js";
import { DEFAULT_TOURNAMENT_DEADLINE_ISO } from "./tournamentMetadata.js";

type StoredRoom = {
  createdOrder: number;
  deadlineIso: string;
  id: string;
  name: string;
  participantCount: number;
  passwordHash: string;
  status: RoomStatus;
};

export type StoredParticipant = {
  codeHash: string;
  createdOrder: number;
  displayName: string;
  exactScoreHits: number;
  id: string;
  roomId: string;
  totalScore: number;
};

export type StoredParticipantPrediction = {
  groupStandings: GroupStandingPrediction[];
  matchScores: MatchPrediction[];
  participantId: string;
  roomId: string;
  submittedAtIso: string;
  updatedAtIso: string;
};

export type StoredMatchResult = MatchResult & {
  source: "import" | "manual";
};

export type StoredGroupStandingResult = GroupStandingPrediction & {
  source: "import" | "manual";
};

export type StoredParticipantSession = {
  expiresAtIso: string;
  lastUsedAtIso: string;
  participantId: string;
  revokedAtIso: string | null;
  tokenHash: string;
};

export type InMemoryFootballStore = {
  deadlineIso: string;
  groupStandingResults: Map<string, StoredGroupStandingResult>;
  matchResults: Map<string, StoredMatchResult>;
  nextParticipantOrder: number;
  nextRoomOrder: number;
  participantSessions: Map<string, StoredParticipantSession>;
  participants: Map<string, StoredParticipant>;
  predictions: Map<string, StoredParticipantPrediction>;
  rooms: Map<string, StoredRoom>;
};

export const createInMemoryFootballStore = (
  options: {
    deadlineIso?: string;
  } = {}
): InMemoryFootballStore => ({
  deadlineIso: options.deadlineIso ?? DEFAULT_TOURNAMENT_DEADLINE_ISO,
  groupStandingResults: new Map(),
  matchResults: new Map(),
  nextParticipantOrder: 0,
  nextRoomOrder: 0,
  participantSessions: new Map(),
  participants: new Map(),
  predictions: new Map(),
  rooms: new Map()
});

const countParticipants = (store: InMemoryFootballStore, roomId: string) =>
  Array.from(store.participants.values()).filter((participant) => participant.roomId === roomId).length;

const toRoomSummary = (store: InMemoryFootballStore, room: StoredRoom): RoomSummary => ({
  deadlineIso: room.deadlineIso,
  id: room.id,
  name: room.name,
  participantCount: countParticipants(store, room.id),
  status: room.status
});

export const createInMemoryRoomRepository = (
  options: {
    deadlineIso?: string;
    store?: InMemoryFootballStore;
  } = {}
): RoomRepository => {
  const store = options.store ?? createInMemoryFootballStore({ deadlineIso: options.deadlineIso });

  const createRoom: RoomRepository["createRoom"] = async ({ name, passwordHash }) => {
    const room: StoredRoom = {
      createdOrder: store.nextRoomOrder,
      deadlineIso: store.deadlineIso,
      id: randomUUID(),
      name,
      participantCount: 0,
      passwordHash,
      status: "open"
    };

    store.nextRoomOrder += 1;
    store.rooms.set(room.id, room);

    return toRoomSummary(store, room);
  };

  const getRoomById: RoomRepository["getRoomById"] = async (roomId) => {
    const room = store.rooms.get(roomId);

    if (!room) {
      return null;
    }

    return {
      id: room.id,
      password_hash: room.passwordHash
    };
  };

  const listRooms: RoomRepository["listRooms"] = async () =>
    Array.from(store.rooms.values())
      .sort((leftRoom, rightRoom) => rightRoom.createdOrder - leftRoom.createdOrder)
      .map((room) => toRoomSummary(store, room));

  return {
    createRoom,
    getRoomById,
    listRooms
  };
};
