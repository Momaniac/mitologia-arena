import { create } from 'zustand';
import {
  autoAssignTeams,
  createGame,
  joinGame,
  leaveGame,
  loadHostDetail,
  loadMyTeamSecret,
  loadSnapshot,
  renameTeam,
  setRepresentative,
  startGame,
  subscribeRoom,
  type HostDetail,
  type LobbyGame,
  type LobbyPlayer,
  type LobbyTeam,
  type TeamSecret,
} from '../services/room';
import * as game from '../services/game';
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
  teams: LobbyTeam[];
  mySecret: TeamSecret | null;
  hostDetail: HostDetail | null;
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
  leave: () => Promise<void>;
  clearError: () => void;
};

/** team_id del jugador actual (null si es host o aún sin equipo). */
function myTeamId(state: RoomState): string | null {
  const me = state.players.find((p) => p.auth_uid === state.myUid);
  return me?.team_id ?? null;
}

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
      const me = snap.players.find((p) => p.auth_uid === get().myUid);
      const teamId = me?.team_id ?? null;
      let mySecret = get().mySecret;
      if (teamId) {
        try {
          mySecret = await loadMyTeamSecret(teamId);
        } catch {
          /* aún sin secretos (antes de iniciar) */
        }
      } else {
        mySecret = null;
      }
      let hostDetail = get().hostDetail;
      if (get().role === 'host' && snap.game.status !== 'lobby') {
        try {
          hostDetail = await loadHostDetail(gameId);
        } catch {
          /* ignora */
        }
      }
      set({ game: snap.game, players: snap.players, teams: snap.teams, mySecret, hostDetail });
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

  async defineSetup(combination, revealedCardId) {
    const teamId = myTeamId(get());
    if (!teamId) return;
    set({ busy: true, error: null });
    try {
      await game.defineSetup(teamId, combination, revealedCardId);
      await get().refresh();
    } catch (e) {
      set({ error: errMessage(e) });
    } finally {
      set({ busy: false });
    }
  },

  async submitBet(tombola, amount, order, columns) {
    const teamId = myTeamId(get());
    const round = get().game?.round ?? 0;
    if (!teamId) return;
    set({ busy: true, error: null });
    try {
      await game.submitBet(teamId, round, tombola, amount, order, columns);
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
