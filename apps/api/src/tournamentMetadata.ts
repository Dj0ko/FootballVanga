import type { PredictionStatus } from "@footballvanga/shared";

import { STATIC_TOURNAMENT_DATA } from "./tournamentData.js";

export type TournamentPredictionMetadata = {
  deadlineIso: string | null;
  groupTeamIds: Record<string, string[]>;
  matchIds: string[];
};

export const DEFAULT_TOURNAMENT_DEADLINE_ISO = STATIC_TOURNAMENT_DATA.deadlineIso;

export const TOURNAMENT_GROUP_TEAM_IDS: Record<string, string[]> = Object.fromEntries(
  STATIC_TOURNAMENT_DATA.groups.map((group) => [group.id, group.teams.map((team) => team.id)])
);

export const TOURNAMENT_MATCH_IDS = STATIC_TOURNAMENT_DATA.matches.map((match) => match.id);

export const getTotalGroupStandingPredictionsCount = () =>
  Object.values(TOURNAMENT_GROUP_TEAM_IDS).reduce((total, teamIds) => total + teamIds.length, 0);

export const getTotalMatchPredictionsCount = () => TOURNAMENT_MATCH_IDS.length;

export const getPredictionStatus = (input: {
  groupStandingsCount: number;
  matchScoresCount: number;
  submittedAtIso: string | null;
}): PredictionStatus => {
  if (!input.submittedAtIso) {
    return "empty";
  }

  return input.groupStandingsCount === getTotalGroupStandingPredictionsCount() &&
    input.matchScoresCount === getTotalMatchPredictionsCount()
    ? "saved"
    : "draft";
};

export const createStaticTournamentPredictionMetadata = (
  deadlineIso = DEFAULT_TOURNAMENT_DEADLINE_ISO
): TournamentPredictionMetadata => ({
  deadlineIso,
  groupTeamIds: Object.fromEntries(
    Object.entries(TOURNAMENT_GROUP_TEAM_IDS).map(([groupId, teamIds]) => [groupId, [...teamIds]])
  ),
  matchIds: [...TOURNAMENT_MATCH_IDS]
});
