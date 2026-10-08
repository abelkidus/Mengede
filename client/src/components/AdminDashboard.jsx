import { useState, useEffect } from 'react';

export default function AdminDashboard({ onBackToMap }) {
  const [pendingRoutes, setPendingRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionInProgress, setActionInProgress] = useState({});
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast(message ? { message, type } : null);
    if (message) {
      setTimeout(() => setToast(null), 3000);
    }
  };

  const fetchPendingRoutes = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/pending');
      if (!res.ok) {
        throw new Error(`Failed to load pending submissions: ${res.statusText}`);
      }
      const data = await res.json();
      setPendingRoutes(data);
    } catch (err) {
      console.error('Error fetching pending routes:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingRoutes();
  }, []);

  const handleModeration = async (routeId, newStatus) => {
    // Keep reference to existing route for rollback if needed
    const targetRoute = pendingRoutes.find((r) => r.id === routeId);
    if (!targetRoute) return;

    // Optimistically remove from state
    setPendingRoutes((prev) => prev.filter((r) => r.id !== routeId));
    setActionInProgress((prev) => ({ ...prev, [routeId]: newStatus }));

    try {
      const res = await fetch(`/api/admin/routes/${routeId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Failed to update status to ${newStatus}`);
      }

      showToast(
        `Route to "${targetRoute.destinationName}" ${
          newStatus === 'APPROVED' ? 'Approved' : 'Rejected'
        }`,
        newStatus === 'APPROVED' ? 'success' : 'info'
      );
    } catch (err) {
      console.error('Moderation error:', err);
      // Rollback optimistic state
      setPendingRoutes((prev) => [targetRoute, ...prev]);
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setActionInProgress((prev) => {
        const copy = { ...prev };
        delete copy[routeId];
        return copy;
      });
    }
  };

  return (
    <div className="flex min-h-screen bg-[#EEFCFA] text-mengede-dark font-['Plus_Jakarta_Sans',sans-serif] antialiased">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-60 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-white border border-white/20 animate-fade-in ${
            toast.type === 'error'
              ? 'bg-red-600'
              : toast.type === 'info'
              ? 'bg-gray-700'
              : 'bg-mengede-teal'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">
            {toast.type === 'error'
              ? 'error'
              : toast.type === 'info'
              ? 'cancel'
              : 'check_circle'}
          </span>
          <span className="text-[14px] font-medium">{toast.message}</span>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 bg-mengede-dark text-white z-40 flex-col justify-between shadow-lg">
        <div className="flex flex-col">
          {/* Brand Header */}
          <div className="h-16 flex items-center gap-3 px-6 border-b border-white/10">
            <div className="w-9 h-9 rounded-full bg-mengede-primary flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-white text-[20px]">
                alt_route
              </span>
            </div>
            <div>
              <span className="text-[17px] font-bold text-white tracking-tight block">
                Mengede
              </span>
              <span className="text-[10px] text-mengede-sage uppercase tracking-wider block font-semibold">
                Moderation Hub
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="px-4 py-5">
            <p className="px-3 pb-2 text-[11px] text-white/50 uppercase tracking-wider font-semibold">
              Route Operations
            </p>
            <nav className="flex flex-col gap-1">
              <button
                type="button"
                onClick={onBackToMap}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/80 hover:bg-white/10 hover:text-white transition-colors text-[14px] font-medium text-left cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">map</span>
                Explore Map
              </button>

              <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-mengede-teal text-white text-[14px] font-semibold">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[20px]">
                    hourglass_top
                  </span>
                  Pending Queue
                </div>
                <span className="px-2 py-0.5 rounded-full bg-mengede-primary text-white text-[11px] font-bold">
                  {pendingRoutes.length}
                </span>
              </div>

              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/60 text-[14px] font-medium">
                <span className="material-symbols-outlined text-[20px]">fact_check</span>
                History Log
              </div>

              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/60 text-[14px] font-medium">
                <span className="material-symbols-outlined text-[20px]">local_taxi</span>
                Terminals & Bays
              </div>
            </nav>
          </div>
        </div>

        {/* Sidebar Footer Status */}
        <div className="p-4">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-mengede-sage animate-pulse" />
              <span className="text-[12px] text-white/90 font-medium">
                Audit Node Live
              </span>
            </div>
            <span className="text-[11px] text-white/50 font-mono">v1.4</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-xl border-b border-gray-200/80 flex items-center justify-between px-6 lg:px-10 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToMap}
              className="lg:hidden p-2 rounded-xl text-mengede-dark hover:bg-gray-100 flex items-center gap-1.5 text-[14px] font-semibold"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              <span>Map</span>
            </button>

            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F7F4] text-mengede-teal text-[12px] font-semibold border border-mengede-sage/30">
              <span className="material-symbols-outlined text-[16px] text-mengede-primary">
                verified_user
              </span>
              <span>Route Safety & Verification Mode</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={fetchPendingRoutes}
              disabled={loading}
              title="Refresh queue"
              className="w-9 h-9 rounded-full flex items-center justify-center text-mengede-dark hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <span
                className={`material-symbols-outlined text-[20px] ${
                  loading ? 'animate-spin' : ''
                }`}
              >
                refresh
              </span>
            </button>

            <button
              type="button"
              onClick={onBackToMap}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-mengede-teal/10 hover:bg-mengede-teal/20 text-mengede-teal text-[13px] font-semibold transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">map</span>
              <span>View Map</span>
            </button>

            <div className="h-6 w-px bg-gray-200" />

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <span className="text-[13px] font-bold text-mengede-dark block leading-tight">
                  Route Examiner
                </span>
                <span className="text-[11px] text-mengede-dark/60 block">
                  Urban Transit Desk
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-mengede-dark text-white flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-[18px]">person</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Body */}
        <main className="flex-1 p-6 lg:p-10 max-w-6xl w-full mx-auto flex flex-col gap-6">
          {/* Page Heading */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-mengede-dark">
                Pending Submissions
              </h1>
              <p className="text-[14px] text-mengede-dark/70 mt-1">
                Review and moderate community-submitted urban transit routes and fare
                rates.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1.5 bg-white rounded-xl shadow-xs border border-gray-200/80 text-[13px] font-semibold text-mengede-dark">
                Queue Total: {pendingRoutes.length}
              </span>
            </div>
          </div>

          {/* Loading State */}
          {loading && pendingRoutes.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-3xl shadow-sm border border-gray-200/60 p-8">
              <div className="w-10 h-10 border-3 border-mengede-primary border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-[15px] font-medium text-mengede-dark">
                Loading pending queue...
              </p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px]">error</span>
                <span className="text-[14px]">{error}</span>
              </div>
              <button
                type="button"
                onClick={fetchPendingRoutes}
                className="px-3 py-1 bg-red-100 hover:bg-red-200 rounded-lg text-[12px] font-bold transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Table Container */}
          {!loading && pendingRoutes.length === 0 && !error ? (
            <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-3xl shadow-sm border border-gray-200/60 p-8">
              <div className="w-14 h-14 rounded-full bg-[#E8F7F4] text-mengede-primary flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-[28px]">
                  task_alt
                </span>
              </div>
              <h3 className="text-lg font-bold text-mengede-dark">
                Queue is Clear!
              </h3>
              <p className="text-[14px] text-mengede-dark/60 max-w-sm mt-1">
                There are no pending submissions waiting for review at this time.
              </p>
            </div>
          ) : (
            pendingRoutes.length > 0 && (
              <div className="w-full rounded-2xl overflow-hidden shadow-sm bg-white border border-gray-200/80">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-mengede-teal text-white">
                        <th className="py-3.5 px-5 text-[13px] font-semibold tracking-wider uppercase">
                          ID
                        </th>
                        <th className="py-3.5 px-5 text-[13px] font-semibold tracking-wider uppercase">
                          Terminal
                        </th>
                        <th className="py-3.5 px-5 text-[13px] font-semibold tracking-wider uppercase">
                          Destination
                        </th>
                        <th className="py-3.5 px-5 text-[13px] font-semibold tracking-wider uppercase">
                          Fare
                        </th>
                        <th className="py-3.5 px-5 text-[13px] font-semibold tracking-wider uppercase text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-mengede-dark text-[14px]">
                      {pendingRoutes.map((route, idx) => (
                        <tr
                          key={route.id}
                          className={`hover:bg-[#EEFCFA]/70 transition-colors duration-150 ${
                            idx % 2 === 1 ? 'bg-[#F9FCFB]' : 'bg-white'
                          }`}
                        >
                          <td className="py-4 px-5 text-gray-400 font-mono text-[13px]">
                            #{route.id}
                          </td>
                          <td className="py-4 px-5 font-semibold text-mengede-primary">
                            {route.origin?.name || `Terminal #${route.originId}`}
                          </td>
                          <td className="py-4 px-5 font-medium text-mengede-dark">
                            {route.destinationName}
                          </td>
                          <td className="py-4 px-5 font-bold text-mengede-dark">
                            {route.fare} Birr
                          </td>
                          <td className="py-4 px-5 text-right">
                            <div className="inline-flex items-center gap-2 justify-end">
                              <button
                                type="button"
                                disabled={actionInProgress[route.id]}
                                onClick={() => handleModeration(route.id, 'APPROVED')}
                                className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-mengede-primary hover:bg-[#236e4f] text-white text-[12px] font-semibold active:scale-95 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                              >
                                <span className="material-symbols-outlined text-[16px]">
                                  check
                                </span>
                                <span>Approve</span>
                              </button>

                              <button
                                type="button"
                                disabled={actionInProgress[route.id]}
                                onClick={() => handleModeration(route.id, 'REJECTED')}
                                className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-gray-500 hover:bg-gray-600 text-white text-[12px] font-semibold active:scale-95 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                              >
                                <span className="material-symbols-outlined text-[16px]">
                                  close
                                </span>
                                <span>Reject</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}
        </main>
      </div>
    </div>
  );
}
