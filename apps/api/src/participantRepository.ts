import type { ParticipantSummary, PredictionStatus } from "@footballvanga/shared";

import type { DatabasePool } from "./database.js";

export type ParticipantRecord = {
  codeHash: string;
  displayName: string;
  id: string;
};

export type ParticipantRepository = {
  createParticipant: (input: { codeHash: string; displayName: string; roomId: string }) => Promise<ParticipantSummary>;
  createParticipantSession: (input: {
    expiresAt: Date;
    participantId: string;
    tokenHash: string;
  }) => Promise<void>;
  getParticipantByDisplayName: (input: {
    displayName: string;
    roomId: string;
  }) => Promise<ParticipantRecord | null>;
  getParticipantBySessionTokenHash: (input: {
    roomId: string;
    tokenHash: string;
  }) => Promise<ParticipantSummary | null>;
  listParticipants: (roomId: string) => Promise<ParticipantSummary[]>;
};

export class ParticipantDisplayNameAlreadyTakenError extends Error {
  constructor() {
    super("Participant display name is already taken.");
    this.name = "ParticipantDisplayNameAlreadyTakenError";
  }
}

type ParticipantRow = {
  display_name: string;
  exact_score_hits: number | null;
  id: string;
  prediction_status: PredictionStatus;
  total_score: number | null;
};

const toParticipantSummary = (row: ParticipantRow): ParticipantSummary => ({
  displayName: row.display_name,
  exactScoreHits: row.exact_score_hits ?? 0,
  id: row.id,
  predictionStatus: row.prediction_status,
  totalScore: row.total_score ?? 0
});

const participantPredictionStatusSql = `
  CASE
    WHEN participants.prediction_submitted_at IS NULL THEN 'empty'
    WHEN (
      SELECT COUNT(*)
      FROM participant_group_predictions
      WHERE participant_group_predictions.participant_id = participants.id
    ) = (SELECT COUNT(*) FROM teams)
      AND (
        SELECT COUNT(*)
        FROM participant_match_predictions
        WHERE participant_match_predictions.participant_id = participants.id
      ) = (SELECT COUNT(*) FROM matches)
      THEN 'saved'
    ELSE 'draft'
  END AS prediction_status
`;

type DatabaseErrorLike = {
  code?: string;
  constraint?: string;
};

const isDatabaseErrorLike = (error: unknown): error is DatabaseErrorLike =>
  typeof error === "object" && error !== null;

const isParticipantDisplayNameUniqueViolation = (error: unknown) =>
  isDatabaseErrorLike(error) &&
  error.code === "23505" &&
  error.constraint === "participants_room_display_name_unique";

export const isParticipantDisplayNameAlreadyTakenError = (
  error: unknown
): error is ParticipantDisplayNameAlreadyTakenError => error instanceof ParticipantDisplayNameAlreadyTakenError;

export const createParticipantRepository = (pool: DatabasePool): ParticipantRepository => {
  const listParticipants = async (roomId: string) => {
    const result = await pool.query<ParticipantRow>(
      `
        SELECT
          participants.id,
          participants.display_name,
          COALESCE(score_snapshots.total_points, 0) AS total_score,
          COALESCE(score_snapshots.exact_score_hits, 0) AS exact_score_hits,
          ${participantPredictionStatusSql}
        FROM participants
        LEFT JOIN score_snapshots ON score_snapshots.participant_id = participants.id
        WHERE participants.room_id = $1
        ORDER BY participants.created_at ASC
      `,
      [roomId]
    );

    return result.rows.map(toParticipantSummary);
  };

  const createParticipant: ParticipantRepository["createParticipant"] = async ({ codeHash, displayName, roomId }) => {
    const result = await pool
      .query<ParticipantRow>(
        `
          INSERT INTO participants (room_id, display_name, code_hash)
          VALUES ($1, $2, $3)
          RETURNING id, display_name, 0 AS total_score, 0 AS exact_score_hits, 'empty' AS prediction_status
        `,
        [roomId, displayName, codeHash]
      )
      .catch((error: unknown) => {
        if (isParticipantDisplayNameUniqueViolation(error)) {
          throw new ParticipantDisplayNameAlreadyTakenError();
        }

        throw error;
      });
    const participant = result.rows[0];

    if (!participant) {
      throw new Error("Participant was not created.");
    }

    return toParticipantSummary(participant);
  };

  const createParticipantSession: ParticipantRepository["createParticipantSession"] = async ({
    expiresAt,
    participantId,
    tokenHash
  }) => {
    await pool.query(
      `
        INSERT INTO participant_sessions (participant_id, token_hash, expires_at)
        VALUES ($1, $2, $3)
      `,
      [participantId, tokenHash, expiresAt]
    );
  };

  const getParticipantByDisplayName: ParticipantRepository["getParticipantByDisplayName"] = async ({
    displayName,
    roomId
  }) => {
    const result = await pool.query<{ code_hash: string; display_name: string; id: string }>(
      `
        SELECT id, display_name, code_hash
        FROM participants
        WHERE room_id = $1 AND lower(display_name) = lower($2)
      `,
      [roomId, displayName]
    );
    const participant = result.rows[0];

    return participant
      ? {
          codeHash: participant.code_hash,
          displayName: participant.display_name,
          id: participant.id
        }
      : null;
  };

  const getParticipantBySessionTokenHash: ParticipantRepository["getParticipantBySessionTokenHash"] = async ({
    roomId,
    tokenHash
  }) => {
    const result = await pool.query<ParticipantRow>(
      `
        SELECT
          participants.id,
          participants.display_name,
          COALESCE(score_snapshots.total_points, 0) AS total_score,
          COALESCE(score_snapshots.exact_score_hits, 0) AS exact_score_hits,
          ${participantPredictionStatusSql}
        FROM participant_sessions
        JOIN participants ON participants.id = participant_sessions.participant_id
        LEFT JOIN score_snapshots ON score_snapshots.participant_id = participants.id
        WHERE participants.room_id = $1
          AND participant_sessions.token_hash = $2
          AND participant_sessions.revoked_at IS NULL
          AND participant_sessions.expires_at > now()
      `,
      [roomId, tokenHash]
    );
    const participant = result.rows[0];

    if (!participant) {
      return null;
    }

    await pool.query("UPDATE participant_sessions SET last_used_at = now() WHERE token_hash = $1", [tokenHash]);

    return toParticipantSummary(participant);
  };

  return {
    createParticipant,
    createParticipantSession,
    getParticipantByDisplayName,
    getParticipantBySessionTokenHash,
    listParticipants
  };
};
