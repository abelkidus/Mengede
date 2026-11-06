/**
 * Searches for locations in Addis Ababa using the Mapbox Geocoding API.
 *
 * @param {string} query - Location search term
 * @returns {Promise<Array>} Array of matching Mapbox features, or empty array if failed
 */
export async function searchAddisLocation(query) {
  if (!query || typeof query !== 'string' || !query.trim()) {
    return [];
  }

  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?proximity=38.7468,9.0227&country=et&bbox=38.3,8.6,39.2,9.3&access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Geocoding request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.features || [];
  } catch (error) {
    console.error('Error searching Addis Ababa location:', error);
    return [];
  }
}

/**
 * Fetches driving route data between two coordinate pairs using Mapbox Directions API.
 *
 * @param {Array|Object} startCoords - [lng, lat] or { longitude, latitude }
 * @param {Array|Object} endCoords - [lng, lat] or { longitude, latitude }
 * @returns {Promise<Object|null>} Primary route object or null if failed
 */
export async function getRoute(startCoords, endCoords) {
  if (!startCoords || !endCoords) {
    return null;
  }

  const startLng = Array.isArray(startCoords) ? startCoords[0] : (startCoords.longitude ?? startCoords.lng);
  const startLat = Array.isArray(startCoords) ? startCoords[1] : (startCoords.latitude ?? startCoords.lat);
  const endLng = Array.isArray(endCoords) ? endCoords[0] : (endCoords.longitude ?? endCoords.lng);
  const endLat = Array.isArray(endCoords) ? endCoords[1] : (endCoords.latitude ?? endCoords.lat);

  if (startLng == null || startLat == null || endLng == null || endLat == null) {
    return null;
  }

  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${startLng},${startLat};${endLng},${endLat}?geometries=geojson&overview=full&access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      if (response.status === 422) {
        console.warn(`Mapbox Routing Error (422): ${data.message || 'Unprocessable Entity'}`);
      } else {
        console.error(`Mapbox API Error: ${response.status}`);
      }
      return null; // Return null gracefully instead of crashing
    }

    return data.routes[0];
  } catch (error) {
    console.error("Failed to fetch route:", error);
    return null;
  }
}

export default searchAddisLocation;

