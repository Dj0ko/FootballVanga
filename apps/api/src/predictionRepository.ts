import type { GroupStandingPrediction, MatchPrediction, ParticipantPrediction } from "@footballvanga/shared";

import type { DatabasePool } from "./database.js";
import type { TournamentPredictionMetadata } from "./tournamentMetadata.js";

export type PredictionSaveInput = {
  groupStandings: GroupStandingPrediction[];
  matchScores: MatchPrediction[];
  participantId: string;
  roomId: string;
};

export type PredictionRepository = {
  getParticipantPrediction: (input: {
    participantId: string;
    roomId: string;
  }) => Promise<ParticipantPrediction | null>;
  getTournamentMetadata: () => Promise<TournamentPredictionMetadata>;
  saveParticipantPrediction: (input: PredictionSaveInput) => Promise<ParticipantPrediction | null>;
};

type DeadlineRow = {
  deadline_at: Date | null;
};

type ParticipantPredictionTimestampRow = {
  prediction_submitted_at: Date | null;
  prediction_updated_at: Date | null;
};

type TeamMetadataRow = {
  group_id: string;
  team_id: string;
};

type MatchMetadataRow = {
  id: string;
};

type GroupStandingPredictionRow = {
  group_id: string;
  position: number;
  team_id: string;
};

type MatchPredictionRow = {
  away_score: number;
  home_score: number;
  match_id: string;
};

const toIsoString = (value: Date | string | null) => {
  if (!value) {
    return null;
  }

  return typeof value === "string" ? new Date(value).toISOString() : value.toISOString();
};

export const createPredictionRepository = (pool: DatabasePool): PredictionRepository => {
  const getTournamentMetadata = async () => {
    const [deadlineResult, teamsResult, matchesResult] = await Promise.all([
      pool.query<DeadlineRow>("SELECT deadline_at FROM tournament_prediction_deadline"),
      pool.query<TeamMetadataRow>(`
        SELECT teams.group_id, teams.id AS team_id
        FROM teams
        JOIN tournament_groups ON tournament_groups.id = teams.group_id
        ORDER BY tournament_groups.display_order ASC, teams.display_order ASC
      `),
      pool.query<MatchMetadataRow>(`
        SELECT id
        FROM matches
        ORDER BY starts_at ASC, display_order ASC
      `)
    ]);
    const groupTeamIds: Record<string, string[]> = {};

    for (const team of teamsResult.rows) {
      groupTeamIds[team.group_id] = [...(groupTeamIds[team.group_id] ?? []), team.team_id];
    }

    return {
      deadlineIso: toIsoString(deadlineResult.rows[0]?.deadline_at ?? null),
      groupTeamIds,
      matchIds: matchesResult.rows.map((match) => match.id)
    };
  };

  const getParticipantPrediction: PredictionRepository["getParticipantPrediction"] = async ({ participantId, roomId }) => {
    const participantResult = await pool.query<ParticipantPredictionTimestampRow>(
      `
        SELECT prediction_submitted_at, prediction_updated_at
        FROM participants
        WHERE id = $1 AND room_id = $2
      `,
      [participantId, roomId]
    );
    const participant = participantResult.rows[0];

    if (!participant) {
      return null;
    }

    const [groupStandingsResult, matchScoresResult] = await Promise.all([
      pool.query<GroupStandingPredictionRow>(
        `
          SELECT
            participant_group_predictions.group_id,
            participant_group_predictions.team_id,
            participant_group_predictions.position
          FROM participant_group_predictions
          JOIN tournament_groups ON tournament_groups.id = participant_group_predictions.group_id
          WHERE participant_group_predictions.participant_id = $1
          ORDER BY tournament_groups.display_order ASC, participant_group_predictions.position ASC
        `,
        [participantId]
      ),
      pool.query<MatchPredictionRow>(
        `
          SELECT
            participant_match_predictions.match_id,
            participant_match_predictions.home_score,
            participant_match_predictions.away_score
          FROM participant_match_predictions
          JOIN matches ON matches.id = participant_match_predictions.match_id
          WHERE participant_match_predictions.participant_id = $1
          ORDER BY matches.starts_at ASC, matches.display_order ASC
        `,
        [participantId]
      )
    ]);

    return {
      groupStandings: groupStandingsResult.rows.map((standing) => ({
        groupId: standing.group_id,
        position: standing.position,
        teamId: standing.team_id
      })),
      matchScores: matchScoresResult.rows.map((matchScore) => ({
        matchId: matchScore.match_id,
        score: {
          away: matchScore.away_score,
          home: matchScore.home_score
        }
      })),
      participantId,
      roomId,
      submittedAtIso: toIsoString(participant.prediction_submitted_at),
      updatedAtIso: toIsoString(participant.prediction_updated_at)
    };
  };

  const saveParticipantPrediction: PredictionRepository["saveParticipantPrediction"] = async ({
    groupStandings,
    matchScores,
    participantId,
    roomId
  }) => {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const participantResult = await client.query<ParticipantPredictionTimestampRow>(
        `
          UPDATE participants
          SET
            prediction_submitted_at = COALESCE(prediction_submitted_at, now()),
            prediction_updated_at = now()
          WHERE id = $1 AND room_id = $2
          RETURNING prediction_submitted_at, prediction_updated_at
        `,
        [participantId, roomId]
      );

      if (!participantResult.rows[0]) {
        await client.query("ROLLBACK");
        return null;
      }

      await client.query("DELETE FROM participant_group_predictions WHERE participant_id = $1", [participantId]);
      await client.query("DELETE FROM participant_match_predictions WHERE participant_id = $1", [participantId]);

      for (const standing of groupStandings) {
        await client.query(
          `
            INSERT INTO participant_group_predictions (participant_id, group_id, team_id, position)
            VALUES ($1, $2, $3, $4)
          `,
          [participantId, standing.groupId, standing.teamId, standing.position]
        );
      }

      for (const matchScore of matchScores) {
        await client.query(
          `
            INSERT INTO participant_match_predictions (participant_id, match_id, home_score, away_score)
            VALUES ($1, $2, $3, $4)
          `,
          [participantId, matchScore.matchId, matchScore.score.home, matchScore.score.away]
        );
      }

      await client.query("COMMIT");

      return getParticipantPrediction({
        participantId,
        roomId
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  };

  return {
    getParticipantPrediction,
    getTournamentMetadata,
    saveParticipantPrediction
  };
};
