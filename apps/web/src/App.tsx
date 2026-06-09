import { useState } from "react";

import {
  firstRoom,
  mockParticipantCodesByRoomId,
  mockRoomPasswordsById,
  roomParticipants,
  type CreateRoomInput,
  type RoomParticipant,
  type RoomSummary
} from "./data/mockFootball";
import { AdminResultsScreen } from "./screens/admin-results/AdminResultsScreen";
import {
  RoomEntryScreen,
  type ParticipantEntryInput,
  type ParticipantEntryResult
} from "./screens/room-entry/RoomEntryScreen";
import { RoomLobbyScreen } from "./screens/room-lobby/RoomLobbyScreen";
import { RoomsScreen } from "./screens/rooms/RoomsScreen";
import { WelcomeScreen } from "./screens/welcome/WelcomeScreen";
import { WorkspaceScreen } from "./screens/workspace/WorkspaceScreen";

type AppScreen = "welcome" | "rooms" | "roomEntry" | "roomLobby" | "workspace";

const createDraftParticipant = (name: string): RoomParticipant => ({
  name,
  points: 0,
  exactScores: 0,
  predictionStatus: "draft"
});

const normalizeParticipantName = (name: string) => name.trim().toLocaleLowerCase("ru-RU");

export default function App() {
  const isAdminResultsRoute = window.location.pathname === "/admin/results";
  const [screen, setScreen] = useState<AppScreen>("welcome");
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [activeRoom, setActiveRoom] = useState<RoomSummary>(firstRoom);
  const [currentParticipant, setCurrentParticipant] = useState<RoomParticipant | null>(null);
  const [viewedParticipant, setViewedParticipant] = useState<RoomParticipant | null>(null);
  const [participantsByRoomId, setParticipantsByRoomId] = useState<Record<string, RoomParticipant[]>>({
    [firstRoom.id]: roomParticipants
  });
  const [roomPasswordsById, setRoomPasswordsById] = useState<Record<string, string>>(mockRoomPasswordsById);
  const [participantCodesByRoomId, setParticipantCodesByRoomId] = useState<Record<string, Record<string, string>>>(
    mockParticipantCodesByRoomId
  );

  const getRoomParticipants = (roomId: string) => participantsByRoomId[roomId] ?? [];

  const getActiveRoomParticipants = () =>
    getRoomParticipants(activeRoom.id).map((participant) => ({
      ...participant,
      isCurrent:
        currentParticipant !== null &&
        normalizeParticipantName(participant.name) === normalizeParticipantName(currentParticipant.name)
    }));

  const createRoom = ({ name, password }: CreateRoomInput) => {
    const nextRoomNumber = rooms.length + 1;
    const roomId = `room-${Date.now().toString(36)}-${nextRoomNumber}`;
    const nextRoom: RoomSummary = {
      id: roomId,
      name,
      joinCode: roomId,
      participantsCount: 0
    };

    setRooms((currentRooms) => [nextRoom, ...currentRooms]);

    setRoomPasswordsById((currentPasswords) => ({
      ...currentPasswords,
      [roomId]: password
    }));
    setParticipantsByRoomId((currentParticipantsByRoomId) => ({
      ...currentParticipantsByRoomId,
      [roomId]: []
    }));
    setParticipantCodesByRoomId((currentCodesByRoomId) => ({
      ...currentCodesByRoomId,
      [roomId]: {}
    }));
  };

  const openRoomEntry = (room: RoomSummary) => {
    setActiveRoom(room);
    setCurrentParticipant(null);
    setViewedParticipant(null);
    setScreen("roomEntry");
  };

  const verifyRoomPassword = (password: string) => roomPasswordsById[activeRoom.id] === password;

  const enterParticipant = ({ code, name }: ParticipantEntryInput): ParticipantEntryResult => {
    const normalizedName = normalizeParticipantName(name);
    const currentRoomParticipants = getRoomParticipants(activeRoom.id);
    const existingParticipant = currentRoomParticipants.find(
      (participant) => normalizeParticipantName(participant.name) === normalizedName
    );
    const roomCodes = participantCodesByRoomId[activeRoom.id] ?? {};

    if (existingParticipant) {
      if (roomCodes[existingParticipant.name] !== code) {
        return "invalid-code";
      }

      setCurrentParticipant(existingParticipant);
      setViewedParticipant(null);
      setScreen("roomLobby");
      return "success";
    }

    const nextParticipant = createDraftParticipant(name.trim());
    const nextParticipants = [...currentRoomParticipants, nextParticipant];

    setParticipantsByRoomId((currentParticipantsByRoomId) => ({
      ...currentParticipantsByRoomId,
      [activeRoom.id]: nextParticipants
    }));
    setParticipantCodesByRoomId((currentCodesByRoomId) => ({
      ...currentCodesByRoomId,
      [activeRoom.id]: {
        ...(currentCodesByRoomId[activeRoom.id] ?? {}),
        [nextParticipant.name]: code
      }
    }));
    setRooms((currentRooms) =>
      currentRooms.map((room) =>
        room.id === activeRoom.id ? { ...room, participantsCount: nextParticipants.length } : room
      )
    );
    setActiveRoom((currentRoom) =>
      currentRoom.id === activeRoom.id ? { ...currentRoom, participantsCount: nextParticipants.length } : currentRoom
    );
    setCurrentParticipant(nextParticipant);
    setViewedParticipant(null);
    setScreen("roomLobby");
    return "success";
  };

  const openWorkspace = (participant: RoomParticipant) => {
    setViewedParticipant(participant);
    setScreen("workspace");
  };

  if (isAdminResultsRoute) {
    return <AdminResultsScreen />;
  }

  if (screen === "welcome") {
    return <WelcomeScreen onContinue={() => setScreen("rooms")} />;
  }

  if (screen === "rooms") {
    return <RoomsScreen rooms={rooms} onCreateRoom={createRoom} onOpenRoom={openRoomEntry} />;
  }

  if (screen === "roomEntry") {
    return (
      <RoomEntryScreen
        room={activeRoom}
        onBackToRooms={() => setScreen("rooms")}
        onEnterParticipant={enterParticipant}
        onVerifyRoomPassword={verifyRoomPassword}
      />
    );
  }

  if (screen === "roomLobby" && currentParticipant) {
    const activeRoomParticipants = getActiveRoomParticipants();

    return (
      <RoomLobbyScreen
        participants={activeRoomParticipants}
        room={activeRoom}
        onBackToRooms={() => setScreen("rooms")}
        onOpenMyPrediction={() => openWorkspace(currentParticipant)}
        onOpenParticipantPrediction={openWorkspace}
      />
    );
  }

  if (screen === "workspace" && currentParticipant && viewedParticipant) {
    const isReadOnly =
      normalizeParticipantName(viewedParticipant.name) !== normalizeParticipantName(currentParticipant.name);

    return (
      <WorkspaceScreen
        isReadOnly={isReadOnly}
        participantName={viewedParticipant.name}
        roomName={activeRoom.name}
        onBackToLobby={() => setScreen("roomLobby")}
      />
    );
  }

  return (
    <RoomEntryScreen
      room={activeRoom}
      onBackToRooms={() => setScreen("rooms")}
      onEnterParticipant={enterParticipant}
      onVerifyRoomPassword={verifyRoomPassword}
    />
  );
}
