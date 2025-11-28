// app/(tabs)/index.tsx
import React, { useState } from 'react';
import { SafeAreaView, View, StyleSheet } from 'react-native';

import { MapScreen } from '@/components/MapScreen';
import { EventListScreen } from '@/components/EventListScreen';
import { EventDetailSheet } from '@/components/EventDetailSheet';

export type ViewMode = 'map' | 'list';

export type Event = {
  id: string;
  title: string;
  time: string;
  distance: string;
  latitude: number;
  longitude: number;
  isFree: boolean;
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
  },
  {
    id: '2',
    title: 'Concert Place des Halles',
    time: '20:30',
    distance: '1,2 km',
    latitude: 50.6385,
    longitude: 3.067,
    isFree: true,
  },
  {
    id: '3',
    title: 'Afterwork étudiants',
    time: '19:00',
    distance: '800 m',
    latitude: 50.636,
    longitude: 3.0705,
    isFree: false,
  },
];

export default function HomeScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const handleToggleView = () => {
    setViewMode((prev) => (prev === 'map' ? 'list' : 'map'));
    // on ne ferme pas forcément le détail ici, tu choisis :
    // pour l’instant on le ferme pour rester simple
    setIsDetailOpen(false);
  };

  const handleOpenDetail = () => {
    // ouverture sans event sélectionné -> message "clique sur un événement..."
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>
        {viewMode === 'map' ? (
          <MapScreen
            events={EVENTS}
            onToggleView={handleToggleView}
            onOpenDetail={handleOpenDetail}
            onSelectEvent={handleSelectEventFromMap}
          />
        ) : (
          <EventListScreen
            events={EVENTS}
            onToggleView={handleToggleView}
            onSelectEvent={handleSelectEventFromList}
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  root: {
    flex: 1,
  },
});
