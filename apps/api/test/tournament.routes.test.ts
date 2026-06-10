import assert from "node:assert/strict";
import test from "node:test";

import type { TournamentData } from "@footballvanga/shared";

import { buildServer } from "../src/index.ts";

const baseConfig = {
  host: "localhost",
  nodeEnv: "test",
  port: 4100
};

const readJson = <ResponseBody>(body: string) => JSON.parse(body) as ResponseBody;

test("GET /api/tournament returns backend-owned World Cup group-stage data", async (t) => {
  const app = await buildServer(baseConfig);

  t.after(async () => {
    await app.close();
  });

  const response = await app.inject({
    method: "GET",
    url: "/api/tournament"
  });
  const tournament = readJson<TournamentData>(response.body);
  const teams = tournament.groups.flatMap((group) => group.teams);

  assert.equal(response.statusCode, 200);
  assert.equal(tournament.deadlineIso, "2026-06-11T19:00:00.000Z");
  assert.equal(tournament.groups.length, 12);
  assert.equal(teams.length, 48);
  assert.equal(tournament.matches.length, 72);
  assert.deepEqual(tournament.groups[0], {
    id: "a",
    name: "Группа A",
    teams: [
      { groupId: "a", id: "mexico", name: "Mexico" },
      { groupId: "a", id: "south-africa", name: "South Africa" },
      { groupId: "a", id: "korea-republic", name: "Korea Republic" },
      { groupId: "a", id: "czechia", name: "Czechia" }
    ]
  });
  assert.deepEqual(tournament.matches[0], {
    awayTeamId: "south-africa",
    groupId: "a",
    homeTeamId: "mexico",
    id: "a-1",
    startsAtIso: "2026-06-11T19:00:00Z",
    venue: "Estadio Azteca, Mexico City"
  });
});
