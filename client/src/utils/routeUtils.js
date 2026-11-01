import { fetchDrivingRoute } from '../services/mapboxService.js';

/**
 * Generates a GeoJSON FeatureCollection containing driving route geometries
 * connecting an origin terminal to its destination terminals.
 *
 * @param {Object} originTerminal - The origin terminal object with routes and coordinates
 * @param {Array<Object>} allTerminals - Array of all terminal objects to search for destinations
 * @returns {Promise<Object|null>} GeoJSON FeatureCollection, or null if arguments are missing or routes are empty
 */
export async function generateRouteGeoJSON(originTerminal, allTerminals) {
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

  const promises = originTerminal.routes.map(async (route) => {
    if (!route) return null;

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

    if (!destinationTerminal) {
      return null;
    }

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

    let actualRouteGeometry = null;
    try {
      actualRouteGeometry = await fetchDrivingRoute(
        originLng,
        originLat,
        destLng,
        destLat
      );
    } catch (err) {
      console.error('Error fetching driving route in routeUtils:', err);
      actualRouteGeometry = null;
    }

    const geometry =
      actualRouteGeometry || {
        type: 'LineString',
        coordinates: [
          [originTerminal.lng ?? originLng, originTerminal.lat ?? originLat],
          [destinationTerminal.lng ?? destLng, destinationTerminal.lat ?? destLat],
        ],
      };

    return {
      type: 'Feature',
      geometry,
    };
  });

  const resolvedFeatures = await Promise.all(promises);
  const features = resolvedFeatures.filter((feature) => feature !== null);

  return {
    type: 'FeatureCollection',
    features,
  };
}

export default generateRouteGeoJSON;
