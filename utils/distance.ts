// utils/distance.ts

/**
 * Haversine : distance entre 2 points (lat/lng) en mètres.
 */
export const calculateDistanceInMeters = (
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number,
): number => {
  const toRad = (value: number) => (value * Math.PI) / 180;

  const R = 6371e3; // rayon de la Terre en mètres
  const φ1 = toRad(latitude1);
  const φ2 = toRad(latitude2);
  const Δφ = toRad(latitude2 - latitude1);
  const Δλ = toRad(longitude2 - longitude1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Format lisible : "123 m" ou "1,2 km"
 */
export const formatDistance = (meters: number): string => {
  if (!Number.isFinite(meters)) {
    return '';
  }

  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }

  const km = meters / 1000;
  return `${km.toFixed(1).replace('.', ',')} km`;
};
