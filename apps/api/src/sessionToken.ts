import { createHash, randomBytes } from "node:crypto";

const PARTICIPANT_SESSION_TOKEN_BYTE_LENGTH = 32;
export const PARTICIPANT_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

export const createParticipantSessionToken = () =>
  randomBytes(PARTICIPANT_SESSION_TOKEN_BYTE_LENGTH).toString("base64url");

export const hashParticipantSessionToken = (token: string) =>
  createHash("sha256").update(token, "utf8").digest("base64url");

export const getParticipantSessionExpiresAt = (now = new Date()) =>
  new Date(now.getTime() + PARTICIPANT_SESSION_TTL_MS);
