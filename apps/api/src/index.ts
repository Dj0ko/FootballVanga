import "dotenv/config";

import cors from "@fastify/cors";
import Fastify from "fastify";
import { SCORING_RULES, type ApiMeta } from "@footballvanga/shared";

import {
  createAdminSessionCookie,
  createClearAdminSessionCookie,
  isAdminSessionValid,
  verifyAdminPassword
} from "./adminAuth.js";
import { type ApiConfig, readConfig } from "./config.js";

type AdminLoginBody = {
  password?: string;
};

type AdminResultBody = {
  away?: number;
  home?: number;
};

type MatchResultRecord = {
  finishedAtIso: string;
  matchId: string;
  score: {
    away: number;
    home: number;
  };
};

const matchResultsById = new Map<string, MatchResultRecord>(
  [
    {
      matchId: "a-1",
      finishedAtIso: "2026-06-11T21:00:00Z",
      score: {
        home: 2,
        away: 1
      }
    },
    {
      matchId: "a-2",
      finishedAtIso: "2026-06-12T04:00:00Z",
      score: {
        home: 1,
        away: 1
      }
    },
    {
      matchId: "b-1",
      finishedAtIso: "2026-06-12T21:00:00Z",
      score: {
        home: 0,
        away: 2
      }
    },
    {
      matchId: "d-1",
      finishedAtIso: "2026-06-13T03:00:00Z",
      score: {
        home: 3,
        away: 1
      }
    },
    {
      matchId: "b-2",
      finishedAtIso: "2026-06-13T21:00:00Z",
      score: {
        home: 1,
        away: 0
      }
    }
  ].map((result) => [result.matchId, result])
);

const isScoreValue = (value: unknown): value is number =>
  Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 99;

const getMatchResults = () =>
  Array.from(matchResultsById.values()).sort(
    (leftResult, rightResult) => Date.parse(rightResult.finishedAtIso) - Date.parse(leftResult.finishedAtIso)
  );

const isAdminConfigured = (config: ApiConfig) => Boolean(config.adminPasswordHash && config.adminSessionSecret);

const hasAdminSession = (config: ApiConfig, cookieHeader: string | undefined) =>
  Boolean(
    config.adminSessionSecret &&
      isAdminSessionValid({
        cookieHeader,
        sessionSecret: config.adminSessionSecret
      })
  );

export const buildServer = async (config: ApiConfig = readConfig()) => {
  const app = Fastify({
    logger: true
  });

  await app.register(cors, {
    credentials: true,
    origin: true
  });

  app.get("/health", async () => ({
    service: "footballvanga-api",
    status: "ok"
  }));

  app.get<{ Reply: ApiMeta }>("/api/meta", async () => ({
    productName: "FootballVanga",
    version: "0.1.0",
    stage: "scaffold",
    scoring: SCORING_RULES
  }));

  app.get("/api/rooms", async () => ({
    rooms: []
  }));

  app.get("/api/match-history", async () => ({
    results: getMatchResults()
  }));

  app.get("/api/admin/session", async (request) => ({
    authenticated: hasAdminSession(config, request.headers.cookie),
    configured: isAdminConfigured(config)
  }));

  app.post<{ Body: AdminLoginBody }>("/api/admin/login", async (request, reply) => {
    if (!config.adminPasswordHash || !config.adminSessionSecret) {
      reply.code(503);
      return {
        message: "Admin access is not configured."
      };
    }

    const password = request.body.password;

    if (!password || !(await verifyAdminPassword(password, config.adminPasswordHash))) {
      reply.code(401);
      return {
        message: "Invalid admin password."
      };
    }

    reply.header(
      "Set-Cookie",
      createAdminSessionCookie({
        isSecure: config.nodeEnv === "production",
        sessionSecret: config.adminSessionSecret
      })
    );

    return {
      ok: true
    };
  });

  app.post("/api/admin/logout", async (_request, reply) => {
    reply.header("Set-Cookie", createClearAdminSessionCookie());

    return {
      ok: true
    };
  });

  app.put<{ Body: AdminResultBody; Params: { matchId: string } }>(
    "/api/admin/matches/:matchId/result",
    async (request, reply) => {
      if (!isAdminConfigured(config)) {
        reply.code(503);
        return {
          message: "Admin access is not configured."
        };
      }

      if (!hasAdminSession(config, request.headers.cookie)) {
        reply.code(401);
        return {
          message: "Admin session is required."
        };
      }

      const { away, home } = request.body;

      if (!isScoreValue(home) || !isScoreValue(away)) {
        reply.code(400);
        return {
          message: "Scores must be integers from 0 to 99."
        };
      }

      const previousResult = matchResultsById.get(request.params.matchId);
      const result: MatchResultRecord = {
        matchId: request.params.matchId,
        finishedAtIso: previousResult?.finishedAtIso ?? new Date().toISOString(),
        score: {
          away,
          home
        }
      };

      matchResultsById.set(result.matchId, result);

      return {
        ok: true,
        result
      };
    }
  );

  app.post("/api/admin/scoring/recalculate", async (request, reply) => {
    if (!isAdminConfigured(config)) {
      reply.code(503);
      return {
        message: "Admin access is not configured."
      };
    }

    if (!hasAdminSession(config, request.headers.cookie)) {
      reply.code(401);
      return {
        message: "Admin session is required."
      };
    }

    return {
      ok: true,
      stage: "scaffold"
    };
  });

  return app;
};

const config = readConfig();
const server = await buildServer(config);

try {
  await server.listen({
    host: config.host,
    port: config.port
  });
} catch (error) {
  server.log.error(error);
  process.exit(1);
}
