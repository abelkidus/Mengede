/**
 * Fetches the driving route geometry between two coordinates from the Mapbox Directions API.
 *
 * @param {number} originLng - Longitude of the origin
 * @param {number} originLat - Latitude of the origin
 * @param {number} destLng - Longitude of the destination
 * @param {number} destLat - Latitude of the destination
 * @returns {Promise<Object|null>} The GeoJSON LineString geometry of the route, or null on error
 */
export async function fetchDrivingRoute(originLng, originLat, destLng, destLat) {
  try {
    const safeOrigLng = Number(originLng);
    const safeOrigLat = Number(originLat);
    const safeDestLng = Number(destLng);
    const safeDestLat = Number(destLat);

    if (isNaN(safeOrigLng) || isNaN(safeOrigLat) || isNaN(safeDestLng) || isNaN(safeDestLat)) {
      console.error("Mapbox Route Error: Invalid coordinates provided.", { originLng, originLat, destLng, destLat });
      return null; // Fail gracefully so the fallback line can render
    }

    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${safeOrigLng},${safeOrigLat};${safeDestLng},${safeDestLat}?geometries=geojson&access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`;

    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data?.routes?.[0]?.geometry || null;
  } catch (error) {
    console.error('Error fetching driving route:', error);
    return null;
  }
}

export default fetchDrivingRoute;

