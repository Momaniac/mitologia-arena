import { useEffect, useState } from 'react';
import { Tutorial } from './ui/pages/Tutorial';
import { Lobby } from './ui/pages/Lobby';
import { useRoomStore } from './state/roomStore';
import { loadPersistedRoom } from './services/room';

const TUTORIAL_KEY = 'mitologia.tutorialSeen';

function App() {
  const reconnect = useRoomStore((s) => s.reconnect);
  const role = useRoomStore((s) => s.role);
  const [booting, setBooting] = useState(() => !!loadPersistedRoom());
  const [showTutorial, setShowTutorial] = useState(
    () => !localStorage.getItem(TUTORIAL_KEY),
  );

  useEffect(() => {
    if (loadPersistedRoom()) {
      reconnect().finally(() => setBooting(false));
    } else {
      setBooting(false);
    }
  }, [reconnect]);

  if (booting) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-base text-ink">
        <div className="text-3xl">🔄</div>
        <p className="font-semibold">Reconectando a tu sala…</p>
      </div>
    );
  }

  // El tutorial solo se interpone si NO estás reconectado a una sala activa.
  if (showTutorial && !role) {
    return (
      <Tutorial
        onFinish={() => {
          localStorage.setItem(TUTORIAL_KEY, '1');
          setShowTutorial(false);
        }}
      />
    );
  }

  return <Lobby onShowTutorial={() => setShowTutorial(true)} />;
}

export default App;
