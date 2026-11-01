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
    if (
      originLng === undefined || originLng === null ||
      originLat === undefined || originLat === null ||
      destLng === undefined || destLng === null ||
      destLat === undefined || destLat === null
    ) {
      return null;
    }

    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${originLng},${originLat};${destLng},${destLat}?geometries=geojson&access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`;

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

