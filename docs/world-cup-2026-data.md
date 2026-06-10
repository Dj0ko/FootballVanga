# FIFA World Cup 2026 Data Reference

Last checked: 2026-06-09

This document is the current product reference for backend-owned tournament data, the no-database static fallback, and the backend seed migration used by FootballVanga.

Sources:

- [FIFA - World Cup 2026 groups and qualification rules](https://www.fifa.com/en/articles/groups-how-teams-qualify-tie-breakers)
- [FIFA - World Cup 2026 match schedule](https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/match-schedule-fixtures-results-teams-stadiums)
- [FourFourTwo - World Cup 2026 complete fixtures](https://www.fourfourtwo.com/competition/world-cup-2026-fixtures-and-results)

The seed migration lives at `apps/api/db/migrations/0002_seed_world_cup_2026_group_stage.sql`.

Before production deployment, verify this data again against FIFA's official schedule.

## Groups

Version 1 of FootballVanga covers only the group stage.

| Group | Teams |
| --- | --- |
| A | Mexico, South Africa, Korea Republic, Czechia |
| B | Canada, Switzerland, Qatar, Bosnia and Herzegovina |
| C | Brazil, Morocco, Haiti, Scotland |
| D | United States, Paraguay, Australia, Turkiye |
| E | Germany, Curacao, Cote d'Ivoire, Ecuador |
| F | Netherlands, Japan, Tunisia, Sweden |
| G | Belgium, Egypt, IR Iran, New Zealand |
| H | Spain, Cabo Verde, Saudi Arabia, Uruguay |
| I | France, Senegal, Norway, Iraq |
| J | Argentina, Algeria, Austria, Jordan |
| K | Portugal, Uzbekistan, Colombia, Congo DR |
| L | England, Croatia, Ghana, Panama |

## Group Stage Matches

There are 72 group-stage matches: 12 groups with 6 matches each.

### Group A

| Date | Match | Venue |
| --- | --- | --- |
| 2026-06-11 | Mexico vs South Africa | Estadio Azteca, Mexico City |
| 2026-06-11 | Korea Republic vs Czechia | Estadio Akron, Zapopan |
| 2026-06-18 | Czechia vs South Africa | Mercedes-Benz Stadium, Atlanta |
| 2026-06-18 | Mexico vs Korea Republic | Estadio Akron, Zapopan |
| 2026-06-24 | Czechia vs Mexico | Estadio Azteca, Mexico City |
| 2026-06-24 | South Africa vs Korea Republic | Estadio BBVA, Guadalupe |

### Group B

| Date | Match | Venue |
| --- | --- | --- |
| 2026-06-12 | Canada vs Bosnia and Herzegovina | BMO Field, Toronto |
| 2026-06-13 | Qatar vs Switzerland | Levi's Stadium, Santa Clara |
| 2026-06-18 | Switzerland vs Bosnia and Herzegovina | SoFi Stadium, Inglewood |
| 2026-06-18 | Canada vs Qatar | BC Place, Vancouver |
| 2026-06-24 | Switzerland vs Canada | BC Place, Vancouver |
| 2026-06-24 | Bosnia and Herzegovina vs Qatar | Lumen Field, Seattle |

### Group C

| Date | Match | Venue |
| --- | --- | --- |
| 2026-06-13 | Brazil vs Morocco | Gillette Stadium, Foxborough |
| 2026-06-13 | Haiti vs Scotland | MetLife Stadium, East Rutherford |
| 2026-06-19 | Scotland vs Morocco | Lincoln Financial Field, Philadelphia |
| 2026-06-19 | Brazil vs Haiti | Gillette Stadium, Foxborough |
| 2026-06-24 | Scotland vs Brazil | Hard Rock Stadium, Miami Gardens |
| 2026-06-24 | Morocco vs Haiti | Mercedes-Benz Stadium, Atlanta |

### Group D

| Date | Match | Venue |
| --- | --- | --- |
| 2026-06-12 | United States vs Paraguay | SoFi Stadium, Inglewood |
| 2026-06-13 | Australia vs Turkiye | BC Place, Vancouver |
| 2026-06-19 | Turkiye vs Paraguay | Levi's Stadium, Santa Clara |
| 2026-06-19 | United States vs Australia | Lumen Field, Seattle |
| 2026-06-25 | Turkiye vs United States | SoFi Stadium, Inglewood |
| 2026-06-25 | Paraguay vs Australia | Levi's Stadium, Santa Clara |

### Group E

| Date | Match | Venue |
| --- | --- | --- |
| 2026-06-14 | Cote d'Ivoire vs Ecuador | Lincoln Financial Field, Philadelphia |
| 2026-06-14 | Germany vs Curacao | NRG Stadium, Houston |
| 2026-06-20 | Germany vs Cote d'Ivoire | BMO Field, Toronto |
| 2026-06-20 | Ecuador vs Curacao | Arrowhead Stadium, Kansas City |
| 2026-06-25 | Curacao vs Cote d'Ivoire | Lincoln Financial Field, Philadelphia |
| 2026-06-25 | Ecuador vs Germany | MetLife Stadium, East Rutherford |

### Group F

| Date | Match | Venue |
| --- | --- | --- |
| 2026-06-14 | Netherlands vs Japan | AT&T Stadium, Arlington |
| 2026-06-14 | Sweden vs Tunisia | Estadio BBVA, Guadalupe |
| 2026-06-20 | Netherlands vs Sweden | NRG Stadium, Houston |
| 2026-06-20 | Tunisia vs Japan | Estadio BBVA, Guadalupe |
| 2026-06-25 | Japan vs Sweden | AT&T Stadium, Arlington |
| 2026-06-25 | Tunisia vs Netherlands | Arrowhead Stadium, Kansas City |

### Group G

| Date | Match | Venue |
| --- | --- | --- |
| 2026-06-15 | IR Iran vs New Zealand | SoFi Stadium, Inglewood |
| 2026-06-15 | Belgium vs Egypt | Lumen Field, Seattle |
| 2026-06-21 | Belgium vs IR Iran | SoFi Stadium, Inglewood |
| 2026-06-21 | New Zealand vs Egypt | BC Place, Vancouver |
| 2026-06-26 | Egypt vs IR Iran | Lumen Field, Seattle |
| 2026-06-26 | New Zealand vs Belgium | BC Place, Vancouver |

### Group H

| Date | Match | Venue |
| --- | --- | --- |
| 2026-06-15 | Saudi Arabia vs Uruguay | Hard Rock Stadium, Miami Gardens |
| 2026-06-15 | Spain vs Cabo Verde | Mercedes-Benz Stadium, Atlanta |
| 2026-06-21 | Uruguay vs Cabo Verde | Hard Rock Stadium, Miami Gardens |
| 2026-06-21 | Spain vs Saudi Arabia | Mercedes-Benz Stadium, Atlanta |
| 2026-06-26 | Cabo Verde vs Saudi Arabia | NRG Stadium, Houston |
| 2026-06-26 | Uruguay vs Spain | Estadio Akron, Zapopan |

### Group I

| Date | Match | Venue |
| --- | --- | --- |
| 2026-06-16 | France vs Senegal | MetLife Stadium, East Rutherford |
| 2026-06-16 | Iraq vs Norway | Gillette Stadium, Foxborough |
| 2026-06-22 | Norway vs Senegal | MetLife Stadium, East Rutherford |
| 2026-06-22 | France vs Iraq | Lincoln Financial Field, Philadelphia |
| 2026-06-26 | Norway vs France | Gillette Stadium, Foxborough |
| 2026-06-26 | Senegal vs Iraq | BMO Field, Toronto |

### Group J

| Date | Match | Venue |
| --- | --- | --- |
| 2026-06-16 | Argentina vs Algeria | Arrowhead Stadium, Kansas City |
| 2026-06-16 | Austria vs Jordan | Levi's Stadium, Santa Clara |
| 2026-06-22 | Argentina vs Austria | AT&T Stadium, Arlington |
| 2026-06-22 | Jordan vs Algeria | Levi's Stadium, Santa Clara |
| 2026-06-27 | Algeria vs Austria | Arrowhead Stadium, Kansas City |
| 2026-06-27 | Jordan vs Argentina | AT&T Stadium, Arlington |

### Group K

| Date | Match | Venue |
| --- | --- | --- |
| 2026-06-17 | Portugal vs Congo DR | NRG Stadium, Houston |
| 2026-06-17 | Uzbekistan vs Colombia | Estadio Azteca, Mexico City |
| 2026-06-23 | Portugal vs Uzbekistan | NRG Stadium, Houston |
| 2026-06-23 | Colombia vs Congo DR | Estadio Akron, Zapopan |
| 2026-06-27 | Colombia vs Portugal | Hard Rock Stadium, Miami Gardens |
| 2026-06-27 | Congo DR vs Uzbekistan | Mercedes-Benz Stadium, Atlanta |

### Group L

| Date | Match | Venue |
| --- | --- | --- |
| 2026-06-17 | Ghana vs Panama | BMO Field, Toronto |
| 2026-06-17 | England vs Croatia | AT&T Stadium, Arlington |
| 2026-06-23 | England vs Ghana | Gillette Stadium, Foxborough |
| 2026-06-23 | Panama vs Croatia | BMO Field, Toronto |
| 2026-06-27 | Panama vs England | MetLife Stadium, East Rutherford |
| 2026-06-27 | Croatia vs Ghana | Lincoln Financial Field, Philadelphia |

## Implementation Notes

- Use stable internal IDs for groups, teams, and matches.
- Store display names separately from IDs so localized labels can be added later.
- For teams with multiple common display names, prefer stable IDs such as:
  - `korea-republic`
  - `cote-divoire`
  - `ir-iran`
  - `congo-dr`
  - `cabo-verde`
- Version 1 predictions should use the 12 groups above and only the 72 group-stage matches.
- The backend seed migration stores kickoff times as UTC `timestamptz` values matching the frontend `startsAtIso` values.
