export type Group = {
  id: string;
  name: string;
  teams: string[];
};

export type Match = {
  id: string;
  group: string;
  home: string;
  away: string;
};

export type MatchScore = {
  home: number;
  away: number;
};

export type Participant = {
  name: string;
  points: number;
  exactScores: number;
};

export type RoomSummary = {
  id: string;
  name: string;
  joinCode: string;
  participantsCount: number;
  deadlineLabel: string;
};

export type CreateRoomInput = {
  name: string;
  password: string;
};

export const groups: Group[] = [
  {
    id: "a",
    name: "Группа A",
    teams: ["A1", "A2", "A3", "A4"]
  },
  {
    id: "b",
    name: "Группа B",
    teams: ["B1", "B2", "B3", "B4"]
  }
];

export const matches: Match[] = [
  { id: "a-1", group: "Группа A", home: "A1", away: "A2" },
  { id: "a-2", group: "Группа A", home: "A3", away: "A4" },
  { id: "b-1", group: "Группа B", home: "B1", away: "B2" },
  { id: "b-2", group: "Группа B", home: "B3", away: "B4" }
];

export const participants: Participant[] = [
  { name: "Алексей", points: 18, exactScores: 4 },
  { name: "Марта", points: 16, exactScores: 3 },
  { name: "Никита", points: 16, exactScores: 2 }
];

export const firstRoom: RoomSummary = {
  id: "chm-druzya",
  name: "ЧМ у друзей",
  joinCode: "chm-druzya",
  participantsCount: participants.length,
  deadlineLabel: "до 15 июня, 20:00"
};

export const initialStandings = Object.fromEntries(
  groups.flatMap((group) => group.teams.map((team, index) => [team, index + 1]))
) as Record<string, number>;

export const initialScores = Object.fromEntries(
  matches.map((match) => [match.id, { home: 0, away: 0 }])
) as Record<string, MatchScore>;
