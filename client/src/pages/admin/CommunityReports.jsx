import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { fetchPendingReports, updateReportStatus } from '../../services/api';

/**
 * CommunityReports component.
 * Displays all user-submitted community feedback where status is 'PENDING'.
 * Allows administrators to resolve or dismiss reports.
 */
export default function CommunityReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [actionInProgress, setActionInProgress] = useState({});

  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchPendingReports();
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching pending reports:', err);
      setError(err.message || 'Failed to load community reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
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

  const getCategoryBadgeStyle = (category) => {
    switch (category) {
      case 'Incorrect Fare':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Route No Longer Exists':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Terminal Relocated':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Missing Route':
        return 'bg-[#E8F7F4] text-mengede-teal border-mengede-sage/40';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Incorrect Fare':
        return 'payments';
      case 'Route No Longer Exists':
        return 'wrong_location';
      case 'Terminal Relocated':
        return 'near_me_disabled';
      case 'Missing Route':
        return 'add_road';
      default:
        return 'report';
    }
  };

  const handleUpdateStatus = async (reportId, newStatus) => {
    setActionInProgress((prev) => ({ ...prev, [reportId]: newStatus }));
    const targetReport = reports.find((r) => r.id === reportId);

    // Optimistically remove from local list
    setReports((prev) => prev.filter((r) => r.id !== reportId));

    try {
      await updateReportStatus(reportId, newStatus);
      toast.success(
        newStatus === 'RESOLVED'
          ? 'Report marked as resolved.'
          : 'Report dismissed.'
      );
    } catch (err) {
      console.error('Failed to update report status:', err);
      // Rollback optimistic removal
      if (targetReport) {
        setReports((prev) => [targetReport, ...prev]);
      }
      toast.error(err.message || 'Failed to update report status.');
    } finally {
      setActionInProgress((prev) => {
        const next = { ...prev };
        delete next[reportId];
        return next;
      });
    }
  };

  // Filtered reports calculation
  const filteredReports = useMemo(() => {
    return reports.filter((item) => {
      // Category filter
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const cat = (item.category || '').toLowerCase();
        const desc = (item.description || '').toLowerCase();
        const terminalName = (item.terminal?.name || '').toLowerCase();
        const dest = (item.route?.destinationName || '').toLowerCase();

        return (
          cat.includes(query) ||
          desc.includes(query) ||
          terminalName.includes(query) ||
          dest.includes(query)
        );
      }

      return true;
    });
  }, [reports, categoryFilter, searchQuery]);

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#EEFCFA] text-mengede-dark font-['Plus_Jakarta_Sans',sans-serif] antialiased">
      {/* Main Container - matching top padding (pt-8 sm:pt-10) of other admin pages */}
      <main className="flex-1 p-4 sm:p-6 lg:p-10 pt-8 sm:pt-10 max-w-6xl w-full mx-auto flex flex-col gap-6">
        {/* Page Heading & Stats */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-mengede-dark tracking-tight">
              Community Reports
            </h1>
            <p className="text-[14px] text-mengede-dark/70 mt-1">
              Review and act on user-submitted feedback regarding fares, missing routes, and terminal relocations.
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex items-center gap-2">
            <div className="px-3.5 py-2 bg-white rounded-xl shadow-xs border border-gray-200/80 text-[13px] font-semibold text-mengede-dark flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <span>
                Pending Queue: <b>{reports.length}</b>
              </span>
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
              placeholder="Search by terminal, route, or keyword..."
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

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto bg-gray-100 p-1 rounded-xl self-stretch sm:self-auto overflow-x-auto">
            <button
              type="button"
              onClick={() => setCategoryFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                categoryFilter === 'ALL'
                  ? 'bg-white text-mengede-dark shadow-xs'
                  : 'text-gray-600 hover:text-mengede-dark'
              }`}
            >
              All ({reports.length})
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('Incorrect Fare')}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                categoryFilter === 'Incorrect Fare'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-mengede-dark'
              }`}
            >
              Fare Issues
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('Terminal Relocated')}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                categoryFilter === 'Terminal Relocated'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-mengede-dark'
              }`}
            >
              Relocated
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('Missing Route')}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                categoryFilter === 'Missing Route'
                  ? 'bg-mengede-primary text-white shadow-xs'
                  : 'text-gray-600 hover:text-mengede-dark'
              }`}
            >
              Missing
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && reports.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-3xl shadow-sm border border-gray-200/60 p-8">
            <div className="w-10 h-10 border-3 border-mengede-primary border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-[15px] font-medium text-mengede-dark">
              Loading pending reports...
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
              onClick={loadReports}
              className="px-3 py-1 bg-red-100 hover:bg-red-200 rounded-lg text-[12px] font-bold transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State (No pending reports) */}
        {!loading && reports.length === 0 && !error && (
          <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-3xl shadow-sm border border-gray-200/60 p-8">
            <div className="w-14 h-14 rounded-full bg-[#E8F7F4] text-mengede-primary flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-[28px]">
                task_alt
              </span>
            </div>
            <h3 className="text-lg font-bold text-mengede-dark">
              All Caught Up!
            </h3>
            <p className="text-[14px] text-mengede-dark/60 max-w-sm mt-1">
              There are no pending community reports to review at this time.
            </p>
          </div>
        )}

        {/* Filtered Empty State (Query has 0 matches) */}
        {!loading && reports.length > 0 && filteredReports.length === 0 && (
          <div className="py-16 flex flex-col items-center justify-center text-center bg-white rounded-3xl shadow-sm border border-gray-200/60 p-8">
            <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-[24px]">search_off</span>
            </div>
            <h3 className="text-[16px] font-bold text-mengede-dark">
              No Matching Reports
            </h3>
            <p className="text-[13px] text-gray-500 max-w-sm mt-1">
              No reports match your current search query or filter. Try clearing the filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('ALL');
              }}
              className="mt-4 px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-[12px] font-semibold text-mengede-dark transition cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Reports Table - styled identically to ActionHistory.jsx */}
        {!loading && filteredReports.length > 0 && (
          <div className="w-full rounded-2xl overflow-hidden shadow-sm bg-white border border-gray-200/80">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left border-collapse">
                <thead>
                  <tr className="bg-mengede-teal text-white">
                    <th className="py-3.5 px-5 text-[13px] font-semibold tracking-wider uppercase">
                      Category
                    </th>
                    <th className="py-3.5 px-5 text-[13px] font-semibold tracking-wider uppercase">
                      Description
                    </th>
                    <th className="py-3.5 px-5 text-[13px] font-semibold tracking-wider uppercase">
                      Target
                    </th>
                    <th className="py-3.5 px-5 text-[13px] font-semibold tracking-wider uppercase">
                      Date
                    </th>
                    <th className="py-3.5 px-5 text-[13px] font-semibold tracking-wider uppercase text-center">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-mengede-dark text-[14px]">
                  {filteredReports.map((report, idx) => {
                    const isProcessing = Boolean(actionInProgress[report.id]);

                    return (
                      <tr
                        key={report.id}
                        className={`hover:bg-[#EEFCFA]/70 transition-colors duration-150 ${
                          idx % 2 === 1 ? 'bg-[#F9FCFB]' : 'bg-white'
                        }`}
                      >
                        {/* Category */}
                        <td className="py-4 px-5 align-top">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-bold border shadow-2xs ${getCategoryBadgeStyle(
                              report.category
                            )}`}
                          >
                            <span className="material-symbols-outlined text-[15px]">
                              {getCategoryIcon(report.category)}
                            </span>
                            <span>{report.category}</span>
                          </span>
                        </td>

                        {/* Description */}
                        <td className="py-4 px-5 align-top max-w-xs md:max-w-md">
                          <p className="text-[13px] text-mengede-dark leading-relaxed whitespace-pre-wrap break-words">
                            {report.description}
                          </p>
                        </td>

                        {/* Target (Terminal/Route name) */}
                        <td className="py-4 px-5 align-top font-medium">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 font-semibold text-mengede-primary">
                              <span className="material-symbols-outlined text-[17px] text-mengede-teal/70 shrink-0">
                                location_on
                              </span>
                              <span>
                                {report.terminal?.name || `Terminal #${report.terminalId}`}
                              </span>
                            </div>
                            {report.route?.destinationName ? (
                              <div className="flex items-center gap-1 text-[12px] text-gray-500 font-medium mt-0.5 ml-0.5">
                                <span className="material-symbols-outlined text-[14px] text-mengede-primary shrink-0">
                                  arrow_forward
                                </span>
                                <span className="truncate">
                                  Route: {report.route.destinationName}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[11px] text-gray-400 ml-0.5 mt-0.5">
                                Terminal-wide
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Date */}
                        <td className="py-4 px-5 align-top text-gray-600 text-[13px] font-mono whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px] text-gray-400 shrink-0">
                              schedule
                            </span>
                            <span>{formatDate(report.createdAt)}</span>
                          </div>
                        </td>

                        {/* Action Buttons: Green Checkmark (Resolve) & Red 'X' (Dismiss) */}
                        <td className="py-4 px-5 align-top whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleUpdateStatus(report.id, 'RESOLVED')}
                              title="Resolve Report"
                              aria-label="Resolve Report"
                              className="w-8 h-8 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 flex items-center justify-center transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-wait shadow-2xs"
                            >
                              {actionInProgress[report.id] === 'RESOLVED' ? (
                                <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <span className="material-symbols-outlined text-[18px]">
                                  check
                                </span>
                              )}
                            </button>
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleUpdateStatus(report.id, 'DISMISSED')}
                              title="Dismiss Report"
                              aria-label="Dismiss Report"
                              className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 flex items-center justify-center transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-wait shadow-2xs"
                            >
                              {actionInProgress[report.id] === 'DISMISSED' ? (
                                <div className="w-4 h-4 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <span className="material-symbols-outlined text-[18px]">
                                  close
                                </span>
                              )}
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
        )}
      </main>
    </div>
  );
}

