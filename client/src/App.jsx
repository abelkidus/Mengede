import { useState } from 'react';
import TerminalMap from './components/Map';

function App() {
  const [selectedTerminal, setSelectedTerminal] = useState(null);

  return (
    <main className="w-full h-screen overflow-hidden relative">
      <TerminalMap
        selectedTerminal={selectedTerminal}
        onSelectTerminal={(terminal) => setSelectedTerminal(terminal)}
      />
    </main>
  );
}

export default App;
