import assert from "node:assert/strict";
import test from "node:test";

import { createFootballDataProvider } from "../src/footballDataProvider.ts";

const createJsonResponse = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    headers: {
      "Content-Type": "application/json"
    },
    status: 200,
    ...init
  });

test("football-data provider parses raw matches and standings responses", async (t) => {
  const originalFetch = globalThis.fetch;
  const requestedUrls: string[] = [];

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async (input, init) => {
    const url = input instanceof URL ? input : new URL(String(input));
    const headers = init?.headers as Record<string, string> | undefined;

    requestedUrls.push(url.toString());
    assert.equal(headers?.["X-Auth-Token"], "test-token");

    if (url.pathname.endsWith("/matches")) {
      return createJsonResponse({
        matches: [
          {
            awayTeam: {
              name: "South Africa"
            },
            homeTeam: {
              name: "Mexico"
            },
            id: 1001,
            lastUpdated: "2026-06-11T21:15:00Z",
            score: {
              fullTime: {
                away: 1,
                home: 2
              }
            },
            status: "FINISHED"
          },
          {
            awayTeam: {
              name: "Czechia"
            },
            homeTeam: {
              name: "Korea Republic"
            },
            id: 1002,
            score: {
              fullTime: {
                away: null,
                home: null
              }
            },
            status: "TIMED"
          }
        ]
      });
    }

    if (url.pathname.endsWith("/standings")) {
      return createJsonResponse({
        standings: [
          {
            group: "GROUP_A",
            table: [
              {
                position: 1,
                team: {
                  name: "Mexico"
                }
              },
              {
                position: 2,
                team: {
                  name: "South Africa"
                }
              },
              {
                position: 3,
                team: {
                  name: "Korea Republic"
                }
              },
              {
                position: 4,
                team: {
                  name: "Czechia"
                }
              }
            ],
            type: "TOTAL"
          },
          {
            group: "GROUP_A",
            table: [
              {
                position: 1,
                team: {
                  name: "Mexico"
                }
              }
            ],
            type: "HOME"
          }
        ]
      });
    }

    return createJsonResponse(
      {
        message: "not found"
      },
      {
        status: 404
      }
    );
  };

  const provider = createFootballDataProvider({
    apiToken: "test-token",
    baseUrl: "https://api.example.test/v4",
    competitionCode: "WC",
    season: "2026"
  });

  const data = await provider.fetchResults();

  assert.deepEqual(
    requestedUrls.map((url) => new URL(url).pathname),
    ["/v4/competitions/WC/matches", "/v4/competitions/WC/standings"]
  );
  assert.deepEqual(
    requestedUrls.map((url) => new URL(url).searchParams.get("season")),
    ["2026", "2026"]
  );
  assert.deepEqual(data.matches, [
    {
      awayTeamName: "South Africa",
      finishedAtIso: "2026-06-11T21:15:00Z",
      homeTeamName: "Mexico",
      providerId: "1001",
      score: {
        away: 1,
        home: 2
      }
    }
  ]);
  assert.deepEqual(data.standings, [
    {
      providerGroupName: "GROUP_A",
      rows: [
        {
          position: 1,
          teamName: "Mexico"
        },
        {
          position: 2,
          teamName: "South Africa"
        },
        {
          position: 3,
          teamName: "Korea Republic"
        },
        {
          position: 4,
          teamName: "Czechia"
        }
      ]
    }
  ]);
  assert.deepEqual(data.warnings, []);
});
