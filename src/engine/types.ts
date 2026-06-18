export type Figure = 'dragon' | 'hydra' | 'fenix' | 'kraken' | 'minotauro';

export const FIGURES: Figure[] = ['dragon', 'hydra', 'fenix', 'kraken', 'minotauro'];

export const FIGURE_LABEL: Record<Figure, string> = {
  dragon: 'Dragón',
  hydra: 'Hydra',
  fenix: 'Fénix',
  kraken: 'Kraken',
  minotauro: 'Minotauro',
};

export const FIGURE_EMOJI: Record<Figure, string> = {
  dragon: '🐉',
  hydra: '🐍',
  fenix: '🔥',
  kraken: '🦑',
  minotauro: '🐂',
};

export type Card = {
  id: string;
  figure: Figure;
};

export type Token = {
  id: string;
  figure: Figure;
};

export type Combination = [Figure, Figure, Figure];

export type Condition = {
  id: string;
  label: string;
  left: Figure[];
  right: Figure[];
};

export type TombolaId = 'A' | 'B';

export type Bet = {
  playerId: string;
  tombola: TombolaId;
  amount: number;
  /** Las 4 columnas elegidas, en orden de colocación de las 4 fichas extraídas. */
  columns: [number, number, number, number];
};

/** Board[row][col]; row 0 = top, row 4 = bottom. null = vacío. */
export type Board = (Figure | null)[][];

export type Player = {
  id: string;
  name: string;
  isBot: boolean;
  isModerator?: boolean;
  hand: Card[];
  /** Orden definitivo de las 3 cartas; combinación secreta. */
  combination: Combination;
  /** Carta pública revelada. */
  revealedCardId: string;
  condition: Condition;
  coins: number;
  scoreHistory: number[];
};

export type RoundRecord = {
  round: number;
  tombolaA: Token[];
  tombolaB: Token[];
  bets: Bet[];
  /** null si la ronda terminó en empate y debe repetirse. */
  winnerTombola: TombolaId | null;
  /** null si la ronda terminó en empate y debe repetirse. */
  winnerPlayerId: string | null;
  /** Razón por la que la ronda no produjo ganador. */
  voidedReason?: 'tombola-tie' | 'player-tie';
  refunded: boolean;
};

export type GamePhase =
  | 'SETUP'
  | 'DEAL_CARDS'
  | 'REVEAL_CARD'
  | 'ROUND_START'
  | 'BETTING'
  | 'POSITION_SELECT'
  | 'RESOLVE'
  | 'PLACE_TOKENS'
  | 'ROUND_END'
  | 'SCORING'
  | 'RESULTS';

export type ScoreBreakdown = {
  playerId: string;
  rawCombinations: number;
  conditionMet: boolean;
  multiplier: 1 | 2;
  total: number;
};
