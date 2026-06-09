import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const getValuesBlock = (sql: string, tableName: string) => {
  const match = sql.match(new RegExp(`INSERT INTO ${tableName}[^]*?VALUES\\n([^]*?)\\nON CONFLICT`));

  assert.ok(match, `Expected ${tableName} seed block to exist.`);
  assert.ok(match[1], `Expected ${tableName} seed values to exist.`);

  return match[1];
};

const countSeedRows = (valuesBlock: string) => [...valuesBlock.matchAll(/^  \('/gm)].length;

test("World Cup 2026 seed migration keeps expected group-stage counts", async () => {
  const migrationUrl = new URL("../db/migrations/0002_seed_world_cup_2026_group_stage.sql", import.meta.url);
  const sql = await readFile(migrationUrl, "utf8");

  assert.equal(countSeedRows(getValuesBlock(sql, "tournament_groups")), 12);
  assert.equal(countSeedRows(getValuesBlock(sql, "teams")), 48);
  assert.equal(countSeedRows(getValuesBlock(sql, "matches")), 72);
});

test("World Cup 2026 seed migration keeps the tournament deadline kickoff stable", async () => {
  const migrationUrl = new URL("../db/migrations/0002_seed_world_cup_2026_group_stage.sql", import.meta.url);
  const sql = await readFile(migrationUrl, "utf8");
  const startsAtValues = [...getValuesBlock(sql, "matches").matchAll(/'(\d{4}-\d{2}-\d{2}T[^']+Z)'/g)].map(
    (match) => {
      assert.ok(match[1]);

      return match[1];
    }
  );

  assert.equal(startsAtValues.length, 72);
  assert.equal(startsAtValues.sort()[0], "2026-06-11T19:00:00Z");
});
