import { useState } from "react";

import {
  firstRoom,
  roomParticipants,
  type CreateRoomInput,
  type RoomParticipant,
  type RoomSummary
} from "./data/mockFootball";
import { RoomLobbyScreen } from "./screens/room-lobby/RoomLobbyScreen";
import { RoomsScreen } from "./screens/rooms/RoomsScreen";
import { WelcomeScreen } from "./screens/welcome/WelcomeScreen";
import { WorkspaceScreen } from "./screens/workspace/WorkspaceScreen";

type AppScreen = "welcome" | "rooms" | "roomLobby" | "workspace";

const currentParticipant: RoomParticipant = roomParticipants.find((participant) => participant.isCurrent) ?? {
  name: "Вы",
  points: 0,
  exactScores: 0,
  isCurrent: true,
  predictionStatus: "draft"
};

export default function App() {
  const [screen, setScreen] = useState<AppScreen>("welcome");
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [activeRoom, setActiveRoom] = useState<RoomSummary>(firstRoom);
  const [activeParticipant, setActiveParticipant] = useState<RoomParticipant>(currentParticipant);

  const createRoom = ({ name }: CreateRoomInput) => {
    setRooms((currentRooms) => {
      const nextRoomNumber = currentRooms.length + 1;
      const roomId = `room-${Date.now().toString(36)}-${nextRoomNumber}`;
      const nextRoom: RoomSummary = {
        id: roomId,
        name,
        joinCode: roomId,
        participantsCount: roomParticipants.length
      };

      return [nextRoom, ...currentRooms];
    });
  };

  const openRoom = (room: RoomSummary) => {
    setActiveRoom(room);
    setScreen("roomLobby");
  };

  const openWorkspace = (participant: RoomParticipant = currentParticipant) => {
    setActiveParticipant(participant);
    setScreen("workspace");
  };

  if (screen === "welcome") {
    return <WelcomeScreen onContinue={() => setScreen("rooms")} />;
  }

  if (screen === "rooms") {
    return <RoomsScreen rooms={rooms} onCreateRoom={createRoom} onOpenRoom={openRoom} />;
  }

  if (screen === "roomLobby") {
    return (
      <RoomLobbyScreen
        room={activeRoom}
        onBackToRooms={() => setScreen("rooms")}
        onOpenMyPrediction={() => openWorkspace(currentParticipant)}
        onOpenParticipantPrediction={openWorkspace}
      />
    );
  }

  return (
    <WorkspaceScreen
      isReadOnly={!activeParticipant.isCurrent}
      participantName={activeParticipant.name}
      roomName={activeRoom.name}
      onBackToLobby={() => setScreen("roomLobby")}
    />
  );
}
