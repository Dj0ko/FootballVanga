import { useCallback, useEffect, useState } from "react";

import type { GlobalLeaderboardEntry, MatchResult, ParticipantSession, PredictionStatus } from "@footballvanga/shared";

import { fetchGlobalLeaderboard } from "./api/leaderboard";
import {
  ApiError,
  createRoom as createRoomRequest,
  enterParticipant as enterParticipantRequest,
  enterRoom,
  fetchMatchHistory,
  fetchRoomLeaderboard,
  fetchRooms
} from "./api/rooms";
import { fetchTournament } from "./api/tournament";
import { type CreateRoomInput, type RoomParticipant, type RoomSummary } from "./data/rooms";
import type { TournamentView } from "./data/tournament";
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

type AppScreen = "welcome" | "rooms" | "roomEntry" | "roomLobby" | "workspace" | "globalPrediction";

export default function App() {
  const isAdminResultsRoute = window.location.pathname === "/admin/results";
  const [screen, setScreen] = useState<AppScreen>("welcome");
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [activeRoom, setActiveRoom] = useState<RoomSummary | null>(null);
  const [currentParticipant, setCurrentParticipant] = useState<RoomParticipant | null>(null);
  const [currentParticipantSession, setCurrentParticipantSession] = useState<ParticipantSession | null>(null);
  const [viewedParticipant, setViewedParticipant] = useState<RoomParticipant | null>(null);
  const [viewedGlobalLeader, setViewedGlobalLeader] = useState<GlobalLeaderboardEntry | null>(null);
  const [participantsByRoomId, setParticipantsByRoomId] = useState<Record<string, RoomParticipant[]>>({});
  const [globalLeaderboard, setGlobalLeaderboard] = useState<GlobalLeaderboardEntry[]>([]);
  const [globalLeaderboardError, setGlobalLeaderboardError] = useState("");
  const [isGlobalLeaderboardLoading, setIsGlobalLeaderboardLoading] = useState(false);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [matchResultsError, setMatchResultsError] = useState("");
  const [isRoomsLoading, setIsRoomsLoading] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [roomsError, setRoomsError] = useState("");
  const [tournament, setTournament] = useState<TournamentView | null>(null);
  const [tournamentError, setTournamentError] = useState("");
  const [isTournamentLoading, setIsTournamentLoading] = useState(true);

  const loadTournament = useCallback(async () => {
    setIsTournamentLoading(true);
    setTournamentError("");

    try {
      setTournament(await fetchTournament());
    } catch (error) {
      setTournamentError(error instanceof Error ? error.message : "Не удалось загрузить данные турнира.");
    } finally {
      setIsTournamentLoading(false);
    }
  }, []);

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

  const loadMatchResults = useCallback(async () => {
    setMatchResultsError("");

    try {
      setMatchResults(await fetchMatchHistory());
    } catch (error) {
      setMatchResultsError(error instanceof Error ? error.message : "Не удалось загрузить результаты матчей.");
    }
  }, []);

  const loadGlobalLeaderboard = useCallback(async () => {
    setIsGlobalLeaderboardLoading(true);
    setGlobalLeaderboardError("");

    try {
      setGlobalLeaderboard(await fetchGlobalLeaderboard());
    } catch (error) {
      setGlobalLeaderboardError(error instanceof Error ? error.message : "Не удалось загрузить лидеров.");
    } finally {
      setIsGlobalLeaderboardLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTournament();
  }, [loadTournament]);

  useEffect(() => {
    if (screen === "rooms") {
      void loadRooms();
      void loadMatchResults();
      void loadGlobalLeaderboard();
    }
  }, [loadGlobalLeaderboard, loadMatchResults, loadRooms, screen]);

  const refreshRoomLeaderboard = useCallback(async (roomId: string, sessionToken: string) => {
    try {
      const leaderboard = await fetchRoomLeaderboard(roomId, sessionToken);

      setParticipantsByRoomId((currentParticipantsByRoomId) => ({
        ...currentParticipantsByRoomId,
        [roomId]: leaderboard
      }));
    } catch {
      // Keep the last known participant list if the leaderboard refresh fails.
    }
  }, []);

  useEffect(() => {
    if (screen === "roomLobby" && activeRoom && currentParticipantSession) {
      void refreshRoomLeaderboard(activeRoom.id, currentParticipantSession.token);
    }
  }, [activeRoom, currentParticipantSession, refreshRoomLeaderboard, screen]);

  const getRoomParticipants = (roomId: string) => participantsByRoomId[roomId] ?? [];

  const getActiveRoomParticipants = () =>
    activeRoom === null
      ? []
      : getRoomParticipants(activeRoom.id).map((participant) => ({
          ...participant,
          isCurrent: currentParticipant !== null && participant.id === currentParticipant.id
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
    setCurrentParticipantSession(null);
    setViewedParticipant(null);
    setViewedGlobalLeader(null);
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

  const enterParticipant = async ({
    code,
    name,
    roomPassword
  }: ParticipantEntryInput): Promise<ParticipantEntryResult> => {
    if (!activeRoom) {
      return "unavailable";
    }

    try {
      const result = await enterParticipantRequest(activeRoom.id, {
        code,
        displayName: name,
        roomPassword
      });

      setParticipantsByRoomId((currentParticipantsByRoomId) => ({
        ...currentParticipantsByRoomId,
        [activeRoom.id]: result.participants
      }));
      setRooms((currentRooms) =>
        currentRooms.map((room) =>
          room.id === activeRoom.id ? { ...room, participantsCount: result.participants.length } : room
        )
      );
      setActiveRoom((currentRoom) =>
        currentRoom?.id === activeRoom.id
          ? { ...currentRoom, participantsCount: result.participants.length }
          : currentRoom
      );
      setCurrentParticipant(result.participant);
      setCurrentParticipantSession(result.session);
      setViewedParticipant(null);
      setViewedGlobalLeader(null);
      setScreen("roomLobby");
      return "success";
    } catch (error) {
      if (error instanceof ApiError && [400, 401].includes(error.status)) {
        return "invalid-code";
      }

      return "unavailable";
    }
  };

  const openWorkspace = (participant: RoomParticipant) => {
    setViewedParticipant(participant);
    setViewedGlobalLeader(null);
    setScreen("workspace");
  };

  const openGlobalLeaderPrediction = (leader: GlobalLeaderboardEntry) => {
    setViewedGlobalLeader(leader);
    setViewedParticipant(null);
    setScreen("globalPrediction");
  };

  const updateParticipantPredictionStatus = useCallback(
    (participantId: string, predictionStatus: PredictionStatus) => {
      if (!activeRoom) {
        return;
      }

      setParticipantsByRoomId((currentParticipantsByRoomId) => ({
        ...currentParticipantsByRoomId,
        [activeRoom.id]: (currentParticipantsByRoomId[activeRoom.id] ?? []).map((participant) =>
          participant.id === participantId ? { ...participant, predictionStatus } : participant
        )
      }));
      setCurrentParticipant((participant) =>
        participant?.id === participantId ? { ...participant, predictionStatus } : participant
      );
      setViewedParticipant((participant) =>
        participant?.id === participantId ? { ...participant, predictionStatus } : participant
      );
    },
    [activeRoom]
  );

  if (isAdminResultsRoute) {
    if (!tournament) {
      return (
        <main className="app-status" role={tournamentError ? "alert" : "status"}>
          <h1>{tournamentError ? "Турнир недоступен" : "Загружаем турнир"}</h1>
          {tournamentError ? <p>{tournamentError}</p> : null}
          {tournamentError ? (
            <button type="button" onClick={loadTournament} disabled={isTournamentLoading}>
              Повторить
            </button>
          ) : null}
        </main>
      );
    }

    return <AdminResultsScreen tournament={tournament} />;
  }

  if (!tournament) {
    return (
      <main className="app-status" role={tournamentError ? "alert" : "status"}>
        <h1>{tournamentError ? "Турнир недоступен" : "Загружаем турнир"}</h1>
        {tournamentError ? <p>{tournamentError}</p> : null}
        {tournamentError ? (
          <button type="button" onClick={loadTournament} disabled={isTournamentLoading}>
            Повторить
          </button>
        ) : null}
      </main>
    );
  }

  if (screen === "welcome") {
    return <WelcomeScreen deadlineIso={tournament.deadlineIso} onContinue={() => setScreen("rooms")} />;
  }

  if (screen === "rooms") {
    return (
      <RoomsScreen
        deadlineIso={tournament.deadlineIso}
        error={roomsError}
        isCreatePending={isCreatingRoom}
        globalLeaderboard={globalLeaderboard}
        globalLeaderboardError={globalLeaderboardError}
        isLoading={isRoomsLoading}
        isGlobalLeaderboardLoading={isGlobalLeaderboardLoading}
        matches={tournament.matches}
        matchResults={matchResults}
        matchResultsError={matchResultsError}
        rooms={rooms}
        onCreateRoom={createRoom}
        onOpenGlobalLeader={openGlobalLeaderPrediction}
        onOpenRoom={openRoomEntry}
        onRetryGlobalLeaderboard={loadGlobalLeaderboard}
        onRetry={loadRooms}
      />
    );
  }

  if (screen === "roomEntry" && activeRoom) {
    return (
      <RoomEntryScreen
        room={activeRoom}
        onBackToRooms={() => {
          setCurrentParticipantSession(null);
          setScreen("rooms");
        }}
        onEnterParticipant={enterParticipant}
        onVerifyRoomPassword={verifyRoomPassword}
      />
    );
  }

  if (screen === "roomLobby" && activeRoom && currentParticipant && currentParticipantSession) {
    const activeRoomParticipants = getActiveRoomParticipants();

    return (
      <RoomLobbyScreen
        deadlineIso={tournament.deadlineIso}
        matchCount={tournament.matches.length}
        participants={activeRoomParticipants}
        room={activeRoom}
        onBackToRooms={() => {
          setCurrentParticipant(null);
          setCurrentParticipantSession(null);
          setViewedParticipant(null);
          setViewedGlobalLeader(null);
          setScreen("rooms");
        }}
        onOpenMyPrediction={() => openWorkspace(currentParticipant)}
        onOpenParticipantPrediction={openWorkspace}
      />
    );
  }

  if (screen === "workspace" && activeRoom && currentParticipant && currentParticipantSession && viewedParticipant) {
    const isReadOnly = viewedParticipant.id !== currentParticipant.id;

    return (
      <WorkspaceScreen
        isReadOnly={isReadOnly}
        onParticipantPredictionStatusChange={updateParticipantPredictionStatus}
        participantId={viewedParticipant.id}
        participantName={viewedParticipant.name}
        roomId={activeRoom.id}
        roomName={activeRoom.name}
        sessionToken={currentParticipantSession.token}
        tournament={tournament}
        onBackToLobby={() => setScreen("roomLobby")}
      />
    );
  }

  if (screen === "globalPrediction" && viewedGlobalLeader) {
    return (
      <WorkspaceScreen
        backButtonLabel="Комнаты"
        isPublicReadOnly
        isReadOnly
        participantId={viewedGlobalLeader.participantId}
        participantName={viewedGlobalLeader.displayName}
        roomId={viewedGlobalLeader.roomId}
        roomName={viewedGlobalLeader.roomName}
        tournament={tournament}
        onBackToLobby={() => setScreen("rooms")}
      />
    );
  }

  return (
    <RoomsScreen
      deadlineIso={tournament.deadlineIso}
      error={roomsError}
      isCreatePending={isCreatingRoom}
      globalLeaderboard={globalLeaderboard}
      globalLeaderboardError={globalLeaderboardError}
      isLoading={isRoomsLoading}
      isGlobalLeaderboardLoading={isGlobalLeaderboardLoading}
      matches={tournament.matches}
      matchResults={matchResults}
      matchResultsError={matchResultsError}
      rooms={rooms}
      onCreateRoom={createRoom}
      onOpenGlobalLeader={openGlobalLeaderPrediction}
      onOpenRoom={openRoomEntry}
      onRetryGlobalLeaderboard={loadGlobalLeaderboard}
      onRetry={loadRooms}
    />
  );
}
