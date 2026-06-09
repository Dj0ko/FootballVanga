import { SCORING_RULES, type ParticipantSummary, type PredictionStatus } from "@footballvanga/shared";

import type { DatabasePool } from "./database.js";

export type ScoringRecalculationResult = {
  recalculatedParticipants: number;
};

export type ScoringRepository = {
  listRoomLeaderboard: (roomId: string) => Promise<ParticipantSummary[]>;
  recalculateScores: () => Promise<ScoringRecalculationResult>;
};

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

export const createScoringRepository = (pool: DatabasePool): ScoringRepository => {
  const listRoomLeaderboard: ScoringRepository["listRoomLeaderboard"] = async (roomId) => {
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
        ORDER BY
          COALESCE(score_snapshots.total_points, 0) DESC,
          COALESCE(score_snapshots.exact_score_hits, 0) DESC,
          participants.created_at ASC
      `,
      [roomId]
    );

    return result.rows.map(toParticipantSummary);
  };

  const recalculateScores: ScoringRepository["recalculateScores"] = async () => {
    const result = await pool.query<{ participant_id: string }>(
      `
        WITH group_scores AS (
          SELECT
            participant_group_predictions.participant_id,
            COUNT(*)::integer * $1::integer AS group_standing_points
          FROM participant_group_predictions
          JOIN group_standing_results
            ON group_standing_results.group_id = participant_group_predictions.group_id
            AND group_standing_results.team_id = participant_group_predictions.team_id
          WHERE group_standing_results.position = participant_group_predictions.position
          GROUP BY participant_group_predictions.participant_id
        ),
        match_scores AS (
          SELECT
            participant_match_predictions.participant_id,
            COALESCE(
              SUM(
                CASE
                  WHEN (
                    participant_match_predictions.home_score > participant_match_predictions.away_score
                    AND match_results.home_score > match_results.away_score
                  )
                    OR (
                      participant_match_predictions.home_score < participant_match_predictions.away_score
                      AND match_results.home_score < match_results.away_score
                    )
                    OR (
                      participant_match_predictions.home_score = participant_match_predictions.away_score
                      AND match_results.home_score = match_results.away_score
                    )
                    THEN $2::integer
                  ELSE 0
                END
              ),
              0
            )::integer AS match_outcome_points,
            COALESCE(
              SUM(
                CASE
                  WHEN participant_match_predictions.home_score = match_results.home_score
                    AND participant_match_predictions.away_score = match_results.away_score
                    THEN $3::integer
                  ELSE 0
                END
              ),
              0
            )::integer AS exact_score_points,
            COUNT(*) FILTER (
              WHERE participant_match_predictions.home_score = match_results.home_score
                AND participant_match_predictions.away_score = match_results.away_score
            )::integer AS exact_score_hits
          FROM participant_match_predictions
          JOIN match_results ON match_results.match_id = participant_match_predictions.match_id
          GROUP BY participant_match_predictions.participant_id
        ),
        participant_scores AS (
          SELECT
            participants.id AS participant_id,
            participants.room_id,
            COALESCE(group_scores.group_standing_points, 0) AS group_standing_points,
            COALESCE(match_scores.match_outcome_points, 0) AS match_outcome_points,
            COALESCE(match_scores.exact_score_points, 0) AS exact_score_points,
            COALESCE(match_scores.exact_score_hits, 0) AS exact_score_hits
          FROM participants
          LEFT JOIN group_scores ON group_scores.participant_id = participants.id
          LEFT JOIN match_scores ON match_scores.participant_id = participants.id
        )
        INSERT INTO score_snapshots (
          participant_id,
          room_id,
          group_standing_points,
          match_outcome_points,
          exact_score_points,
          exact_score_hits,
          calculated_at
        )
        SELECT
          participant_id,
          room_id,
          group_standing_points,
          match_outcome_points,
          exact_score_points,
          exact_score_hits,
          now()
        FROM participant_scores
        ON CONFLICT (participant_id) DO UPDATE SET
          room_id = EXCLUDED.room_id,
          group_standing_points = EXCLUDED.group_standing_points,
          match_outcome_points = EXCLUDED.match_outcome_points,
          exact_score_points = EXCLUDED.exact_score_points,
          exact_score_hits = EXCLUDED.exact_score_hits,
          calculated_at = now()
        RETURNING participant_id
      `,
      [SCORING_RULES.exactGroupPlace, SCORING_RULES.matchOutcome, SCORING_RULES.exactScore]
    );

    return {
      recalculatedParticipants: result.rowCount ?? result.rows.length
    };
  };

  return {
    listRoomLeaderboard,
    recalculateScores
  };
};
