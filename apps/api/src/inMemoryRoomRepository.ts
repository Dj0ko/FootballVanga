import { randomUUID } from "node:crypto";

import type { RoomStatus, RoomSummary } from "@footballvanga/shared";

import type { RoomRepository } from "./roomRepository.js";

const DEFAULT_DEADLINE_ISO = "2026-06-11T19:00:00.000Z";

type StoredRoom = {
  createdOrder: number;
  deadlineIso: string;
  id: string;
  name: string;
  participantCount: number;
  passwordHash: string;
  status: RoomStatus;
};

const toRoomSummary = (room: StoredRoom): RoomSummary => ({
  deadlineIso: room.deadlineIso,
  id: room.id,
  name: room.name,
  participantCount: room.participantCount,
  status: room.status
});

export const createInMemoryRoomRepository = (
  options: {
    deadlineIso?: string;
  } = {}
): RoomRepository => {
  const deadlineIso = options.deadlineIso ?? DEFAULT_DEADLINE_ISO;
  const rooms = new Map<string, StoredRoom>();
  let nextCreatedOrder = 0;

  const createRoom: RoomRepository["createRoom"] = async ({ name, passwordHash }) => {
    const room: StoredRoom = {
      createdOrder: nextCreatedOrder,
      deadlineIso,
      id: randomUUID(),
      name,
      participantCount: 0,
      passwordHash,
      status: "open"
    };

    nextCreatedOrder += 1;
    rooms.set(room.id, room);

    return toRoomSummary(room);
  };

  const getRoomById: RoomRepository["getRoomById"] = async (roomId) => {
    const room = rooms.get(roomId);

    if (!room) {
      return null;
    }

    return {
      id: room.id,
      password_hash: room.passwordHash
    };
  };

  const listRooms: RoomRepository["listRooms"] = async () =>
    Array.from(rooms.values())
      .sort((leftRoom, rightRoom) => rightRoom.createdOrder - leftRoom.createdOrder)
      .map(toRoomSummary);

  return {
    createRoom,
    getRoomById,
    listRooms
  };
};
