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
      return null;
    }

    return data.routes[0];
  } catch (error) {
    console.error("Failed to fetch route:", error);
    return null;
  }
}

export default getRoute;

