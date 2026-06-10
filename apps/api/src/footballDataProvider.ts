import type {
  ExternalGroupStanding,
  ExternalMatchResult,
  ExternalResultImportData,
  ResultImportProvider
} from "./resultImportTypes.js";

type FootballDataTeam = {
  id?: number;
  name?: string;
  shortName?: string;
  tla?: string;
};

type FootballDataMatch = {
  awayTeam?: FootballDataTeam;
  homeTeam?: FootballDataTeam;
  id?: number;
  lastUpdated?: string;
  score?: {
    fullTime?: {
      away?: number | null;
      home?: number | null;
    };
  };
  status?: string;
  utcDate?: string;
};

type FootballDataMatchesResponse = {
  matches?: FootballDataMatch[];
};

type FootballDataStandingRow = {
  position?: number;
  team?: FootballDataTeam;
};

type FootballDataStanding = {
  group?: string | null;
  table?: FootballDataStandingRow[];
  type?: string;
};

type FootballDataStandingsResponse = {
  standings?: FootballDataStanding[];
};

type FootballDataProviderOptions = {
  apiToken: string;
  baseUrl?: string;
  competitionCode?: string;
  season?: string;
};

const DEFAULT_BASE_URL = "https://api.football-data.org/v4";
const DEFAULT_COMPETITION_CODE = "WC";
const DEFAULT_SEASON = "2026";
const FINISHED_STATUSES = new Set(["FINISHED", "AWARDED"]);

const isScorePart = (value: unknown): value is number =>
  Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 99;

const getTeamName = (team: FootballDataTeam | undefined) => team?.name?.trim() || team?.shortName?.trim() || "";

const toExternalMatchResult = (match: FootballDataMatch): ExternalMatchResult | null => {
  if (!match.id || !match.status || !FINISHED_STATUSES.has(match.status)) {
    return null;
  }

  const home = match.score?.fullTime?.home;
  const away = match.score?.fullTime?.away;
  const homeTeamName = getTeamName(match.homeTeam);
  const awayTeamName = getTeamName(match.awayTeam);

  if (!isScorePart(home) || !isScorePart(away) || !homeTeamName || !awayTeamName) {
    return null;
  }

  return {
    awayTeamName,
    finishedAtIso: match.lastUpdated ?? match.utcDate ?? new Date().toISOString(),
    homeTeamName,
    providerId: String(match.id),
    score: {
      away,
      home
    }
  };
};

const toExternalGroupStanding = (standing: FootballDataStanding): ExternalGroupStanding | null => {
  if (standing.type && standing.type !== "TOTAL") {
    return null;
  }

  const rows = (standing.table ?? []).flatMap((row) => {
    const teamName = getTeamName(row.team);

    if (!teamName || !Number.isInteger(row.position)) {
      return [];
    }

    return [
      {
        position: row.position as number,
        teamName
      }
    ];
  });

  if (!rows.length) {
    return null;
  }

  return {
    providerGroupName: standing.group ?? null,
    rows
  };
};

const createCompetitionUrl = (baseUrl: string, competitionCode: string, subresource: string, season: string) => {
  const url = new URL(`${baseUrl.replace(/\/$/, "")}/competitions/${competitionCode}/${subresource}`);

  url.searchParams.set("season", season);

  return url;
};

const fetchJson = async <TResponse>(url: URL, apiToken: string): Promise<TResponse> => {
  const response = await fetch(url, {
    headers: {
      "X-Auth-Token": apiToken
    }
  });

  if (!response.ok) {
    throw new Error(`football-data.org request failed with HTTP ${response.status}`);
  }

  return (await response.json()) as TResponse;
};

export const createFootballDataProvider = ({
  apiToken,
  baseUrl = DEFAULT_BASE_URL,
  competitionCode = DEFAULT_COMPETITION_CODE,
  season = DEFAULT_SEASON
}: FootballDataProviderOptions): ResultImportProvider => {
  const fetchResults: ResultImportProvider["fetchResults"] = async (): Promise<ExternalResultImportData> => {
    const matchesResponse = await fetchJson<FootballDataMatchesResponse>(
      createCompetitionUrl(baseUrl, competitionCode, "matches", season),
      apiToken
    );
    const warnings: string[] = [];
    let standings: ExternalGroupStanding[] = [];

    try {
      const standingsResponse = await fetchJson<FootballDataStandingsResponse>(
        createCompetitionUrl(baseUrl, competitionCode, "standings", season),
        apiToken
      );

      standings = (standingsResponse.standings ?? []).flatMap((standing) => {
        const externalStanding = toExternalGroupStanding(standing);

        return externalStanding ? [externalStanding] : [];
      });
    } catch (error) {
      warnings.push(error instanceof Error ? error.message : "football-data.org standings request failed.");
    }

    return {
      matches: (matchesResponse.matches ?? []).flatMap((match) => {
        const externalMatch = toExternalMatchResult(match);

        return externalMatch ? [externalMatch] : [];
      }),
      standings,
      warnings
    };
  };

  return {
    fetchResults,
    name: "football-data.org"
  };
};
