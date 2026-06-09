import assert from "node:assert/strict";
import test from "node:test";

import type { ParticipantPrediction, ParticipantSummary, RoomSummary } from "@footballvanga/shared";

import { createInMemoryParticipantRepository } from "../src/inMemoryParticipantRepository.ts";
import { createInMemoryPredictionRepository } from "../src/inMemoryPredictionRepository.ts";
import { createInMemoryFootballStore, createInMemoryRoomRepository } from "../src/inMemoryRoomRepository.ts";
import { buildServer } from "../src/index.ts";

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

type PredictionResponse = {
  deadlineIso: string | null;
  isLocked: boolean;
  prediction: ParticipantPrediction;
};

const buildInMemoryApp = (deadlineIso = "2099-01-01T00:00:00.000Z") => {
  const store = createInMemoryFootballStore({
    deadlineIso
  });

  return buildServer(baseConfig, {
    participantRepository: createInMemoryParticipantRepository(store),
    predictionRepository: createInMemoryPredictionRepository(store),
    roomRepository: createInMemoryRoomRepository({ store })
  });
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
) => {
  const response = await app.inject({
    method: "POST",
    payload: {
      code: input.code ?? "2222",
      displayName: input.displayName ?? "Алексей",
      roomPassword: input.roomPassword ?? "room-pass"
    },
    url: `/api/rooms/${input.roomId}/participants/enter`
  });

  assert.ok([200, 201].includes(response.statusCode));

  return readJson<EnterParticipantResponse>(response.body);
};

const predictionPayload = {
  groupStandings: [
    {
      groupId: "a",
      position: 1,
      teamId: "mexico"
    },
    {
      groupId: "a",
      position: 2,
      teamId: "south-africa"
    },
    {
      groupId: "a",
      position: 3,
      teamId: "korea-republic"
    },
    {
      groupId: "a",
      position: 4,
      teamId: "czechia"
    }
  ],
  matchScores: [
    {
      matchId: "a-1",
      score: {
        away: 1,
        home: 2
      }
    }
  ]
};

test("prediction reads require a participant session and return an empty prediction first", async (t) => {
  const app = await buildInMemoryApp();
  const room = await createRoom(app);
  const entry = await enterParticipant(app, {
    roomId: room.id
  });

  t.after(async () => {
    await app.close();
  });

  const missingSessionResponse = await app.inject({
    method: "GET",
    url: `/api/rooms/${room.id}/predictions/${entry.participant.id}`
  });
  const wrongSessionResponse = await app.inject({
    headers: {
      Authorization: "Bearer wrong-token"
    },
    method: "GET",
    url: `/api/rooms/${room.id}/predictions/${entry.participant.id}`
  });
  const successResponse = await app.inject({
    headers: {
      Authorization: `Bearer ${entry.session.token}`
    },
    method: "GET",
    url: `/api/rooms/${room.id}/predictions/${entry.participant.id}`
  });
  const successBody = readJson<PredictionResponse>(successResponse.body);

  assert.equal(missingSessionResponse.statusCode, 401);
  assert.equal(wrongSessionResponse.statusCode, 401);
  assert.equal(successResponse.statusCode, 200);
  assert.equal(successBody.isLocked, false);
  assert.deepEqual(successBody.prediction, {
    groupStandings: [],
    matchScores: [],
    participantId: entry.participant.id,
    roomId: room.id,
    submittedAtIso: null,
    updatedAtIso: null
  });
});

test("participants can save their own prediction and room participants can read it", async (t) => {
  const app = await buildInMemoryApp();
  const room = await createRoom(app);
  const ownerEntry = await enterParticipant(app, {
    displayName: "Алексей",
    roomId: room.id
  });
  const viewerEntry = await enterParticipant(app, {
    code: "3333",
    displayName: "Мария",
    roomId: room.id
  });

  t.after(async () => {
    await app.close();
  });

  const saveResponse = await app.inject({
    headers: {
      Authorization: `Bearer ${ownerEntry.session.token}`
    },
    method: "PUT",
    payload: predictionPayload,
    url: `/api/rooms/${room.id}/predictions/me`
  });
  const saveBody = readJson<PredictionResponse>(saveResponse.body);
  const participantsResponse = await app.inject({
    headers: {
      Authorization: `Bearer ${ownerEntry.session.token}`
    },
    method: "GET",
    url: `/api/rooms/${room.id}/participants`
  });
  const participantsBody = readJson<{ participant: ParticipantSummary; participants: ParticipantSummary[] }>(
    participantsResponse.body
  );
  const readResponse = await app.inject({
    headers: {
      Authorization: `Bearer ${viewerEntry.session.token}`
    },
    method: "GET",
    url: `/api/rooms/${room.id}/predictions/${ownerEntry.participant.id}`
  });
  const readBody = readJson<PredictionResponse>(readResponse.body);

  assert.equal(saveResponse.statusCode, 200);
  assert.equal(saveBody.prediction.participantId, ownerEntry.participant.id);
  assert.deepEqual(saveBody.prediction.groupStandings, predictionPayload.groupStandings);
  assert.deepEqual(saveBody.prediction.matchScores, predictionPayload.matchScores);
  assert.equal(typeof saveBody.prediction.submittedAtIso, "string");
  assert.equal(typeof saveBody.prediction.updatedAtIso, "string");
  assert.equal(participantsBody.participant.predictionStatus, "draft");
  assert.equal(
    participantsBody.participants.find((participant) => participant.id === ownerEntry.participant.id)?.predictionStatus,
    "draft"
  );
  assert.equal(readResponse.statusCode, 200);
  assert.deepEqual(readBody.prediction, saveBody.prediction);
});

test("prediction saves validate standings, match scores, and participant sessions", async (t) => {
  const app = await buildInMemoryApp();
  const room = await createRoom(app);
  const entry = await enterParticipant(app, {
    roomId: room.id
  });

  t.after(async () => {
    await app.close();
  });

  const missingSessionResponse = await app.inject({
    method: "PUT",
    payload: predictionPayload,
    url: `/api/rooms/${room.id}/predictions/me`
  });
  const duplicateStandingResponse = await app.inject({
    headers: {
      Authorization: `Bearer ${entry.session.token}`
    },
    method: "PUT",
    payload: {
      groupStandings: [
        {
          groupId: "a",
          position: 1,
          teamId: "mexico"
        },
        {
          groupId: "a",
          position: 1,
          teamId: "south-africa"
        }
      ],
      matchScores: []
    },
    url: `/api/rooms/${room.id}/predictions/me`
  });
  const badScoreResponse = await app.inject({
    headers: {
      Authorization: `Bearer ${entry.session.token}`
    },
    method: "PUT",
    payload: {
      groupStandings: [],
      matchScores: [
        {
          matchId: "a-1",
          score: {
            away: 0,
            home: 100
          }
        }
      ]
    },
    url: `/api/rooms/${room.id}/predictions/me`
  });

  assert.equal(missingSessionResponse.statusCode, 401);
  assert.deepEqual(readJson(missingSessionResponse.body), {
    message: "Participant session is required."
  });
  assert.equal(duplicateStandingResponse.statusCode, 400);
  assert.deepEqual(readJson(duplicateStandingResponse.body), {
    message: "Prediction group standings contain duplicates."
  });
  assert.equal(badScoreResponse.statusCode, 400);
  assert.deepEqual(readJson(badScoreResponse.body), {
    message: "Prediction match scores are invalid."
  });
});

test("prediction saves are rejected after the server-calculated deadline", async (t) => {
  const app = await buildInMemoryApp("2020-01-01T00:00:00.000Z");
  const room = await createRoom(app);
  const entry = await enterParticipant(app, {
    roomId: room.id
  });

  t.after(async () => {
    await app.close();
  });

  const readResponse = await app.inject({
    headers: {
      Authorization: `Bearer ${entry.session.token}`
    },
    method: "GET",
    url: `/api/rooms/${room.id}/predictions/${entry.participant.id}`
  });
  const readBody = readJson<PredictionResponse>(readResponse.body);
  const saveResponse = await app.inject({
    headers: {
      Authorization: `Bearer ${entry.session.token}`
    },
    method: "PUT",
    payload: predictionPayload,
    url: `/api/rooms/${room.id}/predictions/me`
  });

  assert.equal(readResponse.statusCode, 200);
  assert.equal(readBody.isLocked, true);
  assert.equal(saveResponse.statusCode, 423);
  assert.deepEqual(readJson(saveResponse.body), {
    message: "Prediction deadline has passed."
  });
});
