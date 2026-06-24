import { supabase, ensureAnonSession } from './supabase';
import type { Json } from './database.types';
import { emptyBoard } from '../engine/board';
import { buildTombolas } from '../engine/tombolas';
import { dealHands, handToCombination } from '../engine/deck';
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

export type TeamScore = {
  teamId: string;
  name: string;
  raw: number;
  conditionMet: boolean;
  multiplier: 1 | 2;
  total: number;
};

export type TeamSecret = {
  team_id: string;
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
  final_scores: TeamScore[] | null;
};

export type LobbyPlayer = {
  id: string;
  game_id: string;
  team_id: string | null;
  auth_uid: string;
  name: string;
  connected: boolean;
};

export type LobbyTeam = {
  id: string;
  game_id: string;
  name: string;
  score: number;
  representative: string | null;
  bet_submitted: boolean;
  setup_done: boolean;
};

export type RoomSnapshot = {
  game: LobbyGame;
  players: LobbyPlayer[];
  teams: LobbyTeam[];
};

function isUniqueViolation(error: { code?: string } | null): boolean {
  return error?.code === '23505';
}

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
        mode: 'teams',
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

/** Carga una foto completa del lobby. */
export async function loadSnapshot(gameId: string): Promise<RoomSnapshot> {
  const [{ data: game, error: ge }, { data: players, error: pe }, { data: teams, error: te }] =
    await Promise.all([
      supabase.from('games').select('id, code, host_uid, status, mode, phase, round, board, current_draw, bet_totals, last_result, final_scores').eq('id', gameId).single(),
      supabase.from('players').select('id, game_id, team_id, auth_uid, name, connected').eq('game_id', gameId).order('joined_at'),
      supabase.from('teams').select('id, game_id, name, score, representative, bet_submitted, setup_done').eq('game_id', gameId).order('created_at'),
    ]);
  if (ge) throw ge;
  if (pe) throw pe;
  if (te) throw te;
  return {
    game: game as unknown as LobbyGame,
    players: (players ?? []) as LobbyPlayer[],
    teams: (teams ?? []) as unknown as LobbyTeam[],
  };
}

/** Carga el secreto del equipo del jugador (RLS lo permite solo a miembros/host). */
export async function loadMyTeamSecret(teamId: string): Promise<TeamSecret | null> {
  const { data, error } = await supabase
    .from('team_secrets')
    .select('team_id, hand, combination, condition, coins')
    .eq('team_id', teamId)
    .maybeSingle();
  if (error) throw error;
  return data ? (data as unknown as TeamSecret) : null;
}

/** Suscribe a cambios del lobby (games/players/teams) de una sala. */
export function subscribeRoom(gameId: string, onChange: () => void) {
  const channel = supabase
    .channel(`room:${gameId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `game_id=eq.${gameId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'teams', filter: `game_id=eq.${gameId}` }, onChange)
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
 * Reparte automáticamente los jugadores en equipos de ~5 (rango 4-6), creando
 * los equipos necesarios y marcando un representante por equipo.
 */
export async function autoAssignTeams(gameId: string): Promise<void> {
  const snap = await loadSnapshot(gameId);
  const players = snap.players;
  const n = players.length;
  if (n === 0) throw new Error('No hay jugadores para armar equipos.');

  // Número de equipos buscando tamaño objetivo 5 (acota a 4-6 por equipo).
  const numTeams = Math.max(1, Math.round(n / 5));

  // Borra equipos previos (reasigna desde cero).
  await supabase.from('teams').delete().eq('game_id', gameId);

  const created: LobbyTeam[] = [];
  for (let i = 0; i < numTeams; i++) {
    const { data, error } = await supabase
      .from('teams')
      .insert({ game_id: gameId, name: `Equipo ${i + 1}` })
      .select('id, game_id, name, score, representative, bet_submitted')
      .single();
    if (error) throw error;
    created.push(data as LobbyTeam);
  }

  // Distribución tipo "serpiente" para equilibrar tamaños.
  for (let i = 0; i < players.length; i++) {
    const teamIdx = i % numTeams;
    const team = created[teamIdx];
    const isFirstOfTeam = i < numTeams; // primer jugador asignado = representante
    await supabase
      .from('players')
      .update({ team_id: team.id })
      .eq('id', players[i].id);
    if (isFirstOfTeam) {
      await supabase
        .from('teams')
        .update({ representative: players[i].auth_uid })
        .eq('id', team.id);
    }
  }
}

/** Cambia el representante de un equipo. */
export async function setRepresentative(teamId: string, playerAuthUid: string): Promise<void> {
  const { error } = await supabase.from('teams').update({ representative: playerAuthUid }).eq('id', teamId);
  if (error) throw error;
}

/** Renombra un equipo. */
export async function renameTeam(teamId: string, name: string): Promise<void> {
  const { error } = await supabase.from('teams').update({ name }).eq('id', teamId);
  if (error) throw error;
}

/**
 * Inicia la partida: valida equipos, asigna condición única por equipo, reparte
 * 3 cartas por equipo y crea los secretos. Deja la sala en 'setup' para que cada
 * representante defina su combinación y carta pública (siguiente fase).
 */
export async function startGame(gameId: string): Promise<void> {
  const snap = await loadSnapshot(gameId);
  const teams = snap.teams;
  if (teams.length < 2) throw new Error('Se necesitan al menos 2 equipos.');

  for (const t of teams) {
    const members = snap.players.filter((p) => p.team_id === t.id);
    if (members.length < 4 || members.length > 6) {
      throw new Error(`"${t.name}" debe tener entre 4 y 6 integrantes (tiene ${members.length}).`);
    }
    if (!t.representative) {
      throw new Error(`"${t.name}" no tiene representante asignado.`);
    }
  }

  const rng = makeRng(Date.now());
  const { hands } = dealHands(teams.length, rng);
  const conditions = assignUniqueConditions(
    teams.map((t) => t.id),
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

  for (let i = 0; i < teams.length; i++) {
    const hand = hands[i];
    await supabase.from('team_secrets').insert({
      team_id: teams[i].id,
      game_id: gameId,
      hand: hand as unknown as Json,
      combination: handToCombination(hand) as unknown as Json, // provisional
      condition: conditions[teams[i].id] as unknown as Json,
      coins: 30,
    });
    await supabase
      .from('teams')
      .update({ revealed_card_id: hand[0].id })
      .eq('id', teams[i].id);
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
