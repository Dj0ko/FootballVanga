import assert from "node:assert/strict";
import test from "node:test";

import type {
  GlobalLeaderboardEntry,
  ParticipantPrediction,
  ParticipantSummary,
  RoomSummary
} from "@footballvanga/shared";

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

type GlobalLeaderboardResponse = {
  leaderboard: GlobalLeaderboardEntry[];
};

type PublicPredictionResponse = {
  deadlineIso: string | null;
  isLocked: boolean;
  prediction: ParticipantPrediction;
};

type RecalculateResponse = {
  ok: boolean;
  recalculatedParticipants: number;
  stage: string;
};

const buildScoringAppWithStore = async (
  options: {
    deadlineIso?: string;
  } = {}
) => {
  const store = createInMemoryFootballStore({
    deadlineIso: options.deadlineIso ?? "2099-01-01T00:00:00.000Z"
  });

  const app = await buildServer(
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

  return {
    app,
    store
  };
};

const buildScoringApp = async () => (await buildScoringAppWithStore()).app;

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

  if (typeof adminCookie !== "string") {
    throw new Error("Expected admin session cookie to be returned.");
  }

  return adminCookie;
};

const createRoom = async (
  app: Awaited<ReturnType<typeof buildServer>>,
  input: {
    name?: string;
  } = {}
) => {
  const response = await app.inject({
    method: "POST",
    payload: {
      name: input.name ?? "Office League",
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

const saveMatchResult = async (
  app: Awaited<ReturnType<typeof buildServer>>,
  input: {
    adminCookie: string;
    away: number;
    home: number;
    matchId: string;
  }
) => {
  const response = await app.inject({
    headers: {
      cookie: input.adminCookie
    },
    method: "PUT",
    payload: {
      away: input.away,
      home: input.home
    },
    url: `/api/admin/matches/${input.matchId}/result`
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
  const adminCookie = await getAdminCookie(app);

  t.after(async () => {
    await app.close();
  });

  await saveMatchResult(app, {
    adminCookie,
    away: 1,
    home: 2,
    matchId: "a-1"
  });
  await saveMatchResult(app, {
    adminCookie,
    away: 1,
    home: 1,
    matchId: "a-2"
  });
  await saveMatchResult(app, {
    adminCookie,
    away: 2,
    home: 0,
    matchId: "b-1"
  });
  await saveMatchResult(app, {
    adminCookie,
    away: 1,
    home: 3,
    matchId: "d-1"
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

test("global leaderboard is public and opens current leader predictions only after the deadline", async (t) => {
  const { app, store } = await buildScoringAppWithStore({
    deadlineIso: "2099-01-01T00:00:00.000Z"
  });
  const officeRoom = await createRoom(app, {
    name: "Office League"
  });
  const friendsRoom = await createRoom(app, {
    name: "Friends Cup"
  });
  const exactLeaderEntry = await enterParticipant(app, {
    code: "1111",
    displayName: "Exact Leader",
    roomId: officeRoom.id
  });
  const outcomeLeaderEntry = await enterParticipant(app, {
    code: "2222",
    displayName: "Outcome Leader",
    roomId: friendsRoom.id
  });
  const zeroScoreEntry = await enterParticipant(app, {
    code: "3333",
    displayName: "Zero Score",
    roomId: friendsRoom.id
  });
  const adminCookie = await getAdminCookie(app);

  t.after(async () => {
    await app.close();
  });

  await saveMatchResult(app, {
    adminCookie,
    away: 1,
    home: 2,
    matchId: "a-1"
  });

  await savePrediction(app, {
    matchScores: [{ matchId: "a-1", score: { away: 1, home: 2 } }],
    roomId: officeRoom.id,
    token: exactLeaderEntry.session.token
  });
  await savePrediction(app, {
    matchScores: [{ matchId: "a-1", score: { away: 0, home: 1 } }],
    roomId: friendsRoom.id,
    token: outcomeLeaderEntry.session.token
  });
  await savePrediction(app, {
    matchScores: [{ matchId: "a-1", score: { away: 2, home: 0 } }],
    roomId: friendsRoom.id,
    token: zeroScoreEntry.session.token
  });

  const globalLeaderboardResponse = await app.inject({
    method: "GET",
    url: "/api/leaderboard/global"
  });
  const globalLeaderboardBody = readJson<GlobalLeaderboardResponse>(globalLeaderboardResponse.body);
  const beforeDeadlinePredictionResponse = await app.inject({
    method: "GET",
    url: `/api/leaderboard/global/${officeRoom.id}/predictions/${exactLeaderEntry.participant.id}`
  });

  assert.equal(globalLeaderboardResponse.statusCode, 200);
  assert.deepEqual(
    globalLeaderboardBody.leaderboard.map((leader) => ({
      exactScoreHits: leader.exactScoreHits,
      name: leader.displayName,
      roomName: leader.roomName,
      totalScore: leader.totalScore
    })),
    [
      {
        exactScoreHits: 1,
        name: "Exact Leader",
        roomName: "Office League",
        totalScore: 3
      },
      {
        exactScoreHits: 0,
        name: "Outcome Leader",
        roomName: "Friends Cup",
        totalScore: 1
      }
    ]
  );
  assert.equal(beforeDeadlinePredictionResponse.statusCode, 423);

  store.deadlineIso = "2000-01-01T00:00:00.000Z";

  const publicPredictionResponse = await app.inject({
    method: "GET",
    url: `/api/leaderboard/global/${officeRoom.id}/predictions/${exactLeaderEntry.participant.id}`
  });
  const nonLeaderPredictionResponse = await app.inject({
    method: "GET",
    url: `/api/leaderboard/global/${friendsRoom.id}/predictions/${zeroScoreEntry.participant.id}`
  });
  const publicPredictionBody = readJson<PublicPredictionResponse>(publicPredictionResponse.body);

  assert.equal(publicPredictionResponse.statusCode, 200);
  assert.equal(publicPredictionBody.isLocked, true);
  assert.equal(publicPredictionBody.prediction.participantId, exactLeaderEntry.participant.id);
  assert.deepEqual(publicPredictionBody.prediction.matchScores, [
    {
      matchId: "a-1",
      score: {
        away: 1,
        home: 2
      }
    }
  ]);
  assert.equal(nonLeaderPredictionResponse.statusCode, 404);
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

  await saveMatchResult(app, {
    adminCookie,
    away: 1,
    home: 2,
    matchId: "a-1"
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
