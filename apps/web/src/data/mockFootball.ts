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

export type PredictionStatus = "saved" | "draft" | "empty";

export type RoomParticipant = Participant & {
  isCurrent?: boolean;
  predictionStatus: PredictionStatus;
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

export type GlobalLeader = {
  name: string;
  roomName: string;
  points: number;
  exactScores: number;
};

export const groups: Group[] = [
  {
    id: "a",
    name: "Группа A",
    teams: ["Mexico", "South Africa", "Korea Republic", "Czechia"]
  },
  {
    id: "b",
    name: "Группа B",
    teams: ["Canada", "Switzerland", "Qatar", "Bosnia and Herzegovina"]
  },
  {
    id: "c",
    name: "Группа C",
    teams: ["Brazil", "Morocco", "Haiti", "Scotland"]
  },
  {
    id: "d",
    name: "Группа D",
    teams: ["United States", "Paraguay", "Australia", "Turkiye"]
  },
  {
    id: "e",
    name: "Группа E",
    teams: ["Germany", "Curacao", "Cote d'Ivoire", "Ecuador"]
  },
  {
    id: "f",
    name: "Группа F",
    teams: ["Netherlands", "Japan", "Tunisia", "Sweden"]
  },
  {
    id: "g",
    name: "Группа G",
    teams: ["Belgium", "Egypt", "IR Iran", "New Zealand"]
  },
  {
    id: "h",
    name: "Группа H",
    teams: ["Spain", "Cabo Verde", "Saudi Arabia", "Uruguay"]
  },
  {
    id: "i",
    name: "Группа I",
    teams: ["France", "Senegal", "Norway", "Iraq"]
  },
  {
    id: "j",
    name: "Группа J",
    teams: ["Argentina", "Algeria", "Austria", "Jordan"]
  },
  {
    id: "k",
    name: "Группа K",
    teams: ["Portugal", "Uzbekistan", "Colombia", "Congo DR"]
  },
  {
    id: "l",
    name: "Группа L",
    teams: ["England", "Croatia", "Ghana", "Panama"]
  }
];

export const groupStageMatchCount = 72;

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

export const roomParticipants: RoomParticipant[] = [
  { name: "Алексей", points: 18, exactScores: 4, predictionStatus: "saved" },
  { name: "Марта", points: 16, exactScores: 3, predictionStatus: "saved" },
  { name: "Никита", points: 16, exactScores: 2, predictionStatus: "saved" },
  { name: "Вы", points: 0, exactScores: 0, isCurrent: true, predictionStatus: "draft" }
];

export const firstRoom: RoomSummary = {
  id: "chm-druzya",
  name: "ЧМ у друзей",
  joinCode: "chm-druzya",
  participantsCount: roomParticipants.length,
  deadlineLabel: "до 15 июня, 20:00"
};

export const globalLeaders: GlobalLeader[] = [
  { name: "Алексей", roomName: "ЧМ у друзей", points: 18, exactScores: 4 },
  { name: "Марта", roomName: "ЧМ у друзей", points: 16, exactScores: 3 },
  { name: "Никита", roomName: "ЧМ у друзей", points: 16, exactScores: 2 },
  { name: "Ира", roomName: "Офисная лига", points: 14, exactScores: 3 },
  { name: "Даня", roomName: "Дворовая сетка", points: 12, exactScores: 2 }
];

export const initialStandings = Object.fromEntries(
  groups.flatMap((group) => group.teams.map((team, index) => [team, index + 1]))
) as Record<string, number>;

export const initialScores = Object.fromEntries(
  matches.map((match) => [match.id, { home: 0, away: 0 }])
) as Record<string, MatchScore>;
