import { useState } from 'react';
import TerminalMap from './components/Map';
import TerminalModal from './components/TerminalModal';
import SubmitRouteForm from './components/SubmitRouteForm';
import AdminDashboard from './components/AdminDashboard';

function App() {
  const [currentView, setCurrentView] = useState('map'); // 'map' | 'admin'
  const [selectedTerminal, setSelectedTerminal] = useState(null);
  const [isSubmittingRoute, setIsSubmittingRoute] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3500);
  };

  if (currentView === 'admin') {
    return <AdminDashboard onBackToMap={() => setCurrentView('map')} />;
  }

  return (
    <main className="w-full h-screen overflow-hidden relative">
      {/* Interactive Map Canvas & Top Search Overlay */}
      <TerminalMap
        selectedTerminal={selectedTerminal}
        onSelectTerminal={(terminal) => {
          setSelectedTerminal(terminal);
          setIsSubmittingRoute(false);
        }}
        onOpenAdmin={() => setCurrentView('admin')}
        userLocation={userLocation}
        onUserLocationChange={setUserLocation}
      />

      {/* Screen 2: Terminal Routes & Fares Bottom Sheet Modal */}
      {selectedTerminal && !isSubmittingRoute && (
        <TerminalModal
          terminal={selectedTerminal}
          userLocation={userLocation}
          onClose={() => setSelectedTerminal(null)}
          onSubmitMissingRoute={() => {
            setIsSubmittingRoute(true);
          }}
        />
      )}

      {/* Screen 3: Submit Route Data Form View */}
      {selectedTerminal && isSubmittingRoute && (
        <SubmitRouteForm
          terminal={selectedTerminal}
          onBack={() => setIsSubmittingRoute(false)}
          onSuccess={() => {
            setIsSubmittingRoute(false);
            setSelectedTerminal(null);
            showToast('Route submitted successfully! Pending admin approval.');
          }}
        />
      )}

      {/* Global Success Toast */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-60 bg-mengede-teal text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/20 animate-fade-in pointer-events-none">
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
          </div>
          <div>
            <div className="font-bold text-[14px]">Success</div>
            <div className="text-[12px] text-mengede-sage">{toastMessage}</div>
          </div>
        </div>
      )}
    </main>
  );
}

export default App;
