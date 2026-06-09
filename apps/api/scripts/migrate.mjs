import "dotenv/config";

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Client } = pg;

const migrationFilePattern = /^(\d{4,})_(.+)\.sql$/;
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const migrationsDirectory = path.resolve(scriptDirectory, "../db/migrations");

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is required to run migrations.");
  process.exit(1);
}

const client = new Client({
  connectionString: databaseUrl
});
let isConnected = false;

const getMigrationFiles = async () => {
  const directoryEntries = await readdir(migrationsDirectory, {
    withFileTypes: true
  });

  const migrationFiles = directoryEntries
    .filter((entry) => entry.isFile() && migrationFilePattern.test(entry.name))
    .map((entry) => {
      const [, version, rawName] = entry.name.match(migrationFilePattern);

      return {
        fileName: entry.name,
        name: rawName.replaceAll("_", " "),
        version
      };
    })
    .sort((left, right) => left.version.localeCompare(right.version));

  const duplicateVersion = migrationFiles.find(
    (migration, index) => migrationFiles.findIndex((other) => other.version === migration.version) !== index
  );

  if (duplicateVersion) {
    throw new Error(`Duplicate migration version found: ${duplicateVersion.version}`);
  }

  return migrationFiles;
};

const ensureMigrationsTable = async () => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version text PRIMARY KEY,
      name text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);
};

const getAppliedVersions = async () => {
  const result = await client.query("SELECT version FROM schema_migrations");

  return new Set(result.rows.map((row) => row.version));
};

try {
  await client.connect();
  isConnected = true;
  await ensureMigrationsTable();

  const [migrationFiles, appliedVersions] = await Promise.all([getMigrationFiles(), getAppliedVersions()]);
  const pendingMigrations = migrationFiles.filter((migration) => !appliedVersions.has(migration.version));

  if (pendingMigrations.length === 0) {
    console.log("Database is already up to date.");
    process.exitCode = 0;
  }

  for (const migration of pendingMigrations) {
    const migrationPath = path.join(migrationsDirectory, migration.fileName);
    const sql = await readFile(migrationPath, "utf8");

    console.log(`Applying ${migration.fileName}...`);

    await client.query("BEGIN");

    try {
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations(version, name) VALUES ($1, $2)", [
        migration.version,
        migration.name
      ]);
      await client.query("COMMIT");
      console.log(`Applied ${migration.fileName}.`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  if (isConnected) {
    await client.end();
  }
}
