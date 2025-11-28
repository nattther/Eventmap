// hooks/use-user-location.ts
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type UseUserLocationResult = {
  userLocation: Coordinates | null;
  locationError: string | null;
  isLoading: boolean;
  refreshLocation: () => Promise<void>;
};

export const useUserLocation = (): UseUserLocationResult => {
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const requestLocationAsync = useCallback(async () => {
    try {
      setIsLoading(true);
      setLocationError(null);

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setLocationError('Permission localisation refusée');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy:
          Platform.OS === 'android'
            ? Location.Accuracy.Balanced
            : Location.Accuracy.High,
      });

      setUserLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    } catch (error) {
      console.warn('Erreur localisation :', error);
      setLocationError('Impossible de récupérer ta position');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void requestLocationAsync();
  }, [requestLocationAsync]);

  const refreshLocation = useCallback(async () => {
    await requestLocationAsync();
  }, [requestLocationAsync]);

  return {
    userLocation,
    locationError,
    isLoading,
    refreshLocation,
  };
};
