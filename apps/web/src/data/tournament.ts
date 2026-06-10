import type {
  Match as ApiTournamentMatch,
  ParticipantPrediction,
  PredictionStatus,
  SaveParticipantPredictionInput,
  TournamentData
} from "@footballvanga/shared";

import type { MatchPrediction as ApiMatchPrediction } from "@footballvanga/shared";

export type Group = {
  id: string;
  name: string;
  teams: string[];
};

export type Match = {
  id: string;
  away: string;
  awayTeamId: string;
  group: string;
  groupId: string;
  home: string;
  homeTeamId: string;
  startsAtIso: string;
  venue: string;
};

export type MatchScore = {
  home: number | "";
  away: number | "";
};

export type PredictionSnapshot = {
  groupOrders: Record<string, string[]>;
  matchScores: Record<string, MatchScore>;
  savedGroupIds: string[];
};

export type TournamentView = {
  deadlineIso: string;
  groups: Group[];
  matches: Match[];
  teamIdByName: Record<string, string>;
  teamNameById: Record<string, string>;
};

const createTeamMaps = (tournament: TournamentData) => {
  const teamIdByName: Record<string, string> = {};
  const teamNameById: Record<string, string> = {};

  for (const group of tournament.groups) {
    for (const team of group.teams) {
      teamIdByName[team.name] = team.id;
      teamNameById[team.id] = team.name;
    }
  }

  return {
    teamIdByName,
    teamNameById
  };
};

const createMatchView = (
  match: ApiTournamentMatch,
  input: {
    groupNameById: Record<string, string>;
    teamNameById: Record<string, string>;
  }
): Match => ({
  away: input.teamNameById[match.awayTeamId] ?? match.awayTeamId,
  awayTeamId: match.awayTeamId,
  group: input.groupNameById[match.groupId] ?? match.groupId,
  groupId: match.groupId,
  home: input.teamNameById[match.homeTeamId] ?? match.homeTeamId,
  homeTeamId: match.homeTeamId,
  id: match.id,
  startsAtIso: match.startsAtIso,
  venue: match.venue
});

export const createTournamentView = (tournament: TournamentData): TournamentView => {
  const { teamIdByName, teamNameById } = createTeamMaps(tournament);
  const groupNameById = Object.fromEntries(tournament.groups.map((group) => [group.id, group.name])) as Record<
    string,
    string
  >;

  return {
    deadlineIso: tournament.deadlineIso,
    groups: tournament.groups.map((group) => ({
      id: group.id,
      name: group.name,
      teams: group.teams.map((team) => team.name)
    })),
    matches: tournament.matches.map((match) =>
      createMatchView(match, {
        groupNameById,
        teamNameById
      })
    ),
    teamIdByName,
    teamNameById
  };
};

export const createEmptyPredictionSnapshot = (tournament: TournamentView): PredictionSnapshot => ({
  groupOrders: Object.fromEntries(
    tournament.groups.map((group) => [group.id, [...group.teams]])
  ) as Record<string, string[]>,
  matchScores: Object.fromEntries(tournament.matches.map((match) => [match.id, { home: "", away: "" }])) as Record<
    string,
    MatchScore
  >,
  savedGroupIds: []
});

const getGroupMatches = (tournament: TournamentView, groupId: string) =>
  tournament.matches.filter((match) => match.groupId === groupId);

export const getCompleteGroupIds = (tournament: TournamentView, snapshot: PredictionSnapshot) =>
  tournament.groups
    .filter((group) => {
      const teams = snapshot.groupOrders[group.id] ?? [];
      const hasCompleteTeamOrder =
        teams.length === group.teams.length && group.teams.every((team) => teams.includes(team));
      const hasCompleteScores = getGroupMatches(tournament, group.id).every((match) => {
        const score = snapshot.matchScores[match.id];

        return Boolean(score && score.home !== "" && score.away !== "");
      });

      return hasCompleteTeamOrder && hasCompleteScores;
    })
    .map((group) => group.id);

export const createPredictionSnapshotFromParticipantPrediction = (
  tournament: TournamentView,
  prediction: ParticipantPrediction
): PredictionSnapshot => {
  const snapshot = createEmptyPredictionSnapshot(tournament);
  const standingsByGroupId = new Map<string, Array<{ position: number; teamName: string }>>();

  for (const standing of prediction.groupStandings) {
    const teamName = tournament.teamNameById[standing.teamId];

    if (!teamName) {
      continue;
    }

    standingsByGroupId.set(standing.groupId, [
      ...(standingsByGroupId.get(standing.groupId) ?? []),
      {
        position: standing.position,
        teamName
      }
    ]);
  }

  for (const group of tournament.groups) {
    const predictedStandings = standingsByGroupId
      .get(group.id)
      ?.sort((leftStanding, rightStanding) => leftStanding.position - rightStanding.position);

    if (!predictedStandings?.length) {
      continue;
    }

    const predictedTeams = predictedStandings.map((standing) => standing.teamName);
    const missingTeams = group.teams.filter((team) => !predictedTeams.includes(team));

    snapshot.groupOrders[group.id] = [...predictedTeams, ...missingTeams];
  }

  for (const matchScore of prediction.matchScores) {
    snapshot.matchScores[matchScore.matchId] = {
      away: matchScore.score.away,
      home: matchScore.score.home
    };
  }

  snapshot.savedGroupIds = getCompleteGroupIds(tournament, snapshot);

  return snapshot;
};

export const createSavePredictionInput = (
  tournament: TournamentView,
  groupOrders: Record<string, string[]>,
  matchScores: Record<string, MatchScore>
): SaveParticipantPredictionInput => {
  const groupStandings = tournament.groups.flatMap((group) =>
    (groupOrders[group.id] ?? group.teams).flatMap((team, index) => {
      const teamId = tournament.teamIdByName[team];

      return teamId
        ? [
            {
              groupId: group.id,
              position: index + 1,
              teamId
            }
          ]
        : [];
    })
  );
  const apiMatchScores: ApiMatchPrediction[] = tournament.matches.flatMap((match) => {
    const score = matchScores[match.id];

    if (!score || score.home === "" || score.away === "") {
      return [];
    }

    return [
      {
        matchId: match.id,
        score: {
          away: score.away,
          home: score.home
        }
      }
    ];
  });

  return {
    groupStandings,
    matchScores: apiMatchScores
  };
};

export const getPredictionStatusFromParticipantPrediction = (
  tournament: TournamentView,
  prediction: ParticipantPrediction
): PredictionStatus => {
  if (!prediction.submittedAtIso) {
    return "empty";
  }

  return prediction.groupStandings.length ===
    tournament.groups.reduce((total, group) => total + group.teams.length, 0) &&
    prediction.matchScores.length === tournament.matches.length
    ? "saved"
    : "draft";
};
