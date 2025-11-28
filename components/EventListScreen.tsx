// components/EventListScreen.tsx
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { TopBar } from './TopBar';
import type { ViewMode, Event } from '@/app/(tabs)';

type EventListScreenProps = {
  events: Event[];
  onToggleView: () => void;
  onSelectEvent: (event: Event) => void;
};

export const EventListScreen: React.FC<EventListScreenProps> = ({
  events,
  onToggleView,
  onSelectEvent,
}) => {
  const sortedEvents = useMemo(
    () =>
      [...events].sort(
        (a, b) => parseDistanceToMeters(a.distance) - parseDistanceToMeters(b.distance),
      ),
    [events],
  );

  return (
    <View style={styles.listScreen}>
      <TopBar mode={'list' as ViewMode} onToggleView={onToggleView} />
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
            <Text style={styles.eventCardInfo}>Distance : {event.distance}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

// Helper : "500 m", "800m", "1,2 km", "2.5 km" -> mètres (number)
const parseDistanceToMeters = (distance: string): number => {
  if (!distance) return Number.MAX_SAFE_INTEGER;

  const normalized = distance.replace(',', '.').trim().toLowerCase();
  const match = normalized.match(/([\d.]+)/);

  if (!match) return Number.MAX_SAFE_INTEGER;

  const value = parseFloat(match[1]);

  if (Number.isNaN(value)) return Number.MAX_SAFE_INTEGER;

  // km -> m, sinon on considère que c’est en mètres
  if (normalized.includes('km')) {
    return value * 1000;
  }

  return value;
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
});
