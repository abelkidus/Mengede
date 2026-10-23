import { useState } from 'react';
import { submitRoute } from '../services/api';

export default function SubmitRouteForm({
  terminal,
  onBack,
  onSuccess,
}) {
  const [destinationName, setDestinationName] = useState('');
  const [fare, setFare] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError(null);

    if (!destinationName.trim()) {
      setError('Please enter a destination name.');
      return;
    }

    const parsedFare = parseFloat(fare);
    if (isNaN(parsedFare) || parsedFare <= 0) {
      setError('Please enter a valid fare greater than 0.');
      return;
    }

    if (!terminal?.id) {
      setError('Missing origin terminal information.');
      return;
    }

    try {
      setSubmitting(true);
      const data = await submitRoute({
        originId: terminal.id,
        destinationName: destinationName.trim(),
        fare: parsedFare,
      });

      setSuccess(true);
      setTimeout(() => {
        if (onSuccess) {
          onSuccess(data);
        }
      }, 1500);
    } catch (err) {
      console.error('Submission error:', err);
      setError(err.message || 'An error occurred while submitting.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex flex-col justify-end sm:justify-center sm:items-center pointer-events-auto transition-opacity duration-300 animate-fade-in">
      {/* Toast Notification on Success */}
      {success && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-60 bg-mengede-teal text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/20 animate-fade-in">
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
          </div>
          <div>
            <div className="font-bold text-[14px]">Route Submitted!</div>
            <div className="text-[12px] text-mengede-sage">
              Pending review by administrator.
            </div>
          </div>
        </div>
      )}

      {/* Form Container */}
      <div
        className="w-full max-w-[390px] mx-auto min-h-[580px] max-h-[92vh] flex flex-col justify-between p-6 bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header & Form Content */}
        <div className="flex flex-col space-y-6">
          {/* Header */}
          <div className="flex items-center space-x-3 pt-1 border-b border-mengede-sage/20 pb-4">
            <button
              type="button"
              aria-label="Go back"
              onClick={onBack}
              disabled={submitting}
              className="p-1.5 -ml-1.5 text-mengede-dark hover:opacity-80 active:scale-95 transition cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
            <div className="truncate">
              <h1 className="text-xl font-bold tracking-tight text-mengede-dark truncate">
                Submit Route Data
              </h1>
              {terminal && (
                <p className="text-xs text-mengede-primary font-medium truncate">
                  Origin: {terminal.name}
                </p>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-[13px] flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form Elements */}
          <form className="flex flex-col space-y-5" onSubmit={handleSubmit}>
            {/* Form Field 1: Destination */}
            <div className="flex flex-col space-y-1.5">
              <label
                htmlFor="destination"
                className="text-sm font-semibold text-mengede-dark"
              >
                Destination
              </label>
              <input
                type="text"
                id="destination"
                name="destination"
                value={destinationName}
                onChange={(e) => setDestinationName(e.target.value)}
                placeholder="e.g. Bole Medhanialem"
                disabled={submitting}
                className="w-full px-4 py-3 rounded-2xl border border-mengede-sage bg-white text-mengede-dark placeholder-mengede-sage/80 focus:outline-none focus:ring-2 focus:ring-mengede-primary focus:border-transparent transition text-base"
              />
            </div>

            {/* Form Field 2: Fare */}
            <div className="flex flex-col space-y-1.5">
              <label htmlFor="fare" className="text-sm font-semibold text-mengede-dark">
                Fare (in Birr)
              </label>
              <input
                type="number"
                id="fare"
                name="fare"
                value={fare}
                onChange={(e) => setFare(e.target.value)}
                placeholder="e.g. 15"
                min="0"
                step="any"
                disabled={submitting}
                className="w-full px-4 py-3 rounded-2xl border border-mengede-sage bg-white text-mengede-dark placeholder-mengede-sage/80 focus:outline-none focus:ring-2 focus:ring-mengede-primary focus:border-transparent transition text-base"
              />
            </div>

            {/* Form Field 3: Notes */}
            <div className="flex flex-col space-y-1.5">
              <label htmlFor="notes" className="text-sm font-semibold text-mengede-dark">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                rows="4"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any landmark or terminal details..."
                disabled={submitting}
                className="w-full px-4 py-3 rounded-2xl border border-mengede-sage bg-white text-mengede-dark placeholder-mengede-sage/80 focus:outline-none focus:ring-2 focus:ring-mengede-primary focus:border-transparent transition text-base resize-none"
              />
            </div>
          </form>
        </div>

        {/* Footer Action */}
        <div className="pt-5 pb-1">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className={`w-full py-4 rounded-2xl bg-mengede-primary hover:bg-[#236e4f] text-white font-semibold text-base shadow-md transition active:scale-[0.99] text-center flex items-center justify-center gap-2 cursor-pointer ${
              submitting ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <span>Submit for Review</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
