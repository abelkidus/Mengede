import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { apiFetch } from '../services/api';

const CATEGORIES = [
  'Incorrect Fare',
  'Route No Longer Exists',
  'Terminal Relocated',
  'Missing Route',
  'Other',
];

export default function ReportIssueModal({
  isOpen,
  onClose,
  terminalId,
  routeId,
}) {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [proposedFare, setProposedFare] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const issueCategory = category;

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedDesc = description.trim();
    if (!trimmedDesc) {
      toast.error('Please provide a description of the issue.');
      return;
    }

    if (!terminalId) {
      toast.error('Missing terminal information.');
      return;
    }

    try {
      setIsSubmitting(true);

      const isIncorrectFare = issueCategory === 'Incorrect Fare';
      const payload = {
        category,
        description: trimmedDesc,
        terminalId: Number(terminalId),
        ...(routeId ? { routeId: Number(routeId) } : {}),
        ...(isIncorrectFare && proposedFare !== ''
          ? { proposedFare: parseFloat(proposedFare) }
          : {}),
      };

      await apiFetch('/api/reports', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      toast.success('Report submitted successfully! Thank you for helping improve Mengede.');
      setDescription('');
      setProposedFare('');
      setCategory(CATEGORIES[0]);
      onClose?.();
    } catch (err) {
      console.error('Error submitting report:', err);
      toast.error(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in pointer-events-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-mengede-sage/30 flex flex-col gap-4 animate-slide-up pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-mengede-sage/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[18px]">flag</span>
            </div>
            <div>
              <h3 id="report-modal-title" className="text-[17px] font-bold text-mengede-dark">
                Report an Issue
              </h3>
              <p className="text-[12px] text-mengede-dark/60">
                Help keep Addis Ababa transit data accurate
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full flex items-center justify-center text-mengede-dark/60 hover:text-mengede-dark hover:bg-black/5 active:scale-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Category Dropdown */}
          <div>
            <label
              htmlFor="report-category"
              className="block text-[13px] font-semibold text-mengede-dark mb-1.5"
            >
              Issue Category
            </label>
            <select
              id="report-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-mengede-dark focus:outline-none focus:ring-2 focus:ring-mengede-primary focus:border-transparent text-[14px] cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Conditional Proposed Fare for Incorrect Fare reports */}
          {issueCategory === 'Incorrect Fare' && (
            <div>
              <label
                htmlFor="report-proposed-fare"
                className="block text-[13px] font-semibold text-mengede-dark mb-1.5"
              >
                Proposed Fare (Birr)
              </label>
              <input
                id="report-proposed-fare"
                type="number"
                min="0"
                step="0.5"
                value={proposedFare}
                onChange={(e) => setProposedFare(e.target.value)}
                placeholder="Enter the correct fare (e.g., 15.00)..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-mengede-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mengede-primary focus:border-transparent text-[14px]"
              />
            </div>
          )}

          {/* Description Textarea */}
          <div>
            <label
              htmlFor="report-description"
              className="block text-[13px] font-semibold text-mengede-dark mb-1.5"
            >
              Description
            </label>
            <textarea
              id="report-description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what needs updating (e.g., correct fare amount, new terminal spot, or route change)..."
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-mengede-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mengede-primary focus:border-transparent text-[14px] resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-[13px] font-medium rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !description.trim()}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-[13px] font-semibold rounded-xl bg-mengede-teal hover:bg-mengede-teal/90 text-white transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">send</span>
                  <span>Submit Report</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

