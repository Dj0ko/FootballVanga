import type { GroupStandingPrediction, Match, TournamentData } from "@footballvanga/shared";

import type { GroupStandingResultRepository } from "./groupStandingResultRepository.js";
import type { MatchResultRepository } from "./matchResultRepository.js";
import type { ScoringRepository } from "./scoringRepository.js";
import type { TournamentRepository } from "./tournamentRepository.js";
import type {
  ExternalGroupStanding,
  ExternalMatchResult,
  ResultImporter,
  ResultImportProvider,
  ResultImportSaveStatus,
  ResultImportSummary
} from "./resultImportTypes.js";

type CreateResultImporterOptions = {
  groupStandingResultRepository: GroupStandingResultRepository;
  matchResultRepository: MatchResultRepository;
  provider: ResultImportProvider;
  scoringRepository?: ScoringRepository | null;
  tournamentRepository: TournamentRepository;
};

type TeamLookup = {
  groupIdByTeamId: Map<string, string>;
  teamIdByNormalizedName: Map<string, string>;
};

const TEAM_ALIASES_BY_ID: Record<string, string[]> = {
  "bosnia-and-herzegovina": ["Bosnia", "Bosnia-Herzegovina", "Bosnia & Herzegovina"],
  "cabo-verde": ["Cape Verde", "Cabo Verde Islands"],
  "congo-dr": ["DR Congo", "Congo DR", "Democratic Republic of Congo", "Congo Democratic Republic"],
  "cote-divoire": ["Cote d Ivoire", "Cote d'Ivoire", "Côte d'Ivoire", "Ivory Coast"],
  curacao: ["Curaçao"],
  czechia: ["Czech Republic"],
  "ir-iran": ["Iran", "IR Iran", "Iran Islamic Republic"],
  "korea-republic": ["South Korea", "Republic of Korea", "Korea Republic"],
  turkiye: ["Turkey", "Türkiye", "Turkiye"],
  "united-states": ["USA", "United States of America", "USMNT", "United States"]
};

const createEmptySummary = (provider: string, startedAt: Date): ResultImportSummary => ({
  finalGroups: [],
  finishedAtIso: startedAt.toISOString(),
  matchesCreated: 0,
  matchesSeen: 0,
  matchesSkippedManual: 0,
  matchesSkippedUnmapped: 0,
  matchesUnchanged: 0,
  matchesUpdated: 0,
  provider,
  recalculatedParticipants: 0,
  startedAtIso: startedAt.toISOString(),
  standingsCreated: 0,
  standingsSeen: 0,
  standingsSkippedManual: 0,
  standingsSkippedPending: 0,
  standingsSkippedUnmapped: 0,
  standingsUnchanged: 0,
  standingsUpdated: 0,
  status: "success",
  warnings: []
});

export const normalizeTeamName = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/&/g, " and ")
    .replace(/['’`]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("en-US");

const createTeamLookup = (tournament: TournamentData): TeamLookup => {
  const teamIdByNormalizedName = new Map<string, string>();
  const groupIdByTeamId = new Map<string, string>();

  for (const group of tournament.groups) {
    for (const team of group.teams) {
      groupIdByTeamId.set(team.id, group.id);

      for (const alias of [team.name, ...(TEAM_ALIASES_BY_ID[team.id] ?? [])]) {
        const normalizedName = normalizeTeamName(alias);

        if (normalizedName) {
          teamIdByNormalizedName.set(normalizedName, team.id);
        }
      }
    }
  }

  return {
    groupIdByTeamId,
    teamIdByNormalizedName
  };
};

const createMatchesByTeams = (matches: Match[]) =>
  new Map(matches.map((match) => [`${match.homeTeamId}:${match.awayTeamId}`, match]));

const countMatchSaveStatus = (summary: ResultImportSummary, status: ResultImportSaveStatus) => {
  if (status === "created") {
    summary.matchesCreated += 1;
  } else if (status === "updated") {
    summary.matchesUpdated += 1;
  } else if (status === "unchanged") {
    summary.matchesUnchanged += 1;
  } else {
    summary.matchesSkippedManual += 1;
  }
};

const countStandingSaveStatus = (summary: ResultImportSummary, status: ResultImportSaveStatus) => {
  if (status === "created") {
    summary.standingsCreated += 1;
  } else if (status === "updated") {
    summary.standingsUpdated += 1;
  } else if (status === "unchanged") {
    summary.standingsUnchanged += 1;
  } else {
    summary.standingsSkippedManual += 1;
  }
};

const parseFinishedAt = (finishedAtIso: string) => {
  const date = new Date(finishedAtIso);

  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const getTeamId = (lookup: TeamLookup, teamName: string) =>
  lookup.teamIdByNormalizedName.get(normalizeTeamName(teamName)) ?? null;

const importMatchResult = async (
  input: {
    lookup: TeamLookup;
    matchResultRepository: MatchResultRepository;
    matchesByTeams: Map<string, Match>;
    summary: ResultImportSummary;
  },
  externalMatch: ExternalMatchResult
) => {
  input.summary.matchesSeen += 1;

  const homeTeamId = getTeamId(input.lookup, externalMatch.homeTeamName);
  const awayTeamId = getTeamId(input.lookup, externalMatch.awayTeamName);

  if (!homeTeamId || !awayTeamId) {
    input.summary.matchesSkippedUnmapped += 1;
    return;
  }

  const match = input.matchesByTeams.get(`${homeTeamId}:${awayTeamId}`);

  if (!match) {
    input.summary.matchesSkippedUnmapped += 1;
    return;
  }

  const saveResult = await input.matchResultRepository.saveImportedMatchResult({
    finishedAt: parseFinishedAt(externalMatch.finishedAtIso),
    matchId: match.id,
    score: externalMatch.score
  });

  if (!saveResult) {
    input.summary.matchesSkippedUnmapped += 1;
    return;
  }

  countMatchSaveStatus(input.summary, saveResult.status);
};

const mapExternalStanding = (
  lookup: TeamLookup,
  externalStanding: ExternalGroupStanding
):
  | {
      groupId: string;
      standings: GroupStandingPrediction[];
    }
  | null => {
  const teamRows = externalStanding.rows
    .filter((row) => Number.isInteger(row.position))
    .map((row) => ({
      position: row.position,
      teamId: getTeamId(lookup, row.teamName)
    }));

  if (teamRows.some((row) => !row.teamId)) {
    return null;
  }

  const groupIds = new Set(teamRows.map((row) => lookup.groupIdByTeamId.get(row.teamId ?? "")));

  if (groupIds.size !== 1) {
    return null;
  }

  const groupId = Array.from(groupIds)[0];

  if (!groupId) {
    return null;
  }

  const seenTeamIds = new Set<string>();
  const seenPositions = new Set<number>();
  const standings = teamRows
    .map((row) => ({
      groupId,
      position: row.position,
      teamId: row.teamId ?? ""
    }))
    .sort((leftStanding, rightStanding) => leftStanding.position - rightStanding.position);

  for (const standing of standings) {
    if (
      seenTeamIds.has(standing.teamId) ||
      seenPositions.has(standing.position) ||
      standing.position < 1 ||
      standing.position > standings.length
    ) {
      return null;
    }

    seenTeamIds.add(standing.teamId);
    seenPositions.add(standing.position);
  }

  return {
    groupId,
    standings
  };
};

const getPlayedGroupIds = (tournament: TournamentData, resultIds: Set<string>) =>
  new Set(
    tournament.matches.flatMap((match) => {
      if (!resultIds.has(match.id)) {
        return [];
      }

      return [match.groupId];
    })
  );

const getFinalGroups = (tournament: TournamentData, resultIds: Set<string>) =>
  tournament.groups
    .flatMap((group) => {
      const groupMatchIds = tournament.matches
        .filter((match) => match.groupId === group.id)
        .map((match) => match.id);

      if (!groupMatchIds.length || !groupMatchIds.every((matchId) => resultIds.has(matchId))) {
        return [];
      }

      return [group.id];
    })
    .sort();

const importGroupStanding = async (
  input: {
    groupStandingResultRepository: GroupStandingResultRepository;
    lookup: TeamLookup;
    playedGroupIds: Set<string>;
    summary: ResultImportSummary;
  },
  externalStanding: ExternalGroupStanding
) => {
  input.summary.standingsSeen += 1;

  const mappedStanding = mapExternalStanding(input.lookup, externalStanding);

  if (!mappedStanding) {
    input.summary.standingsSkippedUnmapped += 1;
    return;
  }

  if (!input.playedGroupIds.has(mappedStanding.groupId)) {
    input.summary.standingsSkippedPending += 1;
    return;
  }

  const saveResult = await input.groupStandingResultRepository.saveImportedGroupStandingResults(mappedStanding);

  if (!saveResult) {
    input.summary.standingsSkippedUnmapped += 1;
    return;
  }

  countStandingSaveStatus(input.summary, saveResult.status);
};

export const createResultImporter = ({
  groupStandingResultRepository,
  matchResultRepository,
  provider,
  scoringRepository,
  tournamentRepository
}: CreateResultImporterOptions): ResultImporter => {
  const syncResults: ResultImporter["syncResults"] = async () => {
    const startedAt = new Date();
    const summary = createEmptySummary(provider.name, startedAt);

    try {
      const [tournament, externalData] = await Promise.all([
        tournamentRepository.getTournament(),
        provider.fetchResults()
      ]);
      const lookup = createTeamLookup(tournament);
      const matchesByTeams = createMatchesByTeams(tournament.matches);

      summary.warnings.push(...externalData.warnings);

      for (const externalMatch of externalData.matches) {
        await importMatchResult(
          {
            lookup,
            matchResultRepository,
            matchesByTeams,
            summary
          },
          externalMatch
        );
      }

      const currentResultIds = new Set((await matchResultRepository.listMatchResults()).map((result) => result.matchId));
      const playedGroupIds = getPlayedGroupIds(tournament, currentResultIds);

      for (const externalStanding of externalData.standings) {
        await importGroupStanding(
          {
            groupStandingResultRepository,
            lookup,
            playedGroupIds,
            summary
          },
          externalStanding
        );
      }

      summary.finalGroups = getFinalGroups(tournament, currentResultIds);

      if (scoringRepository) {
        const recalculationResult = await scoringRepository.recalculateScores();

        summary.recalculatedParticipants = recalculationResult.recalculatedParticipants;
      }
    } catch (error) {
      summary.message = error instanceof Error ? error.message : "Result import failed.";
      summary.status = "failed";
    } finally {
      summary.finishedAtIso = new Date().toISOString();
    }

    return summary;
  };

  return {
    syncResults
  };
};
