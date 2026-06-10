import { MAX_BET, MIN_BET } from '../../engine/betting';
import { useGameStore } from '../../state/gameStore';

export function BetPanel() {
  const draft = useGameStore((s) => s.draftBet);
  const update = useGameStore((s) => s.updateDraftBet);
  const human = useGameStore((s) =>
    s.players.find((p) => p.id === s.humanId),
  );
  if (!draft || !human) return null;
  const maxAffordable = Math.min(MAX_BET, Math.max(MIN_BET, human.coins));
  return (
    <div className="p-4 rounded-xl border border-ink/10 bg-white">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-ink">Tu apuesta</h3>
        <span className="text-sm text-ink/70">{human.coins} 🪙 disponibles</span>
      </div>
      <div className="flex gap-2 mb-3">
        {(['A', 'B'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => update({ tombola: t })}
            className={`flex-1 py-2 rounded-lg font-semibold border-2 transition ${
              draft.tombola === t
                ? 'bg-accent border-accent-dark text-ink'
                : 'bg-base border-ink/10 text-ink/70 hover:border-link'
            }`}
          >
            Tómbola {t}
          </button>
        ))}
      </div>
      <label className="block">
        <div className="flex justify-between mb-1">
          <span className="text-sm text-ink/70">Monto</span>
          <span className="font-bold text-ink">{draft.amount} 🪙</span>
        </div>
        <input
          type="range"
          min={MIN_BET}
          max={maxAffordable}
          step={1}
          value={Math.min(draft.amount, maxAffordable)}
          onChange={(e) => update({ amount: Number(e.target.value) })}
          className="w-full accent-accent"
        />
        <div className="flex justify-between text-xs text-ink/50">
          <span>{MIN_BET}</span>
          <span>{maxAffordable}</span>
        </div>
      </label>
      <p className="text-xs text-ink/60 mt-2 italic">
        Recuerda: las monedas apostadas siempre se pierden. Gana la tómbola con
        <span className="font-semibold"> menor total apostado</span>.
      </p>
    </div>
  );
}
