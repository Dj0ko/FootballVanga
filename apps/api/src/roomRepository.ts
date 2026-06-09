import type { RoomStatus, RoomSummary } from "@footballvanga/shared";

import type { DatabasePool } from "./database.js";

export type RoomRepository = {
  createRoom: (input: { name: string; passwordHash: string }) => Promise<RoomSummary>;
  getRoomById: (roomId: string) => Promise<{ id: string; password_hash: string } | null>;
  listRooms: () => Promise<RoomSummary[]>;
};

type RoomRow = {
  deadline_at: Date | null;
  id: string;
  name: string;
  participant_count: string;
  status: RoomStatus;
};

const toIsoString = (value: Date | string | null) => {
  if (!value) {
    return null;
  }

  return typeof value === "string" ? new Date(value).toISOString() : value.toISOString();
};

const toRoomSummary = (row: RoomRow): RoomSummary => ({
  deadlineIso: toIsoString(row.deadline_at) ?? "",
  id: row.id,
  name: row.name,
  participantCount: Number.parseInt(row.participant_count, 10),
  status: row.status
});

export const createRoomRepository = (pool: DatabasePool): RoomRepository => {
  const getDeadlineAt = async () => {
    const result = await pool.query<{ deadline_at: Date | null }>(
      "SELECT deadline_at FROM tournament_prediction_deadline"
    );

    return result.rows[0]?.deadline_at ?? null;
  };

  const getRoomById = async (roomId: string) => {
    const result = await pool.query<{ id: string; password_hash: string }>(
      "SELECT id, password_hash FROM rooms WHERE id = $1",
      [roomId]
    );

    return result.rows[0] ?? null;
  };

  const listRooms = async () => {
    const result = await pool.query<RoomRow>(`
      SELECT
        rooms.id,
        rooms.name,
        rooms.status,
        COUNT(participants.id) AS participant_count,
        (SELECT deadline_at FROM tournament_prediction_deadline) AS deadline_at
      FROM rooms
      LEFT JOIN participants ON participants.room_id = rooms.id
      GROUP BY rooms.id, rooms.name, rooms.status
      ORDER BY rooms.created_at DESC
    `);

    return result.rows.map(toRoomSummary);
  };

  const createRoom = async ({ name, passwordHash }: { name: string; passwordHash: string }) => {
    const deadlineAt = await getDeadlineAt();
    const roomResult = await pool.query<{ id: string; name: string; status: RoomStatus }>(
      `
        INSERT INTO rooms (name, password_hash, status)
        VALUES ($1, $2, 'open')
        RETURNING id, name, status
      `,
      [name, passwordHash]
    );
    const room = roomResult.rows[0];

    if (!room) {
      throw new Error("Room was not created.");
    }

    return toRoomSummary({
      deadline_at: deadlineAt,
      id: room.id,
      name: room.name,
      participant_count: "0",
      status: room.status
    });
  };

  return {
    createRoom,
    getRoomById,
    listRooms
  };
};
