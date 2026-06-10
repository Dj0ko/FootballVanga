import "dotenv/config";

import { pathToFileURL } from "node:url";

import cors from "@fastify/cors";
import Fastify from "fastify";
import {
  SCORING_RULES,
  type ApiMeta,
  type GroupStandingPrediction,
  type MatchPrediction,
  type ParticipantSession,
  type ParticipantSummary
} from "@footballvanga/shared";

import {
  createAdminSessionCookie,
  createClearAdminSessionCookie,
  isAdminSessionValid,
  verifyAdminPassword
} from "./adminAuth.js";
import { type ApiConfig, readConfig } from "./config.js";
import { createDatabasePool } from "./database.js";
import { createFootballDataProvider } from "./footballDataProvider.js";
import { createGroupStandingResultRepository, type GroupStandingResultRepository } from "./groupStandingResultRepository.js";
import { createInMemoryGroupStandingResultRepository } from "./inMemoryGroupStandingResultRepository.js";
import { createInMemoryMatchResultRepository } from "./inMemoryMatchResultRepository.js";
import { createInMemoryParticipantRepository } from "./inMemoryParticipantRepository.js";
import { createInMemoryPredictionRepository } from "./inMemoryPredictionRepository.js";
import { createInMemoryFootballStore, createInMemoryRoomRepository } from "./inMemoryRoomRepository.js";
import { createInMemoryScoringRepository } from "./inMemoryScoringRepository.js";
import { createMatchResultRepository, type MatchResultRepository } from "./matchResultRepository.js";
import {
  createParticipantRepository,
  isParticipantDisplayNameAlreadyTakenError,
  type ParticipantRecord,
  type ParticipantRepository
} from "./participantRepository.js";
import { hashPassword, verifyPassword } from "./passwordHash.js";
import { createPredictionRepository, type PredictionRepository } from "./predictionRepository.js";
import { createResultImporter } from "./resultImporter.js";
import type { ResultImporter } from "./resultImportTypes.js";
import { createRoomRepository, type RoomRepository } from "./roomRepository.js";
import { createScoringRepository, type ScoringRepository } from "./scoringRepository.js";
import {
  createParticipantSessionToken,
  getParticipantSessionExpiresAt,
  hashParticipantSessionToken
} from "./sessionToken.js";
import {
  createStaticTournamentRepository,
  createTournamentRepository,
  type TournamentRepository
} from "./tournamentRepository.js";
import type { TournamentPredictionMetadata } from "./tournamentMetadata.js";

type AdminLoginBody = {
  password?: string;
};

type AdminResultBody = {
  away?: number;
  home?: number;
};

type AdminGroupStandingsBody = {
  standings?: unknown;
};

type CreateRoomBody = {
  name?: string;
  password?: string;
};

type EnterRoomBody = {
  password?: string;
};

type EnterParticipantBody = {
  code?: string;
  displayName?: string;
  roomPassword?: string;
};

type SavePredictionBody = {
  groupStandings?: unknown;
  matchScores?: unknown;
};

type GlobalLeaderboardQuery = {
  limit?: string;
};

type BuildServerDependencies = {
  groupStandingResultRepository?: GroupStandingResultRepository | null;
  matchResultRepository?: MatchResultRepository | null;
  participantRepository?: ParticipantRepository | null;
  predictionRepository?: PredictionRepository | null;
  resultImporter?: ResultImporter | null;
  roomRepository?: RoomRepository | null;
  scoringRepository?: ScoringRepository | null;
  tournamentRepository?: TournamentRepository | null;
};

const isScoreValue = (value: unknown): value is number =>
  Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 99;

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const MIN_ROOM_PASSWORD_LENGTH = 4;
const MIN_PARTICIPANT_CODE_LENGTH = 4;
const DEFAULT_GLOBAL_LEADERBOARD_LIMIT = 5;
const MAX_GLOBAL_LEADERBOARD_LIMIT = 50;

const isAdminConfigured = (config: ApiConfig) => Boolean(config.adminPasswordHash && config.adminSessionSecret);

const hasAdminSession = (config: ApiConfig, cookieHeader: string | undefined) =>
  Boolean(
    config.adminSessionSecret &&
      isAdminSessionValid({
        cookieHeader,
        sessionSecret: config.adminSessionSecret
      })
  );

const getBearerToken = (authorizationHeader: string | undefined) => {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(" ");

  return scheme?.toLocaleLowerCase("en-US") === "bearer" && token ? token : null;
};

const toExistingParticipantSummary = (participant: ParticipantRecord): ParticipantSummary => ({
  displayName: participant.displayName,
  exactScoreHits: 0,
  id: participant.id,
  predictionStatus: "empty",
  totalScore: 0
});

const getAuthenticatedParticipant = async (
  participantRepository: ParticipantRepository,
  roomId: string,
  authorizationHeader: string | undefined
) => {
  const token = getBearerToken(authorizationHeader);

  if (!token) {
    return null;
  }

  return participantRepository.getParticipantBySessionTokenHash({
    roomId,
    tokenHash: hashParticipantSessionToken(token)
  });
};

const isPredictionLocked = (deadlineIso: string | null) =>
  deadlineIso ? Date.now() >= Date.parse(deadlineIso) : false;

const getGlobalLeaderboardLimit = (limit: string | undefined) => {
  const parsedLimit = Number(limit);

  if (!Number.isInteger(parsedLimit) || parsedLimit <= 0) {
    return DEFAULT_GLOBAL_LEADERBOARD_LIMIT;
  }

  return Math.min(parsedLimit, MAX_GLOBAL_LEADERBOARD_LIMIT);
};

const validatePredictionBody = (
  body: SavePredictionBody,
  metadata: TournamentPredictionMetadata
):
  | {
      groupStandings: GroupStandingPrediction[];
      matchScores: MatchPrediction[];
    }
  | {
      message: string;
    } => {
  if (!Array.isArray(body.groupStandings) || !Array.isArray(body.matchScores)) {
    return {
      message: "Prediction group standings and match scores are required."
    };
  }

  const groupStandings: GroupStandingPrediction[] = [];
  const groupTeamKeys = new Set<string>();
  const groupPositionKeys = new Set<string>();

  for (const standing of body.groupStandings) {
    if (!isObjectRecord(standing)) {
      return {
        message: "Prediction group standings are invalid."
      };
    }

    const groupId = standing.groupId;
    const teamId = standing.teamId;
    const position = standing.position;

    if (
      typeof groupId !== "string" ||
      typeof teamId !== "string" ||
      typeof position !== "number" ||
      !Number.isInteger(position)
    ) {
      return {
        message: "Prediction group standings are invalid."
      };
    }

    const groupTeamIds = metadata.groupTeamIds[groupId];

    if (!groupTeamIds || !groupTeamIds.includes(teamId) || position < 1 || position > groupTeamIds.length) {
      return {
        message: "Prediction group standings are invalid."
      };
    }

    const groupTeamKey = `${groupId}:${teamId}`;
    const groupPositionKey = `${groupId}:${position}`;

    if (groupTeamKeys.has(groupTeamKey) || groupPositionKeys.has(groupPositionKey)) {
      return {
        message: "Prediction group standings contain duplicates."
      };
    }

    groupTeamKeys.add(groupTeamKey);
    groupPositionKeys.add(groupPositionKey);
    groupStandings.push({
      groupId,
      position,
      teamId
    });
  }

  const matchIds = new Set(metadata.matchIds);
  const seenMatchIds = new Set<string>();
  const matchScores: MatchPrediction[] = [];

  for (const matchScore of body.matchScores) {
    if (!isObjectRecord(matchScore) || !isObjectRecord(matchScore.score)) {
      return {
        message: "Prediction match scores are invalid."
      };
    }

    const matchId = matchScore.matchId;
    const { away, home } = matchScore.score;

    if (typeof matchId !== "string" || !matchIds.has(matchId) || !isScoreValue(home) || !isScoreValue(away)) {
      return {
        message: "Prediction match scores are invalid."
      };
    }

    if (seenMatchIds.has(matchId)) {
      return {
        message: "Prediction match scores contain duplicates."
      };
    }

    seenMatchIds.add(matchId);
    matchScores.push({
      matchId,
      score: {
        away,
        home
      }
    });
  }

  return {
    groupStandings,
    matchScores
  };
};

const validateGroupStandingResultsBody = (
  body: AdminGroupStandingsBody,
  input: {
    groupId: string;
    teamIds: string[];
  }
):
  | {
      standings: GroupStandingPrediction[];
    }
  | {
      message: string;
    } => {
  if (!Array.isArray(body.standings)) {
    return {
      message: "Group standings are required."
    };
  }

  if (body.standings.length !== input.teamIds.length) {
    return {
      message: "Group standings must include every team in the group."
    };
  }

  const teamIds = new Set(input.teamIds);
  const seenTeamIds = new Set<string>();
  const seenPositions = new Set<number>();
  const standings: GroupStandingPrediction[] = [];

  for (const standing of body.standings) {
    if (!isObjectRecord(standing)) {
      return {
        message: "Group standings are invalid."
      };
    }

    const teamId = standing.teamId;
    const position = standing.position;

    if (typeof teamId !== "string" || typeof position !== "number" || !Number.isInteger(position)) {
      return {
        message: "Group standings are invalid."
      };
    }

    if (!teamIds.has(teamId) || position < 1 || position > input.teamIds.length) {
      return {
        message: "Group standings are invalid."
      };
    }

    if (seenTeamIds.has(teamId) || seenPositions.has(position)) {
      return {
        message: "Group standings contain duplicates."
      };
    }

    seenTeamIds.add(teamId);
    seenPositions.add(position);
    standings.push({
      groupId: input.groupId,
      position,
      teamId
    });
  }

  return {
    standings: standings.sort((leftStanding, rightStanding) => leftStanding.position - rightStanding.position)
  };
};

const createParticipantSession = async (
  participantRepository: ParticipantRepository,
  participant: ParticipantSummary
): Promise<ParticipantSession> => {
  const token = createParticipantSessionToken();
  const expiresAt = getParticipantSessionExpiresAt();

  await participantRepository.createParticipantSession({
    expiresAt,
    participantId: participant.id,
    tokenHash: hashParticipantSessionToken(token)
  });

  return {
    expiresAtIso: expiresAt.toISOString(),
    participantId: participant.id,
    token
  };
};

export const buildServer = async (config: ApiConfig = readConfig(), dependencies: BuildServerDependencies = {}) => {
  const shouldCreateStorage =
    dependencies.groupStandingResultRepository === undefined &&
    dependencies.matchResultRepository === undefined &&
    dependencies.roomRepository === undefined &&
    dependencies.participantRepository === undefined &&
    dependencies.predictionRepository === undefined &&
    dependencies.scoringRepository === undefined &&
    dependencies.tournamentRepository === undefined;
  const shouldCreateDatabasePool = shouldCreateStorage;
  const databasePool = shouldCreateDatabasePool && config.databaseUrl ? createDatabasePool(config.databaseUrl) : null;
  const inMemoryStore = shouldCreateStorage && !databasePool ? createInMemoryFootballStore() : null;
  const roomRepository = shouldCreateStorage
    ? databasePool
      ? createRoomRepository(databasePool)
      : createInMemoryRoomRepository({ store: inMemoryStore ?? undefined })
    : null;
  const participantRepository = shouldCreateStorage
    ? databasePool
      ? createParticipantRepository(databasePool)
      : inMemoryStore
        ? createInMemoryParticipantRepository(inMemoryStore)
        : null
    : null;
  const predictionRepository = shouldCreateStorage
    ? databasePool
      ? createPredictionRepository(databasePool)
      : inMemoryStore
        ? createInMemoryPredictionRepository(inMemoryStore)
        : null
    : null;
  const matchResultRepository = shouldCreateStorage
    ? databasePool
      ? createMatchResultRepository(databasePool)
      : inMemoryStore
        ? createInMemoryMatchResultRepository(inMemoryStore)
        : null
    : null;
  const groupStandingResultRepository = shouldCreateStorage
    ? databasePool
      ? createGroupStandingResultRepository(databasePool)
      : inMemoryStore
        ? createInMemoryGroupStandingResultRepository(inMemoryStore)
        : null
    : null;
  const scoringRepository = shouldCreateStorage
    ? databasePool
      ? createScoringRepository(databasePool)
      : inMemoryStore
        ? createInMemoryScoringRepository(inMemoryStore)
        : null
    : null;
  const tournamentRepository = shouldCreateStorage
    ? databasePool
      ? createTournamentRepository(databasePool)
      : createStaticTournamentRepository()
    : null;
  const resolvedMatchResultRepository =
    dependencies.matchResultRepository === undefined ? matchResultRepository : dependencies.matchResultRepository;
  const resolvedGroupStandingResultRepository =
    dependencies.groupStandingResultRepository === undefined
      ? groupStandingResultRepository
      : dependencies.groupStandingResultRepository;
  const resolvedRoomRepository = dependencies.roomRepository === undefined ? roomRepository : dependencies.roomRepository;
  const resolvedParticipantRepository =
    dependencies.participantRepository === undefined ? participantRepository : dependencies.participantRepository;
  const resolvedPredictionRepository =
    dependencies.predictionRepository === undefined ? predictionRepository : dependencies.predictionRepository;
  const resolvedScoringRepository =
    dependencies.scoringRepository === undefined ? scoringRepository : dependencies.scoringRepository;
  const resolvedTournamentRepository =
    dependencies.tournamentRepository === undefined ? tournamentRepository : dependencies.tournamentRepository;
  const resolvedResultImporter =
    dependencies.resultImporter === undefined
      ? config.footballDataApiToken &&
        resolvedTournamentRepository &&
        resolvedMatchResultRepository &&
        resolvedGroupStandingResultRepository
        ? createResultImporter({
            groupStandingResultRepository: resolvedGroupStandingResultRepository,
            matchResultRepository: resolvedMatchResultRepository,
            provider: createFootballDataProvider({
              apiToken: config.footballDataApiToken,
              baseUrl: config.footballDataBaseUrl,
              competitionCode: config.footballDataCompetitionCode,
              season: config.footballDataSeason
            }),
            scoringRepository: resolvedScoringRepository,
            tournamentRepository: resolvedTournamentRepository
          })
        : null
      : dependencies.resultImporter;
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

  app.get("/api/tournament", async (_request, reply) => {
    if (!resolvedTournamentRepository) {
      reply.code(503);
      return {
        message: "Tournament data is not configured."
      };
    }

    return resolvedTournamentRepository.getTournament();
  });

  app.get<{ Querystring: GlobalLeaderboardQuery }>("/api/leaderboard/global", async (request, reply) => {
    if (!resolvedScoringRepository) {
      reply.code(503);
      return {
        message: "Leaderboard storage is not configured."
      };
    }

    return {
      leaderboard: await resolvedScoringRepository.listGlobalLeaderboard(
        getGlobalLeaderboardLimit(request.query.limit)
      )
    };
  });

  app.get<{ Params: { participantId: string; roomId: string } }>(
    "/api/leaderboard/global/:roomId/predictions/:participantId",
    async (request, reply) => {
      if (!resolvedPredictionRepository || !resolvedScoringRepository) {
        reply.code(503);
        return {
          message: "Prediction storage is not configured."
        };
      }

      const metadata = await resolvedPredictionRepository.getTournamentMetadata();

      if (!metadata.deadlineIso) {
        reply.code(503);
        return {
          message: "Prediction deadline is not configured."
        };
      }

      if (!isPredictionLocked(metadata.deadlineIso)) {
        reply.code(423);
        return {
          message: "Прогнозы лидеров откроются после дедлайна."
        };
      }

      const leaderboard = await resolvedScoringRepository.listGlobalLeaderboard(DEFAULT_GLOBAL_LEADERBOARD_LIMIT);
      const isCurrentGlobalLeader = leaderboard.some(
        (leader) =>
          leader.roomId === request.params.roomId && leader.participantId === request.params.participantId
      );

      if (!isCurrentGlobalLeader) {
        reply.code(404);
        return {
          message: "Leaderboard participant was not found."
        };
      }

      const prediction = await resolvedPredictionRepository.getParticipantPrediction({
        participantId: request.params.participantId,
        roomId: request.params.roomId
      });

      if (!prediction) {
        reply.code(404);
        return {
          message: "Participant was not found."
        };
      }

      return {
        deadlineIso: metadata.deadlineIso,
        isLocked: true,
        prediction
      };
    }
  );

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

    const body = request.body ?? {};
    const name = body.name?.trim() ?? "";
    const password = body.password ?? "";

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

    const body = request.body ?? {};
    const password = body.password ?? "";

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

  app.post<{ Body: EnterParticipantBody; Params: { roomId: string } }>(
    "/api/rooms/:roomId/participants/enter",
    async (request, reply) => {
      if (!resolvedRoomRepository || !resolvedParticipantRepository) {
        reply.code(503);
        return {
          message: "Participant storage is not configured."
        };
      }

      const body = request.body ?? {};
      const displayName = body.displayName?.trim() ?? "";
      const code = body.code ?? "";
      const roomPassword = body.roomPassword ?? "";

      if (!displayName) {
        reply.code(400);
        return {
          message: "Participant display name is required."
        };
      }

      if (code.length < MIN_PARTICIPANT_CODE_LENGTH) {
        reply.code(400);
        return {
          message: `Participant code must be at least ${MIN_PARTICIPANT_CODE_LENGTH} characters.`
        };
      }

      if (roomPassword.length < MIN_ROOM_PASSWORD_LENGTH) {
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

      if (!(await verifyPassword(roomPassword, room.password_hash))) {
        reply.code(401);
        return {
          message: "Invalid room password."
        };
      }

      const existingParticipant = await resolvedParticipantRepository.getParticipantByDisplayName({
        displayName,
        roomId: room.id
      });
      let participant: ParticipantSummary;
      let isCreated = false;

      if (existingParticipant) {
        if (!(await verifyPassword(code, existingParticipant.codeHash))) {
          reply.code(401);
          return {
            message: "Invalid participant code."
          };
        }

        participant = toExistingParticipantSummary(existingParticipant);
      } else {
        try {
          participant = await resolvedParticipantRepository.createParticipant({
            codeHash: await hashPassword(code),
            displayName,
            roomId: room.id
          });
          isCreated = true;
        } catch (error) {
          if (!isParticipantDisplayNameAlreadyTakenError(error)) {
            throw error;
          }

          const conflictingParticipant = await resolvedParticipantRepository.getParticipantByDisplayName({
            displayName,
            roomId: room.id
          });

          if (!conflictingParticipant || !(await verifyPassword(code, conflictingParticipant.codeHash))) {
            reply.code(401);
            return {
              message: "Invalid participant code."
            };
          }

          participant = toExistingParticipantSummary(conflictingParticipant);
        }
      }

      const session = await createParticipantSession(resolvedParticipantRepository, participant);
      const participants = await resolvedParticipantRepository.listParticipants(room.id);
      const currentParticipant = participants.find((currentParticipant) => currentParticipant.id === participant.id);

      reply.code(isCreated ? 201 : 200);
      return {
        participant: currentParticipant ?? participant,
        participants,
        session
      };
    }
  );

  app.get<{ Params: { roomId: string } }>("/api/rooms/:roomId/participants", async (request, reply) => {
    if (!resolvedParticipantRepository) {
      reply.code(503);
      return {
        message: "Participant storage is not configured."
      };
    }

    const token = getBearerToken(request.headers.authorization);

    if (!token) {
      reply.code(401);
      return {
        message: "Participant session is required."
      };
    }

    const participant = await resolvedParticipantRepository.getParticipantBySessionTokenHash({
      roomId: request.params.roomId,
      tokenHash: hashParticipantSessionToken(token)
    });

    if (!participant) {
      reply.code(401);
      return {
        message: "Participant session is required."
      };
    }

    return {
      participant,
      participants: await resolvedParticipantRepository.listParticipants(request.params.roomId)
    };
  });

  app.get<{ Params: { participantId: string; roomId: string } }>(
    "/api/rooms/:roomId/predictions/:participantId",
    async (request, reply) => {
      if (!resolvedParticipantRepository || !resolvedPredictionRepository) {
        reply.code(503);
        return {
          message: "Prediction storage is not configured."
        };
      }

      const participant = await getAuthenticatedParticipant(
        resolvedParticipantRepository,
        request.params.roomId,
        request.headers.authorization
      );

      if (!participant) {
        reply.code(401);
        return {
          message: "Participant session is required."
        };
      }

      const participants = await resolvedParticipantRepository.listParticipants(request.params.roomId);
      const targetParticipant = participants.find(
        (currentParticipant) => currentParticipant.id === request.params.participantId
      );

      if (!targetParticipant) {
        reply.code(404);
        return {
          message: "Participant was not found."
        };
      }

      const [prediction, metadata] = await Promise.all([
        resolvedPredictionRepository.getParticipantPrediction({
          participantId: targetParticipant.id,
          roomId: request.params.roomId
        }),
        resolvedPredictionRepository.getTournamentMetadata()
      ]);

      if (!prediction) {
        reply.code(404);
        return {
          message: "Participant was not found."
        };
      }

      return {
        deadlineIso: metadata.deadlineIso,
        isLocked: isPredictionLocked(metadata.deadlineIso),
        prediction
      };
    }
  );

  app.put<{ Body: SavePredictionBody; Params: { roomId: string } }>(
    "/api/rooms/:roomId/predictions/me",
    async (request, reply) => {
      if (!resolvedParticipantRepository || !resolvedPredictionRepository) {
        reply.code(503);
        return {
          message: "Prediction storage is not configured."
        };
      }

      const participant = await getAuthenticatedParticipant(
        resolvedParticipantRepository,
        request.params.roomId,
        request.headers.authorization
      );

      if (!participant) {
        reply.code(401);
        return {
          message: "Participant session is required."
        };
      }

      const metadata = await resolvedPredictionRepository.getTournamentMetadata();

      if (!metadata.deadlineIso) {
        reply.code(503);
        return {
          message: "Prediction deadline is not configured."
        };
      }

      if (isPredictionLocked(metadata.deadlineIso)) {
        reply.code(423);
        return {
          message: "Prediction deadline has passed."
        };
      }

      const validationResult = validatePredictionBody(request.body ?? {}, metadata);

      if ("message" in validationResult) {
        reply.code(400);
        return {
          message: validationResult.message
        };
      }

      const prediction = await resolvedPredictionRepository.saveParticipantPrediction({
        groupStandings: validationResult.groupStandings,
        matchScores: validationResult.matchScores,
        participantId: participant.id,
        roomId: request.params.roomId
      });

      if (!prediction) {
        reply.code(404);
        return {
          message: "Participant was not found."
        };
      }

      if (resolvedScoringRepository) {
        await resolvedScoringRepository.recalculateScores();
      }

      return {
        deadlineIso: metadata.deadlineIso,
        isLocked: false,
        prediction
      };
    }
  );

  app.get<{ Params: { roomId: string } }>("/api/rooms/:roomId/leaderboard", async (request, reply) => {
    if (!resolvedParticipantRepository || !resolvedScoringRepository) {
      reply.code(503);
      return {
        message: "Leaderboard storage is not configured."
      };
    }

    const participant = await getAuthenticatedParticipant(
      resolvedParticipantRepository,
      request.params.roomId,
      request.headers.authorization
    );

    if (!participant) {
      reply.code(401);
      return {
        message: "Participant session is required."
      };
    }

    return {
      leaderboard: await resolvedScoringRepository.listRoomLeaderboard(request.params.roomId)
    };
  });

  app.get("/api/match-history", async (_request, reply) => {
    if (!resolvedMatchResultRepository) {
      reply.code(503);
      return {
        message: "Match result storage is not configured."
      };
    }

    return {
      results: await resolvedMatchResultRepository.listMatchResults()
    };
  });

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

    const body = request.body ?? {};
    const password = body.password;

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

  app.get("/api/admin/group-standings", async (request, reply) => {
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

    if (!resolvedGroupStandingResultRepository) {
      reply.code(503);
      return {
        message: "Group standing result storage is not configured."
      };
    }

    return {
      standings: await resolvedGroupStandingResultRepository.listGroupStandingResults()
    };
  });

  app.put<{ Body: AdminGroupStandingsBody; Params: { groupId: string } }>(
    "/api/admin/groups/:groupId/standings",
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

      if (!resolvedGroupStandingResultRepository || !resolvedPredictionRepository) {
        reply.code(503);
        return {
          message: "Group standing result storage is not configured."
        };
      }

      const metadata = await resolvedPredictionRepository.getTournamentMetadata();
      const teamIds = metadata.groupTeamIds[request.params.groupId];

      if (!teamIds) {
        reply.code(404);
        return {
          message: "Group was not found."
        };
      }

      const validationResult = validateGroupStandingResultsBody(request.body ?? {}, {
        groupId: request.params.groupId,
        teamIds
      });

      if ("message" in validationResult) {
        reply.code(400);
        return {
          message: validationResult.message
        };
      }

      const standings = await resolvedGroupStandingResultRepository.saveGroupStandingResults({
        groupId: request.params.groupId,
        standings: validationResult.standings
      });

      if (!standings) {
        reply.code(404);
        return {
          message: "Group was not found."
        };
      }

      if (resolvedScoringRepository) {
        await resolvedScoringRepository.recalculateScores();
      }

      return {
        ok: true,
        standings
      };
    }
  );

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

      if (!resolvedMatchResultRepository) {
        reply.code(503);
        return {
          message: "Match result storage is not configured."
        };
      }

      const { away, home } = request.body ?? {};

      if (!isScoreValue(home) || !isScoreValue(away)) {
        reply.code(400);
        return {
          message: "Scores must be integers from 0 to 99."
        };
      }

      const result = await resolvedMatchResultRepository.saveMatchResult({
        matchId: request.params.matchId,
        score: {
          away,
          home
        }
      });

      if (!result) {
        reply.code(404);
        return {
          message: "Match was not found."
        };
      }

      if (resolvedScoringRepository) {
        await resolvedScoringRepository.recalculateScores();
      }

      return {
        ok: true,
        result
      };
    }
  );

  app.post("/api/admin/results/sync", async (request, reply) => {
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

    if (!resolvedResultImporter) {
      reply.code(503);
      return {
        message: "Result import is not configured."
      };
    }

    const summary = await resolvedResultImporter.syncResults();

    if (summary.status === "failed") {
      reply.code(502);
      return {
        ...summary,
        ok: false
      };
    }

    return {
      ...summary,
      ok: true
    };
  });

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

    if (!resolvedScoringRepository) {
      reply.code(503);
      return {
        message: "Scoring storage is not configured."
      };
    }

    const result = await resolvedScoringRepository.recalculateScores();

    return {
      ...result,
      ok: true,
      stage: "mvp"
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
