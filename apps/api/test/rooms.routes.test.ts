import assert from "node:assert/strict";
import test from "node:test";

import type { RoomSummary } from "@footballvanga/shared";

import { buildServer } from "../src/index.ts";
import { hashPassword, verifyPassword } from "../src/passwordHash.ts";
import type { RoomRepository } from "../src/roomRepository.ts";

const baseConfig = {
  host: "localhost",
  nodeEnv: "test",
  port: 4100
};

const readJson = <ResponseBody>(body: string) => JSON.parse(body) as ResponseBody;

const createTestRoomRepository = async () => {
  const existingRoomPasswordHash = await hashPassword("open-sesame");
  const createdRoomInputs: Array<{ name: string; passwordHash: string }> = [];

  const room: RoomSummary = {
    deadlineIso: "2026-06-11T19:00:00.000Z",
    id: "room-1",
    name: "Office League",
    participantCount: 2,
    status: "open"
  };

  const repository: RoomRepository = {
    createRoom: async (input) => {
      createdRoomInputs.push(input);

      return {
        deadlineIso: room.deadlineIso,
        id: "new-room",
        name: input.name,
        participantCount: 0,
        status: "open"
      };
    },
    getRoomById: async (roomId) =>
      roomId === room.id
        ? {
            id: room.id,
            password_hash: existingRoomPasswordHash
          }
        : null,
    listRooms: async () => [room]
  };

  return {
    createdRoomInputs,
    repository,
    room
  };
};

test("room endpoints return 503 when room storage is explicitly disabled", async (t) => {
  const app = await buildServer(baseConfig, {
    roomRepository: null
  });

  t.after(async () => {
    await app.close();
  });

  const response = await app.inject({
    method: "GET",
    url: "/api/rooms"
  });

  assert.equal(response.statusCode, 503);
  assert.deepEqual(readJson(response.body), {
    message: "Room storage is not configured."
  });
});

test("room endpoints use in-memory storage when DATABASE_URL is not configured", async (t) => {
  const app = await buildServer(baseConfig);

  t.after(async () => {
    await app.close();
  });

  const emptyListResponse = await app.inject({
    method: "GET",
    url: "/api/rooms"
  });

  assert.equal(emptyListResponse.statusCode, 200);
  assert.deepEqual(readJson(emptyListResponse.body), {
    rooms: []
  });

  const createResponse = await app.inject({
    method: "POST",
    payload: {
      name: "Local Room",
      password: "1234"
    },
    url: "/api/rooms"
  });
  const createBody = readJson<{ room: RoomSummary }>(createResponse.body);

  assert.equal(createResponse.statusCode, 201);
  assert.equal(createBody.room.name, "Local Room");
  assert.equal(createBody.room.status, "open");
  assert.equal(createBody.room.participantCount, 0);
  assert.equal(createBody.room.deadlineIso, "2026-06-11T19:00:00.000Z");
  assert.equal(createResponse.body.includes("password"), false);

  const listResponse = await app.inject({
    method: "GET",
    url: "/api/rooms"
  });

  assert.equal(listResponse.statusCode, 200);
  assert.deepEqual(readJson(listResponse.body), {
    rooms: [createBody.room]
  });

  const enterResponse = await app.inject({
    method: "POST",
    payload: {
      password: "1234"
    },
    url: `/api/rooms/${createBody.room.id}/enter`
  });

  assert.equal(enterResponse.statusCode, 200);
  assert.deepEqual(readJson(enterResponse.body), {
    ok: true,
    roomId: createBody.room.id
  });
});

test("GET /api/rooms returns public room summaries", async (t) => {
  const { repository, room } = await createTestRoomRepository();
  const app = await buildServer(baseConfig, {
    roomRepository: repository
  });

  t.after(async () => {
    await app.close();
  });

  const response = await app.inject({
    method: "GET",
    url: "/api/rooms"
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(readJson(response.body), {
    rooms: [room]
  });
  assert.equal(response.body.includes("password"), false);
});

test("POST /api/rooms validates room input", async (t) => {
  const { repository } = await createTestRoomRepository();
  const app = await buildServer(baseConfig, {
    roomRepository: repository
  });

  t.after(async () => {
    await app.close();
  });

  const blankNameResponse = await app.inject({
    method: "POST",
    payload: {
      name: "   ",
      password: "1234"
    },
    url: "/api/rooms"
  });
  const shortPasswordResponse = await app.inject({
    method: "POST",
    payload: {
      name: "Office League",
      password: "123"
    },
    url: "/api/rooms"
  });

  assert.equal(blankNameResponse.statusCode, 400);
  assert.deepEqual(readJson(blankNameResponse.body), {
    message: "Room name is required."
  });
  assert.equal(shortPasswordResponse.statusCode, 400);
  assert.deepEqual(readJson(shortPasswordResponse.body), {
    message: "Room password must be at least 4 characters."
  });
});

test("POST /api/rooms creates a room with a hashed password", async (t) => {
  const { createdRoomInputs, repository } = await createTestRoomRepository();
  const app = await buildServer(baseConfig, {
    roomRepository: repository
  });

  t.after(async () => {
    await app.close();
  });

  const response = await app.inject({
    method: "POST",
    payload: {
      name: "  New Room  ",
      password: "1234"
    },
    url: "/api/rooms"
  });
  const createdInput = createdRoomInputs[0];

  assert.ok(createdInput);
  assert.equal(response.statusCode, 201);
  assert.deepEqual(readJson(response.body), {
    room: {
      deadlineIso: "2026-06-11T19:00:00.000Z",
      id: "new-room",
      name: "New Room",
      participantCount: 0,
      status: "open"
    }
  });
  assert.equal(createdInput.name, "New Room");
  assert.notEqual(createdInput.passwordHash, "1234");
  assert.equal(await verifyPassword("1234", createdInput.passwordHash), true);
});

test("POST /api/rooms/:roomId/enter verifies room passwords", async (t) => {
  const { repository } = await createTestRoomRepository();
  const app = await buildServer(baseConfig, {
    roomRepository: repository
  });

  t.after(async () => {
    await app.close();
  });

  const successResponse = await app.inject({
    method: "POST",
    payload: {
      password: "open-sesame"
    },
    url: "/api/rooms/room-1/enter"
  });
  const wrongPasswordResponse = await app.inject({
    method: "POST",
    payload: {
      password: "wrong-password"
    },
    url: "/api/rooms/room-1/enter"
  });
  const notFoundResponse = await app.inject({
    method: "POST",
    payload: {
      password: "open-sesame"
    },
    url: "/api/rooms/missing-room/enter"
  });

  assert.equal(successResponse.statusCode, 200);
  assert.deepEqual(readJson(successResponse.body), {
    ok: true,
    roomId: "room-1"
  });
  assert.equal(wrongPasswordResponse.statusCode, 401);
  assert.deepEqual(readJson(wrongPasswordResponse.body), {
    message: "Invalid room password."
  });
  assert.equal(notFoundResponse.statusCode, 404);
  assert.deepEqual(readJson(notFoundResponse.body), {
    message: "Room was not found."
  });
});
