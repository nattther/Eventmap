// lib/geocoding.ts
const GOOGLE_MAPS_GEOCODING_BASE_URL =
  'https://maps.googleapis.com/maps/api/geocode/json';


/**
 * Construit une adresse lisible pour l'API à partir des champs du lieu.
 */
export type VenueAddressParts = {
  venueName?: string;
  venueAddress: string;
  venueZip?: string;
  venueCity?: string;
};
const GOOGLE_MAPS_API_KEY = 'AIzaSyASnHoibepEtcy0iJpZosIIzitHrhrjHLs';

export const buildFullAddressForGeocoding = ({
  venueName,
  venueAddress,
  venueZip,
  venueCity,
}: VenueAddressParts): string => {
  const parts: string[] = [];

  if (venueName && venueName.trim().length > 0) {
    parts.push(venueName.trim());
  }

  if (venueAddress && venueAddress.trim().length > 0) {
    parts.push(venueAddress.trim());
  }

  const cityLine = [venueZip, venueCity]
    .filter((x) => x && x.trim().length > 0)
    .join(' ');

  if (cityLine.length > 0) {
    parts.push(cityLine);
  }

  return parts.join(', ');
};

export type LatLng = {
  latitude: number;
  longitude: number;
};

/**
 * Appelle Google Geocoding API pour obtenir lat/lng à partir d'une adresse.
 * Lance une erreur si l'adresse est introuvable ou si l'API renvoie une erreur.
 */
export const geocodeAddressToLatLng = async (
  fullAddress: string,
): Promise<LatLng> => {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn(
      '[geocoding] GOOGLE_MAPS_API_KEY manquante. Vérifie EXPO_PUBLIC_GOOGLE_MAPS_API_KEY.',
    );
    throw new Error('Configuration API Google Maps manquante.');
  }

  const url =
    `${GOOGLE_MAPS_GEOCODING_BASE_URL}?address=` +
    encodeURIComponent(fullAddress) +
    `&key=${GOOGLE_MAPS_API_KEY}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Erreur HTTP Geocoding (${response.status}) lors de l'appel API.`,
    );
  }

  const data: any = await response.json();

  if (data.status !== 'OK' || !data.results || data.results.length === 0) {
    const status = data.status ?? 'UNKNOWN';
    console.warn('[geocoding] Status API:', status, 'response:', data);
    throw new Error("Adresse introuvable ou non géocodable.");
  }

  const firstResult = data.results[0];
  const location = firstResult.geometry?.location;

  if (
    !location ||
    typeof location.lat !== 'number' ||
    typeof location.lng !== 'number'
  ) {
    throw new Error('Réponse Geocoding sans coordonnées valides.');
  }

  return {
    latitude: location.lat,
    longitude: location.lng,
  };
};
