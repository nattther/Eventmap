// components/EventListScreen.tsx
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';

import { TopBar } from './TopBar';
import type { ViewMode, Event } from '@/app/(tabs)';
import { useUserLocation } from '@/hooks/use-user-location';
import { calculateDistanceInMeters, formatDistance } from '@/utils/distance';

type EventListScreenProps = {
  events: Event[];
  onToggleView: () => void;
  onSelectEvent: (event: Event) => void;
  searchQuery: string;                     // 🔹 nouvelle prop
  onChangeSearch: (value: string) => void; // 🔹 nouvelle prop
};

type SortMode = 'distance' | 'time';
type EventWithComputed = Event & { computedDistanceMeters?: number };

export const EventListScreen: React.FC<EventListScreenProps> = ({
  events,
  onToggleView,
  onSelectEvent,
  searchQuery,
  onChangeSearch,
}) => {
  const [sortMode, setSortMode] = useState<SortMode>('distance');
  const { userLocation, locationError } = useUserLocation();

  // ➜ On injecte la distance calculée si on connaît la position
  const eventsWithComputed: EventWithComputed[] = useMemo(() => {
    if (!userLocation) {
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

  // ➜ Tri (les events sont déjà filtrés par HomeScreen)
  const sortedEvents: EventWithComputed[] = useMemo(() => {
    const copy = [...eventsWithComputed];

    copy.sort((a, b) => {
      if (sortMode === 'distance') {
        const da = a.computedDistanceMeters ?? Number.MAX_SAFE_INTEGER;
        const db = b.computedDistanceMeters ?? Number.MAX_SAFE_INTEGER;
        return da - db;
      }

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

      {/* 🔹 Barre de recherche (nom + lieu) */}
      <View style={styles.searchWrapper}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher par nom ou lieu (ville, adresse, quartier)..."
          placeholderTextColor="#9e9e9e"
          value={searchQuery}
          onChangeText={onChangeSearch}
          autoCorrect={false}
        />
      </View>

      {locationError && (
        <Text style={styles.locationErrorText}>{locationError}</Text>
      )}

      <ScrollView contentContainerStyle={styles.listContent}>
        {sortedEvents.length === 0 ? (
          <View style={styles.emptyStateWrapper}>
            <Text style={styles.emptyStateTitle}>Aucun événement trouvé</Text>
            <Text style={styles.emptyStateText}>
              Essaie un autre nom ou un autre lieu.
            </Text>
          </View>
        ) : (
          sortedEvents.map((event) => (
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
              <Text style={styles.eventCardInfo}>Lieu : {event.locationLabel}</Text>
              <Text style={styles.eventCardInfo}>
                Distance :{' '}
                {event.computedDistanceMeters != null
                  ? formatDistance(event.computedDistanceMeters)
                  : event.distance}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const parseTimeToMinutes = (time: string): number => {
  if (!time) return Number.MAX_SAFE_INTEGER;

  const [hoursStr, minutesStr] = time.split(':');
  const hours = Number.parseInt(hoursStr, 10);
  const minutes = Number.parseInt(minutesStr, 10);

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

  // Tri
  sortToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 4,
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

  // Recherche
  searchWrapper: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  searchInput: {
    height: 38,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 14,
    fontSize: 13,
    backgroundColor: '#fafafa',
  },

  locationErrorText: {
    fontSize: 12,
    color: '#e53935',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 4,
  },

  // Empty state
  emptyStateWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
    gap: 8,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222222',
  },
  emptyStateText: {
    fontSize: 13,
    color: '#555555',
    textAlign: 'center',
  },
});
