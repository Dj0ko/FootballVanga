import type { TournamentData } from "@footballvanga/shared";

import { createTournamentView } from "../data/tournament";
import type { TournamentView } from "../data/tournament";
import { requestJson } from "./rooms";

export const fetchTournament = async (): Promise<TournamentView> => {
  const tournament = await requestJson<TournamentData>("/api/tournament");

  return createTournamentView(tournament);
};
