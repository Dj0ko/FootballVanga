import "dotenv/config";

import { pathToFileURL } from "node:url";

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
import { createDatabasePool } from "./database.js";
import { createInMemoryRoomRepository } from "./inMemoryRoomRepository.js";
import { hashPassword, verifyPassword } from "./passwordHash.js";
import { createRoomRepository, type RoomRepository } from "./roomRepository.js";

type AdminLoginBody = {
  password?: string;
};

type AdminResultBody = {
  away?: number;
  home?: number;
};

type CreateRoomBody = {
  name?: string;
  password?: string;
};

type EnterRoomBody = {
  password?: string;
};

type MatchResultRecord = {
  finishedAtIso: string;
  matchId: string;
  score: {
    away: number;
    home: number;
  };
};

type BuildServerDependencies = {
  roomRepository?: RoomRepository | null;
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

const MIN_ROOM_PASSWORD_LENGTH = 4;

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

export const buildServer = async (config: ApiConfig = readConfig(), dependencies: BuildServerDependencies = {}) => {
  const shouldCreateDatabasePool = dependencies.roomRepository === undefined;
  const databasePool = shouldCreateDatabasePool && config.databaseUrl ? createDatabasePool(config.databaseUrl) : null;
  const roomRepository = shouldCreateDatabasePool
    ? databasePool
      ? createRoomRepository(databasePool)
      : createInMemoryRoomRepository()
    : null;
  const resolvedRoomRepository =
    dependencies.roomRepository === undefined ? roomRepository : dependencies.roomRepository;
  const app = Fastify({
    logger: config.nodeEnv !== "test"
  });

  if (databasePool) {
    app.addHook("onClose", async () => {
      await databasePool.end();
    });
  }

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

  app.get("/api/rooms", async (_request, reply) => {
    if (!resolvedRoomRepository) {
      reply.code(503);
      return {
        message: "Room storage is not configured."
      };
    }

    return {
      rooms: await resolvedRoomRepository.listRooms()
    };
  });

  app.post<{ Body: CreateRoomBody }>("/api/rooms", async (request, reply) => {
    if (!resolvedRoomRepository) {
      reply.code(503);
      return {
        message: "Room storage is not configured."
      };
    }

    const name = request.body.name?.trim() ?? "";
    const password = request.body.password ?? "";

    if (!name) {
      reply.code(400);
      return {
        message: "Room name is required."
      };
    }

    if (password.length < MIN_ROOM_PASSWORD_LENGTH) {
      reply.code(400);
      return {
        message: `Room password must be at least ${MIN_ROOM_PASSWORD_LENGTH} characters.`
      };
    }

    const room = await resolvedRoomRepository.createRoom({
      name,
      passwordHash: await hashPassword(password)
    });

    reply.code(201);
    return {
      room
    };
  });

  app.post<{ Body: EnterRoomBody; Params: { roomId: string } }>("/api/rooms/:roomId/enter", async (request, reply) => {
    if (!resolvedRoomRepository) {
      reply.code(503);
      return {
        message: "Room storage is not configured."
      };
    }

    const password = request.body.password ?? "";

    if (password.length < MIN_ROOM_PASSWORD_LENGTH) {
      reply.code(400);
      return {
        message: `Room password must be at least ${MIN_ROOM_PASSWORD_LENGTH} characters.`
      };
    }

    const room = await resolvedRoomRepository.getRoomById(request.params.roomId);

    if (!room) {
      reply.code(404);
      return {
        message: "Room was not found."
      };
    }

    if (!(await verifyPassword(password, room.password_hash))) {
      reply.code(401);
      return {
        message: "Invalid room password."
      };
    }

    return {
      ok: true,
      roomId: room.id
    };
  });

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

export const startServer = async (config = readConfig()) => {
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
};

const isMainModule = process.argv[1] ? import.meta.url === pathToFileURL(process.argv[1]).href : false;

if (isMainModule) {
  await startServer();
}
