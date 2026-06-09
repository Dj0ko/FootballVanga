import assert from "node:assert/strict";
import test from "node:test";

import type { ParticipantSummary, RoomSummary } from "@footballvanga/shared";

import { buildServer } from "../src/index.ts";
import { hashPassword, verifyPassword } from "../src/passwordHash.ts";
import type { ParticipantRepository, ParticipantRecord } from "../src/participantRepository.ts";
import type { RoomRepository } from "../src/roomRepository.ts";
import { hashParticipantSessionToken } from "../src/sessionToken.ts";

const baseConfig = {
  host: "localhost",
  nodeEnv: "test",
  port: 4100
};

const readJson = <ResponseBody>(body: string) => JSON.parse(body) as ResponseBody;

type EnterParticipantResponse = {
  participant: ParticipantSummary;
  participants: ParticipantSummary[];
  session: {
    expiresAtIso: string;
    participantId: string;
    token: string;
  };
};

const createRoom = async (app: Awaited<ReturnType<typeof buildServer>>) => {
  const response = await app.inject({
    method: "POST",
    payload: {
      name: "Office League",
      password: "room-pass"
    },
    url: "/api/rooms"
  });

  assert.equal(response.statusCode, 201);

  return readJson<{ room: RoomSummary }>(response.body).room;
};

const enterParticipant = async (
  app: Awaited<ReturnType<typeof buildServer>>,
  input: {
    code?: string;
    displayName?: string;
    roomId: string;
    roomPassword?: string;
  }
) =>
  app.inject({
    method: "POST",
    payload: {
      code: input.code ?? "2222",
      displayName: input.displayName ?? "Алексей",
      roomPassword: input.roomPassword ?? "room-pass"
    },
    url: `/api/rooms/${input.roomId}/participants/enter`
  });

test("POST /api/rooms/:roomId/participants/enter validates participant input", async (t) => {
  const app = await buildServer(baseConfig);
  const room = await createRoom(app);

  t.after(async () => {
    await app.close();
  });

  const blankNameResponse = await enterParticipant(app, {
    displayName: "   ",
    roomId: room.id
  });
  const shortCodeResponse = await enterParticipant(app, {
    code: "123",
    roomId: room.id
  });
  const shortRoomPasswordResponse = await enterParticipant(app, {
    roomId: room.id,
    roomPassword: "123"
  });

  assert.equal(blankNameResponse.statusCode, 400);
  assert.deepEqual(readJson(blankNameResponse.body), {
    message: "Participant display name is required."
  });
  assert.equal(shortCodeResponse.statusCode, 400);
  assert.deepEqual(readJson(shortCodeResponse.body), {
    message: "Participant code must be at least 4 characters."
  });
  assert.equal(shortRoomPasswordResponse.statusCode, 400);
  assert.deepEqual(readJson(shortRoomPasswordResponse.body), {
    message: "Room password must be at least 4 characters."
  });
});

test("participant entry creates participant sessions without exposing hashes", async (t) => {
  const roomPasswordHash = await hashPassword("room-pass");
  const createdParticipants: Array<{ codeHash: string; displayName: string; roomId: string }> = [];
  const participantSessions: Array<{ expiresAt: Date; participantId: string; tokenHash: string }> = [];
  const participants = new Map<string, ParticipantRecord>();
  const roomRepository: RoomRepository = {
    createRoom: async () => {
      throw new Error("Unexpected room creation.");
    },
    getRoomById: async (roomId) =>
      roomId === "room-1"
        ? {
            id: "room-1",
            password_hash: roomPasswordHash
          }
        : null,
    listRooms: async () => []
  };
  const participantRepository: ParticipantRepository = {
    createParticipant: async (input) => {
      createdParticipants.push(input);

      const participant = {
        codeHash: input.codeHash,
        displayName: input.displayName,
        id: "participant-1"
      };

      participants.set(participant.id, participant);

      return {
        displayName: input.displayName,
        exactScoreHits: 0,
        id: participant.id,
        predictionStatus: "empty",
        totalScore: 0
      };
    },
    createParticipantSession: async (input) => {
      participantSessions.push(input);
    },
    getParticipantByDisplayName: async ({ displayName, roomId }) =>
      roomId === "room-1"
        ? (Array.from(participants.values()).find(
            (participant) => participant.displayName.toLocaleLowerCase("ru-RU") === displayName.toLocaleLowerCase("ru-RU")
          ) ?? null)
        : null,
    getParticipantBySessionTokenHash: async ({ tokenHash }) => {
      const session = participantSessions.find((currentSession) => currentSession.tokenHash === tokenHash);

      if (!session) {
        return null;
      }

      const participant = participants.get(session.participantId);

      return participant
        ? {
            displayName: participant.displayName,
            exactScoreHits: 0,
            id: participant.id,
            predictionStatus: "empty",
            totalScore: 0
          }
        : null;
    },
    listParticipants: async () =>
      Array.from(participants.values()).map((participant) => ({
        displayName: participant.displayName,
        exactScoreHits: 0,
        id: participant.id,
        predictionStatus: "empty",
        totalScore: 0
      }))
  };
  const app = await buildServer(baseConfig, {
    participantRepository,
    roomRepository
  });

  t.after(async () => {
    await app.close();
  });

  const response = await enterParticipant(app, {
    code: "2222",
    displayName: "  Алексей  ",
    roomId: "room-1"
  });
  const body = readJson<EnterParticipantResponse>(response.body);
  const createdParticipant = createdParticipants[0];
  const session = participantSessions[0];

  assert.ok(createdParticipant);
  assert.ok(session);
  assert.equal(response.statusCode, 201);
  assert.equal(body.participant.displayName, "Алексей");
  assert.equal(body.participants.length, 1);
  assert.equal(body.session.participantId, "participant-1");
  assert.equal(typeof body.session.token, "string");
  assert.notEqual(createdParticipant.codeHash, "2222");
  assert.equal(await verifyPassword("2222", createdParticipant.codeHash), true);
  assert.notEqual(session.tokenHash, body.session.token);
  assert.equal(session.tokenHash, hashParticipantSessionToken(body.session.token));
  assert.equal(response.body.includes("codeHash"), false);
  assert.equal(response.body.includes("tokenHash"), false);
  assert.equal(response.body.includes("roomPassword"), false);
});

test("participant entry reuses display names only with the matching participant code", async (t) => {
  const app = await buildServer(baseConfig);
  const room = await createRoom(app);

  t.after(async () => {
    await app.close();
  });

  const firstEntryResponse = await enterParticipant(app, {
    code: "2222",
    displayName: "Алексей",
    roomId: room.id
  });
  const firstEntry = readJson<EnterParticipantResponse>(firstEntryResponse.body);
  const wrongCodeResponse = await enterParticipant(app, {
    code: "wrong-code",
    displayName: "алексей",
    roomId: room.id
  });
  const returningEntryResponse = await enterParticipant(app, {
    code: "2222",
    displayName: "алексей",
    roomId: room.id
  });
  const returningEntry = readJson<EnterParticipantResponse>(returningEntryResponse.body);
  const roomsResponse = await app.inject({
    method: "GET",
    url: "/api/rooms"
  });
  const roomsBody = readJson<{ rooms: RoomSummary[] }>(roomsResponse.body);

  assert.equal(firstEntryResponse.statusCode, 201);
  assert.equal(wrongCodeResponse.statusCode, 401);
  assert.deepEqual(readJson(wrongCodeResponse.body), {
    message: "Invalid participant code."
  });
  assert.equal(returningEntryResponse.statusCode, 200);
  assert.equal(returningEntry.participant.id, firstEntry.participant.id);
  assert.equal(returningEntry.participants.length, 1);
  assert.equal(roomsBody.rooms[0]?.participantCount, 1);
});

test("GET /api/rooms/:roomId/participants requires a participant session", async (t) => {
  const app = await buildServer(baseConfig);
  const room = await createRoom(app);

  t.after(async () => {
    await app.close();
  });

  const entryResponse = await enterParticipant(app, {
    roomId: room.id
  });
  const entry = readJson<EnterParticipantResponse>(entryResponse.body);
  const missingSessionResponse = await app.inject({
    method: "GET",
    url: `/api/rooms/${room.id}/participants`
  });
  const wrongSessionResponse = await app.inject({
    headers: {
      Authorization: "Bearer wrong-token"
    },
    method: "GET",
    url: `/api/rooms/${room.id}/participants`
  });
  const successResponse = await app.inject({
    headers: {
      Authorization: `Bearer ${entry.session.token}`
    },
    method: "GET",
    url: `/api/rooms/${room.id}/participants`
  });

  assert.equal(missingSessionResponse.statusCode, 401);
  assert.deepEqual(readJson(missingSessionResponse.body), {
    message: "Participant session is required."
  });
  assert.equal(wrongSessionResponse.statusCode, 401);
  assert.deepEqual(readJson(wrongSessionResponse.body), {
    message: "Participant session is required."
  });
  assert.equal(successResponse.statusCode, 200);
  assert.deepEqual(readJson(successResponse.body), {
    participant: entry.participant,
    participants: entry.participants
  });
});
