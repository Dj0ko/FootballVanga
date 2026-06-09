import type { MatchResult, ScoreLine } from "@footballvanga/shared";

import type { DatabasePool } from "./database.js";

export type MatchResultRepository = {
  listMatchResults: () => Promise<MatchResult[]>;
  saveMatchResult: (input: {
    matchId: string;
    score: ScoreLine;
  }) => Promise<MatchResult | null>;
};

type MatchResultRow = {
  away_score: number;
  finished_at: Date | string;
  home_score: number;
  match_id: string;
};

const toIsoString = (value: Date | string) =>
  typeof value === "string" ? new Date(value).toISOString() : value.toISOString();

const toMatchResult = (row: MatchResultRow): MatchResult => ({
  finishedAtIso: toIsoString(row.finished_at),
  matchId: row.match_id,
  score: {
    away: row.away_score,
    home: row.home_score
  }
});

export const createMatchResultRepository = (pool: DatabasePool): MatchResultRepository => {
  const listMatchResults = async () => {
    const result = await pool.query<MatchResultRow>(`
      SELECT
        match_results.match_id,
        match_results.home_score,
        match_results.away_score,
        match_results.finished_at
      FROM match_results
      JOIN matches ON matches.id = match_results.match_id
      ORDER BY match_results.finished_at DESC, matches.starts_at DESC, matches.display_order DESC
    `);

    return result.rows.map(toMatchResult);
  };

  const saveMatchResult: MatchResultRepository["saveMatchResult"] = async ({ matchId, score }) => {
    const matchResult = await pool.query<{ id: string }>("SELECT id FROM matches WHERE id = $1", [matchId]);

    if (!matchResult.rows[0]) {
      return null;
    }

    const result = await pool.query<MatchResultRow>(
      `
        INSERT INTO match_results (match_id, home_score, away_score, source)
        VALUES ($1, $2, $3, 'manual')
        ON CONFLICT (match_id) DO UPDATE SET
          home_score = EXCLUDED.home_score,
          away_score = EXCLUDED.away_score,
          source = 'manual'
        RETURNING match_id, home_score, away_score, finished_at
      `,
      [matchId, score.home, score.away]
    );
    const row = result.rows[0];

    if (!row) {
      throw new Error("Match result was not saved.");
    }

    return toMatchResult(row);
  };

  return {
    listMatchResults,
    saveMatchResult
  };
};
