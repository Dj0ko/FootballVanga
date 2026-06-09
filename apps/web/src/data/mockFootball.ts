export type Group = {
  id: string;
  name: string;
  teams: string[];
};

export type Match = {
  id: string;
  group: string;
  date: string;
  home: string;
  away: string;
  startsAtIso: string;
  venue: string;
};

export type MatchScore = {
  home: number | "";
  away: number | "";
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

type MatchFixture = Omit<Match, "startsAtIso">;

const matchStartsAtIsoById: Record<string, string> = {
  "a-1": "2026-06-11T19:00:00Z",
  "a-2": "2026-06-12T02:00:00Z",
  "a-3": "2026-06-18T16:00:00Z",
  "a-4": "2026-06-19T01:00:00Z",
  "a-5": "2026-06-25T01:00:00Z",
  "a-6": "2026-06-25T01:00:00Z",
  "b-1": "2026-06-12T19:00:00Z",
  "b-2": "2026-06-13T19:00:00Z",
  "b-3": "2026-06-18T19:00:00Z",
  "b-4": "2026-06-18T22:00:00Z",
  "b-5": "2026-06-24T19:00:00Z",
  "b-6": "2026-06-24T19:00:00Z",
  "c-1": "2026-06-13T22:00:00Z",
  "c-2": "2026-06-14T01:00:00Z",
  "c-3": "2026-06-19T22:00:00Z",
  "c-4": "2026-06-20T00:30:00Z",
  "c-5": "2026-06-24T22:00:00Z",
  "c-6": "2026-06-24T22:00:00Z",
  "d-1": "2026-06-13T01:00:00Z",
  "d-2": "2026-06-14T04:00:00Z",
  "d-3": "2026-06-20T03:00:00Z",
  "d-4": "2026-06-19T19:00:00Z",
  "d-5": "2026-06-26T02:00:00Z",
  "d-6": "2026-06-26T02:00:00Z",
  "e-1": "2026-06-14T23:00:00Z",
  "e-2": "2026-06-14T17:00:00Z",
  "e-3": "2026-06-20T20:00:00Z",
  "e-4": "2026-06-21T00:00:00Z",
  "e-5": "2026-06-25T20:00:00Z",
  "e-6": "2026-06-25T20:00:00Z",
  "f-1": "2026-06-14T20:00:00Z",
  "f-2": "2026-06-15T02:00:00Z",
  "f-3": "2026-06-20T17:00:00Z",
  "f-4": "2026-06-21T04:00:00Z",
  "f-5": "2026-06-25T23:00:00Z",
  "f-6": "2026-06-25T23:00:00Z",
  "g-1": "2026-06-16T01:00:00Z",
  "g-2": "2026-06-15T19:00:00Z",
  "g-3": "2026-06-21T19:00:00Z",
  "g-4": "2026-06-22T01:00:00Z",
  "g-5": "2026-06-27T03:00:00Z",
  "g-6": "2026-06-27T03:00:00Z",
  "h-1": "2026-06-15T22:00:00Z",
  "h-2": "2026-06-15T16:00:00Z",
  "h-3": "2026-06-21T22:00:00Z",
  "h-4": "2026-06-21T16:00:00Z",
  "h-5": "2026-06-27T00:00:00Z",
  "h-6": "2026-06-27T00:00:00Z",
  "i-1": "2026-06-16T19:00:00Z",
  "i-2": "2026-06-16T22:00:00Z",
  "i-3": "2026-06-23T00:00:00Z",
  "i-4": "2026-06-22T21:00:00Z",
  "i-5": "2026-06-26T19:00:00Z",
  "i-6": "2026-06-26T19:00:00Z",
  "j-1": "2026-06-17T01:00:00Z",
  "j-2": "2026-06-17T04:00:00Z",
  "j-3": "2026-06-22T17:00:00Z",
  "j-4": "2026-06-23T03:00:00Z",
  "j-5": "2026-06-28T02:00:00Z",
  "j-6": "2026-06-28T02:00:00Z",
  "k-1": "2026-06-17T17:00:00Z",
  "k-2": "2026-06-18T02:00:00Z",
  "k-3": "2026-06-23T17:00:00Z",
  "k-4": "2026-06-24T02:00:00Z",
  "k-5": "2026-06-27T23:30:00Z",
  "k-6": "2026-06-27T23:30:00Z",
  "l-1": "2026-06-17T23:00:00Z",
  "l-2": "2026-06-17T20:00:00Z",
  "l-3": "2026-06-23T20:00:00Z",
  "l-4": "2026-06-23T23:00:00Z",
  "l-5": "2026-06-27T21:00:00Z",
  "l-6": "2026-06-27T21:00:00Z"
};

const matchFixtures: MatchFixture[] = [
  {
    id: "a-1",
    group: "Группа A",
    date: "2026-06-11",
    home: "Mexico",
    away: "South Africa",
    venue: "Estadio Azteca, Mexico City"
  },
  {
    id: "a-2",
    group: "Группа A",
    date: "2026-06-11",
    home: "Korea Republic",
    away: "Czechia",
    venue: "Estadio Akron, Zapopan"
  },
  {
    id: "a-3",
    group: "Группа A",
    date: "2026-06-18",
    home: "Czechia",
    away: "South Africa",
    venue: "Mercedes-Benz Stadium, Atlanta"
  },
  {
    id: "a-4",
    group: "Группа A",
    date: "2026-06-18",
    home: "Mexico",
    away: "Korea Republic",
    venue: "Estadio Akron, Zapopan"
  },
  {
    id: "a-5",
    group: "Группа A",
    date: "2026-06-24",
    home: "Czechia",
    away: "Mexico",
    venue: "Estadio Azteca, Mexico City"
  },
  {
    id: "a-6",
    group: "Группа A",
    date: "2026-06-24",
    home: "South Africa",
    away: "Korea Republic",
    venue: "Estadio BBVA, Guadalupe"
  },
  {
    id: "b-1",
    group: "Группа B",
    date: "2026-06-12",
    home: "Canada",
    away: "Bosnia and Herzegovina",
    venue: "BMO Field, Toronto"
  },
  {
    id: "b-2",
    group: "Группа B",
    date: "2026-06-13",
    home: "Qatar",
    away: "Switzerland",
    venue: "Levi's Stadium, Santa Clara"
  },
  {
    id: "b-3",
    group: "Группа B",
    date: "2026-06-18",
    home: "Switzerland",
    away: "Bosnia and Herzegovina",
    venue: "SoFi Stadium, Inglewood"
  },
  {
    id: "b-4",
    group: "Группа B",
    date: "2026-06-18",
    home: "Canada",
    away: "Qatar",
    venue: "BC Place, Vancouver"
  },
  {
    id: "b-5",
    group: "Группа B",
    date: "2026-06-24",
    home: "Switzerland",
    away: "Canada",
    venue: "BC Place, Vancouver"
  },
  {
    id: "b-6",
    group: "Группа B",
    date: "2026-06-24",
    home: "Bosnia and Herzegovina",
    away: "Qatar",
    venue: "Lumen Field, Seattle"
  },
  {
    id: "c-1",
    group: "Группа C",
    date: "2026-06-13",
    home: "Brazil",
    away: "Morocco",
    venue: "Gillette Stadium, Foxborough"
  },
  {
    id: "c-2",
    group: "Группа C",
    date: "2026-06-13",
    home: "Haiti",
    away: "Scotland",
    venue: "MetLife Stadium, East Rutherford"
  },
  {
    id: "c-3",
    group: "Группа C",
    date: "2026-06-19",
    home: "Scotland",
    away: "Morocco",
    venue: "Lincoln Financial Field, Philadelphia"
  },
  {
    id: "c-4",
    group: "Группа C",
    date: "2026-06-19",
    home: "Brazil",
    away: "Haiti",
    venue: "Gillette Stadium, Foxborough"
  },
  {
    id: "c-5",
    group: "Группа C",
    date: "2026-06-24",
    home: "Scotland",
    away: "Brazil",
    venue: "Hard Rock Stadium, Miami Gardens"
  },
  {
    id: "c-6",
    group: "Группа C",
    date: "2026-06-24",
    home: "Morocco",
    away: "Haiti",
    venue: "Mercedes-Benz Stadium, Atlanta"
  },
  {
    id: "d-1",
    group: "Группа D",
    date: "2026-06-12",
    home: "United States",
    away: "Paraguay",
    venue: "SoFi Stadium, Inglewood"
  },
  {
    id: "d-2",
    group: "Группа D",
    date: "2026-06-13",
    home: "Australia",
    away: "Turkiye",
    venue: "BC Place, Vancouver"
  },
  {
    id: "d-3",
    group: "Группа D",
    date: "2026-06-19",
    home: "Turkiye",
    away: "Paraguay",
    venue: "Levi's Stadium, Santa Clara"
  },
  {
    id: "d-4",
    group: "Группа D",
    date: "2026-06-19",
    home: "United States",
    away: "Australia",
    venue: "Lumen Field, Seattle"
  },
  {
    id: "d-5",
    group: "Группа D",
    date: "2026-06-25",
    home: "Turkiye",
    away: "United States",
    venue: "SoFi Stadium, Inglewood"
  },
  {
    id: "d-6",
    group: "Группа D",
    date: "2026-06-25",
    home: "Paraguay",
    away: "Australia",
    venue: "Levi's Stadium, Santa Clara"
  },
  {
    id: "e-1",
    group: "Группа E",
    date: "2026-06-14",
    home: "Cote d'Ivoire",
    away: "Ecuador",
    venue: "Lincoln Financial Field, Philadelphia"
  },
  {
    id: "e-2",
    group: "Группа E",
    date: "2026-06-14",
    home: "Germany",
    away: "Curacao",
    venue: "NRG Stadium, Houston"
  },
  {
    id: "e-3",
    group: "Группа E",
    date: "2026-06-20",
    home: "Germany",
    away: "Cote d'Ivoire",
    venue: "BMO Field, Toronto"
  },
  {
    id: "e-4",
    group: "Группа E",
    date: "2026-06-20",
    home: "Ecuador",
    away: "Curacao",
    venue: "Arrowhead Stadium, Kansas City"
  },
  {
    id: "e-5",
    group: "Группа E",
    date: "2026-06-25",
    home: "Curacao",
    away: "Cote d'Ivoire",
    venue: "Lincoln Financial Field, Philadelphia"
  },
  {
    id: "e-6",
    group: "Группа E",
    date: "2026-06-25",
    home: "Ecuador",
    away: "Germany",
    venue: "MetLife Stadium, East Rutherford"
  },
  {
    id: "f-1",
    group: "Группа F",
    date: "2026-06-14",
    home: "Netherlands",
    away: "Japan",
    venue: "AT&T Stadium, Arlington"
  },
  {
    id: "f-2",
    group: "Группа F",
    date: "2026-06-14",
    home: "Sweden",
    away: "Tunisia",
    venue: "Estadio BBVA, Guadalupe"
  },
  {
    id: "f-3",
    group: "Группа F",
    date: "2026-06-20",
    home: "Netherlands",
    away: "Sweden",
    venue: "NRG Stadium, Houston"
  },
  {
    id: "f-4",
    group: "Группа F",
    date: "2026-06-20",
    home: "Tunisia",
    away: "Japan",
    venue: "Estadio BBVA, Guadalupe"
  },
  {
    id: "f-5",
    group: "Группа F",
    date: "2026-06-25",
    home: "Japan",
    away: "Sweden",
    venue: "AT&T Stadium, Arlington"
  },
  {
    id: "f-6",
    group: "Группа F",
    date: "2026-06-25",
    home: "Tunisia",
    away: "Netherlands",
    venue: "Arrowhead Stadium, Kansas City"
  },
  {
    id: "g-1",
    group: "Группа G",
    date: "2026-06-15",
    home: "IR Iran",
    away: "New Zealand",
    venue: "SoFi Stadium, Inglewood"
  },
  {
    id: "g-2",
    group: "Группа G",
    date: "2026-06-15",
    home: "Belgium",
    away: "Egypt",
    venue: "Lumen Field, Seattle"
  },
  {
    id: "g-3",
    group: "Группа G",
    date: "2026-06-21",
    home: "Belgium",
    away: "IR Iran",
    venue: "SoFi Stadium, Inglewood"
  },
  {
    id: "g-4",
    group: "Группа G",
    date: "2026-06-21",
    home: "New Zealand",
    away: "Egypt",
    venue: "BC Place, Vancouver"
  },
  {
    id: "g-5",
    group: "Группа G",
    date: "2026-06-26",
    home: "Egypt",
    away: "IR Iran",
    venue: "Lumen Field, Seattle"
  },
  {
    id: "g-6",
    group: "Группа G",
    date: "2026-06-26",
    home: "New Zealand",
    away: "Belgium",
    venue: "BC Place, Vancouver"
  },
  {
    id: "h-1",
    group: "Группа H",
    date: "2026-06-15",
    home: "Saudi Arabia",
    away: "Uruguay",
    venue: "Hard Rock Stadium, Miami Gardens"
  },
  {
    id: "h-2",
    group: "Группа H",
    date: "2026-06-15",
    home: "Spain",
    away: "Cabo Verde",
    venue: "Mercedes-Benz Stadium, Atlanta"
  },
  {
    id: "h-3",
    group: "Группа H",
    date: "2026-06-21",
    home: "Uruguay",
    away: "Cabo Verde",
    venue: "Hard Rock Stadium, Miami Gardens"
  },
  {
    id: "h-4",
    group: "Группа H",
    date: "2026-06-21",
    home: "Spain",
    away: "Saudi Arabia",
    venue: "Mercedes-Benz Stadium, Atlanta"
  },
  {
    id: "h-5",
    group: "Группа H",
    date: "2026-06-26",
    home: "Cabo Verde",
    away: "Saudi Arabia",
    venue: "NRG Stadium, Houston"
  },
  {
    id: "h-6",
    group: "Группа H",
    date: "2026-06-26",
    home: "Uruguay",
    away: "Spain",
    venue: "Estadio Akron, Zapopan"
  },
  {
    id: "i-1",
    group: "Группа I",
    date: "2026-06-16",
    home: "France",
    away: "Senegal",
    venue: "MetLife Stadium, East Rutherford"
  },
  {
    id: "i-2",
    group: "Группа I",
    date: "2026-06-16",
    home: "Iraq",
    away: "Norway",
    venue: "Gillette Stadium, Foxborough"
  },
  {
    id: "i-3",
    group: "Группа I",
    date: "2026-06-22",
    home: "Norway",
    away: "Senegal",
    venue: "MetLife Stadium, East Rutherford"
  },
  {
    id: "i-4",
    group: "Группа I",
    date: "2026-06-22",
    home: "France",
    away: "Iraq",
    venue: "Lincoln Financial Field, Philadelphia"
  },
  {
    id: "i-5",
    group: "Группа I",
    date: "2026-06-26",
    home: "Norway",
    away: "France",
    venue: "Gillette Stadium, Foxborough"
  },
  {
    id: "i-6",
    group: "Группа I",
    date: "2026-06-26",
    home: "Senegal",
    away: "Iraq",
    venue: "BMO Field, Toronto"
  },
  {
    id: "j-1",
    group: "Группа J",
    date: "2026-06-16",
    home: "Argentina",
    away: "Algeria",
    venue: "Arrowhead Stadium, Kansas City"
  },
  {
    id: "j-2",
    group: "Группа J",
    date: "2026-06-16",
    home: "Austria",
    away: "Jordan",
    venue: "Levi's Stadium, Santa Clara"
  },
  {
    id: "j-3",
    group: "Группа J",
    date: "2026-06-22",
    home: "Argentina",
    away: "Austria",
    venue: "AT&T Stadium, Arlington"
  },
  {
    id: "j-4",
    group: "Группа J",
    date: "2026-06-22",
    home: "Jordan",
    away: "Algeria",
    venue: "Levi's Stadium, Santa Clara"
  },
  {
    id: "j-5",
    group: "Группа J",
    date: "2026-06-27",
    home: "Algeria",
    away: "Austria",
    venue: "Arrowhead Stadium, Kansas City"
  },
  {
    id: "j-6",
    group: "Группа J",
    date: "2026-06-27",
    home: "Jordan",
    away: "Argentina",
    venue: "AT&T Stadium, Arlington"
  },
  {
    id: "k-1",
    group: "Группа K",
    date: "2026-06-17",
    home: "Portugal",
    away: "Congo DR",
    venue: "NRG Stadium, Houston"
  },
  {
    id: "k-2",
    group: "Группа K",
    date: "2026-06-17",
    home: "Uzbekistan",
    away: "Colombia",
    venue: "Estadio Azteca, Mexico City"
  },
  {
    id: "k-3",
    group: "Группа K",
    date: "2026-06-23",
    home: "Portugal",
    away: "Uzbekistan",
    venue: "NRG Stadium, Houston"
  },
  {
    id: "k-4",
    group: "Группа K",
    date: "2026-06-23",
    home: "Colombia",
    away: "Congo DR",
    venue: "Estadio Akron, Zapopan"
  },
  {
    id: "k-5",
    group: "Группа K",
    date: "2026-06-27",
    home: "Colombia",
    away: "Portugal",
    venue: "Hard Rock Stadium, Miami Gardens"
  },
  {
    id: "k-6",
    group: "Группа K",
    date: "2026-06-27",
    home: "Congo DR",
    away: "Uzbekistan",
    venue: "Mercedes-Benz Stadium, Atlanta"
  },
  {
    id: "l-1",
    group: "Группа L",
    date: "2026-06-17",
    home: "Ghana",
    away: "Panama",
    venue: "BMO Field, Toronto"
  },
  {
    id: "l-2",
    group: "Группа L",
    date: "2026-06-17",
    home: "England",
    away: "Croatia",
    venue: "AT&T Stadium, Arlington"
  },
  {
    id: "l-3",
    group: "Группа L",
    date: "2026-06-23",
    home: "England",
    away: "Ghana",
    venue: "Gillette Stadium, Foxborough"
  },
  {
    id: "l-4",
    group: "Группа L",
    date: "2026-06-23",
    home: "Panama",
    away: "Croatia",
    venue: "BMO Field, Toronto"
  },
  {
    id: "l-5",
    group: "Группа L",
    date: "2026-06-27",
    home: "Panama",
    away: "England",
    venue: "MetLife Stadium, East Rutherford"
  },
  {
    id: "l-6",
    group: "Группа L",
    date: "2026-06-27",
    home: "Croatia",
    away: "Ghana",
    venue: "Lincoln Financial Field, Philadelphia"
  }
];

export const matches: Match[] = matchFixtures.map((match) => ({
  ...match,
  startsAtIso: matchStartsAtIsoById[match.id] ?? `${match.date}T00:00:00Z`
}));

export const groupStageMatchCount = matches.length;

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
  matches.map((match) => [match.id, { home: "", away: "" }])
) as Record<string, MatchScore>;
