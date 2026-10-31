import { useState, useEffect, useRef, useMemo } from 'react';
import Map, { Marker, NavigationControl, GeolocateControl, Popup } from 'react-map-gl/mapbox';
import { Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { calculateDistanceKm, formatDistance, formatDistanceShort } from '../utils/distance';
import { fetchTerminals } from '../services/api';
import { generateRouteGeoJSON } from '../utils/routeUtils';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// Addis Ababa coordinates
const INITIAL_VIEW_STATE = {
  latitude: 9.0320,
  longitude: 38.7480,
  zoom: 12.8,
  pitch: 0,
  bearing: 0,
};

export default function TerminalMap({
  onSelectTerminal,
  selectedTerminal,
  onOpenAdmin,
  userLocation: propUserLocation,
  onUserLocationChange,
  activeRouteSelection: propActiveRouteSelection,
  onSelectActiveRoute,
}) {
  const [terminals, setTerminals] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [hoveredTerminal, setHoveredTerminal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [internalUserLocation, setInternalUserLocation] = useState(null);
  const userLocation = propUserLocation !== undefined ? propUserLocation : internalUserLocation;
  const setUserLocation = (loc) => {
    setInternalUserLocation(loc);
    onUserLocationChange?.(loc);
  };

  // Shared active route selection state
  const [internalActiveRoute, setInternalActiveRoute] = useState(null);
  const activeRouteSelection =
    propActiveRouteSelection !== undefined
      ? propActiveRouteSelection
      : internalActiveRoute;
  const setActiveRouteSelection = (val) => {
    setInternalActiveRoute(val);
    onSelectActiveRoute?.(val);
  };

  // Route geometry & driving directions state
  const [routeGeoJSON, setRouteGeoJSON] = useState(null);
  const [activeRouteGeoJSON, setActiveRouteGeoJSON] = useState(null);
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState(null);
  const [routeDetails, setRouteDetails] = useState(null);

  const handleClearRoute = () => {
    setActiveRouteSelection(null);
    setRouteGeoJSON(null);
    setActiveRouteGeoJSON(null);
    setRouteDetails(null);
    setRouteError(null);
  };

  const handleClosePopup = () => {
    if (onSelectTerminal) {
      onSelectTerminal(null);
    }
    setActiveRouteGeoJSON(null);
  };
  const handleClearSelection = handleClosePopup;
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const mapRef = useRef(null);
  const searchInputRef = useRef(null);

  // Fetch terminals on component mount
  useEffect(() => {
    async function loadTerminals() {
      try {
        setLoading(true);
        const data = await fetchTerminals();
        setTerminals(data);
      } catch (err) {
        console.error('Error fetching terminals:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadTerminals();
  }, []);

  // Fetch Geocoded Destination and Mapbox Driving Directions
  useEffect(() => {
    if (!activeRouteSelection) {
      setRouteGeoJSON(null);
      setRouteError(null);
      setIsRouteLoading(false);
      setRouteDetails(null);
      return;
    }

    const {
      originLatitude,
      originLongitude,
      destinationName,
    } = activeRouteSelection;

    if (!originLatitude || !originLongitude || !destinationName) {
      setRouteGeoJSON(null);
      return;
    }

    let isMounted = true;
    const abortController = new AbortController();

    async function fetchDrivingRoute() {
      setIsRouteLoading(true);
      setRouteError(null);

      try {
        // 1. Mapbox Geocoding API: fetch destination coordinates with "Addis Ababa" appended
        const query = encodeURIComponent(`${destinationName.trim()}, Addis Ababa`);
        const geocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${MAPBOX_TOKEN}&proximity=${originLongitude},${originLatitude}&limit=1`;

        const geoRes = await fetch(geocodingUrl, { signal: abortController.signal });
        if (!geoRes.ok) {
          throw new Error(`Geocoding failed with status ${geoRes.status}`);
        }

        const geoData = await geoRes.json();
        if (!geoData.features || geoData.features.length === 0) {
          throw new Error(`Could not find coordinates for "${destinationName}" in Addis Ababa`);
        }

        const [destLng, destLat] = geoData.features[0].center;

        if (!isMounted) return;

        // 2. Mapbox Directions API (driving profile) between origin and destination
        const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${originLongitude},${originLatitude};${destLng},${destLat}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;

        const dirRes = await fetch(directionsUrl, { signal: abortController.signal });
        if (!dirRes.ok) {
          throw new Error(`Directions failed with status ${dirRes.status}`);
        }

        const dirData = await dirRes.json();
        if (!dirData.routes || dirData.routes.length === 0) {
          throw new Error(`No driving route found to "${destinationName}"`);
        }

        const primaryRoute = dirData.routes[0];

        if (!isMounted) return;

        const geoJsonFeature = {
          type: 'Feature',
          properties: {
            distance: primaryRoute.distance,
            duration: primaryRoute.duration,
            destinationName,
          },
          geometry: primaryRoute.geometry,
        };

        setRouteGeoJSON(geoJsonFeature);
        setRouteDetails({
          distanceMeters: primaryRoute.distance,
          durationSeconds: primaryRoute.duration,
          destinationCoords: [destLng, destLat],
        });

        // Fit map viewport to show the complete driving route path
        if (mapRef.current && primaryRoute.geometry?.coordinates?.length > 1) {
          const coords = primaryRoute.geometry.coordinates;
          let minLng = coords[0][0];
          let maxLng = coords[0][0];
          let minLat = coords[0][1];
          let maxLat = coords[0][1];

          for (const [lng, lat] of coords) {
            if (lng < minLng) minLng = lng;
            if (lng > maxLng) maxLng = lng;
            if (lat < minLat) minLat = lat;
            if (lat > maxLat) maxLat = lat;
          }

          mapRef.current.fitBounds(
            [
              [minLng, minLat],
              [maxLng, maxLat],
            ],
            {
              padding: { top: 130, bottom: 90, left: 70, right: 70 },
              duration: 1000,
            }
          );
        } else if (mapRef.current) {
          mapRef.current.flyTo({
            center: [originLongitude, originLatitude],
            zoom: 14.5,
            duration: 800,
          });
        }
      } catch (err) {
        if (err.name === 'AbortError' || !isMounted) return;
        console.error('Route calculation error:', err);
        setRouteError(err.message || 'Unable to calculate driving route');
        setRouteGeoJSON(null);
      } finally {
        if (isMounted) {
          setIsRouteLoading(false);
        }
      }
    }

    fetchDrivingRoute();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [activeRouteSelection]);

  // Filter terminals dynamically based on searchQuery (case-insensitive: matches terminal name OR approved route destinationName)
  // and sort prioritizing direct terminal name matches over route matches
  const filteredTerminals = terminals
    .filter((terminal) => {
      const query = searchQuery.trim().toLowerCase();
      if (!query) return true;

      const matchesName = terminal.name?.toLowerCase().includes(query);
      const matchesApprovedRoute = terminal.routes?.some(
        (route) =>
          (!route.status || route.status === 'APPROVED') &&
          route.destinationName?.toLowerCase().includes(query)
      );

      return Boolean(matchesName || matchesApprovedRoute);
    })
    .sort((a, b) => {
      const query = searchQuery.trim().toLowerCase();
      if (!query) return (a.name || '').localeCompare(b.name || '');

      const aMatchesName = a.name?.toLowerCase().includes(query);
      const bMatchesName = b.name?.toLowerCase().includes(query);

      if (aMatchesName && !bMatchesName) return -1;
      if (!aMatchesName && bMatchesName) return 1;
      return (a.name || '').localeCompare(b.name || '');
    });
  const results = filteredTerminals;

  // Nearest terminal calculation and visibility state
  const [showNearestTerminal, setShowNearestTerminal] = useState(true);

  // Calculate nearest terminal when userLocation is active
  const nearestTerminalInfo = useMemo(() => {
    if (!showNearestTerminal || !userLocation || terminals.length === 0) return null;

    let nearest = null;
    let minDistance = Infinity;

    for (const t of terminals) {
      const dist = calculateDistanceKm(
        userLocation.latitude,
        userLocation.longitude,
        t.latitude,
        t.longitude
      );
      if (dist !== null && dist < minDistance) {
        minDistance = dist;
        nearest = t;
      }
    }

    if (!nearest) return null;
    return {
      terminal: nearest,
      distanceKm: minDistance,
      formattedDistance: formatDistanceShort(minDistance),
    };
  }, [showNearestTerminal, userLocation, terminals]);

  const handleTerminalClick = (terminal) => {
    if (!terminal) return;
    const clickedTerminal = terminal;
    const allTerminals = terminals;
    setActiveRouteGeoJSON(generateRouteGeoJSON(clickedTerminal, allTerminals));

    mapRef.current?.flyTo({
      center: [terminal.longitude, terminal.latitude],
      zoom: 15,
      duration: 1200,
    });
    if (onSelectTerminal) {
      onSelectTerminal(terminal);
    }
    setSearchQuery('');
    searchInputRef.current?.blur();
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newLocation = { latitude, longitude };
        setUserLocation(newLocation);
        setShowNearestTerminal(true);
        setIsLocating(false);

        mapRef.current?.flyTo({
          center: [newLocation.longitude, newLocation.latitude],
          zoom: 14,
          duration: 1200,
        });
      },
      (err) => {
        setIsLocating(false);
        let message = 'Unable to retrieve your location.';
        if (err.code === 1) {
          message = 'Location permission denied. Please allow location access in your browser settings.';
        } else if (err.code === 3) {
          message = 'Location request timed out. Please check your connection and try again.';
        } else if (err.code === 2) {
          message = 'Location unavailable. Your position could not be determined.';
        }
        setLocationError(message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-mengede-surface select-none">
      {/* Top Floating Search Bar Overlay */}
      <header className="absolute top-0 left-0 right-0 z-20 pt-4 px-4 pointer-events-none">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          {/* Search Input Container */}
          <div className="pointer-events-auto flex-1 flex items-center h-12 px-4 bg-white/95 backdrop-blur-xl rounded-full shadow-[0_4px_20px_-2px_rgba(9,35,40,0.15)] border border-white/60 transition-all focus-within:ring-2 focus-within:ring-mengede-primary/40 focus-within:shadow-[0_6px_24px_-2px_rgba(42,131,95,0.25)]">
            <span className="material-symbols-outlined text-mengede-primary text-[22px] mr-2.5 shrink-0 select-none">
              search
            </span>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setActiveIndex(-1);
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setActiveIndex((prev) => Math.min(prev + 1, results.length - 1));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setActiveIndex((prev) => Math.max(prev - 1, 0));
                } else if (e.key === 'Enter') {
                  e.preventDefault();
                  if (activeIndex >= 0 && results[activeIndex]) {
                    handleTerminalClick(results[activeIndex]);
                  }
                } else if (e.key === 'Escape') {
                  setSearchQuery('');
                  setActiveIndex(-1);
                }
              }}
              placeholder="Search terminals (e.g. Megenagna, Mexico)..."
              className="w-full font-['Plus_Jakarta_Sans'] text-[14px] bg-transparent outline-none text-mengede-dark placeholder-mengede-dark/50"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveIndex(-1);
                  searchInputRef.current?.focus();
                }}
                aria-label="Clear search"
                title="Clear search"
                className="p-1 rounded-full text-mengede-dark/40 hover:text-mengede-dark hover:bg-black/5 active:scale-95 transition-all cursor-pointer flex items-center justify-center shrink-0 ml-1"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>

          {/* Profile / Admin Moderation Button */}
          <div className="pointer-events-auto shrink-0">
            <button
              type="button"
              onClick={onOpenAdmin}
              className="w-12 h-12 rounded-full bg-mengede-primary flex items-center justify-center shadow-[0_4px_16px_rgba(42,131,95,0.35)] text-white hover:opacity-90 active:scale-95 transition-all border-2 border-white/80 cursor-pointer"
              aria-label="Open Admin Moderation Hub"
              title="Admin Moderation Hub"
            >
              <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
            </button>
          </div>
        </div>

        {/* Floating Nearest Terminal Quick-Action Pill */}
        {nearestTerminalInfo && showNearestTerminal && !searchQuery.trim() && (
          <div className="max-w-md mx-auto mt-2.5 flex justify-start pointer-events-auto animate-fade-in">
            <div className="inline-flex items-center gap-2 pl-3.5 pr-1.5 py-1.5 rounded-full bg-white/95 backdrop-blur-xl border border-white/80 shadow-[0_4px_16px_rgba(9,35,40,0.12)] text-[12px] font-semibold text-mengede-dark hover:bg-white hover:shadow-[0_6px_20px_rgba(42,131,95,0.2)] transition-all">
              <button
                type="button"
                onClick={() => handleTerminalClick(nearestTerminalInfo.terminal)}
                className="inline-flex items-center gap-2 text-left cursor-pointer group"
              >
                <span className="w-5 h-5 rounded-full bg-mengede-primary/10 text-mengede-primary flex items-center justify-center shrink-0 group-hover:bg-mengede-primary group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-[13px]">near_me</span>
                </span>
                <span className="group-hover:text-mengede-primary transition-colors">
                  Nearest: <span className="font-bold text-mengede-teal">{nearestTerminalInfo.terminal.name}</span> ({nearestTerminalInfo.formattedDistance})
                </span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowNearestTerminal(false);
                }}
                aria-label="Dismiss nearest terminal banner"
                title="Dismiss"
                className="cursor-pointer p-1 text-gray-500 hover:text-gray-800 hover:bg-black/5 rounded-full transition-colors flex items-center justify-center shrink-0"
              >
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Floating Autocomplete Dropdown Menu */}
        {searchQuery.trim() && (
          <div className="max-w-md mx-auto mt-2 pointer-events-auto animate-fade-in">
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_12px_32px_-4px_rgba(9,35,40,0.18)] border border-white/60 max-h-72 overflow-y-auto p-2">
              {filteredTerminals.length > 0 ? (
                <div className="space-y-1">
                  {filteredTerminals.map((terminal, index) => {
                    const query = searchQuery.trim().toLowerCase();
                    const approvedRoutes = terminal.routes?.filter(
                      (r) => !r.status || r.status === 'APPROVED'
                    ) || [];
                    const matchingDestinations = [
                      ...new Set(
                        approvedRoutes
                          .filter((r) => r.destinationName?.toLowerCase().includes(query))
                          .map((r) => r.destinationName)
                      ),
                    ];
                    const distanceKm = userLocation
                      ? calculateDistanceKm(
                          userLocation.latitude,
                          userLocation.longitude,
                          terminal.latitude,
                          terminal.longitude
                        )
                      : null;
                    const distanceBadge = distanceKm !== null ? formatDistance(distanceKm) : null;

                    return (
                      <button
                        key={terminal.id}
                        type="button"
                        onClick={() => {
                          handleTerminalClick(terminal);
                          setSearchQuery('');
                        }}
                        className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-all duration-150 flex items-center gap-3 group cursor-pointer hover:bg-mengede-surface-container/70 active:bg-mengede-surface-high ${
                          index === activeIndex ? 'bg-gray-100' : ''
                        }`}
                      >
                        <div className="w-9 h-9 rounded-full bg-mengede-surface-container text-mengede-primary flex items-center justify-center shrink-0 group-hover:bg-mengede-primary group-hover:text-white transition-all duration-150 shadow-xs">
                          <span className="material-symbols-outlined text-[18px]">
                            local_taxi
                          </span>
                        </div>
                        <div className="flex-1 min-w-0 truncate">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[14px] font-semibold text-mengede-dark group-hover:text-mengede-teal transition-colors truncate">
                              {terminal.name}
                            </span>
                            {distanceBadge && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-mengede-surface-container text-mengede-primary shrink-0 border border-mengede-primary/15">
                                <span className="material-symbols-outlined text-[12px]">near_me</span>
                                {distanceBadge}
                              </span>
                            )}
                          </div>
                          {matchingDestinations.length > 0 ? (
                            <div className="text-[12px] text-mengede-teal flex items-center gap-1.5 truncate font-medium">
                              <span className="material-symbols-outlined text-[14px] text-mengede-primary shrink-0">
                                arrow_forward
                              </span>
                              <span className="truncate">
                                {matchingDestinations.length === 1
                                  ? `Route to ${matchingDestinations[0]}`
                                  : `Routes to ${matchingDestinations.join(', ')}`}
                              </span>
                            </div>
                          ) : (
                            <div className="text-[12px] text-mengede-dark/60 truncate">
                              {approvedRoutes.length > 0
                                ? `${approvedRoutes.length} active ${
                                    approvedRoutes.length === 1 ? 'route' : 'routes'
                                  }`
                                : 'No active routes'}
                            </div>
                          )}
                        </div>
                        <span className="material-symbols-outlined text-[18px] text-mengede-dark/25 group-hover:text-mengede-primary group-hover:translate-x-0.5 transition-all shrink-0">
                          navigate_next
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="py-7 px-4 text-center">
                  <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-mengede-surface-container flex items-center justify-center text-mengede-primary/70">
                    <span className="material-symbols-outlined text-[20px]">search_off</span>
                  </div>
                  <p className="text-[13px] font-semibold text-mengede-dark">
                    No matching terminals or routes found
                  </p>
                  <p className="text-[12px] text-mengede-dark/50 mt-0.5">
                    Try searching for another terminal or destination
                  </p>
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
        maxBounds={[
          [38.60, 8.80],
          [38.95, 9.15],
        ]}
        minZoom={10}
        reuseMaps
        onClick={handleClosePopup}
      >
        {/* Navigation / Map Controls on Right */}
        <NavigationControl position="bottom-right" showCompass={true} />
        <GeolocateControl position="bottom-right" trackUserLocation={true} />

        {/* Driving Route Geometry from Directions API */}
        {routeGeoJSON && (
          <Source id="active-route-line" type="geojson" data={routeGeoJSON}>
            <Layer
              id="route-line"
              type="line"
              layout={{
                'line-cap': 'round',
                'line-join': 'round',
              }}
              paint={{
                'line-color': '#2A835F',
                'line-width': 4,
              }}
            />
          </Source>
        )}

        {/* Destination Marker from Geocoding */}
        {routeDetails?.destinationCoords && (
          <Marker
            latitude={routeDetails.destinationCoords[1]}
            longitude={routeDetails.destinationCoords[0]}
            anchor="bottom"
          >
            <div className="flex flex-col items-center animate-bounce">
              <div className="px-2 py-0.5 mb-1 bg-mengede-dark text-white text-[11px] font-bold rounded-lg shadow-md whitespace-nowrap border border-white/20">
                {activeRouteSelection.destinationName}
              </div>
              <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg border-2 border-white ring-2 ring-red-400/40">
                <span className="material-symbols-outlined text-[18px]">flag</span>
              </div>
              <div className="w-2 h-2 bg-red-600 rotate-45 -mt-1 shadow-xs" />
            </div>
          </Marker>
        )}

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
        {selectedTerminal && filteredTerminals.some((t) => t.id === selectedTerminal.id) && (
          <Popup
            latitude={selectedTerminal.latitude}
            longitude={selectedTerminal.longitude}
            offset={[0, -25]}
            closeButton={false}
            closeOnClick={false}
            onClose={handleClosePopup}
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
        {/* User Current Location Distinct Marker */}
        {userLocation && (
          <Marker
            latitude={userLocation.latitude}
            longitude={userLocation.longitude}
            anchor="center"
          >
            <div className="relative flex items-center justify-center pointer-events-none">
              {/* Tailwind animate-ping pulsing ring */}
              <span className="absolute w-8 h-8 rounded-full bg-blue-500 opacity-60 animate-ping" />
              <span className="absolute w-6 h-6 rounded-full bg-blue-400/25" />

              {/* Solid center dot */}
              <div className="relative w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-[0_2px_8px_rgba(37,99,235,0.6)]" />
            </div>
          </Marker>
        )}
      </Map>

      {/* Floating Active Route Selection Overlay Card & Clear Route Button */}
      {(activeRouteSelection || routeGeoJSON) && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 max-w-lg w-[92%] sm:w-auto bg-white/95 backdrop-blur-xl border border-mengede-teal/30 rounded-2xl shadow-[0_12px_36px_rgba(9,35,40,0.2)] p-4 flex items-center justify-between gap-4 animate-slide-down">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-mengede-primary text-white flex items-center justify-center shrink-0 shadow-md">
              <span className="material-symbols-outlined text-[22px]">alt_route</span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-full bg-[#E8F7F4] text-mengede-teal text-[10px] font-bold uppercase tracking-wider border border-mengede-sage/30">
                  Driving Route
                </span>
                {activeRouteSelection?.fare && (
                  <span className="text-[12px] font-bold text-mengede-primary">
                    {activeRouteSelection.fare} Birr
                  </span>
                )}
                {routeDetails && !isRouteLoading && (
                  <span className="text-[11px] font-semibold text-gray-500">
                    • {(routeDetails.distanceMeters / 1000).toFixed(1)} km (~{Math.ceil(routeDetails.durationSeconds / 60)} min)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[14px] sm:text-[15px] font-bold text-mengede-dark mt-0.5 truncate">
                <span className="truncate">{activeRouteSelection?.originName || 'Origin'}</span>
                <span className="material-symbols-outlined text-[16px] text-mengede-primary shrink-0">
                  arrow_forward
                </span>
                <span className="text-mengede-teal truncate">
                  {activeRouteSelection?.destinationName || 'Destination'}
                </span>
              </div>
              {/* Route status indicators */}
              {isRouteLoading && (
                <div className="flex items-center gap-1.5 text-[11px] text-mengede-teal font-semibold mt-1">
                  <div className="w-3 h-3 border-2 border-mengede-teal border-t-transparent rounded-full animate-spin" />
                  <span>Calculating driving route geometry...</span>
                </div>
              )}
              {routeError && (
                <div className="flex items-center gap-1 text-[11px] text-rose-600 font-semibold mt-1">
                  <span className="material-symbols-outlined text-[14px]">error</span>
                  <span>{routeError}</span>
                </div>
              )}
            </div>
          </div>

          {/* Floating Clear Route button */}
          <button
            type="button"
            onClick={handleClearRoute}
            title="Clear Route"
            aria-label="Clear Route"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-rose-50 hover:text-rose-600 text-gray-600 active:scale-95 transition-all cursor-pointer font-semibold text-[13px] shrink-0 border border-gray-200/60 shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
            <span>Clear Route</span>
          </button>
        </div>
      )}

      {/* Floating "Locate Me" Button & Dismissible Error Toast */}
      <div className="absolute bottom-16 md:bottom-6 right-6 z-20 flex flex-col items-end gap-2.5 pointer-events-none">
        {/* Dismissible Geolocation Error Toast */}
        {locationError && (
          <div className="pointer-events-auto max-w-xs bg-white/95 backdrop-blur-xl text-mengede-dark px-4 py-3 rounded-2xl shadow-[0_8px_30px_rgba(9,35,40,0.18)] border border-red-200 flex items-start gap-3 animate-fade-in">
            <div className="w-7 h-7 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[16px]">location_off</span>
            </div>
            <div className="flex-1 text-[13px] leading-tight">
              <div className="font-bold text-red-700 mb-0.5">Location Error</div>
              <div className="text-mengede-dark/75">{locationError}</div>
            </div>
            <button
              type="button"
              onClick={() => setLocationError(null)}
              aria-label="Dismiss location error"
              className="text-mengede-dark/40 hover:text-mengede-dark p-1 rounded-full hover:bg-mengede-dark/5 transition-colors cursor-pointer shrink-0 -mr-1 -mt-1"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        )}

        {/* Locate Me Crosshair Button */}
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={isLocating}
          aria-label="Locate Me"
          title="Locate Me"
          className={`pointer-events-auto w-12 h-12 rounded-full bg-white/95 backdrop-blur-xl flex items-center justify-center shadow-[0_4px_20px_-2px_rgba(9,35,40,0.18)] border border-white/80 hover:bg-white active:scale-95 transition-all cursor-pointer disabled:cursor-wait group ${
            userLocation
              ? 'text-mengede-primary ring-2 ring-mengede-primary/40'
              : 'text-mengede-dark hover:text-mengede-primary'
          }`}
        >
          {isLocating ? (
            <div className="w-5 h-5 border-2 border-mengede-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <span className="material-symbols-outlined text-[24px] group-hover:scale-110 transition-transform">
              my_location
            </span>
          )}
        </button>
      </div>

      {/* Loading state indicator */}
      {loading && (
        <div className="absolute bottom-16 md:bottom-6 left-6 z-20 flex items-center gap-2 bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-full shadow-lg border border-white/50 text-[13px] text-mengede-dark font-medium">
          <div className="w-4 h-4 border-2 border-mengede-primary border-t-transparent rounded-full animate-spin" />
          <span>Loading terminals...</span>
        </div>
      )}

      {/* Error notification banner */}
      {error && (
        <div className="absolute bottom-16 md:bottom-6 left-6 z-20 flex items-center gap-2 bg-red-50 text-red-700 px-3.5 py-2 rounded-xl shadow-lg border border-red-200 text-[13px]">
          <span className="material-symbols-outlined text-[18px]">error</span>
          <span>Failed to load live terminals: {error}</span>
        </div>
      )}
    </div>
  );
}
