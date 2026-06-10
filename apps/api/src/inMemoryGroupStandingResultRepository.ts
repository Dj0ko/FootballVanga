import type { GroupStandingPrediction } from "@footballvanga/shared";

import type { GroupStandingResultRepository } from "./groupStandingResultRepository.js";
import type { InMemoryFootballStore, StoredGroupStandingResult } from "./inMemoryRoomRepository.js";
import { TOURNAMENT_GROUP_TEAM_IDS } from "./tournamentMetadata.js";

const cloneGroupStandingResult = (standing: StoredGroupStandingResult): StoredGroupStandingResult => ({
  groupId: standing.groupId,
  position: standing.position,
  teamId: standing.teamId
});

const groupOrder = Object.keys(TOURNAMENT_GROUP_TEAM_IDS);

const compareGroupStandingResults = (
  leftStanding: GroupStandingPrediction,
  rightStanding: GroupStandingPrediction
) => {
  const groupDiff = groupOrder.indexOf(leftStanding.groupId) - groupOrder.indexOf(rightStanding.groupId);

  if (groupDiff !== 0) {
    return groupDiff;
  }

  return leftStanding.position - rightStanding.position;
};

export const createInMemoryGroupStandingResultRepository = (
  store: InMemoryFootballStore
): GroupStandingResultRepository => {
  const listGroupStandingResults: GroupStandingResultRepository["listGroupStandingResults"] = async () =>
    Array.from(store.groupStandingResults.values())
      .sort(compareGroupStandingResults)
      .map(cloneGroupStandingResult);

  const saveGroupStandingResults: GroupStandingResultRepository["saveGroupStandingResults"] = async ({
    groupId,
    standings
  }) => {
    if (!TOURNAMENT_GROUP_TEAM_IDS[groupId]) {
      return null;
    }

    for (const key of Array.from(store.groupStandingResults.keys())) {
      if (key.startsWith(`${groupId}:`)) {
        store.groupStandingResults.delete(key);
      }
    }

    for (const standing of standings) {
      store.groupStandingResults.set(`${groupId}:${standing.teamId}`, cloneGroupStandingResult(standing));
    }

    return standings.map(cloneGroupStandingResult);
  };

  return {
    listGroupStandingResults,
    saveGroupStandingResults
  };
};
