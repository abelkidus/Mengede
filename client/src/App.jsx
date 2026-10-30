import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
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
  const [userLocation, setUserLocation] = useState(null);

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
            toast.success('Route submitted successfully! Pending admin approval.');
          }}
        />
      )}
    </main>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#0d2926', /* Matches your dark green sidebar */
            color: '#fff',
            borderRadius: '8px',
          },
          success: {
            iconTheme: {
              primary: '#4ADE80', /* Tailwind green-400 */
              secondary: '#0d2926',
            },
          },
          error: {
            iconTheme: {
              primary: '#F87171', /* Tailwind red-400 */
              secondary: '#0d2926',
            },
          },
        }}
      />
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
