// app/(tabs)/index.tsx
import React, { useState, useMemo } from 'react';
import { SafeAreaView, View, StyleSheet } from 'react-native';

import { MapScreen } from '@/components/MapScreen';
import { EventListScreen } from '@/components/EventListScreen';
import { EventDetailSheet } from '@/components/EventDetailSheet';

export type ViewMode = 'map' | 'list';

export type Event = {
  id: string;
  title: string;
  time: string;
  distance: string;       // texte de fallback
  latitude: number;
  longitude: number;
  isFree: boolean;
  locationLabel: string;  // 🔹 nouveau : ville / adresse / quartier
};

const EVENTS: Event[] = [
  {
    id: '1',
    title: 'Apéro au Network',
    time: '18:00',
    distance: '500 m',
    latitude: 50.6375,
    longitude: 3.0625,
    isFree: true,
    locationLabel: 'Lille - Vieux-Lille',
  },
  {
    id: '2',
    title: 'Concert Place des Halles',
    time: '20:30',
    distance: '1,2 km',
    latitude: 50.6385,
    longitude: 3.067,
    isFree: true,
    locationLabel: 'Lille - Centre',
  },
  {
    id: '3',
    title: 'Afterwork étudiants',
    time: '19:00',
    distance: '800 m',
    latitude: 50.636,
    longitude: 3.0705,
    isFree: false,
    locationLabel: 'Lille - Quartier étudiant',
  },
];

export default function HomeScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleToggleView = () => {
    setViewMode((prev) => (prev === 'map' ? 'list' : 'map'));
    // Pour rester simple : on ferme le détail quand on change de vue
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

  // 🔍 Filtre global : nom + lieu (ville / adresse / quartier)
  const filteredEvents = useMemo(() => {
    const query = searchQuery.trim();
    if (!query) return EVENTS;

    const normalizedQuery = normalizeStringForSearch(query);

    return EVENTS.filter((event) => {
      const haystack = `${event.title} ${event.locationLabel ?? ''}`;
      const normalizedHaystack = normalizeStringForSearch(haystack);
      return normalizedHaystack.includes(normalizedQuery);
    });
  }, [searchQuery]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>
        {viewMode === 'map' ? (
          <MapScreen
            events={filteredEvents}                 // 🔹 seulement les events filtrés
            onToggleView={handleToggleView}
            onOpenDetail={handleOpenDetail}
            onSelectEvent={handleSelectEventFromMap}
          />
        ) : (
          <EventListScreen
            events={filteredEvents}                 // 🔹 idem
            onToggleView={handleToggleView}
            onSelectEvent={handleSelectEventFromList}
            searchQuery={searchQuery}              // 🔹 state remonté
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
});
