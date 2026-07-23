import { supabase, ensureAnonSession } from './supabase';
import type { Json } from './database.types';
import { emptyBoard } from '../engine/board';
import { buildTombolas } from '../engine/tombolas';
import { dealHandsIndependent, handToCombination } from '../engine/deck';
import { assignUniqueConditions } from '../engine/conditions';
import { makeRng } from '../engine/rng';
import type {
  Board,
  Card,
  Combination,
  Condition,
  Token,
} from '../engine/types';

export type RoundResultPublic = {
  round: number;
  kind: 'winner' | 'void';
  tombola?: 'A' | 'B';
  totals: { A: number; B: number };
  reason?: string;
};

export type PlayerScore = {
  playerId: string;
  name: string;
  raw: number;
  conditionMet: boolean;
  multiplier: 1 | 2;
  total: number;
};

export type PlayerSecret = {
  player_id: string;
  hand: Card[];
  combination: Combination | null;
  condition: Condition;
  coins: number;
};

// Caracteres sin ambigüedad (sin I, O, 0, 1, L).
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function genCode(len = 5): string {
  let out = '';
  for (let i = 0; i < len; i++) {
    out += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return out;
}

export type LobbyGame = {
  id: string;
  code: string;
  host_uid: string;
  status: string;
  mode: string;
  phase: string;
  round: number;
  board: Board;
  current_draw: { A: Token[]; B: Token[] } | null;
  bet_totals: { A: number; B: number } | null;
  last_result: RoundResultPublic | null;
  final_scores: PlayerScore[] | null;
};

export type LobbyPlayer = {
  id: string;
  game_id: string;
  auth_uid: string;
  name: string;
  connected: boolean;
  revealed_card_id: string | null;
  score: number;
  rounds_won: number;
  setup_done: boolean;
  bet_submitted: boolean;
};

export type RoomSnapshot = {
  game: LobbyGame;
  players: LobbyPlayer[];
};

function isUniqueViolation(error: { code?: string } | null): boolean {
  return error?.code === '23505';
}

const PLAYER_COLS =
  'id, game_id, auth_uid, name, connected, revealed_card_id, score, rounds_won, setup_done, bet_submitted';

/** Crea una sala como host. Devuelve gameId, code y el uid del host. */
export async function createGame(): Promise<{
  gameId: string;
  code: string;
  hostUid: string;
}> {
  const uid = await ensureAnonSession();
  for (let attempt = 0; attempt < 6; attempt++) {
    const code = genCode();
    const { data, error } = await supabase
      .from('games')
      .insert({
        code,
        host_uid: uid,
        status: 'lobby',
        mode: 'individual',
        phase: 'LOBBY',
        round: 0,
        board: emptyBoard() as unknown as Json,
      })
      .select('id, code')
      .single();

    if (error) {
      if (isUniqueViolation(error)) continue; // colisión de código, reintenta
      throw error;
    }

    const seed = Date.now();
    const { error: gpError } = await supabase
      .from('game_private')
      .insert({ game_id: data.id, seed });
    if (gpError) throw gpError;

    return { gameId: data.id, code: data.code, hostUid: uid };
  }
  throw new Error('No se pudo generar un código de sala único. Intenta de nuevo.');
}

/** Une al dispositivo a una sala por código. */
export async function joinGame(
  code: string,
  name: string,
): Promise<{ gameId: string; playerId: string; uid: string }> {
  const uid = await ensureAnonSession();
  const { data, error } = await supabase.rpc('join_game', {
    p_code: code.trim().toUpperCase(),
    p_name: name.trim() || 'Jugador',
  });
  if (error) throw error;
  const row = (Array.isArray(data) ? data[0] : data) as
    | { game_id: string; player_id: string }
    | null;
  if (!row) throw new Error('No fue posible unirse a la sala.');
  return { gameId: row.game_id, playerId: row.player_id, uid };
}

/** Carga una foto completa del lobby (partida + jugadores). */
export async function loadSnapshot(gameId: string): Promise<RoomSnapshot> {
  const [{ data: game, error: ge }, { data: players, error: pe }] =
    await Promise.all([
      supabase
        .from('games')
        .select(
          'id, code, host_uid, status, mode, phase, round, board, current_draw, bet_totals, last_result, final_scores',
        )
        .eq('id', gameId)
        .single(),
      supabase.from('players').select(PLAYER_COLS).eq('game_id', gameId).order('joined_at'),
    ]);
  if (ge) throw ge;
  if (pe) throw pe;
  return {
    game: game as unknown as LobbyGame,
    players: (players ?? []) as unknown as LobbyPlayer[],
  };
}

/** Apuesta cruda (solo el host la lee antes de resolver). */
export type HostBet = {
  player_id: string;
  round: number;
  tombola: 'A' | 'B';
  amount: number;
  columns: number[];
};

/** Registro público de una ronda ya resuelta (payload de round_history). */
export type RoundHistoryRow = {
  round: number;
  winnerPlayerId: string | null;
  winnerTombola: 'A' | 'B' | null;
  totals: { A: number; B: number };
  bets: HostBet[];
};

export type HostDetail = {
  secrets: PlayerSecret[];
  tombolaA: Token[];
  tombolaB: Token[];
  /** Apuestas de la ronda en curso (visibles en vivo para el moderador). */
  currentBets: HostBet[];
  /** Historial de rondas ya resueltas. */
  history: RoundHistoryRow[];
};

/** Detalle completo solo para el moderador: secretos, tómbolas, apuestas e historial. */
export async function loadHostDetail(gameId: string, round: number): Promise<HostDetail> {
  const [{ data: secrets }, { data: priv }, { data: betsRows }, { data: historyRows }] =
    await Promise.all([
      supabase
        .from('player_secrets')
        .select('player_id, hand, combination, condition, coins')
        .eq('game_id', gameId),
      supabase
        .from('game_private')
        .select('tombola_a, tombola_b')
        .eq('game_id', gameId)
        .maybeSingle(),
      supabase
        .from('bets')
        .select('player_id, round, tombola, amount, columns')
        .eq('game_id', gameId)
        .eq('round', round),
      supabase
        .from('round_history')
        .select('round, payload')
        .eq('game_id', gameId)
        .order('round'),
    ]);

  const currentBets: HostBet[] = (betsRows ?? []).map((b) => ({
    player_id: b.player_id as string,
    round: b.round as number,
    tombola: b.tombola as 'A' | 'B',
    amount: b.amount as number,
    columns: b.columns as unknown as number[],
  }));

  const history: RoundHistoryRow[] = (historyRows ?? []).map((r) => {
    const p = r.payload as {
      winnerPlayerId?: string | null;
      winnerTombola?: 'A' | 'B' | null;
      totals?: { A: number; B: number };
      bets?: Array<{ player_id: string; tombola: 'A' | 'B'; amount: number; columns: number[] }>;
    };
    return {
      round: r.round as number,
      winnerPlayerId: p.winnerPlayerId ?? null,
      winnerTombola: p.winnerTombola ?? null,
      totals: p.totals ?? { A: 0, B: 0 },
      bets: (p.bets ?? []).map((b) => ({
        player_id: b.player_id,
        round: r.round as number,
        tombola: b.tombola,
        amount: b.amount,
        columns: b.columns,
      })),
    };
  });

  return {
    secrets: (secrets ?? []) as unknown as PlayerSecret[],
    tombolaA: ((priv?.tombola_a ?? []) as unknown as Token[]),
    tombolaB: ((priv?.tombola_b ?? []) as unknown as Token[]),
    currentBets,
    history,
  };
}

/** Carga el secreto del jugador (RLS lo permite solo al dueño/host). */
export async function loadMyPlayerSecret(playerId: string): Promise<PlayerSecret | null> {
  const { data, error } = await supabase
    .from('player_secrets')
    .select('player_id, hand, combination, condition, coins')
    .eq('player_id', playerId)
    .maybeSingle();
  if (error) throw error;
  return data ? (data as unknown as PlayerSecret) : null;
}

/** Suscribe a cambios del lobby (games/players) de una sala. */
export function subscribeRoom(gameId: string, onChange: () => void) {
  const channel = supabase
    .channel(`room:${gameId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `game_id=eq.${gameId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'games', filter: `id=eq.${gameId}` }, onChange)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

// ---------------------------------------------------------------------------
// Operaciones del host
// ---------------------------------------------------------------------------

/**
 * Inicia la partida: reparte 3 cartas y una condición única a cada jugador,
 * crea sus secretos y deja la sala en 'setup' para que cada jugador defina su
 * combinación y su carta pública.
 */
export async function startGame(gameId: string): Promise<void> {
  const snap = await loadSnapshot(gameId);
  const players = snap.players.filter((p) => p.connected);
  if (players.length < 2) throw new Error('Se necesitan al menos 2 jugadores.');

  const rng = makeRng(Date.now());
  const hands = dealHandsIndependent(players.length, rng);
  const conditions = assignUniqueConditions(
    players.map((p) => p.id),
    rng,
  );

  // Bolsas de tómbola completas para el motor (host).
  const tombolas = buildTombolas();
  await supabase
    .from('game_private')
    .update({
      tombola_a: tombolas.A as unknown as Json,
      tombola_b: tombolas.B as unknown as Json,
    })
    .eq('game_id', gameId);

  for (let i = 0; i < players.length; i++) {
    const hand = hands[i];
    await supabase.from('player_secrets').upsert({
      player_id: players[i].id,
      game_id: gameId,
      hand: hand as unknown as Json,
      combination: handToCombination(hand) as unknown as Json, // provisional
      condition: conditions[players[i].id] as unknown as Json,
      coins: 30,
    });
    await supabase
      .from('players')
      .update({
        revealed_card_id: hand[0].id,
        setup_done: false,
        bet_submitted: false,
        score: 0,
        rounds_won: 0,
      })
      .eq('id', players[i].id);
  }

  const { error } = await supabase
    .from('games')
    .update({ status: 'setup', phase: 'SETUP', round: 0 })
    .eq('id', gameId);
  if (error) throw error;
}

/** Sale de la sala (marca desconectado). Mejor esfuerzo. */
export async function leaveGame(playerId: string): Promise<void> {
  await supabase.from('players').update({ connected: false }).eq('id', playerId);
}

// ---------------------------------------------------------------------------
// Persistencia de la sala (reconexión al recargar)
// ---------------------------------------------------------------------------

const ROOM_KEY = 'mitologia.room';

export type PersistedRoom = {
  gameId: string;
  role: 'host' | 'player';
  code: string;
  myPlayerId: string | null;
};

export function persistRoom(r: PersistedRoom): void {
  try {
    localStorage.setItem(ROOM_KEY, JSON.stringify(r));
  } catch {
    /* almacenamiento no disponible */
  }
}

export function loadPersistedRoom(): PersistedRoom | null {
  try {
    const s = localStorage.getItem(ROOM_KEY);
    return s ? (JSON.parse(s) as PersistedRoom) : null;
  } catch {
    return null;
  }
}

export function clearPersistedRoom(): void {
  try {
    localStorage.removeItem(ROOM_KEY);
  } catch {
    /* no-op */
  }
}
