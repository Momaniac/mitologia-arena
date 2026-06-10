import { FIGURE_LABEL, type Player } from '../../engine/types';
import { TokenIcon } from './TokenIcon';

type Props = {
  players: Player[];
  humanId: string;
  /** Si está definido, marca con un check los jugadores que ya apostaron. */
  betsSubmitted?: Set<string>;
};

export function PlayerStrip({ players, humanId, betsSubmitted }: Props) {
  return (
    <div className="flex flex-wrap gap-3">
      {players.map((p) => {
        const revealed = p.hand.find((c) => c.id === p.revealedCardId);
        const isHuman = p.id === humanId;
        return (
          <div
            key={p.id}
            className={`flex items-center gap-3 p-3 rounded-lg border ${
              isHuman
                ? 'border-accent bg-accent/10'
                : 'border-ink/10 bg-white'
            } min-w-[180px]`}
          >
            <div className="flex flex-col items-center">
              {revealed ? (
                <TokenIcon figure={revealed.figure} size="sm" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-ink/10" />
              )}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-ink text-sm">{p.name}</div>
              <div className="text-xs text-ink/70">
                {isHuman ? `${p.coins} 🪙` : '••• 🪙'}
              </div>
              {revealed && (
                <div className="text-[10px] text-ink/60 mt-0.5">
                  Carta: {FIGURE_LABEL[revealed.figure]}
                </div>
              )}
            </div>
            {betsSubmitted && betsSubmitted.has(p.id) && (
              <span className="text-success text-lg">✓</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
