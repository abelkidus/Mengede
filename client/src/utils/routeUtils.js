/**
 * Generates a GeoJSON FeatureCollection containing LineString features
 * connecting an origin terminal to its destination terminals.
 *
 * @param {Object} originTerminal - The origin terminal object with routes and coordinates
 * @param {Array<Object>} allTerminals - Array of all terminal objects to search for destinations
 * @returns {Object|null} GeoJSON FeatureCollection, or null if arguments are missing or routes are empty
 */
export function generateRouteGeoJSON(originTerminal, allTerminals) {
  if (
    !originTerminal ||
    !allTerminals ||
    !Array.isArray(allTerminals) ||
    !originTerminal.routes ||
    !Array.isArray(originTerminal.routes) ||
    originTerminal.routes.length === 0
  ) {
    return null;
  }

  const features = [];

  for (const route of originTerminal.routes) {
    if (!route) continue;

    const destName =
      typeof route === 'string'
        ? route
        : route.destination?.name || route.destination || route.destinationName;

    const destinationTerminal = allTerminals.find(
      (terminal) =>
        terminal &&
        terminal.name &&
        (terminal.name === destName ||
          terminal.name === route.destination ||
          terminal.name === route.destinationName)
    );

    if (destinationTerminal) {
      const originLng =
        originTerminal.longitude !== undefined
          ? originTerminal.longitude
          : originTerminal.lng;
      const originLat =
        originTerminal.latitude !== undefined
          ? originTerminal.latitude
          : originTerminal.lat;
      const destLng =
        destinationTerminal.longitude !== undefined
          ? destinationTerminal.longitude
          : destinationTerminal.lng;
      const destLat =
        destinationTerminal.latitude !== undefined
          ? destinationTerminal.latitude
          : destinationTerminal.lat;

      features.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [originLng, originLat],
            [destLng, destLat],
          ],
        },
      });
    }
  }

  return {
    type: 'FeatureCollection',
    features,
  };
}

export default generateRouteGeoJSON;

