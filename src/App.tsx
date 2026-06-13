import { useState } from 'react';
import { Setup } from './ui/pages/Setup';
import { Game } from './ui/pages/Game';
import { Tutorial } from './ui/pages/Tutorial';
import { Moderator } from './ui/pages/Moderator';
import { useGameStore } from './state/gameStore';

const TUTORIAL_KEY = 'mitologia.tutorialSeen';

function App() {
  const phase = useGameStore((s) => s.phase);
  const [showTutorial, setShowTutorial] = useState(
    () => !localStorage.getItem(TUTORIAL_KEY),
  );
  const [showModerator, setShowModerator] = useState(false);

  if (showTutorial) {
    return (
      <Tutorial
        onFinish={() => {
          localStorage.setItem(TUTORIAL_KEY, '1');
          setShowTutorial(false);
        }}
      />
    );
  }

  if (showModerator) {
    return <Moderator onClose={() => setShowModerator(false)} />;
  }

  if (phase === 'SETUP') {
    return (
      <div>
        <Setup />
        <div className="fixed bottom-4 right-4">
          <button
            type="button"
            onClick={() => setShowTutorial(true)}
            className="text-sm bg-white border border-ink/10 px-3 py-1.5 rounded-lg shadow hover:border-link text-link"
          >
            Ver tutorial
          </button>
        </div>
      </div>
    );
  }

  return <Game onOpenModerator={() => setShowModerator(true)} />;
}

export default App;
