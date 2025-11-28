// components/EventListScreen.tsx
import React, { useMemo, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';

import { TopBar } from './TopBar';
import type { ViewMode, Event } from '@/app/(tabs)';

type EventListScreenProps = {
  events: Event[];
  onToggleView: () => void;
  onSelectEvent: (event: Event) => void;
};

type SortMode = 'distance' | 'time';
type EventWithComputed = Event & { computedDistanceMeters?: number };

export const EventListScreen: React.FC<EventListScreenProps> = ({
  events,
  onToggleView,
  onSelectEvent,
}) => {
  const [sortMode, setSortMode] = useState<SortMode>('distance');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(
    null,
  );
  const [locationError, setLocationError] = useState<string | null>(null);

  // 🔹 Récupération de la position de l'utilisateur
  useEffect(() => {
    (async () => {
      try {
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
        console.warn('Erreur localisation liste :', error);
        setLocationError('Impossible de récupérer ta position');
      }
    })();
  }, []);

  // 🔹 On ajoute la distance calculée à chaque event (si position connue)
  const eventsWithComputed: EventWithComputed[] = useMemo(() => {
    if (!userLocation) {
      // Pas encore de position -> on renvoie les events tels quels
      return events;
    }

    return events.map((event) => {
      const distanceMeters = calculateDistanceInMeters(
        userLocation.latitude,
        userLocation.longitude,
        event.latitude,
        event.longitude,
      );

      return {
        ...event,
        computedDistanceMeters: distanceMeters,
      };
    });
  }, [events, userLocation]);

  // 🔹 Tri selon le mode sélectionné
  const sortedEvents: EventWithComputed[] = useMemo(() => {
    // Si on trie par distance mais qu'aucune distance n'est calculée,
    // on ne touche pas à l'ordre d'origine.
    if (sortMode === 'distance') {
      const hasComputed = eventsWithComputed.some(
        (event) => event.computedDistanceMeters != null,
      );
      if (!hasComputed) {
        return eventsWithComputed;
      }
    }

    const copy = [...eventsWithComputed];

    copy.sort((a, b) => {
      if (sortMode === 'distance') {
        const da = a.computedDistanceMeters ?? Number.MAX_SAFE_INTEGER;
        const db = b.computedDistanceMeters ?? Number.MAX_SAFE_INTEGER;
        return da - db;
      }

      // Tri par horaire (ex: "18:00", "20:30")
      return parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time);
    });

    return copy;
  }, [eventsWithComputed, sortMode]);

  return (
    <View style={styles.listScreen}>
      <TopBar mode={'list' as ViewMode} onToggleView={onToggleView} />

      {/* 🔹 Barre de tri */}
      <View style={styles.sortToggleRow}>
        <Text style={styles.sortLabel}>Trier par</Text>
        <View style={styles.sortButtonsContainer}>
          <TouchableOpacity
            style={[
              styles.sortButton,
              sortMode === 'distance' && styles.sortButtonActive,
            ]}
            activeOpacity={0.8}
            onPress={() => setSortMode('distance')}
          >
            <Text
              style={[
                styles.sortButtonText,
                sortMode === 'distance' && styles.sortButtonTextActive,
              ]}
            >
              Distance
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sortButton,
              sortMode === 'time' && styles.sortButtonActive,
            ]}
            activeOpacity={0.8}
            onPress={() => setSortMode('time')}
          >
            <Text
              style={[
                styles.sortButtonText,
                sortMode === 'time' && styles.sortButtonTextActive,
              ]}
            >
              Horaire
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {locationError && (
        <Text style={styles.locationErrorText}>{locationError}</Text>
      )}

      <ScrollView contentContainerStyle={styles.listContent}>
        {sortedEvents.map((event) => (
          <TouchableOpacity
            key={event.id}
            style={styles.eventCard}
            activeOpacity={0.8}
            onPress={() => onSelectEvent(event)}
          >
            <View style={styles.eventCardHeader}>
              {event.isFree && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Gratuit</Text>
                </View>
              )}
              <Text style={styles.eventCardTitle}>{event.title}</Text>
            </View>
            <Text style={styles.eventCardInfo}>Horaire : {event.time}</Text>
            <Text style={styles.eventCardInfo}>
              Distance :{' '}
              {event.computedDistanceMeters != null
                ? formatDistance(event.computedDistanceMeters)
                : event.distance}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

/**
 * Haversine : distance entre 2 points (lat/lng) en mètres
 */
const calculateDistanceInMeters = (
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
 * Format : 123 m ou 1,2 km
 */
const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }

  const km = meters / 1000;
  // virgule pour le français
  return `${km.toFixed(1).replace('.', ',')} km`;
};

/**
 * "18:00" -> minutes depuis minuit (1080)
 */
const parseTimeToMinutes = (time: string): number => {
  if (!time) return Number.MAX_SAFE_INTEGER;

  const parts = time.split(':');
  if (parts.length < 2) return Number.MAX_SAFE_INTEGER;

  const hours = Number.parseInt(parts[0], 10);
  const minutes = Number.parseInt(parts[1], 10);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return Number.MAX_SAFE_INTEGER;
  }

  return hours * 60 + minutes;
};

const styles = StyleSheet.create({
  listScreen: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },

  // Cartes d'événements
  eventCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  eventCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  eventCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222222',
  },
  eventCardInfo: {
    fontSize: 13,
    color: '#555555',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#00e676',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },

  // 🔹 Barre de tri
  sortToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
  },
  sortLabel: {
    fontSize: 13,
    color: '#555555',
  },
  sortButtonsContainer: {
    flexDirection: 'row',
    borderRadius: 20,
    backgroundColor: '#f1f7ff',
    padding: 3,
  },
  sortButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  sortButtonActive: {
    backgroundColor: '#1e88e5',
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e88e5',
  },
  sortButtonTextActive: {
    color: '#ffffff',
  },

  locationErrorText: {
    fontSize: 12,
    color: '#e53935',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 4,
  },
});
