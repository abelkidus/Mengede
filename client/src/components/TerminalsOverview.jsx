import { useState, useEffect } from 'react';
import {
  fetchTerminals,
  createTerminal,
  updateTerminal,
  deleteTerminal,
} from '../services/api';

export default function TerminalsOverview() {
  const [terminals, setTerminals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTerminal, setEditingTerminal] = useState(null); // null when creating, terminal object when editing
  const [formData, setFormData] = useState({ name: '', latitude: '', longitude: '' });
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete confirmation modal state
  const [terminalToDelete, setTerminalToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadTerminals = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTerminals();
      setTerminals(data);
    } catch (err) {
      console.error('Error fetching terminals:', err);
      setError(err.message || 'Failed to load terminals. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTerminals();
  }, []);

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingTerminal(null);
    setFormData({ name: '', latitude: '', longitude: '' });
    setFormError(null);
    setModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (terminal) => {
    setEditingTerminal(terminal);
    setFormData({
      name: terminal.name,
      latitude: terminal.latitude.toString(),
      longitude: terminal.longitude.toString(),
    });
    setFormError(null);
    setModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    if (submitting) return;
    setModalOpen(false);
    setEditingTerminal(null);
    setFormError(null);
  };

  // Submit Modal (Create or Update)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = formData.name.trim();
    if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 100) {
      setFormError('Terminal name must be between 2 and 100 characters.');
      return;
    }

    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setFormError('Latitude must be a valid number between -90 and 90.');
      return;
    }

    if (isNaN(lng) || lng < -180 || lng > 180) {
      setFormError('Longitude must be a valid number between -180 and 180.');
      return;
    }

    try {
      setSubmitting(true);

      if (editingTerminal) {
        // Update existing terminal
        const updated = await updateTerminal(editingTerminal.id, {
          name: trimmedName,
          latitude: lat,
          longitude: lng,
        });

        // Optimistically update list
        setTerminals((prev) =>
          prev.map((t) =>
            t.id === editingTerminal.id
              ? { ...t, ...updated, routes: t.routes || [] }
              : t
          )
        );
        showToast(`Terminal "${trimmedName}" updated successfully.`);
      } else {
        // Create new terminal
        const created = await createTerminal({
          name: trimmedName,
          latitude: lat,
          longitude: lng,
        });

        // Optimistically add to list
        setTerminals((prev) => [
          ...prev,
          { ...created, routes: [] },
        ]);
        showToast(`Terminal "${trimmedName}" created successfully.`);
      }

      handleCloseModal();
    } catch (err) {
      console.error('Error saving terminal:', err);
      setFormError(
        err.data?.error || err.message || 'An error occurred while saving the terminal.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm delete
  const handleDeleteConfirm = async () => {
    if (!terminalToDelete) return;

    try {
      setDeleting(true);
      await deleteTerminal(terminalToDelete.id);

      // Optimistically remove from state
      setTerminals((prev) => prev.filter((t) => t.id !== terminalToDelete.id));
      showToast(`Terminal "${terminalToDelete.name}" deleted successfully.`);
      setTerminalToDelete(null);
    } catch (err) {
      console.error('Error deleting terminal:', err);
      showToast(err.message || 'Failed to delete terminal.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Filter terminals by search
  const filteredTerminals = terminals.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const totalRoutesCount = terminals.reduce(
    (acc, t) => acc + (t.routes ? t.routes.length : 0),
    0
  );

  return (
    <div className="flex flex-col min-h-full p-6 lg:p-10 max-w-6xl w-full mx-auto gap-6 font-['Plus_Jakarta_Sans',sans-serif]">
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

      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-mengede-dark tracking-tight">
            Terminals Overview
          </h1>
          <p className="text-[14px] text-mengede-dark/70 mt-1">
            Manage origin hubs, geolocation coordinates, and operational routes across Addis Ababa.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-mengede-primary hover:bg-[#236e4f] text-white rounded-2xl font-semibold text-[14px] shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <span className="material-symbols-outlined text-[20px]">add_location_alt</span>
          <span>Add New Terminal</span>
        </button>
      </div>

      {/* Quick Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#E8F7F4] text-mengede-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">location_on</span>
          </div>
          <div>
            <span className="text-xs font-semibold text-mengede-dark/60 uppercase tracking-wider block">
              Active Terminals
            </span>
            <span className="text-2xl font-bold text-mengede-dark">
              {terminals.length}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">alt_route</span>
          </div>
          <div>
            <span className="text-xs font-semibold text-mengede-dark/60 uppercase tracking-wider block">
              Approved Connected Routes
            </span>
            <span className="text-2xl font-bold text-mengede-dark">
              {totalRoutesCount}
            </span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-[20px] pointer-events-none">
          search
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search terminals by name..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200/80 rounded-2xl text-[14px] text-mengede-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mengede-primary shadow-xs transition"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading && terminals.length === 0 && (
        <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-3xl shadow-sm border border-gray-200/60 p-8">
          <div className="w-10 h-10 border-3 border-mengede-primary border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-[15px] font-medium text-mengede-dark">
            Loading terminals...
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
            onClick={loadTerminals}
            className="px-3.5 py-1.5 bg-red-100 hover:bg-red-200 rounded-xl text-[12px] font-bold transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Terminals Table */}
      {!loading && filteredTerminals.length === 0 && !error ? (
        <div className="py-16 flex flex-col items-center justify-center text-center bg-white rounded-3xl shadow-sm border border-gray-200/60 p-8">
          <div className="w-14 h-14 rounded-full bg-[#E8F7F4] text-mengede-primary flex items-center justify-center mb-3">
            <span className="material-symbols-outlined text-[28px]">wrong_location</span>
          </div>
          <h3 className="text-lg font-bold text-mengede-dark">
            {searchQuery ? 'No Matching Terminals' : 'No Terminals Available'}
          </h3>
          <p className="text-[14px] text-mengede-dark/60 max-w-sm mt-1">
            {searchQuery
              ? `No terminal names match "${searchQuery}". Try a different keyword.`
              : 'Add your first transportation hub to begin managing urban transit routes.'}
          </p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-[13px] font-semibold text-mengede-dark transition cursor-pointer"
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        filteredTerminals.length > 0 && (
          <div className="w-full rounded-2xl overflow-hidden shadow-sm bg-white border border-gray-200/80">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-mengede-teal text-white">
                    <th className="py-3.5 px-5 text-[13px] font-semibold tracking-wider uppercase">
                      ID
                    </th>
                    <th className="py-3.5 px-5 text-[13px] font-semibold tracking-wider uppercase">
                      Terminal Name
                    </th>
                    <th className="py-3.5 px-5 text-[13px] font-semibold tracking-wider uppercase">
                      Coordinates (Lat, Lng)
                    </th>
                    <th className="py-3.5 px-5 text-[13px] font-semibold tracking-wider uppercase">
                      Routes
                    </th>
                    <th className="py-3.5 px-5 text-[13px] font-semibold tracking-wider uppercase text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-mengede-dark text-[14px]">
                  {filteredTerminals.map((terminal, idx) => (
                    <tr
                      key={terminal.id}
                      className={`hover:bg-[#EEFCFA]/70 transition-colors duration-150 ${
                        idx % 2 === 1 ? 'bg-[#F9FCFB]' : 'bg-white'
                      }`}
                    >
                      <td className="py-4 px-5 text-gray-400 font-mono text-[13px]">
                        #{terminal.id}
                      </td>
                      <td className="py-4 px-5 font-semibold text-mengede-dark">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-mengede-primary text-[18px]">
                            location_on
                          </span>
                          <span>{terminal.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-5 font-mono text-[13px] text-gray-600">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-200/70 rounded-lg">
                          <span>{terminal.latitude.toFixed(4)}° N,</span>
                          <span>{terminal.longitude.toFixed(4)}° E</span>
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-semibold bg-[#E8F7F4] text-mengede-teal border border-mengede-sage/30">
                          <span className="material-symbols-outlined text-[14px]">alt_route</span>
                          <span>{terminal.routes ? terminal.routes.length : 0} routes</span>
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="inline-flex items-center gap-2 justify-end">
                          {/* Edit Action Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(terminal)}
                            title="Edit Terminal"
                            aria-label={`Edit ${terminal.name}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white hover:bg-gray-100 text-mengede-dark border border-gray-300 text-[12px] font-semibold active:scale-95 transition-all shadow-xs cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px] text-mengede-primary">
                              edit
                            </span>
                            <span>Edit</span>
                          </button>

                          {/* Delete Action Button */}
                          <button
                            type="button"
                            onClick={() => setTerminalToDelete(terminal)}
                            title="Delete Terminal"
                            aria-label={`Delete ${terminal.name}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-[12px] font-semibold active:scale-95 transition-all shadow-xs cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              delete
                            </span>
                            <span>Delete</span>
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

      {/* Create / Edit Terminal Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={handleCloseModal}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col gap-6 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#E8F7F4] text-mengede-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">
                    {editingTerminal ? 'edit_location' : 'add_location_alt'}
                  </span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-mengede-dark">
                    {editingTerminal ? 'Edit Terminal' : 'Add New Terminal'}
                  </h2>
                  <p className="text-xs text-mengede-dark/60">
                    {editingTerminal
                      ? `Update hub details for #${editingTerminal.id}`
                      : 'Register a new transit hub'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={submitting}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Error Banner */}
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-2xl text-[13px] flex items-start gap-2.5">
                <span className="material-symbols-outlined text-[18px] text-red-500 shrink-0 mt-0.5">
                  error
                </span>
                <span className="flex-1 font-medium">{formError}</span>
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
              {/* Terminal Name */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="terminal-name"
                  className="text-xs font-bold uppercase tracking-wider text-mengede-dark/75"
                >
                  Terminal Name
                </label>
                <input
                  type="text"
                  id="terminal-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g. Gotera Interchange"
                  required
                  minLength={2}
                  maxLength={100}
                  disabled={submitting}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-mengede-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mengede-primary focus:bg-white transition"
                />
              </div>

              {/* Coordinates Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Latitude */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="terminal-latitude"
                    className="text-xs font-bold uppercase tracking-wider text-mengede-dark/75"
                  >
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    id="terminal-latitude"
                    value={formData.latitude}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, latitude: e.target.value }))
                    }
                    placeholder="e.g. 9.0345"
                    required
                    min="-90"
                    max="90"
                    disabled={submitting}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-mengede-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mengede-primary focus:bg-white transition"
                  />
                </div>

                {/* Longitude */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="terminal-longitude"
                    className="text-xs font-bold uppercase tracking-wider text-mengede-dark/75"
                  >
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    id="terminal-longitude"
                    value={formData.longitude}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, longitude: e.target.value }))
                    }
                    placeholder="e.g. 38.7636"
                    required
                    min="-180"
                    max="180"
                    disabled={submitting}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-mengede-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mengede-primary focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#E8F7F4]/50 border border-mengede-sage/20 text-[11px] text-mengede-dark/70 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-mengede-teal shrink-0">
                  info
                </span>
                <span>
                  Tip: Addis Ababa coordinates are typically within 8.8°–9.1° N, 38.6°–38.9° E.
                </span>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={submitting}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-[13px] font-semibold hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-mengede-primary hover:bg-[#236e4f] text-white text-[13px] font-semibold shadow-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingTerminal ? 'Save Changes' : 'Create Terminal'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {terminalToDelete && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => !deleting && setTerminalToDelete(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 flex flex-col gap-5 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[26px]">warning</span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-mengede-dark">
                Delete Terminal?
              </h3>
              <p className="text-[13px] text-gray-600 mt-1.5 leading-relaxed">
                Are you sure you want to delete{' '}
                <strong className="text-mengede-dark">"{terminalToDelete.name}"</strong>?
                This action is permanent and will automatically remove all associated routes
                connected to this terminal.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setTerminalToDelete(null)}
                disabled={deleting}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-[13px] font-semibold hover:bg-gray-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[13px] font-semibold shadow-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Terminal</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
