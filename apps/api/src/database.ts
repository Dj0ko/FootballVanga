import pg from "pg";

const { Pool } = pg;

export const createDatabasePool = (databaseUrl: string) =>
  new Pool({
    connectionString: databaseUrl
  });

export type DatabasePool = pg.Pool;
