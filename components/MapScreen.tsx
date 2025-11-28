// components/MapScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { MaterialIcons } from '@expo/vector-icons';

import { TopBar } from './TopBar';
import type { ViewMode, Event } from '@/app/(tabs)';
import { useUserLocation } from '@/hooks/use-user-location';

type MapScreenProps = {
  events: Event[];
  onToggleView: () => void;
  onOpenDetail: () => void;
  onSelectEvent: (event: Event) => void;
};

const INITIAL_REGION: Region = {
  latitude: 50.637,
  longitude: 3.063,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

export const MapScreen: React.FC<MapScreenProps> = ({
  events,
  onToggleView,
  onOpenDetail,
  onSelectEvent,
}) => {
  const [region, setRegion] = useState<Region>(INITIAL_REGION);

  const { userLocation, locationError, refreshLocation } = useUserLocation();

  // Quand on récupère la position, on recentre la carte
  useEffect(() => {
    if (!userLocation) return;

    setRegion((prev) => ({
      ...prev,
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
    }));
  }, [userLocation]);

  const handleLocateMe = async () => {
    if (!userLocation) {
      await refreshLocation();
      return;
    }

    setRegion((prev) => ({
      ...prev,
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
    }));
  };

  return (
    <View style={styles.mapScreen}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation
      >
        {events.map((event) => (
          <Marker
            key={event.id}
            coordinate={{ latitude: event.latitude, longitude: event.longitude }}
            onPress={() => onSelectEvent(event)}
          >
            <View style={[styles.markerBase, styles.markerBase]} />
          </Marker>
        ))}
      </MapView>

      <TopBar
        mode={'map' as ViewMode}
        onToggleView={onToggleView}
        containerStyle={styles.topBarOverlay}
      />

      <BottomHandle onPress={onOpenDetail} />
      <LocateMeButton onPress={handleLocateMe} />

      {locationError && (
        <View style={styles.locationErrorWrapper}>
          <Text style={styles.locationErrorText}>{locationError}</Text>
        </View>
      )}
    </View>
  );
};

const BottomHandle: React.FC<{ onPress: () => void }> = ({ onPress }) => (
  <TouchableOpacity style={styles.bottomHandleWrapper} activeOpacity={0.8} onPress={onPress}>
    <View style={styles.bottomHandleBar} />
  </TouchableOpacity>
);

const LocateMeButton: React.FC<{ onPress: () => void }> = ({ onPress }) => (
  <TouchableOpacity style={styles.locateMeButton} activeOpacity={0.8} onPress={onPress}>
    <MaterialIcons name="my-location" size={22} color="#1e88e5" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  mapScreen: {
    flex: 1,
  },
  topBarOverlay: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
  },
  markerBase: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#ffffff',
    backgroundColor: '#1e88e5',
  },
  bottomHandleWrapper: {
    position: 'absolute',
    bottom: 18,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  bottomHandleBar: {
    width: '40%',
    height: 4,
    borderRadius: 2,
    backgroundColor: '#29b6f6',
  },
  locateMeButton: {
    position: 'absolute',
    bottom: 80,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  locationErrorWrapper: {
    position: 'absolute',
    bottom: 70,
    left: 16,
    right: 16,
  },
  locationErrorText: {
    color: '#e53935',
    textAlign: 'center',
  },
});
