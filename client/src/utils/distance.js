/**
 * Calculates the great-circle distance between two geographic coordinates in kilometers
 * using the standard Haversine formula.
 *
 * @param {number} lat1 - Latitude of first coordinate
 * @param {number} lon1 - Longitude of first coordinate
 * @param {number} lat2 - Latitude of second coordinate
 * @param {number} lon2 - Longitude of second coordinate
 * @returns {number|null} Distance in kilometers, or null if coordinates are invalid
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (
    lat1 === undefined || lat1 === null ||
    lon1 === undefined || lon1 === null ||
    lat2 === undefined || lat2 === null ||
    lon2 === undefined || lon2 === null
  ) {
    return null;
  }

  const numLat1 = Number(lat1);
  const numLon1 = Number(lon1);
  const numLat2 = Number(lat2);
  const numLon2 = Number(lon2);

  if (isNaN(numLat1) || isNaN(numLon1) || isNaN(numLat2) || isNaN(numLon2)) {
    return null;
  }

  const R = 6371; // Earth's mean radius in kilometers
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(numLat2 - numLat1);
  const dLon = toRad(numLon2 - numLon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(numLat1)) *
      Math.cos(toRad(numLat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Formats a distance in kilometers into a friendly badge string (e.g., "1.4 km away").
 *
 * @param {number|null} km - Distance in kilometers
 * @returns {string} Formatted distance string
 */
export function formatDistance(km) {
  if (km === null || km === undefined || isNaN(km)) return '';
  return `${km.toFixed(1)} km away`;
}

/**
 * Formats distance in a compact format for labels (e.g., "1.4 km").
 *
 * @param {number|null} km - Distance in kilometers
 * @returns {string} Formatted short distance string
 */
export function formatDistanceShort(km) {
  if (km === null || km === undefined || isNaN(km)) return '';
  return `${km.toFixed(1)} km`;
}
