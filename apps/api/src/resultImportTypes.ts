import type { GroupStandingPrediction, MatchResult, ScoreLine } from "@footballvanga/shared";

export type ResultImportSaveStatus = "created" | "updated" | "unchanged" | "skipped_manual";

export type ImportedSaveResult<TValue> = {
  result: TValue;
  status: ResultImportSaveStatus;
};

export type ImportedMatchResultInput = {
  finishedAt: Date;
  matchId: string;
  score: ScoreLine;
};

export type ImportedGroupStandingResultsInput = {
  groupId: string;
  standings: GroupStandingPrediction[];
};

export type ExternalMatchResult = {
  awayTeamName: string;
  finishedAtIso: string;
  homeTeamName: string;
  providerId: string;
  score: ScoreLine;
};

export type ExternalGroupStanding = {
  providerGroupName: string | null;
  rows: Array<{
    position: number;
    teamName: string;
  }>;
};

export type ExternalResultImportData = {
  matches: ExternalMatchResult[];
  standings: ExternalGroupStanding[];
  warnings: string[];
};

export type ResultImportProvider = {
  fetchResults: () => Promise<ExternalResultImportData>;
  name: string;
};

export type ResultImportSummary = {
  finalGroups: string[];
  finishedAtIso: string;
  matchesCreated: number;
  matchesSeen: number;
  matchesSkippedManual: number;
  matchesSkippedUnmapped: number;
  matchesUnchanged: number;
  matchesUpdated: number;
  message?: string;
  provider: string;
  recalculatedParticipants: number;
  startedAtIso: string;
  standingsCreated: number;
  standingsSeen: number;
  standingsSkippedManual: number;
  standingsSkippedPending: number;
  standingsSkippedUnmapped: number;
  standingsUnchanged: number;
  standingsUpdated: number;
  status: "success" | "failed";
  warnings: string[];
};

export type ResultImporter = {
  syncResults: () => Promise<ResultImportSummary>;
};

export type ImportedMatchResultSaveResult = ImportedSaveResult<MatchResult>;
export type ImportedGroupStandingResultsSaveResult = ImportedSaveResult<GroupStandingPrediction[]>;
