import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import TerminalMap from './components/Map';
import TerminalModal from './components/TerminalModal';
import SubmitRouteForm from './components/SubmitRouteForm';
import AdminDashboard from './components/AdminDashboard';
import TerminalsOverview from './components/TerminalsOverview';
import ActionHistory from './components/ActionHistory';
import AdminLayout from './components/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLogin from './components/AdminLogin';

function MainMap() {
  const navigate = useNavigate();
  const [selectedTerminal, setSelectedTerminal] = useState(null);
  const [activeRouteSelection, setActiveRouteSelection] = useState(null);
  const [isSubmittingRoute, setIsSubmittingRoute] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <main className="w-full h-[100dvh] overflow-hidden relative">
      {/* Interactive Map Canvas & Top Search Overlay */}
      <TerminalMap
        selectedTerminal={selectedTerminal}
        onSelectTerminal={(terminal) => {
          setSelectedTerminal(terminal);
          setIsSubmittingRoute(false);
        }}
        onOpenAdmin={() => navigate('/admin')}
        userLocation={userLocation}
        onUserLocationChange={setUserLocation}
        activeRouteSelection={activeRouteSelection}
        onSelectActiveRoute={setActiveRouteSelection}
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
          onViewPath={(routeData) => {
            setActiveRouteSelection(routeData);
            setSelectedTerminal(null);
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

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        {/* Main Map interface */}
        <Route path="/" element={<MainMap />} />

        {/* Public Admin Login route */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Nested Protected Admin routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="terminals" element={<TerminalsOverview />} />
          <Route path="history" element={<ActionHistory />} />
        </Route>

        {/* Catch-all redirect for 404s back to root */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
