import type { GroupStandingPrediction } from "@footballvanga/shared";

import type { GroupStandingResultRepository } from "./groupStandingResultRepository.js";
import type { InMemoryFootballStore, StoredGroupStandingResult } from "./inMemoryRoomRepository.js";
import { TOURNAMENT_GROUP_TEAM_IDS } from "./tournamentMetadata.js";

const cloneGroupStandingResult = (standing: GroupStandingPrediction): GroupStandingPrediction => ({
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

const cloneStoredGroupStandingResult = (
  standing: GroupStandingPrediction,
  source: StoredGroupStandingResult["source"]
): StoredGroupStandingResult => ({
  ...standing,
  source
});

const areStandingsEqual = (leftStandings: GroupStandingPrediction[], rightStandings: GroupStandingPrediction[]) => {
  if (leftStandings.length !== rightStandings.length) {
    return false;
  }

  const sortedLeftStandings = [...leftStandings].sort(compareGroupStandingResults);
  const sortedRightStandings = [...rightStandings].sort(compareGroupStandingResults);

  return sortedLeftStandings.every((leftStanding, index) => {
    const rightStanding = sortedRightStandings[index];

    return (
      rightStanding &&
      leftStanding.groupId === rightStanding.groupId &&
      leftStanding.teamId === rightStanding.teamId &&
      leftStanding.position === rightStanding.position
    );
  });
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
      store.groupStandingResults.set(`${groupId}:${standing.teamId}`, cloneStoredGroupStandingResult(standing, "manual"));
    }

    return standings.map(cloneGroupStandingResult);
  };

  const saveImportedGroupStandingResults: GroupStandingResultRepository["saveImportedGroupStandingResults"] = async ({
    groupId,
    standings
  }) => {
    if (!TOURNAMENT_GROUP_TEAM_IDS[groupId]) {
      return null;
    }

    const existingStandings = Array.from(store.groupStandingResults.values())
      .filter((standing) => standing.groupId === groupId)
      .sort(compareGroupStandingResults);

    if (existingStandings.some((standing) => standing.source === "manual")) {
      return {
        result: existingStandings.map(cloneGroupStandingResult),
        status: "skipped_manual"
      };
    }

    if (existingStandings.length > 0 && areStandingsEqual(existingStandings, standings)) {
      return {
        result: existingStandings.map(cloneGroupStandingResult),
        status: "unchanged"
      };
    }

    for (const key of Array.from(store.groupStandingResults.keys())) {
      if (key.startsWith(`${groupId}:`)) {
        store.groupStandingResults.delete(key);
      }
    }

    for (const standing of standings) {
      store.groupStandingResults.set(`${groupId}:${standing.teamId}`, cloneStoredGroupStandingResult(standing, "import"));
    }

    return {
      result: standings.map(cloneGroupStandingResult),
      status: existingStandings.length ? "updated" : "created"
    };
  };

  return {
    listGroupStandingResults,
    saveImportedGroupStandingResults,
    saveGroupStandingResults
  };
};
