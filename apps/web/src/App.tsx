import { useState } from "react";

import { firstRoom, type RoomSummary } from "./data/mockFootball";
import { RoomsScreen } from "./screens/rooms/RoomsScreen";
import { WelcomeScreen } from "./screens/welcome/WelcomeScreen";
import { WorkspaceScreen } from "./screens/workspace/WorkspaceScreen";

type AppScreen = "welcome" | "rooms" | "workspace";

export default function App() {
  const [screen, setScreen] = useState<AppScreen>("welcome");
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [roomCode, setRoomCode] = useState(firstRoom.joinCode);

  const createMockRoom = () => {
    setRooms((currentRooms) => {
      if (currentRooms.some((room) => room.id === firstRoom.id)) {
        return currentRooms;
      }

      return [firstRoom, ...currentRooms];
    });
    setRoomCode(firstRoom.joinCode);
  };

  const openRoom = (room: RoomSummary) => {
    setRoomCode(room.joinCode);
    setScreen("workspace");
  };

  if (screen === "welcome") {
    return <WelcomeScreen onContinue={() => setScreen("rooms")} />;
  }

  if (screen === "rooms") {
    return <RoomsScreen rooms={rooms} onCreateRoom={createMockRoom} onOpenRoom={openRoom} />;
  }

  return <WorkspaceScreen initialRoomCode={roomCode} />;
}
