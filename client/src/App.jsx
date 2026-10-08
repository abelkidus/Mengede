import { useState } from 'react';
import TerminalMap from './components/Map';
import TerminalModal from './components/TerminalModal';

function App() {
  const [selectedTerminal, setSelectedTerminal] = useState(null);

  return (
    <main className="w-full h-screen overflow-hidden relative">
      <TerminalMap
        selectedTerminal={selectedTerminal}
        onSelectTerminal={(terminal) => setSelectedTerminal(terminal)}
      />

      {/* Screen 2: Terminal Routes & Fares Modal */}
      {selectedTerminal && (
        <TerminalModal
          terminal={selectedTerminal}
          onClose={() => setSelectedTerminal(null)}
          onSubmitMissingRoute={(terminal) => {
            console.log('Submit missing route clicked for terminal:', terminal);
          }}
        />
      )}
    </main>
  );
}

export default App;
