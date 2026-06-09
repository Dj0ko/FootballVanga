import { useState } from "react";

import { firstRoom, type CreateRoomInput, type RoomSummary } from "./data/mockFootball";
import { RoomsScreen } from "./screens/rooms/RoomsScreen";
import { WelcomeScreen } from "./screens/welcome/WelcomeScreen";
import { WorkspaceScreen } from "./screens/workspace/WorkspaceScreen";

type AppScreen = "welcome" | "rooms" | "workspace";

export default function App() {
  const [screen, setScreen] = useState<AppScreen>("welcome");
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [roomCode, setRoomCode] = useState(firstRoom.joinCode);

  const createRoom = ({ name }: CreateRoomInput) => {
    setRooms((currentRooms) => {
      const nextRoomNumber = currentRooms.length + 1;
      const roomId = `room-${Date.now().toString(36)}-${nextRoomNumber}`;
      const nextRoom: RoomSummary = {
        id: roomId,
        name,
        joinCode: roomId,
        participantsCount: 0,
        deadlineLabel: "дедлайн настроим позже"
      };

      return [nextRoom, ...currentRooms];
    });
  };

  const openRoom = (room: RoomSummary) => {
    setRoomCode(room.joinCode);
    setScreen("workspace");
  };

  if (screen === "welcome") {
    return <WelcomeScreen onContinue={() => setScreen("rooms")} />;
  }

  if (screen === "rooms") {
    return <RoomsScreen rooms={rooms} onCreateRoom={createRoom} onOpenRoom={openRoom} />;
  }

  return <WorkspaceScreen initialRoomCode={roomCode} />;
}
