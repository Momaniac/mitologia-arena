import { useState } from 'react';
import { Tutorial } from './ui/pages/Tutorial';
import { Lobby } from './ui/pages/Lobby';

const TUTORIAL_KEY = 'mitologia.tutorialSeen';

function App() {
  const [showTutorial, setShowTutorial] = useState(
    () => !localStorage.getItem(TUTORIAL_KEY),
  );

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

  return <Lobby onShowTutorial={() => setShowTutorial(true)} />;
}

export default App;
