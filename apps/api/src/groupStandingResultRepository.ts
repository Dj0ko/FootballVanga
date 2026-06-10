import type { GroupStandingPrediction } from "@footballvanga/shared";

import type { DatabasePool } from "./database.js";
import type {
  ImportedGroupStandingResultsInput,
  ImportedGroupStandingResultsSaveResult
} from "./resultImportTypes.js";

export type GroupStandingResultRepository = {
  listGroupStandingResults: () => Promise<GroupStandingPrediction[]>;
  saveImportedGroupStandingResults: (
    input: ImportedGroupStandingResultsInput
  ) => Promise<ImportedGroupStandingResultsSaveResult | null>;
  saveGroupStandingResults: (input: {
    groupId: string;
    standings: GroupStandingPrediction[];
  }) => Promise<GroupStandingPrediction[] | null>;
};

type ResultSource = "import" | "manual";

type GroupStandingResultRow = {
  group_id: string;
  position: number;
  team_id: string;
};

type GroupStandingResultSourceRow = GroupStandingResultRow & {
  source: ResultSource;
};

const toGroupStandingResult = (row: GroupStandingResultRow): GroupStandingPrediction => ({
  groupId: row.group_id,
  position: row.position,
  teamId: row.team_id
});

const areStandingsEqual = (leftStandings: GroupStandingPrediction[], rightStandings: GroupStandingPrediction[]) => {
  if (leftStandings.length !== rightStandings.length) {
    return false;
  }

  const sortedLeftStandings = [...leftStandings].sort(
    (leftStanding, rightStanding) => leftStanding.position - rightStanding.position
  );
  const sortedRightStandings = [...rightStandings].sort(
    (leftStanding, rightStanding) => leftStanding.position - rightStanding.position
  );

  return sortedLeftStandings.every((leftStanding, index) => {
    const rightStanding = sortedRightStandings[index];

    return (
      rightStanding &&
      leftStanding.groupId === rightStanding.groupId &&
      leftStanding.teamId === rightStanding.teamId &&
      leftStanding.position === rightStanding.position
    );
  });
};

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

  const saveImportedGroupStandingResults: GroupStandingResultRepository["saveImportedGroupStandingResults"] = async ({
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

      const existingResult = await client.query<GroupStandingResultSourceRow>(
        `
          SELECT group_id, team_id, position, source
          FROM group_standing_results
          WHERE group_id = $1
          ORDER BY position ASC
        `,
        [groupId]
      );
      const existingStandings = existingResult.rows.map(toGroupStandingResult);

      if (existingResult.rows.some((standing) => standing.source === "manual")) {
        await client.query("COMMIT");
        return {
          result: existingStandings,
          status: "skipped_manual"
        };
      }

      if (existingStandings.length > 0 && areStandingsEqual(existingStandings, standings)) {
        await client.query("COMMIT");
        return {
          result: existingStandings,
          status: "unchanged"
        };
      }

      await client.query("DELETE FROM group_standing_results WHERE group_id = $1", [groupId]);

      for (const standing of standings) {
        await client.query(
          `
            INSERT INTO group_standing_results (group_id, team_id, position, source)
            VALUES ($1, $2, $3, 'import')
          `,
          [groupId, standing.teamId, standing.position]
        );
      }

      await client.query("COMMIT");

      return {
        result: standings.map((standing) => ({ ...standing })),
        status: existingStandings.length ? "updated" : "created"
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  };

  return {
    listGroupStandingResults,
    saveImportedGroupStandingResults,
    saveGroupStandingResults
  };
};
