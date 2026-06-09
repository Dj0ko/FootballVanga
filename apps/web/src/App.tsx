import { useCallback, useEffect, useState } from "react";

import { ApiError, createRoom as createRoomRequest, enterRoom, fetchRooms } from "./api/rooms";
import {
  mockParticipantCodesByRoomId,
  type CreateRoomInput,
  type RoomParticipant,
  type RoomSummary
} from "./data/mockFootball";
import { AdminResultsScreen } from "./screens/admin-results/AdminResultsScreen";
import {
  RoomEntryScreen,
  type ParticipantEntryInput,
  type ParticipantEntryResult,
  type RoomPasswordResult
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
  const [activeRoom, setActiveRoom] = useState<RoomSummary | null>(null);
  const [currentParticipant, setCurrentParticipant] = useState<RoomParticipant | null>(null);
  const [viewedParticipant, setViewedParticipant] = useState<RoomParticipant | null>(null);
  const [participantsByRoomId, setParticipantsByRoomId] = useState<Record<string, RoomParticipant[]>>({});
  const [participantCodesByRoomId, setParticipantCodesByRoomId] = useState<Record<string, Record<string, string>>>(
    mockParticipantCodesByRoomId
  );
  const [isRoomsLoading, setIsRoomsLoading] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [roomsError, setRoomsError] = useState("");

  const loadRooms = useCallback(async () => {
    setIsRoomsLoading(true);
    setRoomsError("");

    try {
      setRooms(await fetchRooms());
    } catch (error) {
      setRoomsError(error instanceof Error ? error.message : "Не удалось загрузить комнаты.");
    } finally {
      setIsRoomsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (screen === "rooms") {
      void loadRooms();
    }
  }, [loadRooms, screen]);

  const getRoomParticipants = (roomId: string) => participantsByRoomId[roomId] ?? [];

  const getActiveRoomParticipants = () =>
    activeRoom === null
      ? []
      : getRoomParticipants(activeRoom.id).map((participant) => ({
          ...participant,
          isCurrent:
            currentParticipant !== null &&
            normalizeParticipantName(participant.name) === normalizeParticipantName(currentParticipant.name)
        }));

  const createRoom = async (input: CreateRoomInput) => {
    setIsCreatingRoom(true);
    setRoomsError("");

    try {
      const nextRoom = await createRoomRequest(input);

      setRooms((currentRooms) => [nextRoom, ...currentRooms]);
      setParticipantsByRoomId((currentParticipantsByRoomId) => ({
        ...currentParticipantsByRoomId,
        [nextRoom.id]: []
      }));
      setParticipantCodesByRoomId((currentCodesByRoomId) => ({
        ...currentCodesByRoomId,
        [nextRoom.id]: {}
      }));

      return true;
    } catch (error) {
      setRoomsError(error instanceof Error ? error.message : "Не удалось создать комнату.");
      return false;
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const openRoomEntry = (room: RoomSummary) => {
    setActiveRoom(room);
    setCurrentParticipant(null);
    setViewedParticipant(null);
    setScreen("roomEntry");
  };

  const verifyRoomPassword = async (password: string): Promise<RoomPasswordResult> => {
    if (!activeRoom) {
      return "unavailable";
    }

    try {
      await enterRoom(activeRoom.id, password);
      return "success";
    } catch (error) {
      if (error instanceof ApiError && [400, 401, 404].includes(error.status)) {
        return "invalid-password";
      }

      return "unavailable";
    }
  };

  const enterParticipant = ({ code, name }: ParticipantEntryInput): ParticipantEntryResult => {
    if (!activeRoom) {
      return "invalid-code";
    }

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
      currentRoom?.id === activeRoom.id
        ? { ...currentRoom, participantsCount: nextParticipants.length }
        : currentRoom
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
    return (
      <RoomsScreen
        error={roomsError}
        isCreatePending={isCreatingRoom}
        isLoading={isRoomsLoading}
        rooms={rooms}
        onCreateRoom={createRoom}
        onOpenRoom={openRoomEntry}
        onRetry={loadRooms}
      />
    );
  }

  if (screen === "roomEntry" && activeRoom) {
    return (
      <RoomEntryScreen
        room={activeRoom}
        onBackToRooms={() => setScreen("rooms")}
        onEnterParticipant={enterParticipant}
        onVerifyRoomPassword={verifyRoomPassword}
      />
    );
  }

  if (screen === "roomLobby" && activeRoom && currentParticipant) {
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

  if (screen === "workspace" && activeRoom && currentParticipant && viewedParticipant) {
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
    <RoomsScreen
      error={roomsError}
      isCreatePending={isCreatingRoom}
      isLoading={isRoomsLoading}
      rooms={rooms}
      onCreateRoom={createRoom}
      onOpenRoom={openRoomEntry}
      onRetry={loadRooms}
    />
  );
}
