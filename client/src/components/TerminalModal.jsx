import { calculateDistanceKm, formatDistance } from '../utils/distance';

export default function TerminalModal({
  terminal,
  userLocation,
  onClose,
  onSubmitMissingRoute,
}) {
  if (!terminal) return null;

  const distanceKm = userLocation && terminal
    ? calculateDistanceKm(
        userLocation.latitude,
        userLocation.longitude,
        terminal.latitude,
        terminal.longitude
      )
    : null;
  const distanceBadge = distanceKm !== null ? formatDistance(distanceKm) : null;

  // Filter approved routes (or all routes associated with this terminal if already filtered by the API)
  const approvedRoutes = terminal.routes?.filter(
    (route) => !route.status || route.status === 'APPROVED'
  ) || [];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex flex-col justify-end pointer-events-auto transition-opacity duration-300 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md mx-auto bg-white rounded-t-3xl shadow-2xl p-6 flex flex-col max-h-[85vh] animate-slide-up pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle Indicator */}
        <div className="w-12 h-1 bg-mengede-dark/15 rounded-full mx-auto mb-3" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-mengede-sage/40">
          <div className="flex items-center gap-2.5 truncate pr-2">
            <div className="w-8 h-8 rounded-full bg-mengede-primary/10 text-mengede-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[18px]">local_taxi</span>
            </div>
            <div className="flex flex-col min-w-0 truncate">
              <div className="flex items-center gap-2 truncate">
                <h2 className="text-[20px] font-bold text-mengede-dark truncate">
                  {terminal.name}
                </h2>
                {distanceBadge && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-mengede-surface-container text-mengede-primary border border-mengede-primary/20 shrink-0">
                    <span className="material-symbols-outlined text-[12px]">near_me</span>
                    {distanceBadge}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close modal"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-mengede-dark hover:bg-mengede-sage/20 active:scale-95 transition-all shrink-0 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Routes & Fares List */}
        <div className="flex flex-col py-2 overflow-y-auto max-h-[45vh] divide-y divide-mengede-sage/40">
          {approvedRoutes.length > 0 ? (
            approvedRoutes.map((route, index) => (
              <div
                key={route.id || index}
                className="flex items-center justify-between py-3.5 transition-colors hover:bg-mengede-surface/50 px-1 rounded-lg"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="material-symbols-outlined text-[18px] text-mengede-sage">
                    arrow_forward
                  </span>
                  <span className="text-[16px] font-medium text-mengede-dark truncate">
                    {route.destinationName}
                  </span>
                </div>
                <span className="text-[16px] font-bold text-mengede-primary shrink-0 ml-3">
                  {route.fare} Birr
                </span>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-mengede-dark/60">
              <span className="material-symbols-outlined text-mengede-sage text-[32px] mb-1">
                route
              </span>
              <p className="text-[14px]">No approved routes currently available.</p>
              <p className="text-[12px] text-mengede-dark/40 mt-0.5">
                Be the first to submit a route for this terminal!
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer with Action CTA */}
        <div className="pt-4 pb-2">
          <button
            type="button"
            onClick={() => {
              if (onSubmitMissingRoute) {
                onSubmitMissingRoute(terminal);
              }
            }}
            className="w-full py-3.5 bg-mengede-teal hover:bg-mengede-teal/90 text-white font-semibold rounded-xl transition-all shadow-md active:scale-[0.99] text-center flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            <span>Submit Missing Route</span>
          </button>
        </div>
      </div>
    </div>
  );
}
