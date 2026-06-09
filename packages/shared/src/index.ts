export type RoomId = string;
export type ParticipantId = string;
export type TeamId = string;
export type MatchId = string;
export type GroupId = string;

export type MatchOutcome = "home_win" | "away_win" | "draw";

export type RoomStatus = "draft" | "open" | "locked" | "finished";
export type PredictionStatus = "saved" | "draft" | "empty";

export type RoomSummary = {
  id: RoomId;
  name: string;
  status: RoomStatus;
  deadlineIso: string;
  participantCount: number;
};

export type ParticipantSummary = {
  id: ParticipantId;
  displayName: string;
  totalScore: number;
  exactScoreHits: number;
  predictionStatus: PredictionStatus;
};

export type ParticipantSession = {
  participantId: ParticipantId;
  token: string;
  expiresAtIso: string;
};

export type Team = {
  id: TeamId;
  name: string;
  groupId: GroupId;
};

export type TournamentGroup = {
  id: GroupId;
  name: string;
  teams: Team[];
};

export type Match = {
  id: MatchId;
  groupId: GroupId;
  homeTeamId: TeamId;
  awayTeamId: TeamId;
  startsAtIso: string;
};

export type ScoreLine = {
  home: number;
  away: number;
};

export type MatchPrediction = {
  matchId: MatchId;
  score: ScoreLine;
};

export type GroupStandingPrediction = {
  groupId: GroupId;
  teamId: TeamId;
  position: number;
};

export type ParticipantPrediction = {
  participantId: ParticipantId;
  roomId: RoomId;
  groupStandings: GroupStandingPrediction[];
  matchScores: MatchPrediction[];
  submittedAtIso: string | null;
  updatedAtIso: string | null;
};

export type SaveParticipantPredictionInput = {
  groupStandings: GroupStandingPrediction[];
  matchScores: MatchPrediction[];
};

export type ScoreBreakdown = {
  groupStandingPoints: number;
  matchOutcomePoints: number;
  exactScorePoints: number;
  exactScoreHits: number;
  total: number;
};

export const SCORING_RULES = {
  exactGroupPlace: 1,
  matchOutcome: 1,
  exactScore: 2
} as const;

export type ApiMeta = {
  productName: "FootballVanga";
  version: string;
  stage: "scaffold" | "mvp" | "production";
  scoring: typeof SCORING_RULES;
};
