import { useCallback, useEffect, useState, type ReactNode } from "react";

import type { GlobalLeaderboardEntry, MatchResult, ParticipantSession, PredictionStatus } from "@footballvanga/shared";

import { fetchGlobalLeaderboard } from "./api/leaderboard";
import {
  ApiError,
  createRoom as createRoomRequest,
  enterParticipant as enterParticipantRequest,
  enterRoom,
  fetchParticipants,
  fetchMatchHistory,
  fetchRoomLeaderboard,
  fetchRooms
} from "./api/rooms";
import { fetchTournament } from "./api/tournament";
import { ScoringRulesDialog } from "./components/scoring-rules/ScoringRulesDialog";
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

type AppRoute =
  | {
      type: "adminResults" | "rooms" | "welcome";
    }
  | {
      roomId: string;
      type: "roomEntry" | "roomLobby";
    }
  | {
      participantId: string;
      roomId: string;
      type: "globalPrediction" | "workspace";
    };

type StoredParticipantSession = {
  participant: RoomParticipant;
  roomId: string;
  session: ParticipantSession;
};

const PARTICIPANT_SESSION_STORAGE_PREFIX = "footballvanga:participant-session:";

const decodeRouteSegment = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const encodeRouteSegment = (value: string) => encodeURIComponent(value);

const normalizePath = (pathname: string) =>
  pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;

const parseAppRoute = (pathname: string): AppRoute => {
  const normalizedPath = normalizePath(pathname);

  if (normalizedPath === "/admin/results") {
    return {
      type: "adminResults"
    };
  }

  if (normalizedPath === "/rooms") {
    return {
      type: "rooms"
    };
  }

  const roomEntryMatch = normalizedPath.match(/^\/rooms\/([^/]+)\/enter$/);

  if (roomEntryMatch?.[1]) {
    return {
      roomId: decodeRouteSegment(roomEntryMatch[1]),
      type: "roomEntry"
    };
  }

  const roomLobbyMatch = normalizedPath.match(/^\/rooms\/([^/]+)\/lobby$/);

  if (roomLobbyMatch?.[1]) {
    return {
      roomId: decodeRouteSegment(roomLobbyMatch[1]),
      type: "roomLobby"
    };
  }

  const workspaceMatch = normalizedPath.match(/^\/rooms\/([^/]+)\/participants\/([^/]+)$/);

  if (workspaceMatch?.[1] && workspaceMatch[2]) {
    return {
      participantId: decodeRouteSegment(workspaceMatch[2]),
      roomId: decodeRouteSegment(workspaceMatch[1]),
      type: "workspace"
    };
  }

  const globalPredictionMatch = normalizedPath.match(/^\/leaderboard\/([^/]+)\/participants\/([^/]+)$/);

  if (globalPredictionMatch?.[1] && globalPredictionMatch[2]) {
    return {
      participantId: decodeRouteSegment(globalPredictionMatch[2]),
      roomId: decodeRouteSegment(globalPredictionMatch[1]),
      type: "globalPrediction"
    };
  }

  return {
    type: "welcome"
  };
};

const isRoomRoute = (
  route: AppRoute
): route is Extract<AppRoute, { roomId: string }> =>
  route.type === "roomEntry" || route.type === "roomLobby" || route.type === "workspace";

const getInitialScreen = (): AppScreen => {
  const route = parseAppRoute(window.location.pathname);

  if (route.type === "welcome") {
    return "welcome";
  }

  if (route.type === "globalPrediction") {
    return "globalPrediction";
  }

  return "rooms";
};

const shouldRestoreInitialRoute = () => {
  const route = parseAppRoute(window.location.pathname);

  return !["adminResults", "rooms", "welcome"].includes(route.type);
};

const setBrowserPath = (path: string, options: { replace?: boolean } = {}) => {
  if (window.location.pathname === path) {
    return;
  }

  const method = options.replace ? "replaceState" : "pushState";

  window.history[method]({}, "", path);
};

const getRoomEntryPath = (roomId: string) => `/rooms/${encodeRouteSegment(roomId)}/enter`;
const getRoomLobbyPath = (roomId: string) => `/rooms/${encodeRouteSegment(roomId)}/lobby`;
const getWorkspacePath = (roomId: string, participantId: string) =>
  `/rooms/${encodeRouteSegment(roomId)}/participants/${encodeRouteSegment(participantId)}`;
const getGlobalPredictionPath = (roomId: string, participantId: string) =>
  `/leaderboard/${encodeRouteSegment(roomId)}/participants/${encodeRouteSegment(participantId)}`;

const getParticipantSessionStorageKey = (roomId: string) => `${PARTICIPANT_SESSION_STORAGE_PREFIX}${roomId}`;

const persistParticipantSession = (input: StoredParticipantSession) => {
  window.localStorage.setItem(getParticipantSessionStorageKey(input.roomId), JSON.stringify(input));
};

const getStoredParticipantSession = (roomId: string): StoredParticipantSession | null => {
  const rawSession = window.localStorage.getItem(getParticipantSessionStorageKey(roomId));

  if (!rawSession) {
    return null;
  }

  try {
    const parsedSession = JSON.parse(rawSession) as StoredParticipantSession;

    if (
      parsedSession.roomId !== roomId ||
      !parsedSession.participant?.id ||
      !parsedSession.session?.participantId ||
      !parsedSession.session?.token ||
      !parsedSession.session?.expiresAtIso ||
      Date.now() >= Date.parse(parsedSession.session.expiresAtIso)
    ) {
      window.localStorage.removeItem(getParticipantSessionStorageKey(roomId));
      return null;
    }

    return parsedSession;
  } catch {
    window.localStorage.removeItem(getParticipantSessionStorageKey(roomId));
    return null;
  }
};

export default function App() {
  const isAdminResultsRoute = window.location.pathname === "/admin/results";
  const [screen, setScreen] = useState<AppScreen>(() => getInitialScreen());
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
  const [isRouteRestoring, setIsRouteRestoring] = useState(() => shouldRestoreInitialRoute());
  const [isScoringRulesOpen, setIsScoringRulesOpen] = useState(false);

  const openScoringRules = () => setIsScoringRulesOpen(true);
  const closeScoringRules = () => setIsScoringRulesOpen(false);

  const withScoringRules = (screenNode: ReactNode) => (
    <>
      {screenNode}
      <ScoringRulesDialog isOpen={isScoringRulesOpen} onClose={closeScoringRules} />
    </>
  );

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

  const restoreRoute = useCallback(async (options: { replace?: boolean } = {}) => {
    const route = parseAppRoute(window.location.pathname);

    if (route.type === "adminResults") {
      return;
    }

    if (route.type === "welcome") {
      setActiveRoom(null);
      setCurrentParticipant(null);
      setCurrentParticipantSession(null);
      setViewedParticipant(null);
      setViewedGlobalLeader(null);
      setScreen("welcome");
      return;
    }

    if (route.type === "rooms") {
      setActiveRoom(null);
      setCurrentParticipant(null);
      setCurrentParticipantSession(null);
      setViewedParticipant(null);
      setViewedGlobalLeader(null);
      setScreen("rooms");
      return;
    }

    setIsRouteRestoring(true);

    try {
      if (route.type === "globalPrediction") {
        const nextGlobalLeaderboard = await fetchGlobalLeaderboard();
        const leader = nextGlobalLeaderboard.find(
          (currentLeader) =>
            currentLeader.roomId === route.roomId && currentLeader.participantId === route.participantId
        );

        if (!leader) {
          throw new Error("Leaderboard participant was not found.");
        }

        setGlobalLeaderboard(nextGlobalLeaderboard);
        setViewedGlobalLeader(leader);
        setViewedParticipant(null);
        setCurrentParticipant(null);
        setCurrentParticipantSession(null);
        setActiveRoom(null);
        setScreen("globalPrediction");
        return;
      }

      if (!isRoomRoute(route)) {
        return;
      }

      const nextRooms = await fetchRooms();
      const room = nextRooms.find((currentRoom) => currentRoom.id === route.roomId);

      setRooms(nextRooms);

      if (!room) {
        throw new Error("Room was not found.");
      }

      setActiveRoom(room);
      setViewedGlobalLeader(null);

      if (route.type === "roomEntry") {
        setCurrentParticipant(null);
        setCurrentParticipantSession(null);
        setViewedParticipant(null);
        setScreen("roomEntry");
        return;
      }

      const storedSession = getStoredParticipantSession(room.id);

      if (!storedSession) {
        setCurrentParticipant(null);
        setCurrentParticipantSession(null);
        setViewedParticipant(null);
        setBrowserPath(getRoomEntryPath(room.id), {
          replace: options.replace
        });
        setScreen("roomEntry");
        return;
      }

      const participantResult = await fetchParticipants(room.id, storedSession.session.token).catch(() => {
        window.localStorage.removeItem(getParticipantSessionStorageKey(room.id));
        setCurrentParticipant(null);
        setCurrentParticipantSession(null);
        setViewedParticipant(null);
        setBrowserPath(getRoomEntryPath(room.id), {
          replace: true
        });
        setScreen("roomEntry");

        return null;
      });

      if (!participantResult) {
        return;
      }
      const participants = participantResult.participants;
      const currentParticipant =
        participants.find((participant) => participant.id === participantResult.participant.id) ??
        participantResult.participant;

      setParticipantsByRoomId((currentParticipantsByRoomId) => ({
        ...currentParticipantsByRoomId,
        [room.id]: participants
      }));
      setCurrentParticipant(currentParticipant);
      setCurrentParticipantSession(storedSession.session);

      if (route.type === "roomLobby") {
        setViewedParticipant(null);
        setScreen("roomLobby");
        return;
      }

      if (route.type !== "workspace") {
        return;
      }

      const viewedParticipant = participants.find((participant) => participant.id === route.participantId);

      if (!viewedParticipant) {
        setViewedParticipant(null);
        setBrowserPath(getRoomLobbyPath(room.id), {
          replace: true
        });
        setScreen("roomLobby");
        return;
      }

      setViewedParticipant(viewedParticipant);
      setScreen("workspace");
    } catch (error) {
      setRoomsError(error instanceof Error ? error.message : "Не удалось восстановить экран.");
      setActiveRoom(null);
      setCurrentParticipant(null);
      setCurrentParticipantSession(null);
      setViewedParticipant(null);
      setViewedGlobalLeader(null);
      setBrowserPath("/rooms", {
        replace: true
      });
      setScreen("rooms");
    } finally {
      setIsRouteRestoring(false);
    }
  }, []);

  useEffect(() => {
    if (isAdminResultsRoute || !tournament) {
      return;
    }

    void restoreRoute({
      replace: true
    });
  }, [isAdminResultsRoute, restoreRoute, tournament]);

  useEffect(() => {
    const restoreOnPopState = () => {
      void restoreRoute({
        replace: true
      });
    };

    window.addEventListener("popstate", restoreOnPopState);

    return () => {
      window.removeEventListener("popstate", restoreOnPopState);
    };
  }, [restoreRoute]);

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
    setBrowserPath(getRoomEntryPath(room.id));
    setScreen("roomEntry");
  };

  const verifyRoomPassword = async (password: string): Promise<RoomPasswordResult> => {
    if (!activeRoom) {
      return "unavailable";
    }

    try {
      const result = await enterRoom(activeRoom.id, password);

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
      persistParticipantSession({
        participant: result.participant,
        roomId: activeRoom.id,
        session: result.session
      });
      setViewedParticipant(null);
      setViewedGlobalLeader(null);
      setBrowserPath(getRoomLobbyPath(activeRoom.id));
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
    if (activeRoom) {
      setBrowserPath(getWorkspacePath(activeRoom.id, participant.id));
    }

    setViewedParticipant(participant);
    setViewedGlobalLeader(null);
    setScreen("workspace");
  };

  const openGlobalLeaderPrediction = (leader: GlobalLeaderboardEntry) => {
    setBrowserPath(getGlobalPredictionPath(leader.roomId, leader.participantId));
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
    return (
      <WelcomeScreen
        deadlineIso={tournament.deadlineIso}
        onContinue={() => {
          setBrowserPath("/rooms");
          setScreen("rooms");
        }}
      />
    );
  }

  if (isRouteRestoring) {
    return (
      <main className="app-status" role="status">
        <h1>Восстанавливаем экран</h1>
      </main>
    );
  }

  if (screen === "rooms") {
    return withScoringRules(
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
        onOpenScoringRules={openScoringRules}
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
          setBrowserPath("/rooms");
          setScreen("rooms");
        }}
        onEnterParticipant={enterParticipant}
        onVerifyRoomPassword={verifyRoomPassword}
        participants={getRoomParticipants(activeRoom.id)}
      />
    );
  }

  if (screen === "roomLobby" && activeRoom && currentParticipant && currentParticipantSession) {
    const activeRoomParticipants = getActiveRoomParticipants();

    return withScoringRules(
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
          setBrowserPath("/rooms");
          setScreen("rooms");
        }}
        onOpenMyPrediction={() => openWorkspace(currentParticipant)}
        onOpenParticipantPrediction={openWorkspace}
        onOpenScoringRules={openScoringRules}
      />
    );
  }

  if (screen === "workspace" && activeRoom && currentParticipant && currentParticipantSession && viewedParticipant) {
    const isReadOnly = viewedParticipant.id !== currentParticipant.id;

    return withScoringRules(
      <WorkspaceScreen
        isReadOnly={isReadOnly}
        onParticipantPredictionStatusChange={updateParticipantPredictionStatus}
        participantId={viewedParticipant.id}
        participantName={viewedParticipant.name}
        roomId={activeRoom.id}
        roomName={activeRoom.name}
        sessionToken={currentParticipantSession.token}
        tournament={tournament}
        onBackToLobby={() => {
          setBrowserPath(getRoomLobbyPath(activeRoom.id));
          setScreen("roomLobby");
        }}
        onOpenScoringRules={openScoringRules}
      />
    );
  }

  if (screen === "globalPrediction" && viewedGlobalLeader) {
    return withScoringRules(
      <WorkspaceScreen
        backButtonLabel="Комнаты"
        isPublicReadOnly
        isReadOnly
        participantId={viewedGlobalLeader.participantId}
        participantName={viewedGlobalLeader.displayName}
        roomId={viewedGlobalLeader.roomId}
        roomName={viewedGlobalLeader.roomName}
        tournament={tournament}
        onBackToLobby={() => {
          setBrowserPath("/rooms");
          setScreen("rooms");
        }}
        onOpenScoringRules={openScoringRules}
      />
    );
  }

  return withScoringRules(
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
      onOpenScoringRules={openScoringRules}
      onRetryGlobalLeaderboard={loadGlobalLeaderboard}
      onRetry={loadRooms}
    />
  );
}
