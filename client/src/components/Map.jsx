import { useState, useEffect, useRef } from 'react';
import Map, { Marker, NavigationControl, GeolocateControl, Popup } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// Addis Ababa coordinates
const INITIAL_VIEW_STATE = {
  latitude: 9.0320,
  longitude: 38.7480,
  zoom: 12.8,
  pitch: 0,
  bearing: 0,
};

export default function TerminalMap({ onSelectTerminal, selectedTerminal }) {
  const [terminals, setTerminals] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredTerminal, setHoveredTerminal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);

  // Fetch terminals on component mount
  useEffect(() => {
    async function fetchTerminals() {
      try {
        setLoading(true);
        const res = await fetch('/api/terminals');
        if (!res.ok) {
          throw new Error(`Failed to fetch terminals: ${res.statusText}`);
        }
        const data = await res.json();
        setTerminals(data);
      } catch (err) {
        console.error('Error fetching terminals:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchTerminals();
  }, []);

  // Filter terminals based on search input
  const filteredTerminals = terminals.filter((terminal) =>
    terminal.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTerminalClick = (terminal) => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [terminal.longitude, terminal.latitude],
        zoom: 14.5,
        duration: 1000,
      });
    }
    if (onSelectTerminal) {
      onSelectTerminal(terminal);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-mengede-surface select-none">
      {/* Top Floating Search Bar Overlay */}
      <header className="absolute top-0 left-0 right-0 z-20 pt-4 px-4 pointer-events-none">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          {/* Search Input Container */}
          <div className="pointer-events-auto flex-1 flex items-center h-12 px-4 bg-white/95 backdrop-blur-xl rounded-full shadow-[0_4px_20px_-2px_rgba(9,35,40,0.15)] border border-white/60 transition-all focus-within:ring-2 focus-within:ring-mengede-primary/40 focus-within:shadow-[0_6px_24px_-2px_rgba(42,131,95,0.25)]">
            <span className="material-symbols-outlined text-mengede-primary text-[22px] mr-2.5 shrink-0 select-none">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search terminals (e.g. Megenagna, Mexico)..."
              className="w-full font-['Plus_Jakarta_Sans'] text-[14px] bg-transparent outline-none text-mengede-dark placeholder-mengede-dark/50"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 text-mengede-dark/40 hover:text-mengede-dark transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>

          {/* Profile / Action Button */}
          <div className="pointer-events-auto shrink-0">
            <button
              type="button"
              className="w-12 h-12 rounded-full bg-mengede-primary flex items-center justify-center shadow-[0_4px_16px_rgba(42,131,95,0.35)] text-white hover:opacity-90 active:scale-95 transition-all border-2 border-white/80"
              aria-label="User Profile"
            >
              <span className="material-symbols-outlined text-[20px]">person</span>
            </button>
          </div>
        </div>

        {/* Search Results Dropdown Preview */}
        {searchQuery.trim() && (
          <div className="max-w-md mx-auto mt-2 pointer-events-auto">
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 max-h-60 overflow-y-auto p-2">
              {filteredTerminals.length > 0 ? (
                filteredTerminals.map((terminal) => (
                  <button
                    key={terminal.id}
                    onClick={() => {
                      handleTerminalClick(terminal);
                      setSearchQuery('');
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-mengede-surface-container flex items-center gap-3 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-full bg-mengede-primary/10 text-mengede-primary flex items-center justify-center shrink-0 group-hover:bg-mengede-primary group-hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-[18px]">local_taxi</span>
                    </div>
                    <div className="flex-1 truncate">
                      <div className="text-[14px] font-semibold text-mengede-dark truncate">
                        {terminal.name}
                      </div>
                      <div className="text-[12px] text-mengede-dark/60">
                        {terminal.routes?.length || 0} active routes
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-center text-[13px] text-mengede-dark/60">
                  No terminals found matching "{searchQuery}"
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Interactive Mapbox Canvas */}
      <Map
        ref={mapRef}
        initialViewState={INITIAL_VIEW_STATE}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/light-v11"
        style={{ width: '100%', height: '100%' }}
        reuseMaps
      >
        {/* Navigation / Map Controls on Right */}
        <NavigationControl position="bottom-right" showCompass={true} />
        <GeolocateControl position="bottom-right" trackUserLocation={true} />

        {/* Render Custom HTML Markers for Terminals */}
        {filteredTerminals.map((terminal) => {
          const isSelected = selectedTerminal?.id === terminal.id;
          const isHovered = hoveredTerminal?.id === terminal.id;

          return (
            <Marker
              key={terminal.id}
              latitude={terminal.latitude}
              longitude={terminal.longitude}
              anchor="center"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                handleTerminalClick(terminal);
              }}
            >
              <div
                className="relative group cursor-pointer transition-transform duration-300 hover:scale-115 active:scale-95 z-10"
                onMouseEnter={() => setHoveredTerminal(terminal)}
                onMouseLeave={() => setHoveredTerminal(null)}
              >
                <div className="relative flex items-center justify-center">
                  {/* Subtle Ambient Pulse Halo */}
                  <span className="absolute w-12 h-12 rounded-full bg-mengede-primary opacity-25 animate-ping pointer-events-none" />
                  <span className="absolute w-10 h-10 rounded-full bg-mengede-primary/20 pointer-events-none" />

                  {/* Terminal Badge */}
                  <div
                    className={`relative flex items-center justify-center rounded-full text-white shadow-[0_6px_20px_-2px_rgba(42,131,95,0.45)] border-2 border-white transition-all ${
                      isSelected
                        ? 'w-12 h-12 bg-mengede-dark scale-110 ring-4 ring-mengede-primary/40'
                        : 'w-10 h-10 bg-mengede-primary hover:bg-mengede-teal'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      local_taxi
                    </span>
                  </div>

                  {/* Floating Terminal Name Label Badge */}
                  <div
                    className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-mengede-dark/95 backdrop-blur-md text-white text-[12px] font-semibold rounded-lg shadow-lg whitespace-nowrap pointer-events-none transition-all duration-200 border border-white/20 ${
                      isHovered || isSelected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
                    }`}
                  >
                    <span>{terminal.name}</span>
                    {terminal.routes && (
                      <span className="ml-1.5 text-[10px] font-normal text-mengede-sage">
                        ({terminal.routes.length} routes)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Marker>
          );
        })}

        {/* Popup for Selected Terminal */}
        {selectedTerminal && (
          <Popup
            latitude={selectedTerminal.latitude}
            longitude={selectedTerminal.longitude}
            offset={[0, -25]}
            closeButton={false}
            closeOnClick={false}
            className="mengede-popup"
          >
            <div className="p-1 font-['Plus_Jakarta_Sans']">
              <div className="font-bold text-[14px] text-mengede-dark">{selectedTerminal.name}</div>
              <div className="text-[12px] text-mengede-primary font-medium mt-0.5">
                {selectedTerminal.routes?.length || 0} Available Routes
              </div>
            </div>
          </Popup>
        )}
      </Map>

      {/* Loading state indicator */}
      {loading && (
        <div className="absolute bottom-6 left-6 z-20 flex items-center gap-2 bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-full shadow-lg border border-white/50 text-[13px] text-mengede-dark font-medium">
          <div className="w-4 h-4 border-2 border-mengede-primary border-t-transparent rounded-full animate-spin" />
          <span>Loading terminals...</span>
        </div>
      )}

      {/* Error notification banner */}
      {error && (
        <div className="absolute bottom-6 left-6 z-20 flex items-center gap-2 bg-red-50 text-red-700 px-3.5 py-2 rounded-xl shadow-lg border border-red-200 text-[13px]">
          <span className="material-symbols-outlined text-[18px]">error</span>
          <span>Failed to load live terminals: {error}</span>
        </div>
      )}
    </div>
  );
}
