import type { GlobalLeaderboardEntry } from "@footballvanga/shared";

import { requestJson } from "./rooms";

type GlobalLeaderboardResponse = {
  leaderboard: GlobalLeaderboardEntry[];
};

export const fetchGlobalLeaderboard = async (limit = 5) => {
  const response = await requestJson<GlobalLeaderboardResponse>(`/api/leaderboard/global?limit=${limit}`);

  return response.leaderboard;
};
