import { create } from 'zustand';
import {
  autoAssignTeams,
  createGame,
  joinGame,
  leaveGame,
  loadSnapshot,
  renameTeam,
  setRepresentative,
  startGame,
  subscribeRoom,
  type LobbyGame,
  type LobbyPlayer,
  type LobbyTeam,
} from '../services/room';

export type RoomRole = 'host' | 'player';

type RoomState = {
  role: RoomRole | null;
  gameId: string | null;
  code: string | null;
  myUid: string | null;
  myPlayerId: string | null;
  game: LobbyGame | null;
  players: LobbyPlayer[];
  teams: LobbyTeam[];
  busy: boolean;
  error: string | null;
};

type RoomActions = {
  hostCreate: () => Promise<void>;
  join: (code: string, name: string) => Promise<void>;
  refresh: () => Promise<void>;
  autoAssign: () => Promise<void>;
  setRep: (teamId: string, playerAuthUid: string) => Promise<void>;
  rename: (teamId: string, name: string) => Promise<void>;
  start: () => Promise<void>;
  leave: () => Promise<void>;
  clearError: () => void;
};

let unsub: (() => void) | null = null;

const initial: RoomState = {
  role: null,
  gameId: null,
  code: null,
  myUid: null,
  myPlayerId: null,
  game: null,
  players: [],
  teams: [],
  busy: false,
  error: null,
};

function errMessage(e: unknown): string {
  return e instanceof Error ? e.message : 'Ocurrió un error inesperado.';
}

export const useRoomStore = create<RoomState & RoomActions>((set, get) => ({
  ...initial,

  async hostCreate() {
    set({ busy: true, error: null });
    try {
      const { gameId, code, hostUid } = await createGame();
      set({ role: 'host', gameId, code, myUid: hostUid });
      await get().refresh();
      unsub?.();
      unsub = subscribeRoom(gameId, () => {
        get().refresh();
      });
    } catch (e) {
      set({ error: errMessage(e) });
    } finally {
      set({ busy: false });
    }
  },

  async join(code, name) {
    set({ busy: true, error: null });
    try {
      const { gameId, playerId, uid } = await joinGame(code, name);
      set({ role: 'player', gameId, myPlayerId: playerId, myUid: uid });
      await get().refresh();
      set({ code: get().game?.code ?? code.toUpperCase() });
      unsub?.();
      unsub = subscribeRoom(gameId, () => {
        get().refresh();
      });
    } catch (e) {
      set({ error: errMessage(e) });
    } finally {
      set({ busy: false });
    }
  },

  async refresh() {
    const { gameId } = get();
    if (!gameId) return;
    try {
      const snap = await loadSnapshot(gameId);
      set({ game: snap.game, players: snap.players, teams: snap.teams });
    } catch (e) {
      set({ error: errMessage(e) });
    }
  },

  async autoAssign() {
    const { gameId } = get();
    if (!gameId) return;
    set({ busy: true, error: null });
    try {
      await autoAssignTeams(gameId);
      await get().refresh();
    } catch (e) {
      set({ error: errMessage(e) });
    } finally {
      set({ busy: false });
    }
  },

  async setRep(teamId, playerAuthUid) {
    try {
      await setRepresentative(teamId, playerAuthUid);
      await get().refresh();
    } catch (e) {
      set({ error: errMessage(e) });
    }
  },

  async rename(teamId, name) {
    try {
      await renameTeam(teamId, name);
      await get().refresh();
    } catch (e) {
      set({ error: errMessage(e) });
    }
  },

  async start() {
    const { gameId } = get();
    if (!gameId) return;
    set({ busy: true, error: null });
    try {
      await startGame(gameId);
      await get().refresh();
    } catch (e) {
      set({ error: errMessage(e) });
    } finally {
      set({ busy: false });
    }
  },

  async leave() {
    const { myPlayerId } = get();
    unsub?.();
    unsub = null;
    if (myPlayerId) await leaveGame(myPlayerId).catch(() => {});
    set({ ...initial });
  },

  clearError() {
    set({ error: null });
  },
}));
