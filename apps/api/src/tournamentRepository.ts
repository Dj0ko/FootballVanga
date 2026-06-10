import type { Match, Team, TournamentData, TournamentGroup } from "@footballvanga/shared";

import type { DatabasePool } from "./database.js";
import { cloneTournamentData, STATIC_TOURNAMENT_DATA } from "./tournamentData.js";

export type TournamentRepository = {
  getTournament: () => Promise<TournamentData>;
};

type DeadlineRow = {
  deadline_at: Date | string | null;
};

type GroupRow = {
  id: string;
  name: string;
};

type TeamRow = {
  group_id: string;
  id: string;
  name: string;
};

type MatchRow = {
  away_team_id: string;
  group_id: string;
  home_team_id: string;
  id: string;
  starts_at: Date | string;
  venue: string;
};

const toIsoString = (value: Date | string) =>
  typeof value === "string" ? new Date(value).toISOString() : value.toISOString();

export const createStaticTournamentRepository = (): TournamentRepository => ({
  getTournament: async () => cloneTournamentData(STATIC_TOURNAMENT_DATA)
});

export const createTournamentRepository = (pool: DatabasePool): TournamentRepository => {
  const getTournament: TournamentRepository["getTournament"] = async () => {
    const [deadlineResult, groupsResult, teamsResult, matchesResult] = await Promise.all([
      pool.query<DeadlineRow>("SELECT deadline_at FROM tournament_prediction_deadline"),
      pool.query<GroupRow>(`
        SELECT id, name
        FROM tournament_groups
        ORDER BY display_order ASC
      `),
      pool.query<TeamRow>(`
        SELECT teams.id, teams.group_id, teams.name
        FROM teams
        JOIN tournament_groups ON tournament_groups.id = teams.group_id
        ORDER BY tournament_groups.display_order ASC, teams.display_order ASC
      `),
      pool.query<MatchRow>(`
        SELECT matches.id, matches.group_id, matches.home_team_id, matches.away_team_id, matches.starts_at, matches.venue
        FROM matches
        JOIN tournament_groups ON tournament_groups.id = matches.group_id
        ORDER BY tournament_groups.display_order ASC, matches.display_order ASC
      `)
    ]);
    const teamsByGroupId = new Map<string, Team[]>();

    for (const team of teamsResult.rows) {
      teamsByGroupId.set(team.group_id, [
        ...(teamsByGroupId.get(team.group_id) ?? []),
        {
          groupId: team.group_id,
          id: team.id,
          name: team.name
        }
      ]);
    }

    const groups: TournamentGroup[] = groupsResult.rows.map((group) => ({
      id: group.id,
      name: group.name,
      teams: teamsByGroupId.get(group.id) ?? []
    }));
    const matches: Match[] = matchesResult.rows.map((match) => ({
      awayTeamId: match.away_team_id,
      groupId: match.group_id,
      homeTeamId: match.home_team_id,
      id: match.id,
      startsAtIso: toIsoString(match.starts_at),
      venue: match.venue
    }));
    const deadline = deadlineResult.rows[0]?.deadline_at;

    return {
      deadlineIso: deadline ? toIsoString(deadline) : STATIC_TOURNAMENT_DATA.deadlineIso,
      groups,
      matches
    };
  };

  return {
    getTournament
  };
};
