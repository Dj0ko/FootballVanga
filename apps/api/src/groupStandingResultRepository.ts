import type { GroupStandingPrediction } from "@footballvanga/shared";

import type { DatabasePool } from "./database.js";

export type GroupStandingResultRepository = {
  listGroupStandingResults: () => Promise<GroupStandingPrediction[]>;
  saveGroupStandingResults: (input: {
    groupId: string;
    standings: GroupStandingPrediction[];
  }) => Promise<GroupStandingPrediction[] | null>;
};

type GroupStandingResultRow = {
  group_id: string;
  position: number;
  team_id: string;
};

const toGroupStandingResult = (row: GroupStandingResultRow): GroupStandingPrediction => ({
  groupId: row.group_id,
  position: row.position,
  teamId: row.team_id
});

export const createGroupStandingResultRepository = (pool: DatabasePool): GroupStandingResultRepository => {
  const listGroupStandingResults = async () => {
    const result = await pool.query<GroupStandingResultRow>(`
      SELECT
        group_standing_results.group_id,
        group_standing_results.team_id,
        group_standing_results.position
      FROM group_standing_results
      JOIN tournament_groups ON tournament_groups.id = group_standing_results.group_id
      ORDER BY tournament_groups.display_order ASC, group_standing_results.position ASC
    `);

    return result.rows.map(toGroupStandingResult);
  };

  const saveGroupStandingResults: GroupStandingResultRepository["saveGroupStandingResults"] = async ({
    groupId,
    standings
  }) => {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const groupResult = await client.query<{ id: string }>("SELECT id FROM tournament_groups WHERE id = $1", [
        groupId
      ]);

      if (!groupResult.rows[0]) {
        await client.query("ROLLBACK");
        return null;
      }

      await client.query("DELETE FROM group_standing_results WHERE group_id = $1", [groupId]);

      for (const standing of standings) {
        await client.query(
          `
            INSERT INTO group_standing_results (group_id, team_id, position, source)
            VALUES ($1, $2, $3, 'manual')
          `,
          [groupId, standing.teamId, standing.position]
        );
      }

      await client.query("COMMIT");

      return standings.map((standing) => ({ ...standing }));
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  };

  return {
    listGroupStandingResults,
    saveGroupStandingResults
  };
};
