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
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?proximity=38.7468,9.0227&access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`;

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

export default searchAddisLocation;

