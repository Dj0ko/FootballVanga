import assert from "node:assert/strict";
import test from "node:test";

import type { ParticipantSummary, RoomSummary } from "@footballvanga/shared";

import { hashAdminPassword } from "../src/adminAuth.ts";
import { createInMemoryMatchResultRepository } from "../src/inMemoryMatchResultRepository.ts";
import { createInMemoryParticipantRepository } from "../src/inMemoryParticipantRepository.ts";
import { createInMemoryPredictionRepository } from "../src/inMemoryPredictionRepository.ts";
import { createInMemoryFootballStore, createInMemoryRoomRepository } from "../src/inMemoryRoomRepository.ts";
import { createInMemoryScoringRepository } from "../src/inMemoryScoringRepository.ts";
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

type LeaderboardResponse = {
  leaderboard: ParticipantSummary[];
};

type RecalculateResponse = {
  ok: boolean;
  recalculatedParticipants: number;
  stage: string;
};

const buildScoringApp = async () => {
  const store = createInMemoryFootballStore({
    deadlineIso: "2099-01-01T00:00:00.000Z"
  });

  return buildServer(
    {
      ...baseConfig,
      adminPasswordHash: await hashAdminPassword("operator-pass"),
      adminSessionSecret: "test-admin-session-secret"
    },
    {
      matchResultRepository: createInMemoryMatchResultRepository(store),
      participantRepository: createInMemoryParticipantRepository(store),
      predictionRepository: createInMemoryPredictionRepository(store),
      roomRepository: createInMemoryRoomRepository({ store }),
      scoringRepository: createInMemoryScoringRepository(store)
    }
  );
};

const getAdminCookie = async (app: Awaited<ReturnType<typeof buildServer>>) => {
  const loginResponse = await app.inject({
    method: "POST",
    payload: {
      password: "operator-pass"
    },
    url: "/api/admin/login"
  });
  const setCookieHeader = loginResponse.headers["set-cookie"];

  assert.equal(loginResponse.statusCode, 200);

  const adminCookie = Array.isArray(setCookieHeader) ? setCookieHeader[0] : setCookieHeader;

  assert.equal(typeof adminCookie, "string");

  return adminCookie;
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
    code: string;
    displayName: string;
    roomId: string;
  }
) => {
  const response = await app.inject({
    method: "POST",
    payload: {
      code: input.code,
      displayName: input.displayName,
      roomPassword: "room-pass"
    },
    url: `/api/rooms/${input.roomId}/participants/enter`
  });

  assert.ok([200, 201].includes(response.statusCode));

  return readJson<EnterParticipantResponse>(response.body);
};

const savePrediction = async (
  app: Awaited<ReturnType<typeof buildServer>>,
  input: {
    matchScores: Array<{
      matchId: string;
      score: {
        away: number;
        home: number;
      };
    }>;
    roomId: string;
    token: string;
  }
) => {
  const response = await app.inject({
    headers: {
      Authorization: `Bearer ${input.token}`
    },
    method: "PUT",
    payload: {
      groupStandings: [],
      matchScores: input.matchScores
    },
    url: `/api/rooms/${input.roomId}/predictions/me`
  });

  assert.equal(response.statusCode, 200);
};

test("room leaderboard requires participant access and ranks by points then exact scores", async (t) => {
  const app = await buildScoringApp();
  const room = await createRoom(app);
  const outcomeOnlyEntry = await enterParticipant(app, {
    code: "1111",
    displayName: "Outcome Only",
    roomId: room.id
  });
  const exactTieBreakerEntry = await enterParticipant(app, {
    code: "2222",
    displayName: "Exact Tie",
    roomId: room.id
  });

  t.after(async () => {
    await app.close();
  });

  await savePrediction(app, {
    matchScores: [
      { matchId: "a-1", score: { away: 0, home: 1 } },
      { matchId: "a-2", score: { away: 0, home: 0 } },
      { matchId: "b-1", score: { away: 1, home: 0 } },
      { matchId: "d-1", score: { away: 0, home: 1 } }
    ],
    roomId: room.id,
    token: outcomeOnlyEntry.session.token
  });
  await savePrediction(app, {
    matchScores: [
      { matchId: "a-1", score: { away: 1, home: 2 } },
      { matchId: "a-2", score: { away: 0, home: 0 } }
    ],
    roomId: room.id,
    token: exactTieBreakerEntry.session.token
  });

  const missingSessionResponse = await app.inject({
    method: "GET",
    url: `/api/rooms/${room.id}/leaderboard`
  });
  const leaderboardResponse = await app.inject({
    headers: {
      Authorization: `Bearer ${outcomeOnlyEntry.session.token}`
    },
    method: "GET",
    url: `/api/rooms/${room.id}/leaderboard`
  });
  const leaderboardBody = readJson<LeaderboardResponse>(leaderboardResponse.body);

  assert.equal(missingSessionResponse.statusCode, 401);
  assert.equal(leaderboardResponse.statusCode, 200);
  assert.deepEqual(
    leaderboardBody.leaderboard.map((participant) => ({
      exactScoreHits: participant.exactScoreHits,
      name: participant.displayName,
      totalScore: participant.totalScore
    })),
    [
      {
        exactScoreHits: 1,
        name: "Exact Tie",
        totalScore: 4
      },
      {
        exactScoreHits: 0,
        name: "Outcome Only",
        totalScore: 4
      }
    ]
  );
});

test("admin scoring recalculation updates snapshots and reports recalculated participant count", async (t) => {
  const app = await buildScoringApp();
  const room = await createRoom(app);
  const entry = await enterParticipant(app, {
    code: "1111",
    displayName: "Алексей",
    roomId: room.id
  });
  const adminCookie = await getAdminCookie(app);

  t.after(async () => {
    await app.close();
  });

  await savePrediction(app, {
    matchScores: [{ matchId: "a-1", score: { away: 1, home: 2 } }],
    roomId: room.id,
    token: entry.session.token
  });

  const recalculateResponse = await app.inject({
    headers: {
      cookie: adminCookie
    },
    method: "POST",
    url: "/api/admin/scoring/recalculate"
  });
  const recalculateBody = readJson<RecalculateResponse>(recalculateResponse.body);
  const leaderboardResponse = await app.inject({
    headers: {
      Authorization: `Bearer ${entry.session.token}`
    },
    method: "GET",
    url: `/api/rooms/${room.id}/leaderboard`
  });
  const leaderboardBody = readJson<LeaderboardResponse>(leaderboardResponse.body);

  assert.equal(recalculateResponse.statusCode, 200);
  assert.deepEqual(recalculateBody, {
    ok: true,
    recalculatedParticipants: 1,
    stage: "mvp"
  });
  assert.equal(leaderboardResponse.statusCode, 200);
  assert.equal(leaderboardBody.leaderboard[0]?.totalScore, 3);
  assert.equal(leaderboardBody.leaderboard[0]?.exactScoreHits, 1);
});
