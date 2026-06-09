import {
  SCORING_RULES,
  type GroupStandingPrediction,
  type MatchPrediction,
  type MatchOutcome,
  type MatchResult
} from "@footballvanga/shared";

export type GroupStandingResult = {
  groupId: string;
  position: number;
  teamId: string;
};

const getScoreOutcome = (score: { away: number; home: number }): MatchOutcome => {
  if (score.home > score.away) {
    return "home_win";
  }

  if (score.away > score.home) {
    return "away_win";
  }

  return "draw";
};

export const calculateScoreBreakdown = (input: {
  groupStandingResults: GroupStandingResult[];
  groupStandings: GroupStandingPrediction[];
  matchResults: MatchResult[];
  matchScores: MatchPrediction[];
}) => {
  const standingResultPositions = new Map(
    input.groupStandingResults.map((result) => [`${result.groupId}:${result.teamId}`, result.position])
  );
  const matchResults = new Map(input.matchResults.map((result) => [result.matchId, result]));

  let groupStandingPoints = 0;
  let matchOutcomePoints = 0;
  let exactScoreHits = 0;

  for (const standing of input.groupStandings) {
    if (standingResultPositions.get(`${standing.groupId}:${standing.teamId}`) === standing.position) {
      groupStandingPoints += SCORING_RULES.exactGroupPlace;
    }
  }

  for (const matchScore of input.matchScores) {
    const result = matchResults.get(matchScore.matchId);

    if (!result) {
      continue;
    }

    const isExactScore =
      matchScore.score.home === result.score.home && matchScore.score.away === result.score.away;

    if (isExactScore) {
      exactScoreHits += 1;
    }

    if (getScoreOutcome(matchScore.score) === getScoreOutcome(result.score)) {
      matchOutcomePoints += SCORING_RULES.matchOutcome;
    }
  }

  const exactScorePoints = exactScoreHits * SCORING_RULES.exactScore;

  return {
    exactScoreHits,
    exactScorePoints,
    groupStandingPoints,
    matchOutcomePoints,
    total: groupStandingPoints + matchOutcomePoints + exactScorePoints
  };
};
