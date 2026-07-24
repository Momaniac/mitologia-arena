import { useEffect, useState } from 'react';
import { Entry } from './ui/pages/Entry';
import { Lobby } from './ui/pages/Lobby';
import { useRoomStore } from './state/roomStore';
import { loadPersistedRoom } from './services/room';

function App() {
  const reconnect = useRoomStore((s) => s.reconnect);
  const role = useRoomStore((s) => s.role);
  const [booting, setBooting] = useState(() => !!loadPersistedRoom());

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
        <span className="h-2.5 w-2.5 animate-pulse-ring rounded-full bg-accent" />
        <p className="font-semibold">Reconectando a tu sala…</p>
      </div>
    );
  }

  // En una sala (moderador o jugador) → juego; fuera de sala → flujo de acceso.
  if (role) return <Lobby />;
  return <Entry />;
}

export default App;
