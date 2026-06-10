import assert from "node:assert/strict";
import test from "node:test";

import type { MatchResult } from "@footballvanga/shared";

import { hashAdminPassword } from "../src/adminAuth.ts";
import { buildServer } from "../src/index.ts";
import type { ResultImportSummary } from "../src/resultImportTypes.ts";

const baseConfig = {
  host: "localhost",
  nodeEnv: "test",
  port: 4100
};

const readJson = <ResponseBody>(body: string) => JSON.parse(body) as ResponseBody;

type MatchHistoryResponse = {
  results: MatchResult[];
};

type SaveMatchResultResponse = {
  ok: boolean;
  result: MatchResult;
};

type SyncResultsResponse = ResultImportSummary & {
  ok: boolean;
};

const buildAdminApp = async () =>
  buildServer({
    ...baseConfig,
    adminPasswordHash: await hashAdminPassword("operator-pass"),
    adminSessionSecret: "test-admin-session-secret"
  });

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

test("GET /api/match-history starts empty before real match results are saved", async (t) => {
  const app = await buildServer(baseConfig);

  t.after(async () => {
    await app.close();
  });

  const response = await app.inject({
    method: "GET",
    url: "/api/match-history"
  });
  const body = readJson<MatchHistoryResponse>(response.body);

  assert.equal(response.statusCode, 200);
  assert.deepEqual(body.results, []);
});

test("admin match result writes require admin configuration and session", async (t) => {
  const unconfiguredApp = await buildServer(baseConfig);
  const configuredApp = await buildAdminApp();

  t.after(async () => {
    await unconfiguredApp.close();
    await configuredApp.close();
  });

  const missingLoginBodyResponse = await configuredApp.inject({
    method: "POST",
    url: "/api/admin/login"
  });
  const unconfiguredResponse = await unconfiguredApp.inject({
    method: "PUT",
    payload: {
      away: 1,
      home: 2
    },
    url: "/api/admin/matches/a-1/result"
  });
  const missingSessionResponse = await configuredApp.inject({
    method: "PUT",
    payload: {
      away: 1,
      home: 2
    },
    url: "/api/admin/matches/a-1/result"
  });

  assert.equal(missingLoginBodyResponse.statusCode, 401);
  assert.deepEqual(readJson(missingLoginBodyResponse.body), {
    message: "Invalid admin password."
  });
  assert.equal(unconfiguredResponse.statusCode, 503);
  assert.deepEqual(readJson(unconfiguredResponse.body), {
    message: "Admin access is not configured."
  });
  assert.equal(missingSessionResponse.statusCode, 401);
  assert.deepEqual(readJson(missingSessionResponse.body), {
    message: "Admin session is required."
  });
});

test("admin match result writes validate scores and known matches", async (t) => {
  const app = await buildAdminApp();
  const adminCookie = await getAdminCookie(app);

  t.after(async () => {
    await app.close();
  });

  const badScoreResponse = await app.inject({
    headers: {
      cookie: adminCookie
    },
    method: "PUT",
    payload: {
      away: 0,
      home: 100
    },
    url: "/api/admin/matches/a-1/result"
  });
  const unknownMatchResponse = await app.inject({
    headers: {
      cookie: adminCookie
    },
    method: "PUT",
    payload: {
      away: 0,
      home: 1
    },
    url: "/api/admin/matches/no-such-match/result"
  });

  assert.equal(badScoreResponse.statusCode, 400);
  assert.deepEqual(readJson(badScoreResponse.body), {
    message: "Scores must be integers from 0 to 99."
  });
  assert.equal(unknownMatchResponse.statusCode, 404);
  assert.deepEqual(readJson(unknownMatchResponse.body), {
    message: "Match was not found."
  });
});

test("admin group standing writes require admin session and validate standings", async (t) => {
  const app = await buildAdminApp();
  const adminCookie = await getAdminCookie(app);

  t.after(async () => {
    await app.close();
  });

  const missingSessionResponse = await app.inject({
    method: "PUT",
    payload: {
      standings: [
        { position: 1, teamId: "mexico" },
        { position: 2, teamId: "south-africa" },
        { position: 3, teamId: "korea-republic" },
        { position: 4, teamId: "czechia" }
      ]
    },
    url: "/api/admin/groups/a/standings"
  });
  const duplicateTeamResponse = await app.inject({
    headers: {
      cookie: adminCookie
    },
    method: "PUT",
    payload: {
      standings: [
        { position: 1, teamId: "mexico" },
        { position: 2, teamId: "mexico" },
        { position: 3, teamId: "korea-republic" },
        { position: 4, teamId: "czechia" }
      ]
    },
    url: "/api/admin/groups/a/standings"
  });

  assert.equal(missingSessionResponse.statusCode, 401);
  assert.deepEqual(readJson(missingSessionResponse.body), {
    message: "Admin session is required."
  });
  assert.equal(duplicateTeamResponse.statusCode, 400);
  assert.deepEqual(readJson(duplicateTeamResponse.body), {
    message: "Group standings contain duplicates."
  });
});

test("admin match result writes persist to public match history", async (t) => {
  const app = await buildAdminApp();
  const adminCookie = await getAdminCookie(app);

  t.after(async () => {
    await app.close();
  });

  const saveResponse = await app.inject({
    headers: {
      cookie: adminCookie
    },
    method: "PUT",
    payload: {
      away: 2,
      home: 4
    },
    url: "/api/admin/matches/a-3/result"
  });
  const saveBody = readJson<SaveMatchResultResponse>(saveResponse.body);
  const historyResponse = await app.inject({
    method: "GET",
    url: "/api/match-history"
  });
  const historyBody = readJson<MatchHistoryResponse>(historyResponse.body);
  const savedHistoryResult = historyBody.results.find((result) => result.matchId === "a-3");

  assert.equal(saveResponse.statusCode, 200);
  assert.equal(saveBody.ok, true);
  assert.deepEqual(saveBody.result.score, {
    away: 2,
    home: 4
  });
  assert.equal(typeof saveBody.result.finishedAtIso, "string");
  assert.deepEqual(savedHistoryResult, saveBody.result);
});

test("admin result sync requires session and importer configuration", async (t) => {
  const configuredApp = await buildAdminApp();
  const appWithImporter = await buildServer(
    {
      ...baseConfig,
      adminPasswordHash: await hashAdminPassword("operator-pass"),
      adminSessionSecret: "test-admin-session-secret"
    },
    {
      resultImporter: {
        syncResults: async () => ({
          finalGroups: ["a"],
          finishedAtIso: "2026-06-10T09:00:01.000Z",
          matchesCreated: 1,
          matchesSeen: 1,
          matchesSkippedManual: 0,
          matchesSkippedUnmapped: 0,
          matchesUnchanged: 0,
          matchesUpdated: 0,
          provider: "test-provider",
          recalculatedParticipants: 2,
          startedAtIso: "2026-06-10T09:00:00.000Z",
          standingsCreated: 1,
          standingsSeen: 1,
          standingsSkippedManual: 0,
          standingsSkippedPending: 0,
          standingsSkippedUnmapped: 0,
          standingsUnchanged: 0,
          standingsUpdated: 0,
          status: "success",
          warnings: []
        })
      }
    }
  );
  const adminCookie = await getAdminCookie(appWithImporter);

  t.after(async () => {
    await configuredApp.close();
    await appWithImporter.close();
  });

  const missingSessionResponse = await appWithImporter.inject({
    method: "POST",
    url: "/api/admin/results/sync"
  });
  const unconfiguredImporterResponse = await configuredApp.inject({
    headers: {
      cookie: adminCookie
    },
    method: "POST",
    url: "/api/admin/results/sync"
  });
  const syncResponse = await appWithImporter.inject({
    headers: {
      cookie: adminCookie
    },
    method: "POST",
    url: "/api/admin/results/sync"
  });
  const syncBody = readJson<SyncResultsResponse>(syncResponse.body);

  assert.equal(missingSessionResponse.statusCode, 401);
  assert.deepEqual(readJson(missingSessionResponse.body), {
    message: "Admin session is required."
  });
  assert.equal(unconfiguredImporterResponse.statusCode, 503);
  assert.deepEqual(readJson(unconfiguredImporterResponse.body), {
    message: "Result import is not configured."
  });
  assert.equal(syncResponse.statusCode, 200);
  assert.equal(syncBody.ok, true);
  assert.equal(syncBody.matchesCreated, 1);
  assert.equal(syncBody.standingsCreated, 1);
  assert.deepEqual(syncBody.finalGroups, ["a"]);
});
