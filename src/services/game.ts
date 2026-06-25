import { supabase } from './supabase';
import type { Json } from './database.types';
import { drawFour } from '../engine/tombolas';
import { placeTokens } from '../engine/board';
import { resolveRound as engineResolve } from '../engine/betting';
import { rawScore } from '../engine/scoring';
import { evaluateCondition } from '../engine/conditions';
import { makeRng } from '../engine/rng';
import type { Bet, Board, Combination, Condition, Token } from '../engine/types';
import type { RoundResultPublic, TeamScore } from './room';

const TOTAL_ROUNDS = 5;

type PrivateState = { seed: number; tombola_a: Token[]; tombola_b: Token[] };

async function loadPrivate(gameId: string): Promise<PrivateState> {
  const { data, error } = await supabase
    .from('game_private')
    .select('seed, tombola_a, tombola_b')
    .eq('game_id', gameId)
    .single();
  if (error) throw error;
  return data as unknown as PrivateState;
}

// ---------------------------------------------------------------------------
// Representante
// ---------------------------------------------------------------------------

export async function defineSetup(
  teamId: string,
  combination: Combination,
  revealedCardId: string,
): Promise<void> {
  const { error } = await supabase.rpc('define_setup', {
    p_team_id: teamId,
    p_combination: combination as unknown as Json,
    p_revealed_card_id: revealedCardId,
  });
  if (error) throw error;
}

export async function submitBet(
  teamId: string,
  round: number,
  tombola: 'A' | 'B',
  amount: number,
  order: number[],
  columns: number[],
): Promise<void> {
  const { error } = await supabase.rpc('submit_bet', {
    p_team_id: teamId,
    p_round: round,
    p_tombola: tombola,
    p_amount: amount,
    p_order: order as unknown as Json,
    p_columns: columns as unknown as Json,
  });
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Host (autoritativo)
// ---------------------------------------------------------------------------

/** Extrae 4+4 fichas para una ronda y abre apuestas. */
export async function drawRound(gameId: string, round: number): Promise<void> {
  const priv = await loadPrivate(gameId);
  const rng = makeRng(priv.seed + round);
  const a = drawFour(priv.tombola_a, rng);
  const b = drawFour(priv.tombola_b, rng);

  await supabase
    .from('game_private')
    .update({
      tombola_a: a.remaining as unknown as Json,
      tombola_b: b.remaining as unknown as Json,
    })
    .eq('game_id', gameId);
  await supabase.from('teams').update({ bet_submitted: false }).eq('game_id', gameId);
  await supabase.from('bets').delete().eq('game_id', gameId).eq('round', round);
  await supabase
    .from('games')
    .update({
      status: 'playing',
      phase: 'BETTING',
      round,
      current_draw: { A: a.drawn, B: b.drawn } as unknown as Json,
      bet_totals: null,
      last_result: null,
    })
    .eq('id', gameId);
}

/** Inicia la fase de rondas tras el setup. */
export async function hostStartRounds(gameId: string): Promise<void> {
  await drawRound(gameId, 1);
}

async function deductCoins(bets: { team_id: string; amount: number }[]): Promise<void> {
  for (const b of bets) {
    const { data } = await supabase
      .from('team_secrets')
      .select('coins')
      .eq('team_id', b.team_id)
      .single();
    const next = Math.max(0, (data?.coins ?? 0) - b.amount);
    await supabase.from('team_secrets').update({ coins: next }).eq('team_id', b.team_id);
  }
}

/** Resuelve la ronda actual con el motor y escribe el resultado. */
export async function resolveRound(gameId: string): Promise<void> {
  const { data: g, error: ge } = await supabase
    .from('games')
    .select('round, board, current_draw')
    .eq('id', gameId)
    .single();
  if (ge) throw ge;
  const round = g.round;
  const board = g.board as unknown as Board;
  const draw = g.current_draw as unknown as { A: Token[]; B: Token[] };

  const { data: betsRows, error: be } = await supabase
    .from('bets')
    .select('team_id, tombola, amount, order, columns')
    .eq('game_id', gameId)
    .eq('round', round);
  if (be) throw be;

  const bets: Bet[] = (betsRows ?? []).map((b) => ({
    playerId: b.team_id as string,
    tombola: b.tombola as 'A' | 'B',
    amount: b.amount as number,
    order: b.order as unknown as [number, number, number, number],
    columns: b.columns as unknown as [number, number, number, number],
  }));

  const totals = { A: 0, B: 0 };
  for (const b of bets) totals[b.tombola] += b.amount;

  const resolution = engineResolve(bets);

  if (resolution.kind === 'winner') {
    const winningTokens = resolution.winnerTombola === 'A' ? draw.A : draw.B;
    const winnerBet = bets.find((b) => b.playerId === resolution.winnerPlayerId)!;
    const orderedFigures = winnerBet.order.map((i) => winningTokens[i].figure);
    const place = placeTokens(
      board,
      orderedFigures,
      winnerBet.columns,
      winningTokens.map((t) => t.figure),
    );
    const newBoard = place.ok ? place.board : board;
    const placements = place.ok ? place.placements : [];

    await deductCoins(
      bets.map((b) => ({ team_id: b.playerId, amount: b.amount })),
    );

    await supabase.from('round_history').insert({
      game_id: gameId,
      round,
      payload: {
        winnerTeamId: resolution.winnerPlayerId,
        winnerTombola: resolution.winnerTombola,
        totals,
        bets: betsRows,
        placements,
      } as unknown as Json,
    });

    const lastResult: RoundResultPublic = {
      round,
      kind: 'winner',
      tombola: resolution.winnerTombola,
      totals,
    };
    await supabase
      .from('games')
      .update({
        board: newBoard as unknown as Json,
        bet_totals: totals as unknown as Json,
        last_result: lastResult as unknown as Json,
        phase: 'ROUND_END',
      })
      .eq('id', gameId);
  } else {
    const lastResult: RoundResultPublic = {
      round,
      kind: 'void',
      totals,
      reason: resolution.reason,
    };
    await supabase
      .from('games')
      .update({
        bet_totals: totals as unknown as Json,
        last_result: lastResult as unknown as Json,
        phase: 'ROUND_END',
      })
      .eq('id', gameId);
  }
}

/** Avanza tras ROUND_END: repite (empate), siguiente ronda o resultados. */
export async function advanceRound(gameId: string): Promise<void> {
  const { data: g } = await supabase
    .from('games')
    .select('round, last_result')
    .eq('id', gameId)
    .single();
  if (!g) return;
  const lr = g.last_result as unknown as RoundResultPublic | null;

  if (lr?.kind === 'void') {
    // Empate: repetir MISMA ronda con las mismas fichas (no se re-sortea).
    await supabase.from('teams').update({ bet_submitted: false }).eq('game_id', gameId);
    await supabase.from('bets').delete().eq('game_id', gameId).eq('round', g.round);
    await supabase
      .from('games')
      .update({ phase: 'BETTING', last_result: null, bet_totals: null })
      .eq('id', gameId);
    return;
  }

  if (g.round < TOTAL_ROUNDS) {
    await drawRound(gameId, g.round + 1);
  } else {
    await computeScores(gameId);
  }
}

/** Calcula puntajes finales (combinaciones × condición) y termina la partida. */
export async function computeScores(gameId: string): Promise<void> {
  const { data: g } = await supabase.from('games').select('board').eq('id', gameId).single();
  const board = (g?.board ?? []) as unknown as Board;
  const { data: teams } = await supabase.from('teams').select('id, name').eq('game_id', gameId);
  const { data: secrets } = await supabase
    .from('team_secrets')
    .select('team_id, combination, condition')
    .eq('game_id', gameId);

  const scores: TeamScore[] = (teams ?? [])
    .map((t) => {
      const sec = (secrets ?? []).find((s) => s.team_id === t.id);
      const combo = sec?.combination as unknown as Combination | null;
      const cond = sec?.condition as unknown as Condition | undefined;
      const raw = combo ? rawScore(board, combo) : 0;
      const met = cond ? evaluateCondition(board, cond) : false;
      const multiplier: 1 | 2 = met ? 2 : 1;
      return {
        teamId: t.id,
        name: t.name,
        raw,
        conditionMet: met,
        multiplier,
        total: raw * multiplier,
      };
    })
    .sort((a, b) => b.total - a.total);

  for (const s of scores) {
    await supabase.from('teams').update({ score: s.total }).eq('id', s.teamId);
  }
  await supabase
    .from('games')
    .update({
      status: 'finished',
      phase: 'RESULTS',
      final_scores: scores as unknown as Json,
    })
    .eq('id', gameId);
}
