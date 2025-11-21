import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  StyleProp,
  ViewStyle,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';



// ---- Types ----

type ViewMode = 'map' | 'list';

type TopBarProps = {
  mode: ViewMode;
  onToggleView: () => void;
  containerStyle?: StyleProp<ViewStyle>;
};

type MapScreenProps = {
  onToggleView: () => void;
  onOpenDetail: () => void;
};

type ListScreenProps = {
  onToggleView: () => void;
};

type EventMarker = {
  id: string;
  latitude: number;
  longitude: number;
  color: 'blue' | 'green' | 'red';
};

// ---- Data pour la démo ----

const INITIAL_REGION: Region = {
  // Centre approximatif de Lille pour coller à ta maquette
  latitude: 50.637,
  longitude: 3.063,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

const MARKERS: EventMarker[] = [
  { id: '1', latitude: 50.6375, longitude: 3.0625, color: 'blue' },
  { id: '2', latitude: 50.6385, longitude: 3.067, color: 'blue' },
  { id: '3', latitude: 50.636, longitude: 3.0705, color: 'blue' },
  { id: '4', latitude: 50.639, longitude: 3.056, color: 'green' },
  { id: '5', latitude: 50.6367, longitude: 3.0635, color: 'red' },
];

const DUMMY_EVENTS = [
  { id: '1', title: 'Apéro au Network', time: '18:00', distance: '500 m' },
  { id: '2', title: 'Concert Place des Halles', time: '20:30', distance: '1,2 km' },
  { id: '3', title: 'Afterwork étudiants', time: '19:00', distance: '800 m' },
];

// ---- Écran principal ----

export default function HomeScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>
        {viewMode === 'map' ? (
          <MapScreen onToggleView={handleToggleView} onOpenDetail={handleOpenDetail} />
        ) : (
          <ListScreen onToggleView={handleToggleView} />
        )}

        {viewMode === 'map' && isDetailOpen && (
          <EventDetailSheet onClose={handleCloseDetail} />
        )}
      </View>
    </SafeAreaView>
  );
}

// ---- Top bar (burger + switch carte/liste) ----

const TopBar: React.FC<TopBarProps> = ({ mode, onToggleView, containerStyle }) => (
  <View style={[styles.topBar, containerStyle]}>
    <TouchableOpacity style={styles.menuButton} activeOpacity={0.7}>
      <View style={styles.menuLine} />
      <View style={styles.menuLine} />
      <View style={styles.menuLine} />
    </TouchableOpacity>

    <TouchableOpacity style={styles.listButton} onPress={onToggleView} activeOpacity={0.8}>
      <Text style={styles.listButtonText}>
        {mode === 'map' ? 'Voir en liste' : 'Voir la carte'}
      </Text>
    </TouchableOpacity>
  </View>
);

// ---- Écran Carte ----

const MapScreen: React.FC<MapScreenProps> = ({ onToggleView, onOpenDetail }) => {
  const [region, setRegion] = useState<Region>(INITIAL_REGION);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

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

        const { latitude, longitude } = loc.coords;

        setUserLocation({ latitude, longitude });

        setRegion((prev) => ({
          ...prev,
          latitude,
          longitude,
        }));
      } catch (error) {
        console.warn('Erreur localisation :', error);
        setLocationError('Impossible de récupérer la localisation');
      }
    })();
  }, []);

  const handleLocateMe = async () => {
    try {
      if (!userLocation) {
        // Si on n'a pas encore de position en mémoire, on tente une nouvelle fois
        const loc = await Location.getCurrentPositionAsync({
          accuracy:
            Platform.OS === 'android'
              ? Location.Accuracy.Balanced
              : Location.Accuracy.High,
        });

        const { latitude, longitude } = loc.coords;
        setUserLocation({ latitude, longitude });

        setRegion((prev) => ({
          ...prev,
          latitude,
          longitude,
        }));
        return;
      }

      // On recentre juste sur la dernière position connue
      setRegion((prev) => ({
        ...prev,
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      }));
    } catch (error) {
      console.warn('Erreur locate me :', error);
      setLocationError('Impossible de recentrer sur ta position');
    }
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
        {MARKERS.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
          >
            <View
              style={[
                styles.markerBase,
                marker.color === 'blue' && styles.markerBlue,
                marker.color === 'green' && styles.markerGreen,
                marker.color === 'red' && styles.markerRed,
              ]}
            />
          </Marker>
        ))}
      </MapView>

      <TopBar
        mode="map"
        onToggleView={onToggleView}
        containerStyle={styles.topBarOverlay}
      />

      {/* Barre bleue en bas pour ouvrir le détail */}
      <BottomHandle onPress={onOpenDetail} />

      {/* Bouton "me localiser" en bas à droite */}
      <LocateMeButton onPress={handleLocateMe} />

      {locationError && (
        <View style={{ position: 'absolute', bottom: 70, left: 16, right: 16 }}>
          <Text style={{ color: '#e53935', textAlign: 'center' }}>
            {locationError}
          </Text>
        </View>
      )}
    </View>
  );
};


const LocateMeButton: React.FC<{ onPress: () => void }> = ({ onPress }) => (
  <TouchableOpacity
    style={styles.locateMeButton}
    activeOpacity={0.8}
    onPress={onPress}
  >
    <MaterialIcons name="my-location" size={22} color="#1e88e5" />
  </TouchableOpacity>
);

// ---- Écran Liste ----

const ListScreen: React.FC<ListScreenProps> = ({ onToggleView }) => (
  <View style={styles.listScreen}>
    <TopBar mode="list" onToggleView={onToggleView} />
    <ScrollView contentContainerStyle={styles.listContent}>
      {DUMMY_EVENTS.map((event) => (
        <View key={event.id} style={styles.eventCard}>
          <View style={styles.eventCardHeader}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Gratuit</Text>
            </View>
            <Text style={styles.eventCardTitle}>{event.title}</Text>
          </View>
          <Text style={styles.eventCardInfo}>Horaire : {event.time}</Text>
          <Text style={styles.eventCardInfo}>Distance : {event.distance}</Text>
        </View>
      ))}
    </ScrollView>
  </View>
);

// ---- Barre en bas pour ouvrir le détail ----

const BottomHandle: React.FC<{ onPress: () => void }> = ({ onPress }) => (
  <TouchableOpacity
    style={styles.bottomHandleWrapper}
    activeOpacity={0.8}
    onPress={onPress}
  >
    <View style={styles.bottomHandleBar} />
  </TouchableOpacity>
);

// ---- Bottom sheet : détail d’événement ----

const EventDetailSheet: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <View style={styles.sheetContainer}>
    <View style={styles.sheetHeader}>
      <View className="sheetTopBarWrapper" style={styles.sheetTopBarBackground}>
        <View style={styles.sheetTopBarForeground} />
      </View>
      <TouchableOpacity onPress={onClose} style={styles.sheetCloseButton}>
        <Text style={styles.sheetCloseText}>✕</Text>
      </TouchableOpacity>
    </View>

    <ScrollView contentContainerStyle={styles.sheetContent}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Gratuit</Text>
      </View>

      <Text style={styles.detailTitle}>Titre de l&apos;événement</Text>

      <View style={styles.eventInfoRow}>
        <Text style={styles.eventInfoLabel}>Horaire</Text>
        <Text style={styles.eventInfoValue}>18:00 - 21:00</Text>
      </View>

      <View style={styles.eventInfoRow}>
        <Text style={styles.eventInfoLabel}>Distance</Text>
        <Text style={styles.eventInfoValue}>500 m</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.imagesRow}
      >
        {[1, 2, 3].map((index) => (
          <View key={index} style={styles.imageCard}>
            <View style={styles.imagePlaceholderIcon}>
              <Text style={styles.imagePlaceholderText}>🖼</Text>
            </View>
            <Text style={styles.imageCaption}>Photo {index}</Text>
          </View>
        ))}
      </ScrollView>

      <Text style={styles.sectionTitle}>Description</Text>
      <Text style={styles.eventDescription}>
        Ici tu pourras mettre la vraie description de l&apos;événement. Pour l&apos;instant
        c&apos;est juste un texte de démo.
      </Text>
    </ScrollView>
  </View>
);

// ---- Styles ----

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  root: {
    flex: 1,
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

  
  // Map screen
  mapScreen: {
    flex: 1,
  },

  markerBase: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  markerBlue: {
    backgroundColor: '#1e88e5',
  },
  markerGreen: {
    backgroundColor: '#00c853',
  },
  markerRed: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ffffff',
    backgroundColor: '#e53935',
  },

  // List screen
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

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  topBarOverlay: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  menuLine: {
    width: 18,
    height: 2,
    backgroundColor: '#333333',
    marginVertical: 1.5,
    borderRadius: 1,
  },
  listButton: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#b3e5fc',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  listButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e88e5',
    textTransform: 'capitalize',
  },

  // Bottom handle (ouvrir détail)
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

  // Sheet détail
  sheetContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
  },
  sheetHeader: {
    paddingTop: 10,
    paddingBottom: 4,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sheetTopBarBackground: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e0f2ff',
    overflow: 'hidden',
    marginRight: 12,
  },
  sheetTopBarForeground: {
    width: '50%',
    height: '100%',
    backgroundColor: '#29b6f6',
  },
  sheetCloseButton: {
    padding: 4,
  },
  sheetCloseText: {
    fontSize: 18,
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 8,
  },

  // Détail événement
  badge: {
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#00e676',
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 12,
  },
  eventInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  eventInfoLabel: {
    fontSize: 14,
    color: '#777777',
  },
  eventInfoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },

  // Images
  imagesRow: {
    marginTop: 16,
    marginBottom: 16,
  },
  imageCard: {
    width: 90,
    marginRight: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dddddd',
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  imagePlaceholderIcon: {
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  imagePlaceholderText: {
    fontSize: 26,
  },
  imageCaption: {
    fontSize: 10,
    paddingHorizontal: 4,
    paddingVertical: 4,
    color: '#555555',
  },

  // Description
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222222',
    marginBottom: 6,
  },
  eventDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: '#555555',
  },
});
