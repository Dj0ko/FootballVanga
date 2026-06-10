import "dotenv/config";

import { createDatabasePool } from "./database.js";
import { createFootballDataProvider } from "./footballDataProvider.js";
import { createGroupStandingResultRepository } from "./groupStandingResultRepository.js";
import { createMatchResultRepository } from "./matchResultRepository.js";
import { readConfig } from "./config.js";
import { createResultImporter } from "./resultImporter.js";
import { createScoringRepository } from "./scoringRepository.js";
import { createTournamentRepository } from "./tournamentRepository.js";

const run = async () => {
  const config = readConfig();

  if (!config.databaseUrl) {
    throw new Error("DATABASE_URL is required for scheduled result import.");
  }

  if (!config.footballDataApiToken) {
    throw new Error("FOOTBALL_DATA_API_TOKEN is required for result import.");
  }

  const pool = createDatabasePool(config.databaseUrl);

  try {
    const importer = createResultImporter({
      groupStandingResultRepository: createGroupStandingResultRepository(pool),
      matchResultRepository: createMatchResultRepository(pool),
      provider: createFootballDataProvider({
        apiToken: config.footballDataApiToken,
        baseUrl: config.footballDataBaseUrl,
        competitionCode: config.footballDataCompetitionCode,
        season: config.footballDataSeason
      }),
      scoringRepository: createScoringRepository(pool),
      tournamentRepository: createTournamentRepository(pool)
    });
    const summary = await importer.syncResults();

    console.log(JSON.stringify(summary));

    if (summary.status === "failed") {
      process.exitCode = 1;
    }
  } finally {
    await pool.end();
  }
};

try {
  await run();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
