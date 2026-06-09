import type { ParticipantSession, PredictionStatus } from "@footballvanga/shared";

import type { CreateRoomInput, RoomParticipant, RoomSummary } from "../data/mockFootball";

type ApiRoomSummary = {
  deadlineIso: string;
  id: string;
  name: string;
  participantCount: number;
  status: string;
};

type RoomsResponse = {
  rooms: ApiRoomSummary[];
};

type CreateRoomResponse = {
  room: ApiRoomSummary;
};

type EnterRoomResponse = {
  ok: boolean;
  roomId: string;
};

type ApiParticipantSummary = {
  displayName: string;
  exactScoreHits: number;
  id: string;
  predictionStatus: PredictionStatus;
  totalScore: number;
};

type EnterParticipantInput = {
  code: string;
  displayName: string;
  roomPassword: string;
};

type ParticipantsResponse = {
  participant: ApiParticipantSummary;
  participants: ApiParticipantSummary[];
};

type EnterParticipantResponse = ParticipantsResponse & {
  session: ParticipantSession;
};

type ApiErrorBody = {
  message?: string;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const toRoomSummary = (room: ApiRoomSummary): RoomSummary => ({
  id: room.id,
  joinCode: room.id,
  name: room.name,
  participantsCount: room.participantCount
});

const toRoomParticipant = (participant: ApiParticipantSummary): RoomParticipant => ({
  exactScores: participant.exactScoreHits,
  id: participant.id,
  name: participant.displayName,
  points: participant.totalScore,
  predictionStatus: participant.predictionStatus
});

export const requestJson = async <ResponseBody>(path: string, init?: RequestInit) => {
  const response = await fetch(path, {
    credentials: "include",
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers
    }
  });
  const body = (await response.json().catch(() => ({}))) as ApiErrorBody | ResponseBody;

  if (!response.ok) {
    const message =
      body && typeof body === "object" && "message" in body && typeof body.message === "string"
        ? body.message
        : "API request failed.";

    throw new ApiError(message, response.status);
  }

  return body as ResponseBody;
};

export const fetchRooms = async () => {
  const response = await requestJson<RoomsResponse>("/api/rooms");

  return response.rooms.map(toRoomSummary);
};

export const createRoom = async (input: CreateRoomInput) => {
  const response = await requestJson<CreateRoomResponse>("/api/rooms", {
    body: JSON.stringify(input),
    method: "POST"
  });

  return toRoomSummary(response.room);
};

export const enterRoom = async (roomId: string, password: string) =>
  requestJson<EnterRoomResponse>(`/api/rooms/${encodeURIComponent(roomId)}/enter`, {
    body: JSON.stringify({
      password
    }),
    method: "POST"
  });

export const enterParticipant = async (roomId: string, input: EnterParticipantInput) => {
  const response = await requestJson<EnterParticipantResponse>(
    `/api/rooms/${encodeURIComponent(roomId)}/participants/enter`,
    {
      body: JSON.stringify(input),
      method: "POST"
    }
  );

  return {
    participant: toRoomParticipant(response.participant),
    participants: response.participants.map(toRoomParticipant),
    session: response.session
  };
};

export const fetchParticipants = async (roomId: string, sessionToken: string) => {
  const response = await requestJson<ParticipantsResponse>(
    `/api/rooms/${encodeURIComponent(roomId)}/participants`,
    {
      headers: {
        Authorization: `Bearer ${sessionToken}`
      }
    }
  );

  return {
    participant: toRoomParticipant(response.participant),
    participants: response.participants.map(toRoomParticipant)
  };
};
