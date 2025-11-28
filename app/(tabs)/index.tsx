// app/(tabs)/index.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { SafeAreaView, View, StyleSheet, ActivityIndicator, Text } from 'react-native';

import { MapScreen } from '@/components/MapScreen';
import { EventListScreen } from '@/components/EventListScreen';
import { EventDetailSheet } from '@/components/EventDetailSheet';
import { subscribeToAllEvents, type EventDoc } from '@/services/eventsService';

export type ViewMode = 'map' | 'list';

export type Event = {
  id: string;
  title: string;
  time: string;
  date?: string;
  description?: string;
  category?: string;
  price?: number;
  capacity?: number;
  isFree: boolean;

  latitude: number;
  longitude: number;

  distance: string;       // texte de fallback
  locationLabel: string;  // ville / nom lieu

  venueName: string;
  venueAddress: string;
  venueCity: string;
  venueZip: string;
};

const DEFAULT_LATITUDE = 50.637;
const DEFAULT_LONGITUDE = 3.063;

export default function HomeScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [rawEvents, setRawEvents] = useState<EventDoc[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = subscribeToAllEvents((events) => {
      setRawEvents(events);
      setIsLoadingEvents(false);
    });

    return () => unsubscribe();
  }, []);

  const uiEvents: Event[] = useMemo(() => {
    return rawEvents.map((e) => {
      const locationLabelParts: string[] = [];
      if (e.venueCity) {
        locationLabelParts.push(e.venueCity);
      }
      if (e.venueName) {
        locationLabelParts.push(e.venueName);
      }
      const locationLabel =
        locationLabelParts.length > 0
          ? locationLabelParts.join(' - ')
          : e.venueAddress;

      return {
        id: e.id,
        title: e.title,
        time: e.startTime ?? '—',
        date: e.date,
        description: e.description ?? '',
        category: e.category,
        price: e.price,
        capacity: e.capacity,
        isFree: e.isFree,

        latitude:
          typeof e.latitude === 'number' ? e.latitude : DEFAULT_LATITUDE,
        longitude:
          typeof e.longitude === 'number' ? e.longitude : DEFAULT_LONGITUDE,

        distance: 'Distance inconnue', // fallback si pas de géoloc calculée
        locationLabel,

        venueName: e.venueName,
        venueAddress: e.venueAddress,
        venueCity: e.venueCity,
        venueZip: e.venueZip,
      };
    });
  }, [rawEvents]);

  const handleToggleView = () => {
    setViewMode((prev) => (prev === 'map' ? 'list' : 'map'));
    setIsDetailOpen(false);
  };

  const handleOpenDetail = () => {
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
  };

  const handleSelectEventFromMap = (event: Event) => {
    setSelectedEvent(event);
    setIsDetailOpen(true);
  };

  const handleSelectEventFromList = (event: Event) => {
    setSelectedEvent(event);
    setViewMode('map');
    setIsDetailOpen(true);
  };

  const handleChangeSearch = (value: string) => {
    setSearchQuery(value);
  };

  // 🔍 Filtre global : nom + lieu (ville / nom du lieu)
  const filteredEvents = useMemo(() => {
    const query = searchQuery.trim();
    const source = uiEvents;

    if (!query) return source;

    const normalizedQuery = normalizeStringForSearch(query);

    return source.filter((event) => {
      const haystack = `${event.title} ${event.locationLabel ?? ''}`;
      const normalizedHaystack = normalizeStringForSearch(haystack);
      return normalizedHaystack.includes(normalizedQuery);
    });
  }, [searchQuery, uiEvents]);

  if (isLoadingEvents) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loaderWrapper}>
          <ActivityIndicator />
          <Text style={styles.loaderText}>Chargement des événements...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>
        {viewMode === 'map' ? (
          <MapScreen
            events={filteredEvents}
            onToggleView={handleToggleView}
            onOpenDetail={handleOpenDetail}
            onSelectEvent={handleSelectEventFromMap}
          />
        ) : (
          <EventListScreen
            events={filteredEvents}
            onToggleView={handleToggleView}
            onSelectEvent={handleSelectEventFromList}
            searchQuery={searchQuery}
            onChangeSearch={handleChangeSearch}
          />
        )}

        {viewMode === 'map' && isDetailOpen && (
          <EventDetailSheet
            event={selectedEvent}
            onClose={handleCloseDetail}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

/**
 * Supprime les accents + met en minuscules pour une recherche plus tolérante
 */
const normalizeStringForSearch = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  root: {
    flex: 1,
  },
  loaderWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loaderText: {
    fontSize: 14,
    color: '#555555',
  },
});
