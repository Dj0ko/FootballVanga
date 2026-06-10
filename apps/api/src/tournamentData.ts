import type { Match, TournamentData, TournamentGroup } from "@footballvanga/shared";

export const STATIC_TOURNAMENT_GROUPS: TournamentGroup[] = [
  {
    id: "a",
    name: "Группа A",
    teams: [
      { groupId: "a", id: "mexico", name: "Mexico" },
      { groupId: "a", id: "south-africa", name: "South Africa" },
      { groupId: "a", id: "korea-republic", name: "Korea Republic" },
      { groupId: "a", id: "czechia", name: "Czechia" }
    ]
  },
  {
    id: "b",
    name: "Группа B",
    teams: [
      { groupId: "b", id: "canada", name: "Canada" },
      { groupId: "b", id: "switzerland", name: "Switzerland" },
      { groupId: "b", id: "qatar", name: "Qatar" },
      { groupId: "b", id: "bosnia-and-herzegovina", name: "Bosnia and Herzegovina" }
    ]
  },
  {
    id: "c",
    name: "Группа C",
    teams: [
      { groupId: "c", id: "brazil", name: "Brazil" },
      { groupId: "c", id: "morocco", name: "Morocco" },
      { groupId: "c", id: "haiti", name: "Haiti" },
      { groupId: "c", id: "scotland", name: "Scotland" }
    ]
  },
  {
    id: "d",
    name: "Группа D",
    teams: [
      { groupId: "d", id: "united-states", name: "United States" },
      { groupId: "d", id: "paraguay", name: "Paraguay" },
      { groupId: "d", id: "australia", name: "Australia" },
      { groupId: "d", id: "turkiye", name: "Turkiye" }
    ]
  },
  {
    id: "e",
    name: "Группа E",
    teams: [
      { groupId: "e", id: "germany", name: "Germany" },
      { groupId: "e", id: "curacao", name: "Curacao" },
      { groupId: "e", id: "cote-divoire", name: "Cote d'Ivoire" },
      { groupId: "e", id: "ecuador", name: "Ecuador" }
    ]
  },
  {
    id: "f",
    name: "Группа F",
    teams: [
      { groupId: "f", id: "netherlands", name: "Netherlands" },
      { groupId: "f", id: "japan", name: "Japan" },
      { groupId: "f", id: "tunisia", name: "Tunisia" },
      { groupId: "f", id: "sweden", name: "Sweden" }
    ]
  },
  {
    id: "g",
    name: "Группа G",
    teams: [
      { groupId: "g", id: "belgium", name: "Belgium" },
      { groupId: "g", id: "egypt", name: "Egypt" },
      { groupId: "g", id: "ir-iran", name: "IR Iran" },
      { groupId: "g", id: "new-zealand", name: "New Zealand" }
    ]
  },
  {
    id: "h",
    name: "Группа H",
    teams: [
      { groupId: "h", id: "spain", name: "Spain" },
      { groupId: "h", id: "cabo-verde", name: "Cabo Verde" },
      { groupId: "h", id: "saudi-arabia", name: "Saudi Arabia" },
      { groupId: "h", id: "uruguay", name: "Uruguay" }
    ]
  },
  {
    id: "i",
    name: "Группа I",
    teams: [
      { groupId: "i", id: "france", name: "France" },
      { groupId: "i", id: "senegal", name: "Senegal" },
      { groupId: "i", id: "norway", name: "Norway" },
      { groupId: "i", id: "iraq", name: "Iraq" }
    ]
  },
  {
    id: "j",
    name: "Группа J",
    teams: [
      { groupId: "j", id: "argentina", name: "Argentina" },
      { groupId: "j", id: "algeria", name: "Algeria" },
      { groupId: "j", id: "austria", name: "Austria" },
      { groupId: "j", id: "jordan", name: "Jordan" }
    ]
  },
  {
    id: "k",
    name: "Группа K",
    teams: [
      { groupId: "k", id: "portugal", name: "Portugal" },
      { groupId: "k", id: "uzbekistan", name: "Uzbekistan" },
      { groupId: "k", id: "colombia", name: "Colombia" },
      { groupId: "k", id: "congo-dr", name: "Congo DR" }
    ]
  },
  {
    id: "l",
    name: "Группа L",
    teams: [
      { groupId: "l", id: "england", name: "England" },
      { groupId: "l", id: "croatia", name: "Croatia" },
      { groupId: "l", id: "ghana", name: "Ghana" },
      { groupId: "l", id: "panama", name: "Panama" }
    ]
  }
];

export const STATIC_TOURNAMENT_MATCHES: Match[] = [
  {
    awayTeamId: "south-africa",
    groupId: "a",
    homeTeamId: "mexico",
    id: "a-1",
    startsAtIso: "2026-06-11T19:00:00Z",
    venue: "Estadio Azteca, Mexico City"
  },
  {
    awayTeamId: "czechia",
    groupId: "a",
    homeTeamId: "korea-republic",
    id: "a-2",
    startsAtIso: "2026-06-12T02:00:00Z",
    venue: "Estadio Akron, Zapopan"
  },
  {
    awayTeamId: "south-africa",
    groupId: "a",
    homeTeamId: "czechia",
    id: "a-3",
    startsAtIso: "2026-06-18T16:00:00Z",
    venue: "Mercedes-Benz Stadium, Atlanta"
  },
  {
    awayTeamId: "korea-republic",
    groupId: "a",
    homeTeamId: "mexico",
    id: "a-4",
    startsAtIso: "2026-06-19T01:00:00Z",
    venue: "Estadio Akron, Zapopan"
  },
  {
    awayTeamId: "mexico",
    groupId: "a",
    homeTeamId: "czechia",
    id: "a-5",
    startsAtIso: "2026-06-25T01:00:00Z",
    venue: "Estadio Azteca, Mexico City"
  },
  {
    awayTeamId: "korea-republic",
    groupId: "a",
    homeTeamId: "south-africa",
    id: "a-6",
    startsAtIso: "2026-06-25T01:00:00Z",
    venue: "Estadio BBVA, Guadalupe"
  },
  {
    awayTeamId: "bosnia-and-herzegovina",
    groupId: "b",
    homeTeamId: "canada",
    id: "b-1",
    startsAtIso: "2026-06-12T19:00:00Z",
    venue: "BMO Field, Toronto"
  },
  {
    awayTeamId: "switzerland",
    groupId: "b",
    homeTeamId: "qatar",
    id: "b-2",
    startsAtIso: "2026-06-13T19:00:00Z",
    venue: "Levi's Stadium, Santa Clara"
  },
  {
    awayTeamId: "bosnia-and-herzegovina",
    groupId: "b",
    homeTeamId: "switzerland",
    id: "b-3",
    startsAtIso: "2026-06-18T19:00:00Z",
    venue: "SoFi Stadium, Inglewood"
  },
  {
    awayTeamId: "qatar",
    groupId: "b",
    homeTeamId: "canada",
    id: "b-4",
    startsAtIso: "2026-06-18T22:00:00Z",
    venue: "BC Place, Vancouver"
  },
  {
    awayTeamId: "canada",
    groupId: "b",
    homeTeamId: "switzerland",
    id: "b-5",
    startsAtIso: "2026-06-24T19:00:00Z",
    venue: "BC Place, Vancouver"
  },
  {
    awayTeamId: "qatar",
    groupId: "b",
    homeTeamId: "bosnia-and-herzegovina",
    id: "b-6",
    startsAtIso: "2026-06-24T19:00:00Z",
    venue: "Lumen Field, Seattle"
  },
  {
    awayTeamId: "morocco",
    groupId: "c",
    homeTeamId: "brazil",
    id: "c-1",
    startsAtIso: "2026-06-13T22:00:00Z",
    venue: "Gillette Stadium, Foxborough"
  },
  {
    awayTeamId: "scotland",
    groupId: "c",
    homeTeamId: "haiti",
    id: "c-2",
    startsAtIso: "2026-06-14T01:00:00Z",
    venue: "MetLife Stadium, East Rutherford"
  },
  {
    awayTeamId: "morocco",
    groupId: "c",
    homeTeamId: "scotland",
    id: "c-3",
    startsAtIso: "2026-06-19T22:00:00Z",
    venue: "Lincoln Financial Field, Philadelphia"
  },
  {
    awayTeamId: "haiti",
    groupId: "c",
    homeTeamId: "brazil",
    id: "c-4",
    startsAtIso: "2026-06-20T00:30:00Z",
    venue: "Gillette Stadium, Foxborough"
  },
  {
    awayTeamId: "brazil",
    groupId: "c",
    homeTeamId: "scotland",
    id: "c-5",
    startsAtIso: "2026-06-24T22:00:00Z",
    venue: "Hard Rock Stadium, Miami Gardens"
  },
  {
    awayTeamId: "haiti",
    groupId: "c",
    homeTeamId: "morocco",
    id: "c-6",
    startsAtIso: "2026-06-24T22:00:00Z",
    venue: "Mercedes-Benz Stadium, Atlanta"
  },
  {
    awayTeamId: "paraguay",
    groupId: "d",
    homeTeamId: "united-states",
    id: "d-1",
    startsAtIso: "2026-06-13T01:00:00Z",
    venue: "SoFi Stadium, Inglewood"
  },
  {
    awayTeamId: "turkiye",
    groupId: "d",
    homeTeamId: "australia",
    id: "d-2",
    startsAtIso: "2026-06-14T04:00:00Z",
    venue: "BC Place, Vancouver"
  },
  {
    awayTeamId: "paraguay",
    groupId: "d",
    homeTeamId: "turkiye",
    id: "d-3",
    startsAtIso: "2026-06-20T03:00:00Z",
    venue: "Levi's Stadium, Santa Clara"
  },
  {
    awayTeamId: "australia",
    groupId: "d",
    homeTeamId: "united-states",
    id: "d-4",
    startsAtIso: "2026-06-19T19:00:00Z",
    venue: "Lumen Field, Seattle"
  },
  {
    awayTeamId: "united-states",
    groupId: "d",
    homeTeamId: "turkiye",
    id: "d-5",
    startsAtIso: "2026-06-26T02:00:00Z",
    venue: "SoFi Stadium, Inglewood"
  },
  {
    awayTeamId: "australia",
    groupId: "d",
    homeTeamId: "paraguay",
    id: "d-6",
    startsAtIso: "2026-06-26T02:00:00Z",
    venue: "Levi's Stadium, Santa Clara"
  },
  {
    awayTeamId: "ecuador",
    groupId: "e",
    homeTeamId: "cote-divoire",
    id: "e-1",
    startsAtIso: "2026-06-14T23:00:00Z",
    venue: "Lincoln Financial Field, Philadelphia"
  },
  {
    awayTeamId: "curacao",
    groupId: "e",
    homeTeamId: "germany",
    id: "e-2",
    startsAtIso: "2026-06-14T17:00:00Z",
    venue: "NRG Stadium, Houston"
  },
  {
    awayTeamId: "cote-divoire",
    groupId: "e",
    homeTeamId: "germany",
    id: "e-3",
    startsAtIso: "2026-06-20T20:00:00Z",
    venue: "BMO Field, Toronto"
  },
  {
    awayTeamId: "curacao",
    groupId: "e",
    homeTeamId: "ecuador",
    id: "e-4",
    startsAtIso: "2026-06-21T00:00:00Z",
    venue: "Arrowhead Stadium, Kansas City"
  },
  {
    awayTeamId: "cote-divoire",
    groupId: "e",
    homeTeamId: "curacao",
    id: "e-5",
    startsAtIso: "2026-06-25T20:00:00Z",
    venue: "Lincoln Financial Field, Philadelphia"
  },
  {
    awayTeamId: "germany",
    groupId: "e",
    homeTeamId: "ecuador",
    id: "e-6",
    startsAtIso: "2026-06-25T20:00:00Z",
    venue: "MetLife Stadium, East Rutherford"
  },
  {
    awayTeamId: "japan",
    groupId: "f",
    homeTeamId: "netherlands",
    id: "f-1",
    startsAtIso: "2026-06-14T20:00:00Z",
    venue: "AT&T Stadium, Arlington"
  },
  {
    awayTeamId: "tunisia",
    groupId: "f",
    homeTeamId: "sweden",
    id: "f-2",
    startsAtIso: "2026-06-15T02:00:00Z",
    venue: "Estadio BBVA, Guadalupe"
  },
  {
    awayTeamId: "sweden",
    groupId: "f",
    homeTeamId: "netherlands",
    id: "f-3",
    startsAtIso: "2026-06-20T17:00:00Z",
    venue: "NRG Stadium, Houston"
  },
  {
    awayTeamId: "japan",
    groupId: "f",
    homeTeamId: "tunisia",
    id: "f-4",
    startsAtIso: "2026-06-21T04:00:00Z",
    venue: "Estadio BBVA, Guadalupe"
  },
  {
    awayTeamId: "sweden",
    groupId: "f",
    homeTeamId: "japan",
    id: "f-5",
    startsAtIso: "2026-06-25T23:00:00Z",
    venue: "AT&T Stadium, Arlington"
  },
  {
    awayTeamId: "netherlands",
    groupId: "f",
    homeTeamId: "tunisia",
    id: "f-6",
    startsAtIso: "2026-06-25T23:00:00Z",
    venue: "Arrowhead Stadium, Kansas City"
  },
  {
    awayTeamId: "new-zealand",
    groupId: "g",
    homeTeamId: "ir-iran",
    id: "g-1",
    startsAtIso: "2026-06-16T01:00:00Z",
    venue: "SoFi Stadium, Inglewood"
  },
  {
    awayTeamId: "egypt",
    groupId: "g",
    homeTeamId: "belgium",
    id: "g-2",
    startsAtIso: "2026-06-15T19:00:00Z",
    venue: "Lumen Field, Seattle"
  },
  {
    awayTeamId: "ir-iran",
    groupId: "g",
    homeTeamId: "belgium",
    id: "g-3",
    startsAtIso: "2026-06-21T19:00:00Z",
    venue: "SoFi Stadium, Inglewood"
  },
  {
    awayTeamId: "egypt",
    groupId: "g",
    homeTeamId: "new-zealand",
    id: "g-4",
    startsAtIso: "2026-06-22T01:00:00Z",
    venue: "BC Place, Vancouver"
  },
  {
    awayTeamId: "ir-iran",
    groupId: "g",
    homeTeamId: "egypt",
    id: "g-5",
    startsAtIso: "2026-06-27T03:00:00Z",
    venue: "Lumen Field, Seattle"
  },
  {
    awayTeamId: "belgium",
    groupId: "g",
    homeTeamId: "new-zealand",
    id: "g-6",
    startsAtIso: "2026-06-27T03:00:00Z",
    venue: "BC Place, Vancouver"
  },
  {
    awayTeamId: "uruguay",
    groupId: "h",
    homeTeamId: "saudi-arabia",
    id: "h-1",
    startsAtIso: "2026-06-15T22:00:00Z",
    venue: "Hard Rock Stadium, Miami Gardens"
  },
  {
    awayTeamId: "cabo-verde",
    groupId: "h",
    homeTeamId: "spain",
    id: "h-2",
    startsAtIso: "2026-06-15T16:00:00Z",
    venue: "Mercedes-Benz Stadium, Atlanta"
  },
  {
    awayTeamId: "cabo-verde",
    groupId: "h",
    homeTeamId: "uruguay",
    id: "h-3",
    startsAtIso: "2026-06-21T22:00:00Z",
    venue: "Hard Rock Stadium, Miami Gardens"
  },
  {
    awayTeamId: "saudi-arabia",
    groupId: "h",
    homeTeamId: "spain",
    id: "h-4",
    startsAtIso: "2026-06-21T16:00:00Z",
    venue: "Mercedes-Benz Stadium, Atlanta"
  },
  {
    awayTeamId: "saudi-arabia",
    groupId: "h",
    homeTeamId: "cabo-verde",
    id: "h-5",
    startsAtIso: "2026-06-27T00:00:00Z",
    venue: "NRG Stadium, Houston"
  },
  {
    awayTeamId: "spain",
    groupId: "h",
    homeTeamId: "uruguay",
    id: "h-6",
    startsAtIso: "2026-06-27T00:00:00Z",
    venue: "Estadio Akron, Zapopan"
  },
  {
    awayTeamId: "senegal",
    groupId: "i",
    homeTeamId: "france",
    id: "i-1",
    startsAtIso: "2026-06-16T19:00:00Z",
    venue: "MetLife Stadium, East Rutherford"
  },
  {
    awayTeamId: "norway",
    groupId: "i",
    homeTeamId: "iraq",
    id: "i-2",
    startsAtIso: "2026-06-16T22:00:00Z",
    venue: "Gillette Stadium, Foxborough"
  },
  {
    awayTeamId: "senegal",
    groupId: "i",
    homeTeamId: "norway",
    id: "i-3",
    startsAtIso: "2026-06-23T00:00:00Z",
    venue: "MetLife Stadium, East Rutherford"
  },
  {
    awayTeamId: "iraq",
    groupId: "i",
    homeTeamId: "france",
    id: "i-4",
    startsAtIso: "2026-06-22T21:00:00Z",
    venue: "Lincoln Financial Field, Philadelphia"
  },
  {
    awayTeamId: "france",
    groupId: "i",
    homeTeamId: "norway",
    id: "i-5",
    startsAtIso: "2026-06-26T19:00:00Z",
    venue: "Gillette Stadium, Foxborough"
  },
  {
    awayTeamId: "iraq",
    groupId: "i",
    homeTeamId: "senegal",
    id: "i-6",
    startsAtIso: "2026-06-26T19:00:00Z",
    venue: "BMO Field, Toronto"
  },
  {
    awayTeamId: "algeria",
    groupId: "j",
    homeTeamId: "argentina",
    id: "j-1",
    startsAtIso: "2026-06-17T01:00:00Z",
    venue: "Arrowhead Stadium, Kansas City"
  },
  {
    awayTeamId: "jordan",
    groupId: "j",
    homeTeamId: "austria",
    id: "j-2",
    startsAtIso: "2026-06-17T04:00:00Z",
    venue: "Levi's Stadium, Santa Clara"
  },
  {
    awayTeamId: "austria",
    groupId: "j",
    homeTeamId: "argentina",
    id: "j-3",
    startsAtIso: "2026-06-22T17:00:00Z",
    venue: "AT&T Stadium, Arlington"
  },
  {
    awayTeamId: "algeria",
    groupId: "j",
    homeTeamId: "jordan",
    id: "j-4",
    startsAtIso: "2026-06-23T03:00:00Z",
    venue: "Levi's Stadium, Santa Clara"
  },
  {
    awayTeamId: "austria",
    groupId: "j",
    homeTeamId: "algeria",
    id: "j-5",
    startsAtIso: "2026-06-28T02:00:00Z",
    venue: "Arrowhead Stadium, Kansas City"
  },
  {
    awayTeamId: "argentina",
    groupId: "j",
    homeTeamId: "jordan",
    id: "j-6",
    startsAtIso: "2026-06-28T02:00:00Z",
    venue: "AT&T Stadium, Arlington"
  },
  {
    awayTeamId: "congo-dr",
    groupId: "k",
    homeTeamId: "portugal",
    id: "k-1",
    startsAtIso: "2026-06-17T17:00:00Z",
    venue: "NRG Stadium, Houston"
  },
  {
    awayTeamId: "colombia",
    groupId: "k",
    homeTeamId: "uzbekistan",
    id: "k-2",
    startsAtIso: "2026-06-18T02:00:00Z",
    venue: "Estadio Azteca, Mexico City"
  },
  {
    awayTeamId: "uzbekistan",
    groupId: "k",
    homeTeamId: "portugal",
    id: "k-3",
    startsAtIso: "2026-06-23T17:00:00Z",
    venue: "NRG Stadium, Houston"
  },
  {
    awayTeamId: "congo-dr",
    groupId: "k",
    homeTeamId: "colombia",
    id: "k-4",
    startsAtIso: "2026-06-24T02:00:00Z",
    venue: "Estadio Akron, Zapopan"
  },
  {
    awayTeamId: "portugal",
    groupId: "k",
    homeTeamId: "colombia",
    id: "k-5",
    startsAtIso: "2026-06-27T23:30:00Z",
    venue: "Hard Rock Stadium, Miami Gardens"
  },
  {
    awayTeamId: "uzbekistan",
    groupId: "k",
    homeTeamId: "congo-dr",
    id: "k-6",
    startsAtIso: "2026-06-27T23:30:00Z",
    venue: "Mercedes-Benz Stadium, Atlanta"
  },
  {
    awayTeamId: "panama",
    groupId: "l",
    homeTeamId: "ghana",
    id: "l-1",
    startsAtIso: "2026-06-17T23:00:00Z",
    venue: "BMO Field, Toronto"
  },
  {
    awayTeamId: "croatia",
    groupId: "l",
    homeTeamId: "england",
    id: "l-2",
    startsAtIso: "2026-06-17T20:00:00Z",
    venue: "AT&T Stadium, Arlington"
  },
  {
    awayTeamId: "ghana",
    groupId: "l",
    homeTeamId: "england",
    id: "l-3",
    startsAtIso: "2026-06-23T20:00:00Z",
    venue: "Gillette Stadium, Foxborough"
  },
  {
    awayTeamId: "croatia",
    groupId: "l",
    homeTeamId: "panama",
    id: "l-4",
    startsAtIso: "2026-06-23T23:00:00Z",
    venue: "BMO Field, Toronto"
  },
  {
    awayTeamId: "england",
    groupId: "l",
    homeTeamId: "panama",
    id: "l-5",
    startsAtIso: "2026-06-27T21:00:00Z",
    venue: "MetLife Stadium, East Rutherford"
  },
  {
    awayTeamId: "ghana",
    groupId: "l",
    homeTeamId: "croatia",
    id: "l-6",
    startsAtIso: "2026-06-27T21:00:00Z",
    venue: "Lincoln Financial Field, Philadelphia"
  }
];

export const getTournamentDeadlineIso = (matches: Match[]) =>
  new Date(Math.min(...matches.map((match) => Date.parse(match.startsAtIso)))).toISOString();

export const STATIC_TOURNAMENT_DATA: TournamentData = {
  deadlineIso: getTournamentDeadlineIso(STATIC_TOURNAMENT_MATCHES),
  groups: STATIC_TOURNAMENT_GROUPS,
  matches: STATIC_TOURNAMENT_MATCHES
};

export const cloneTournamentData = (data: TournamentData): TournamentData => ({
  deadlineIso: data.deadlineIso,
  groups: data.groups.map((group) => ({
    id: group.id,
    name: group.name,
    teams: group.teams.map((team) => ({ ...team }))
  })),
  matches: data.matches.map((match) => ({ ...match }))
});
