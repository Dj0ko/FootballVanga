import type { ParticipantPrediction, SaveParticipantPredictionInput } from "@footballvanga/shared";

import { requestJson } from "./rooms";

export type PredictionResponse = {
  deadlineIso: string | null;
  isLocked: boolean;
  prediction: ParticipantPrediction;
};

export const fetchParticipantPrediction = async (
  roomId: string,
  participantId: string,
  sessionToken: string
) =>
  requestJson<PredictionResponse>(
    `/api/rooms/${encodeURIComponent(roomId)}/predictions/${encodeURIComponent(participantId)}`,
    {
      headers: {
        Authorization: `Bearer ${sessionToken}`
      }
    }
  );

export const saveMyPrediction = async (
  roomId: string,
  sessionToken: string,
  input: SaveParticipantPredictionInput
) =>
  requestJson<PredictionResponse>(`/api/rooms/${encodeURIComponent(roomId)}/predictions/me`, {
    body: JSON.stringify(input),
    headers: {
      Authorization: `Bearer ${sessionToken}`
    },
    method: "PUT"
  });
