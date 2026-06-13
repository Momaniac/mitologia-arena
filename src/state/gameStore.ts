import { create } from 'zustand';
import type {
  Bet,
  Board,
  Card,
  GamePhase,
  Player,
  RoundRecord,
  ScoreBreakdown,
  Token,
} from '../engine/types';
import { emptyBoard, placeTokens } from '../engine/board';
import { dealHands, handToCombination } from '../engine/deck';
import { buildTombolas, drawFour, type TombolaState } from '../engine/tombolas';
import { evaluateCondition } from '../engine/conditions';
import { resolveRound } from '../engine/betting';
import { rawScore } from '../engine/scoring';
import { makeRng, type RNG } from '../engine/rng';
import {
  botDecideBet,
  botOrderHand,
  botPickRevealedCard,
} from '../bots/botStrategy';
import { createGameSession, rememberSession } from '../services/gameSessionApi';

const TOTAL_ROUNDS = 5;
const STARTING_COINS = 30;

type SetupConfig = {
  humanName: string;
  numBots: number;
  seed?: number;
};

type DrawState = {
  A: Token[];
  B: Token[];
};

type Placement = { row: number; col: number; figure: Token['figure'] };

type GameState = {
  phase: GamePhase;
  rng: RNG;
  seed: number;
  round: number;
  players: Player[];
  humanId: string;
  board: Board;
  tombolas: TombolaState;
  currentDraw: DrawState | null;
  /** Apuestas de la ronda en curso, recolectadas antes de resolver. */
  pendingBets: Bet[];
  /** Mano del humano sin combinar (en orden de reparto), mientras escoge orden. */
  pendingHand: Card[] | null;
  /** Cartas seleccionadas en orden por el humano (puede ser parcial). */
  selectedOrder: Card[];
  history: RoundRecord[];
  finalScores: ScoreBreakdown[] | null;
  /** Apuesta provisional del humano que la UI está construyendo. */
  draftBet: {
    tombola: 'A' | 'B';
    amount: number;
    columns: (number | null)[];
  } | null;
  lastResolution: ReturnType<typeof resolveRound> | null;
  lastPlacements: Placement[];
  setupError: string | null;
  gameId: string | null;
  moderatorSecret: string | null;
};

type GameActions = {
  startGame: (config: SetupConfig) => Promise<void>;
  setHumanCombinationOrder: (cards: Card[]) => void;
  confirmCombination: () => void;
  revealCard: (cardId: string) => void;
  startRound: () => void;
  updateDraftBet: (patch: Partial<NonNullable<GameState['draftBet']>>) => void;
  setDraftColumn: (index: number, col: number) => void;
  submitHumanBet: () => void;
  proceedToResults: () => void;
  resetGame: () => void;
};

export type Store = GameState & GameActions;

const initialState: GameState = {
  phase: 'SETUP',
  rng: makeRng(1),
  seed: 1,
  round: 0,
  players: [],
  humanId: '',
  board: emptyBoard(),
  tombolas: buildTombolas(),
  currentDraw: null,
  pendingBets: [],
  pendingHand: null,
  selectedOrder: [],
  history: [],
  finalScores: null,
  draftBet: null,
  lastResolution: null,
  lastPlacements: [],
  setupError: null,
  gameId: null,
  moderatorSecret: null,
};

export const useGameStore = create<Store>((set, get) => ({
  ...initialState,

  async startGame(config) {
    try {
      set({ setupError: null });
      const seed = config.seed ?? Date.now();
      const rng = makeRng(seed);
      const numPlayers = 1 + config.numBots;
      const { hands } = dealHands(numPlayers, rng);

      const humanId = 'human';
      const participantIds = [
        humanId,
        ...Array.from({ length: config.numBots }, (_, i) => `bot-${i + 1}`),
      ];
      const session = await createGameSession(participantIds, seed);
      const players: Player[] = [];

      players.push({
        id: humanId,
        name: config.humanName || 'Tú',
        isBot: false,
        hand: hands[0],
        combination: handToCombination(hands[0]), // placeholder, lo confirma el humano
        revealedCardId: hands[0][0].id,
        condition: session.assignments[humanId],
        coins: STARTING_COINS,
        scoreHistory: [],
      });

      // Bots
      for (let i = 0; i < config.numBots; i++) {
        const botId = `bot-${i + 1}`;
        const botHand = botOrderHand(hands[1 + i], rng);
        const revealedCardId = botPickRevealedCard(botHand, rng);
        players.push({
          id: botId,
          name: `Bot ${i + 1}`,
          isBot: true,
          hand: botHand,
          combination: handToCombination(botHand),
          revealedCardId,
          condition: session.assignments[botId],
          coins: STARTING_COINS,
          scoreHistory: [],
        });
      }
      rememberSession(session, humanId);

      set({
        ...initialState,
        phase: 'DEAL_CARDS',
        rng,
        seed,
        players,
        humanId,
        pendingHand: hands[0],
        selectedOrder: [],
        gameId: session.gameId,
        moderatorSecret: session.moderatorSecret,
      });
    } catch (error) {
      set({
        setupError:
          error instanceof Error
            ? error.message
            : 'No fue posible asignar una condición única. Revisa la configuración de la partida.',
      });
    }
  },

  setHumanCombinationOrder(cards) {
    set({ selectedOrder: cards });
  },

  confirmCombination() {
    const { selectedOrder, players, humanId } = get();
    if (selectedOrder.length !== 3) return;
    const updated = players.map((p) =>
      p.id === humanId
        ? { ...p, hand: selectedOrder, combination: handToCombination(selectedOrder) }
        : p,
    );
    set({
      players: updated,
      phase: 'REVEAL_CARD',
      pendingHand: null,
    });
  },

  revealCard(cardId) {
    const { players, humanId } = get();
    const updated = players.map((p) =>
      p.id === humanId ? { ...p, revealedCardId: cardId } : p,
    );
    set({ players: updated, phase: 'ROUND_START', round: 1 });
    // Auto-iniciar primera ronda
    get().startRound();
  },

  startRound() {
    const { tombolas, rng, round } = get();
    const a = drawFour(tombolas.A, rng);
    const b = drawFour(tombolas.B, rng);
    set({
      tombolas: { A: a.remaining, B: b.remaining },
      currentDraw: { A: a.drawn, B: b.drawn },
      pendingBets: [],
      draftBet: { tombola: 'A', amount: 3, columns: [null, null, null, null] },
      lastPlacements: [],
      phase: 'BETTING',
      round: round || 1,
    });
  },

  updateDraftBet(patch) {
    const draft = get().draftBet;
    if (!draft) return;
    set({ draftBet: { ...draft, ...patch } });
  },

  setDraftColumn(index, col) {
    const draft = get().draftBet;
    if (!draft) return;
    const cols = draft.columns.slice();
    cols[index] = col;
    set({ draftBet: { ...draft, columns: cols } });
  },

  submitHumanBet() {
    const { draftBet, players, humanId, currentDraw, board, rng } = get();
    if (!draftBet || !currentDraw) return;
    if (draftBet.columns.some((c) => c === null)) return;

    const humanBet: Bet = {
      playerId: humanId,
      tombola: draftBet.tombola,
      amount: draftBet.amount,
      columns: draftBet.columns as [number, number, number, number],
    };

    // Bots deciden
    const botBets: Bet[] = players
      .filter((p) => p.isBot)
      .map((bot) => botDecideBet(bot, currentDraw.A, currentDraw.B, board, rng));

    const allBets = [humanBet, ...botBets];

    // Descontar monedas (siempre se pierden)
    const playersAfterBet = players.map((p) => {
      const b = allBets.find((x) => x.playerId === p.id);
      return b ? { ...p, coins: Math.max(0, p.coins - b.amount) } : p;
    });

    const resolution = resolveRound(allBets);

    let nextBoard = board;
    let winnerPlayerId: string | null = null;
    let winnerTombola: 'A' | 'B' | null = null;
    let voidedReason: RoundRecord['voidedReason'];
    let refunded = false;
    let finalPlayers = playersAfterBet;
    let lastPlacements: Placement[] = [];

    if (resolution.kind === 'winner') {
      winnerTombola = resolution.winnerTombola;
      winnerPlayerId = resolution.winnerPlayerId;
      const winningTokens =
        winnerTombola === 'A' ? currentDraw.A : currentDraw.B;
      const winnerBet = allBets.find((b) => b.playerId === winnerPlayerId)!;
      const placeResult = placeTokens(
        nextBoard,
        winningTokens.map((t) => t.figure),
        winnerBet.columns,
        winningTokens.map((t) => t.figure),
      );
      if (placeResult.ok) {
        nextBoard = placeResult.board;
        lastPlacements = placeResult.placements;
      } else {
        // Colocación inválida (p.ej. bot eligió columnas que violan contacto):
        // las fichas se descartan; el bot pierde la apuesta igualmente.
        // En el moderador se verá la razón.
        voidedReason = undefined;
      }
    } else {
      voidedReason = resolution.reason;
      refunded = true;
      // Devolver monedas
      finalPlayers = playersAfterBet.map((p) => {
        const b = allBets.find((x) => x.playerId === p.id);
        return b ? { ...p, coins: p.coins + b.amount } : p;
      });
    }

    const record: RoundRecord = {
      round: get().round,
      tombolaA: currentDraw.A,
      tombolaB: currentDraw.B,
      bets: allBets,
      winnerTombola,
      winnerPlayerId,
      voidedReason,
      refunded,
    };

    const isLastRound = get().round >= TOTAL_ROUNDS;

    set({
      board: nextBoard,
      players: finalPlayers,
      pendingBets: allBets,
      history: [...get().history, record],
      lastResolution: resolution,
      lastPlacements,
      phase: 'ROUND_END',
    });

    // Avanzar tras un breve delay sería ideal en UI; por ahora la UI
    // ofrecerá un botón "Continuar" que llama a proceedToResults o startRound.
    if (isLastRound) {
      // dejamos en ROUND_END; UI llamará a proceedToResults()
    }
  },

  proceedToResults() {
    const { round, players, board } = get();
    if (round < TOTAL_ROUNDS) {
      set({ round: round + 1, currentDraw: null, draftBet: null });
      get().startRound();
      return;
    }
    // Calcular puntajes finales
    const breakdown: ScoreBreakdown[] = players.map((p) => {
      const raw = rawScore(board, p.combination);
      const met = evaluateCondition(board, p.condition);
      const mult: 1 | 2 = met ? 2 : 1;
      return {
        playerId: p.id,
        rawCombinations: raw,
        conditionMet: met,
        multiplier: mult,
        total: raw * mult,
      };
    });
    set({ phase: 'RESULTS', finalScores: breakdown });
  },

  resetGame() {
    set({ ...initialState, rng: makeRng(Date.now()) });
  },
}));

export const TOTAL_ROUNDS_CONST = TOTAL_ROUNDS;
export const STARTING_COINS_CONST = STARTING_COINS;
