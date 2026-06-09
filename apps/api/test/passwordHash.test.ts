import assert from "node:assert/strict";
import test from "node:test";

import { hashPassword, verifyPassword } from "../src/passwordHash.ts";

test("hashPassword stores a scrypt hash instead of the plain password", async () => {
  const password = "room-code-1234";
  const passwordHash = await hashPassword(password);

  assert.notEqual(passwordHash, password);
  assert.match(passwordHash, /^scrypt:\d+:\d+:\d+:[A-Za-z0-9_-]+:[A-Za-z0-9_-]+$/);
});

test("verifyPassword accepts matching passwords", async () => {
  const password = "correct-password";
  const passwordHash = await hashPassword(password);

  assert.equal(await verifyPassword(password, passwordHash), true);
});

test("verifyPassword rejects wrong passwords", async () => {
  const passwordHash = await hashPassword("correct-password");

  assert.equal(await verifyPassword("wrong-password", passwordHash), false);
});

test("verifyPassword rejects malformed hashes", async () => {
  assert.equal(await verifyPassword("anything", "not-a-valid-hash"), false);
});
