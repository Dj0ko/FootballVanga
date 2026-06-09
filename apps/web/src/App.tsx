import { useState } from "react";

import { firstRoom, roomParticipants, type CreateRoomInput, type RoomSummary } from "./data/mockFootball";
import { RoomLobbyScreen } from "./screens/room-lobby/RoomLobbyScreen";
import { RoomsScreen } from "./screens/rooms/RoomsScreen";
import { WelcomeScreen } from "./screens/welcome/WelcomeScreen";
import { WorkspaceScreen } from "./screens/workspace/WorkspaceScreen";

type AppScreen = "welcome" | "rooms" | "roomLobby" | "workspace";

export default function App() {
  const [screen, setScreen] = useState<AppScreen>("welcome");
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [activeRoom, setActiveRoom] = useState<RoomSummary>(firstRoom);

  const createRoom = ({ name }: CreateRoomInput) => {
    setRooms((currentRooms) => {
      const nextRoomNumber = currentRooms.length + 1;
      const roomId = `room-${Date.now().toString(36)}-${nextRoomNumber}`;
      const nextRoom: RoomSummary = {
        id: roomId,
        name,
        joinCode: roomId,
        participantsCount: roomParticipants.length,
        deadlineLabel: "дедлайн настроим позже"
      };

      return [nextRoom, ...currentRooms];
    });
  };

  const openRoom = (room: RoomSummary) => {
    setActiveRoom(room);
    setScreen("roomLobby");
  };

  const openWorkspace = () => {
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
        onOpenWorkspace={openWorkspace}
      />
    );
  }

  return (
    <WorkspaceScreen
      deadlineLabel={activeRoom.deadlineLabel}
      roomName={activeRoom.name}
      onBackToLobby={() => setScreen("roomLobby")}
    />
  );
}
