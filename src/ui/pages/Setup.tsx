import { useState } from 'react';
import { useGameStore } from '../../state/gameStore';

export function Setup() {
  const startGame = useGameStore((s) => s.startGame);
  const [name, setName] = useState('Jugador 1');
  const [numBots, setNumBots] = useState(3);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border-t-4 border-accent">
        <h1 className="text-3xl font-extrabold text-ink mb-2">Mitología</h1>
        <p className="text-ink/70 mb-6">
          Juego de estrategia, apuestas y deducción social.
        </p>

        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-ink">Tu nombre</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-ink/20 px-3 py-2 focus:border-accent focus:ring-2 focus:ring-accent/30 outline-none"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-ink">
              Oponentes (bots): {numBots}
            </span>
            <input
              type="range"
              min={2}
              max={9}
              value={numBots}
              onChange={(e) => setNumBots(Number(e.target.value))}
              className="w-full accent-accent mt-1"
            />
            <div className="flex justify-between text-xs text-ink/50">
              <span>2</span>
              <span>9</span>
            </div>
          </label>
        </div>

        <button
          type="button"
          onClick={() => startGame({ humanName: name, numBots })}
          className="mt-6 w-full bg-accent hover:bg-accent-dark text-ink font-bold py-3 rounded-lg transition shadow-md"
        >
          Comenzar partida
        </button>

        <p className="text-xs text-ink/50 mt-4">
          v1 demo · Single-player con bots · Funciona offline
        </p>
      </div>
    </div>
  );
}
