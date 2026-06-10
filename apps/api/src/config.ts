export type ApiConfig = {
  adminPasswordHash?: string;
  adminSessionSecret?: string;
  nodeEnv: string;
  host: string;
  port: number;
  databaseUrl?: string;
  footballDataApiToken?: string;
  footballDataBaseUrl?: string;
  footballDataCompetitionCode?: string;
  footballDataSeason?: string;
};

const parsePort = (value: string | undefined, fallback: number) => {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1 || parsed > 65535) {
    return fallback;
  }

  return parsed;
};

export const readConfig = (env: NodeJS.ProcessEnv = process.env): ApiConfig => ({
  adminPasswordHash: env.ADMIN_PASSWORD_HASH,
  adminSessionSecret: env.ADMIN_SESSION_SECRET,
  nodeEnv: env.NODE_ENV ?? "development",
  host: env.HOST ?? "localhost",
  port: parsePort(env.PORT, 4100),
  databaseUrl: env.DATABASE_URL,
  footballDataApiToken: env.FOOTBALL_DATA_API_TOKEN,
  footballDataBaseUrl: env.FOOTBALL_DATA_BASE_URL,
  footballDataCompetitionCode: env.FOOTBALL_DATA_COMPETITION_CODE ?? "WC",
  footballDataSeason: env.FOOTBALL_DATA_SEASON ?? "2026"
});
