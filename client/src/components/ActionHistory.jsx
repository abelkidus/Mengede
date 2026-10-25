import { useState, useEffect, useMemo } from 'react';
import { fetchActionHistory } from '../services/api';

/**
 * ActionHistory component.
 * Displays an audit trail of approved and rejected community-submitted routes
 * ordered by updatedAt descending.
 */
export default function ActionHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'APPROVED' | 'REJECTED'

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchActionHistory();
      setHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching action history:', err);
      setError(err.message || 'Failed to load action history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(date);
    } catch {
      return String(dateString);
    }
  };

  // Compute filtered records
  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      // Status filter
      if (statusFilter !== 'ALL' && item.status !== statusFilter) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const dest = (item.destinationName || '').toLowerCase();
        const terminalName = (item.origin?.name || '').toLowerCase();
        return dest.includes(query) || terminalName.includes(query);
      }

      return true;
    });
  }, [history, statusFilter, searchQuery]);

  // Statistics
  const totalApproved = useMemo(
    () => history.filter((r) => r.status === 'APPROVED').length,
    [history]
  );
  const totalRejected = useMemo(
    () => history.filter((r) => r.status === 'REJECTED').length,
    [history]
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#EEFCFA] text-mengede-dark font-['Plus_Jakarta_Sans',sans-serif] antialiased">
      {/* Top Header */}
      <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-xl border-b border-gray-200/80 flex items-center justify-between px-6 lg:px-10 shadow-xs">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F7F4] text-mengede-teal text-[12px] font-semibold border border-mengede-sage/30">
          <span className="material-symbols-outlined text-[16px] text-mengede-primary">
            history
          </span>
          <span>Decision Audit Trail</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadHistory}
            disabled={loading}
            title="Refresh history"
            className="w-9 h-9 rounded-full flex items-center justify-center text-mengede-dark hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            <span
              className={`material-symbols-outlined text-[20px] ${
                loading ? 'animate-spin' : ''
              }`}
            >
              refresh
            </span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-6 lg:p-10 max-w-6xl w-full mx-auto flex flex-col gap-6">
        {/* Page Heading & Stats */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-mengede-dark tracking-tight">
              Action History
            </h1>
            <p className="text-[14px] text-mengede-dark/70 mt-1">
              Audit log of all reviewed, approved, and rejected community route submissions.
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="px-3.5 py-1.5 bg-white rounded-xl shadow-xs border border-gray-200/80 text-[13px] font-semibold text-mengede-dark flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-mengede-teal" />
              <span>Total Logged: <b>{history.length}</b></span>
            </div>
            <div className="px-3.5 py-1.5 bg-[#E8F7F4] rounded-xl shadow-xs border border-mengede-sage/30 text-[13px] font-semibold text-mengede-teal flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-mengede-primary">
                check_circle
              </span>
              <span>Approved: <b>{totalApproved}</b></span>
            </div>
            <div className="px-3.5 py-1.5 bg-rose-50 rounded-xl shadow-xs border border-rose-200 text-[13px] font-semibold text-rose-700 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-rose-600">
                cancel
              </span>
              <span>Rejected: <b>{totalRejected}</b></span>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by terminal or destination..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[13px] text-mengede-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mengede-primary focus:bg-white transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          {/* Decision Status Filter Pills */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto bg-gray-100 p-1 rounded-xl self-stretch sm:self-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-[12px] font-bold transition-all cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-white text-mengede-dark shadow-xs'
                  : 'text-gray-600 hover:text-mengede-dark'
              }`}
            >
              All ({history.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('APPROVED')}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-[12px] font-bold transition-all cursor-pointer ${
                statusFilter === 'APPROVED'
                  ? 'bg-mengede-primary text-white shadow-xs'
                  : 'text-gray-600 hover:text-mengede-dark'
              }`}
            >
              Approved ({totalApproved})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('REJECTED')}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-[12px] font-bold transition-all cursor-pointer ${
                statusFilter === 'REJECTED'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-mengede-dark'
              }`}
            >
              Rejected ({totalRejected})
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && history.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-3xl shadow-sm border border-gray-200/60 p-8">
            <div className="w-10 h-10 border-3 border-mengede-primary border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-[15px] font-medium text-mengede-dark">
              Loading moderation history...
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
              onClick={loadHistory}
              className="px-3 py-1 bg-red-100 hover:bg-red-200 rounded-lg text-[12px] font-bold transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State (No records at all) */}
        {!loading && history.length === 0 && !error && (
          <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-3xl shadow-sm border border-gray-200/60 p-8">
            <div className="w-14 h-14 rounded-full bg-[#E8F7F4] text-mengede-primary flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-[28px]">
                history_toggle_off
              </span>
            </div>
            <h3 className="text-lg font-bold text-mengede-dark">
              No Action History Yet
            </h3>
            <p className="text-[14px] text-mengede-dark/60 max-w-sm mt-1">
              As community routes are approved or rejected in the moderation queue,
              their audit trail will appear here.
            </p>
          </div>
        )}

        {/* Filtered Empty State (Query has 0 matches) */}
        {!loading && history.length > 0 && filteredHistory.length === 0 && (
          <div className="py-16 flex flex-col items-center justify-center text-center bg-white rounded-3xl shadow-sm border border-gray-200/60 p-8">
            <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-[24px]">search_off</span>
            </div>
            <h3 className="text-[16px] font-bold text-mengede-dark">
              No Matching Records
            </h3>
            <p className="text-[13px] text-gray-500 max-w-sm mt-1">
              No moderation records matched your search query or filter. Try clearing the filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
              }}
              className="mt-4 px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-[12px] font-semibold text-mengede-dark transition cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Data Table */}
        {!loading && filteredHistory.length > 0 && (
          <div className="w-full rounded-2xl overflow-hidden shadow-sm bg-white border border-gray-200/80">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-mengede-teal text-white">
                    <th className="py-3.5 px-5 text-[13px] font-semibold tracking-wider uppercase">
                      Terminal
                    </th>
                    <th className="py-3.5 px-5 text-[13px] font-semibold tracking-wider uppercase">
                      Destination
                    </th>
                    <th className="py-3.5 px-5 text-[13px] font-semibold tracking-wider uppercase">
                      Fare
                    </th>
                    <th className="py-3.5 px-5 text-[13px] font-semibold tracking-wider uppercase">
                      Admin Decision
                    </th>
                    <th className="py-3.5 px-5 text-[13px] font-semibold tracking-wider uppercase">
                      Decision Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-mengede-dark text-[14px]">
                  {filteredHistory.map((route, idx) => {
                    const isApproved = route.status === 'APPROVED';
                    return (
                      <tr
                        key={route.id}
                        className={`hover:bg-[#EEFCFA]/70 transition-colors duration-150 ${
                          idx % 2 === 1 ? 'bg-[#F9FCFB]' : 'bg-white'
                        }`}
                      >
                        {/* Terminal */}
                        <td className="py-4 px-5 font-semibold text-mengede-primary">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px] text-mengede-teal/70">
                              location_on
                            </span>
                            <span>{route.origin?.name || `Terminal #${route.originId}`}</span>
                          </div>
                        </td>

                        {/* Destination */}
                        <td className="py-4 px-5 font-medium text-mengede-dark">
                          {route.destinationName}
                        </td>

                        {/* Fare */}
                        <td className="py-4 px-5 font-bold text-mengede-dark">
                          {route.fare} <span className="text-[12px] font-semibold text-gray-500">Birr</span>
                        </td>

                        {/* Admin Decision Colored Badge */}
                        <td className="py-4 px-5">
                          {isApproved ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold bg-[#E8F7F4] text-mengede-teal border border-mengede-sage/40 shadow-xs">
                              <span className="material-symbols-outlined text-[15px] text-mengede-primary">
                                check_circle
                              </span>
                              <span>Approved</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-xs">
                              <span className="material-symbols-outlined text-[15px] text-rose-600">
                                cancel
                              </span>
                              <span>Rejected</span>
                            </span>
                          )}
                        </td>

                        {/* Formatted Timestamp */}
                        <td className="py-4 px-5 text-gray-600 text-[13px] font-mono">
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px] text-gray-400">
                              schedule
                            </span>
                            <span>{formatDate(route.updatedAt)}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
