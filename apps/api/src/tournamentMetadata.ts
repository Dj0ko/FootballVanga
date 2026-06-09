import type { PredictionStatus } from "@footballvanga/shared";

export type TournamentPredictionMetadata = {
  deadlineIso: string | null;
  groupTeamIds: Record<string, string[]>;
  matchIds: string[];
};

export const DEFAULT_TOURNAMENT_DEADLINE_ISO = "2026-06-11T19:00:00.000Z";

export const TOURNAMENT_GROUP_TEAM_IDS: Record<string, string[]> = {
  a: ["mexico", "south-africa", "korea-republic", "czechia"],
  b: ["canada", "switzerland", "qatar", "bosnia-and-herzegovina"],
  c: ["brazil", "morocco", "haiti", "scotland"],
  d: ["united-states", "paraguay", "australia", "turkiye"],
  e: ["germany", "curacao", "cote-divoire", "ecuador"],
  f: ["netherlands", "japan", "tunisia", "sweden"],
  g: ["belgium", "egypt", "ir-iran", "new-zealand"],
  h: ["spain", "cabo-verde", "saudi-arabia", "uruguay"],
  i: ["france", "senegal", "norway", "iraq"],
  j: ["argentina", "algeria", "austria", "jordan"],
  k: ["portugal", "uzbekistan", "colombia", "congo-dr"],
  l: ["england", "croatia", "ghana", "panama"]
};

const TOURNAMENT_GROUP_IDS = Object.keys(TOURNAMENT_GROUP_TEAM_IDS);

export const TOURNAMENT_MATCH_IDS = TOURNAMENT_GROUP_IDS.flatMap((groupId) =>
  Array.from({ length: 6 }, (_unused, index) => `${groupId}-${index + 1}`)
);

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
