import type { PredictionStatus } from "@footballvanga/shared";

export type Participant = {
  name: string;
  points: number;
  exactScores: number;
};

export type { PredictionStatus };

export type RoomParticipant = Participant & {
  id: string;
  isCurrent?: boolean;
  predictionStatus: PredictionStatus;
};

export type RoomSummary = {
  id: string;
  name: string;
  joinCode: string;
  participantsCount: number;
};

export type CreateRoomInput = {
  name: string;
  password: string;
};
