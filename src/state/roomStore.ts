import { create } from 'zustand';
import {
  clearPersistedRoom,
  createGame,
  joinGame,
  leaveGame,
  loadHostDetail,
  loadPersistedRoom,
  persistRoom,
  loadMyPlayerSecret,
  loadSnapshot,
  startGame,
  subscribeRoom,
  type HostDetail,
  type LobbyGame,
  type LobbyPlayer,
  type PlayerSecret,
} from '../services/room';
import * as game from '../services/game';
import { ensureAnonSession } from '../services/supabase';
import type { Combination } from '../engine/types';

export type RoomRole = 'host' | 'player';

type RoomState = {
  role: RoomRole | null;
  gameId: string | null;
  code: string | null;
  myUid: string | null;
  myPlayerId: string | null;
  game: LobbyGame | null;
  players: LobbyPlayer[];
  mySecret: PlayerSecret | null;
  hostDetail: HostDetail | null;
  busy: boolean;
  error: string | null;
};

type RoomActions = {
  hostCreate: () => Promise<void>;
  join: (code: string, name: string) => Promise<void>;
  refresh: () => Promise<void>;
  start: () => Promise<void>;
  defineSetup: (combination: Combination, revealedCardId: string) => Promise<void>;
  submitBet: (
    tombola: 'A' | 'B',
    amount: number,
    order: number[],
    columns: number[],
  ) => Promise<void>;
  hostStart: () => Promise<void>;
  hostResolve: () => Promise<void>;
  hostAdvance: () => Promise<void>;
  reconnect: () => Promise<void>;
  leave: () => Promise<void>;
  clearError: () => void;
};

/** player_id del jugador actual (null si es host o aún no cargó). */
function myPlayerId(state: RoomState): string | null {
  if (state.myPlayerId) return state.myPlayerId;
  const me = state.players.find((p) => p.auth_uid === state.myUid);
  return me?.id ?? null;
}

let unsub: (() => void) | null = null;
let poll: ReturnType<typeof setInterval> | null = null;

/** Activa realtime + un refresco periódico de respaldo (auto-sana eventos perdidos). */
function startSync(gameId: string, refresh: () => void) {
  stopSync();
  unsub = subscribeRoom(gameId, refresh);
  poll = setInterval(refresh, 4000);
}

function stopSync() {
  unsub?.();
  unsub = null;
  if (poll) {
    clearInterval(poll);
    poll = null;
  }
}

const initial: RoomState = {
  role: null,
  gameId: null,
  code: null,
  myUid: null,
  myPlayerId: null,
  game: null,
  players: [],
  mySecret: null,
  hostDetail: null,
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
      persistRoom({ gameId, role: 'host', code, myPlayerId: null });
      startSync(gameId, () => get().refresh());
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
      const resolvedCode = get().game?.code ?? code.toUpperCase();
      set({ code: resolvedCode });
      persistRoom({ gameId, role: 'player', code: resolvedCode, myPlayerId: playerId });
      startSync(gameId, () => get().refresh());
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
      const playerId = myPlayerId({ ...get(), players: snap.players });
      let mySecret = get().mySecret;
      if (get().role === 'player' && playerId) {
        try {
          mySecret = await loadMyPlayerSecret(playerId);
        } catch {
          /* aún sin secretos (antes de iniciar) */
        }
      } else if (get().role === 'host') {
        mySecret = null;
      }
      let hostDetail = get().hostDetail;
      if (get().role === 'host' && snap.game.status !== 'lobby') {
        try {
          hostDetail = await loadHostDetail(gameId, snap.game.round);
        } catch {
          /* ignora */
        }
      }
      set({ game: snap.game, players: snap.players, mySecret, hostDetail });
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

  async defineSetup(combination, revealedCardId) {
    const playerId = myPlayerId(get());
    if (!playerId) return;
    set({ busy: true, error: null });
    try {
      await game.defineSetup(playerId, combination, revealedCardId);
      await get().refresh();
    } catch (e) {
      set({ error: errMessage(e) });
    } finally {
      set({ busy: false });
    }
  },

  async submitBet(tombola, amount, order, columns) {
    const playerId = myPlayerId(get());
    const round = get().game?.round ?? 0;
    if (!playerId) return;
    set({ busy: true, error: null });
    try {
      await game.submitBet(playerId, round, tombola, amount, order, columns);
      await get().refresh();
    } catch (e) {
      set({ error: errMessage(e) });
    } finally {
      set({ busy: false });
    }
  },

  async hostStart() {
    const { gameId } = get();
    if (!gameId) return;
    set({ busy: true, error: null });
    try {
      await game.hostStartRounds(gameId);
      await get().refresh();
    } catch (e) {
      set({ error: errMessage(e) });
    } finally {
      set({ busy: false });
    }
  },

  async hostResolve() {
    const { gameId } = get();
    if (!gameId) return;
    set({ busy: true, error: null });
    try {
      await game.resolveRound(gameId);
      await get().refresh();
    } catch (e) {
      set({ error: errMessage(e) });
    } finally {
      set({ busy: false });
    }
  },

  async hostAdvance() {
    const { gameId } = get();
    if (!gameId) return;
    set({ busy: true, error: null });
    try {
      await game.advanceRound(gameId);
      await get().refresh();
    } catch (e) {
      set({ error: errMessage(e) });
    } finally {
      set({ busy: false });
    }
  },

  async reconnect() {
    const saved = loadPersistedRoom();
    if (!saved) return;
    set({ busy: true });
    try {
      const uid = await ensureAnonSession();
      const snap = await loadSnapshot(saved.gameId); // lanza si la sala ya no existe
      const stillValid =
        saved.role === 'host'
          ? snap.game.host_uid === uid
          : snap.players.some((p) => p.auth_uid === uid);
      if (!stillValid) {
        clearPersistedRoom();
        return;
      }
      set({
        role: saved.role,
        gameId: saved.gameId,
        code: snap.game.code,
        myUid: uid,
        myPlayerId: saved.myPlayerId,
      });
      await get().refresh();
      startSync(saved.gameId, () => get().refresh());
    } catch {
      // Sala borrada o inaccesible: olvida la persistencia y vuelve al inicio.
      clearPersistedRoom();
    } finally {
      set({ busy: false });
    }
  },

  async leave() {
    const { myPlayerId: pid } = get();
    stopSync();
    clearPersistedRoom();
    if (pid) await leaveGame(pid).catch(() => {});
    set({ ...initial });
  },

  clearError() {
    set({ error: null });
  },
}));
