import { useState, useEffect } from 'react';
import { fetchPendingRoutes as apiFetchPendingRoutes, updateRouteStatus } from '../services/api';

export default function AdminDashboard({ onBackToMap }) {
  const [pendingRoutes, setPendingRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionInProgress, setActionInProgress] = useState({});
  const [toast, setToast] = useState(null);
  const [editState, setEditState] = useState({}); // { [routeId]: { destinationName: string, fare: number|string } }

  const showToast = (message, type = 'success') => {
    setToast(message ? { message, type } : null);
    if (message) {
      setTimeout(() => setToast(null), 3000);
    }
  };

  const toggleEdit = (route) => {
    setEditState((prev) => {
      if (prev[route.id]) {
        const copy = { ...prev };
        delete copy[route.id];
        return copy;
      }
      return {
        ...prev,
        [route.id]: {
          destinationName: route.destinationName,
          fare: route.fare,
        },
      };
    });
  };

  const handleEditChange = (routeId, field, value) => {
    setEditState((prev) => ({
      ...prev,
      [routeId]: {
        ...prev[routeId],
        [field]: value,
      },
    }));
  };

  const fetchPendingRoutes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetchPendingRoutes();
      setPendingRoutes(data);
    } catch (err) {
      console.error('Error fetching pending routes:', err);
      setError(err.message || 'Failed to load pending submissions.');
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

    const editedValues = editState[routeId];
    let payload = { status: newStatus };
    let finalDestination = targetRoute.destinationName;

    if (newStatus === 'APPROVED' && editedValues) {
      const trimmedDest = editedValues.destinationName !== undefined ? editedValues.destinationName.trim() : targetRoute.destinationName;
      const parsedFare = editedValues.fare !== undefined ? parseFloat(editedValues.fare) : targetRoute.fare;

      if (!trimmedDest || trimmedDest.length < 2 || trimmedDest.length > 80) {
        showToast('Destination name must be between 2 and 80 characters.', 'error');
        return;
      }

      if (isNaN(parsedFare) || parsedFare <= 0 || parsedFare > 1000) {
        showToast('Fare must be a positive number up to 1000 Birr.', 'error');
        return;
      }

      payload.destinationName = trimmedDest;
      payload.fare = parsedFare;
      finalDestination = trimmedDest;
    }

    // Optimistically remove from state
    setPendingRoutes((prev) => prev.filter((r) => r.id !== routeId));
    setActionInProgress((prev) => ({ ...prev, [routeId]: newStatus }));

    try {
      await updateRouteStatus(routeId, payload);

      setEditState((prev) => {
        const copy = { ...prev };
        delete copy[routeId];
        return copy;
      });

      showToast(
        `Route to "${finalDestination}" ${
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
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
                      {pendingRoutes.map((route, idx) => {
                        const isEditing = !!editState[route.id];
                        return (
                          <tr
                            key={route.id}
                            className={`hover:bg-[#EEFCFA]/70 transition-colors duration-150 ${
                              isEditing
                                ? 'bg-amber-50/50'
                                : idx % 2 === 1
                                ? 'bg-[#F9FCFB]'
                                : 'bg-white'
                            }`}
                          >
                            <td className="py-4 px-5 text-gray-400 font-mono text-[13px]">
                              #{route.id}
                            </td>
                            <td className="py-4 px-5 font-semibold text-mengede-primary">
                              {route.origin?.name || `Terminal #${route.originId}`}
                            </td>
                            <td className="py-4 px-5 font-medium text-mengede-dark">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editState[route.id]?.destinationName ?? route.destinationName}
                                  onChange={(e) =>
                                    handleEditChange(route.id, 'destinationName', e.target.value)
                                  }
                                  placeholder="Destination name"
                                  required
                                  minLength={2}
                                  maxLength={80}
                                  className="w-full min-w-[150px] px-3 py-1.5 bg-white border border-mengede-sage rounded-xl text-[13px] text-mengede-dark focus:outline-none focus:ring-2 focus:ring-mengede-primary shadow-xs transition"
                                />
                              ) : (
                                route.destinationName
                              )}
                            </td>
                            <td className="py-4 px-5 font-bold text-mengede-dark">
                              {isEditing ? (
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="number"
                                    value={editState[route.id]?.fare ?? route.fare}
                                    onChange={(e) =>
                                      handleEditChange(route.id, 'fare', e.target.value)
                                    }
                                    placeholder="Fare"
                                    required
                                    min="0.01"
                                    max="1000"
                                    step="any"
                                    className="w-20 px-2.5 py-1.5 bg-white border border-mengede-sage rounded-xl text-[13px] text-mengede-dark focus:outline-none focus:ring-2 focus:ring-mengede-primary shadow-xs transition font-bold"
                                  />
                                  <span className="text-[12px] font-semibold text-gray-500">
                                    Birr
                                  </span>
                                </div>
                              ) : (
                                `${route.fare} Birr`
                              )}
                            </td>
                            <td className="py-4 px-5 text-right">
                              <div className="inline-flex items-center gap-2 justify-end">
                                {/* Edit Action Button */}
                                <button
                                  type="button"
                                  disabled={actionInProgress[route.id]}
                                  onClick={() => toggleEdit(route)}
                                  title={isEditing ? 'Cancel Edit' : 'Edit Route'}
                                  aria-label={isEditing ? 'Cancel Edit' : 'Edit Route'}
                                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-semibold active:scale-95 transition-all shadow-xs cursor-pointer disabled:opacity-50 ${
                                    isEditing
                                      ? 'bg-amber-500 hover:bg-amber-600 text-white'
                                      : 'bg-white hover:bg-gray-100 text-mengede-dark border border-gray-300'
                                  }`}
                                >
                                  <span className="material-symbols-outlined text-[16px]">
                                    {isEditing ? 'close' : 'edit'}
                                  </span>
                                  <span>{isEditing ? 'Cancel' : 'Edit'}</span>
                                </button>

                                {/* Approve Button */}
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

                                {/* Reject Button */}
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
                        );
                      })}
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
