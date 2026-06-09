import "dotenv/config";

import cors from "@fastify/cors";
import Fastify from "fastify";
import { SCORING_RULES, type ApiMeta } from "@footballvanga/shared";

import { readConfig } from "./config.js";

export const buildServer = async () => {
  const app = Fastify({
    logger: true
  });

  await app.register(cors, {
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

  return app;
};

const config = readConfig();
const server = await buildServer();

try {
  await server.listen({
    host: config.host,
    port: config.port
  });
} catch (error) {
  server.log.error(error);
  process.exit(1);
}

