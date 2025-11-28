import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
  FlatList,
  ListRenderItemInfo,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/context/AuthContext';



type AuthMode = 'login' | 'register';

const PartnerScreen: React.FC = () => {
  const { partner, isLoading } = useAuth();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (partner) {
    return <PartnerProfileScreen />;
  }

  return <PartnerAuthScreen />;
};

/* ---------- ÉCRAN AUTH : connexion / inscription ---------- */

const PartnerAuthScreen: React.FC = () => {
  const { login, register, isLoading } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');

  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const handleSubmit = async () => {
    if (!email || !password || (mode === 'register' && !name)) {
      Alert.alert('Oups', 'Merci de remplir tous les champs requis.');
      return;
    }

    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        await register(name.trim(), email.trim(), password);
      }
    } catch (error) {
      console.warn('Erreur auth :', error);
      Alert.alert(
        'Erreur',
        "Une erreur est survenue lors de l'authentification. Réessaie plus tard.",
      );
    }
  };

  const toggleMode = () => {
    setMode((prev) => (prev === 'login' ? 'register' : 'login'));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.authContainer}>
        <Text style={styles.authTitle}>Espace partenaire</Text>
        <Text style={styles.authSubtitle}>
          {mode === 'login'
            ? 'Connecte-toi pour gérer tes événements.'
            : 'Crée ton compte partenaire pour gérer tes événements.'}
        </Text>

        <View style={styles.authToggleRow}>
          <TouchableOpacity
            style={[
              styles.authToggleButton,
              mode === 'login' && styles.authToggleButtonActive,
            ]}
            onPress={() => setMode('login')}
          >
            <Text
              style={[
                styles.authToggleText,
                mode === 'login' && styles.authToggleTextActive,
              ]}
            >
              Connexion
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.authToggleButton,
              mode === 'register' && styles.authToggleButtonActive,
            ]}
            onPress={() => setMode('register')}
          >
            <Text
              style={[
                styles.authToggleText,
                mode === 'register' && styles.authToggleTextActive,
              ]}
            >
              Inscription
            </Text>
          </TouchableOpacity>
        </View>

        {mode === 'register' && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nom / Organisation</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex : La Maison des Événements"
              placeholderTextColor="#9e9e9e"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="ton.email@exemple.com"
            placeholderTextColor="#9e9e9e"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Mot de passe</Text>
          <TextInput
            style={styles.input}
            placeholder="Mot de passe"
            placeholderTextColor="#9e9e9e"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          activeOpacity={0.85}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitButtonText}>
              {mode === 'login' ? 'Se connecter' : "Créer mon compte"}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={toggleMode}>
          <Text style={styles.toggleModeText}>
            {mode === 'login'
              ? "Pas encore de compte ? Inscris-toi"
              : 'Déjà un compte ? Connecte-toi'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

/* ---------- PROFIL + ÉVÈNEMENTS (SCROLL INFINI) ---------- */

type PartnerEvent = {
  id: string;
  title: string;
  dateIso: string; // ISO string
  status: 'upcoming' | 'past' | 'cancelled';
};

type EventTab = 'upcoming' | 'past';

const PAGE_SIZE = 10;

const PartnerProfileScreen: React.FC = () => {
  const { partner, updateProfile, logout } = useAuth();

  const [editingName, setEditingName] = useState<string>(partner?.name ?? '');
  const [venueName, setVenueName] = useState<string>(partner?.venueName ?? '');
  const [venueAddress, setVenueAddress] = useState<string>(partner?.venueAddress ?? '');
  const [venueCity, setVenueCity] = useState<string>(partner?.venueCity ?? '');
  const [venueZip, setVenueZip] = useState<string>(partner?.venueZip ?? '');
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<EventTab>('upcoming');
  const [upcomingEvents, setUpcomingEvents] = useState<PartnerEvent[]>([]);
  const [pastEvents, setPastEvents] = useState<PartnerEvent[]>([]);
  const [pageUpcoming, setPageUpcoming] = useState<number>(0);
  const [pagePast, setPagePast] = useState<number>(0);
  const [isLoadingUpcoming, setIsLoadingUpcoming] = useState<boolean>(false);
  const [isLoadingPast, setIsLoadingPast] = useState<boolean>(false);
  const [hasMoreUpcoming, setHasMoreUpcoming] = useState<boolean>(true);
  const [hasMorePast, setHasMorePast] = useState<boolean>(true);

  const handleSaveProfile = async () => {
    if (!partner) return;

    setIsSavingProfile(true);
    try {
      await updateProfile({
        name: editingName.trim() || partner.name,
        venueName: venueName.trim() || undefined,
        venueAddress: venueAddress.trim() || undefined,
        venueCity: venueCity.trim() || undefined,
        venueZip: venueZip.trim() || undefined,
      });
      Alert.alert('Profil mis à jour', 'Tes informations ont bien été enregistrées ✅');
    } catch (error) {
      console.warn('Erreur update profil :', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil pour le moment.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'La permission à la galerie est nécessaire.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    const uri = result.assets[0].uri;
    try {
      await updateProfile({ avatarUrl: uri });
    } catch (error) {
      console.warn('Erreur mise à jour avatar :', error);
      Alert.alert('Erreur', "Impossible d'enregistrer la photo de profil.");
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  // Fake fetch events (à remplacer par ton vrai backend)
  const fetchEventsPage = async (
    type: EventTab,
    page: number,
    pageSize: number,
  ): Promise<{ items: PartnerEvent[]; hasMore: boolean }> => {
    // Simu simple : on génère 30 events max par type
    const TOTAL = 30;
    const start = page * pageSize;
    const end = Math.min(start + pageSize, TOTAL);

    if (start >= TOTAL) {
      return { items: [], hasMore: false };
    }

    const now = new Date();

    const items: PartnerEvent[] = [];
    for (let i = start; i < end; i += 1) {
      const offsetDays = type === 'upcoming' ? i + 1 : -(i + 1);
      const date = new Date(now);
      date.setDate(now.getDate() + offsetDays);

      items.push({
        id: `${type}-${i}`,
        title:
          type === 'upcoming'
            ? `Événement à venir #${i + 1}`
            : `Événement passé #${i + 1}`,
        dateIso: date.toISOString(),
        status: type,
      });
    }

    return { items, hasMore: end < TOTAL };
  };

  const loadMoreUpcoming = async () => {
    if (isLoadingUpcoming || !hasMoreUpcoming) return;
    setIsLoadingUpcoming(true);
    try {
      const res = await fetchEventsPage('upcoming', pageUpcoming, PAGE_SIZE);
      setUpcomingEvents((prev) => [...prev, ...res.items]);
      setPageUpcoming((prev) => prev + 1);
      setHasMoreUpcoming(res.hasMore);
    } finally {
      setIsLoadingUpcoming(false);
    }
  };

  const loadMorePast = async () => {
    if (isLoadingPast || !hasMorePast) return;
    setIsLoadingPast(true);
    try {
      const res = await fetchEventsPage('past', pagePast, PAGE_SIZE);
      setPastEvents((prev) => [...prev, ...res.items]);
      setPagePast((prev) => prev + 1);
      setHasMorePast(res.hasMore);
    } finally {
      setIsLoadingPast(false);
    }
  };

  useEffect(() => {
    // On charge la première page des événements à venir au montage
    void loadMoreUpcoming();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Si l'utilisateur bascule sur "Passés" et qu'on n'a rien chargé, on charge.
    if (activeTab === 'past' && pastEvents.length === 0 && hasMorePast && !isLoadingPast) {
      void loadMorePast();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const eventsToDisplay = activeTab === 'upcoming' ? upcomingEvents : pastEvents;
  const isLoadingCurrentTab =
    activeTab === 'upcoming' ? isLoadingUpcoming : isLoadingPast;
  const hasMoreCurrentTab =
    activeTab === 'upcoming' ? hasMoreUpcoming : hasMorePast;

  const renderEventItem = ({ item }: ListRenderItemInfo<PartnerEvent>) => {
    const date = new Date(item.dateIso);
    const dateLabel = `${date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
    })} · ${date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    return (
      <View style={styles.eventItemCard}>
        <Text style={styles.eventItemTitle}>{item.title}</Text>
        <Text style={styles.eventItemDate}>{dateLabel}</Text>
        <Text style={styles.eventItemStatus}>
          {item.status === 'upcoming' ? 'À venir' : 'Passé'}
        </Text>
      </View>
    );
  };

  const handleEndReached = () => {
    if (!hasMoreCurrentTab || isLoadingCurrentTab) return;
    if (activeTab === 'upcoming') {
      void loadMoreUpcoming();
    } else {
      void loadMorePast();
    }
  };

  const ListHeader = () => (
    <View style={styles.profileHeaderContainer}>
      <Text style={styles.profileTitle}>Profil partenaire</Text>

      {/* Avatar */}
      <View style={styles.avatarRow}>
        <TouchableOpacity
          style={styles.avatarWrapper}
          activeOpacity={0.8}
          onPress={handlePickAvatar}
        >
          {partner?.avatarUrl ? (
            <Image
              source={{ uri: partner.avatarUrl }}
              style={styles.avatarImage}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarPlaceholderText}>
                {partner?.name?.[0]?.toUpperCase() ?? '?'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <View style={styles.avatarTextContainer}>
          <Text style={styles.avatarName}>{partner?.name}</Text>
          <Text style={styles.avatarEmail}>{partner?.email}</Text>
          <Text style={styles.avatarHint}>Appuie sur la photo pour la modifier</Text>
        </View>
      </View>

      {/* Formulaire infos profil */}
      <View style={styles.profileCard}>
        <Text style={styles.profileSectionTitle}>Informations générales</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Nom / Organisation</Text>
          <TextInput
            style={styles.input}
            value={editingName}
            onChangeText={setEditingName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Nom du lieu</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex : Le Loft du Vieux-Lille"
            placeholderTextColor="#9e9e9e"
            value={venueName}
            onChangeText={setVenueName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Adresse</Text>
          <TextInput
            style={styles.input}
            placeholder="Rue, numéro..."
            placeholderTextColor="#9e9e9e"
            value={venueAddress}
            onChangeText={setVenueAddress}
          />
        </View>

        <View style={styles.profileAddressRow}>
          <View style={[styles.inputGroup, styles.profileAddressCol]}>
            <Text style={styles.inputLabel}>Code postal</Text>
            <TextInput
              style={styles.input}
              placeholder="59000"
              placeholderTextColor="#9e9e9e"
              value={venueZip}
              onChangeText={setVenueZip}
              keyboardType="number-pad"
            />
          </View>
          <View style={[styles.inputGroup, styles.profileAddressCol]}>
            <Text style={styles.inputLabel}>Ville</Text>
            <TextInput
              style={styles.input}
              placeholder="Lille"
              placeholderTextColor="#9e9e9e"
              value={venueCity}
              onChangeText={setVenueCity}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            isSavingProfile && styles.submitButtonDisabled,
          ]}
          activeOpacity={0.85}
          onPress={handleSaveProfile}
          disabled={isSavingProfile}
        >
          {isSavingProfile ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitButtonText}>Enregistrer le profil</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Tabs événements */}
      <View style={styles.eventsHeader}>
        <Text style={styles.profileSectionTitle}>Mes événements</Text>
        <View style={styles.eventsTabsRow}>
          <TouchableOpacity
            style={[
              styles.eventsTabButton,
              activeTab === 'upcoming' && styles.eventsTabButtonActive,
            ]}
            onPress={() => setActiveTab('upcoming')}
          >
            <Text
              style={[
                styles.eventsTabText,
                activeTab === 'upcoming' && styles.eventsTabTextActive,
              ]}
            >
              À venir
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.eventsTabButton,
              activeTab === 'past' && styles.eventsTabButtonActive,
            ]}
            onPress={() => setActiveTab('past')}
          >
            <Text
              style={[
                styles.eventsTabText,
                activeTab === 'past' && styles.eventsTabTextActive,
              ]}
            >
              Passés
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const ListFooter = () => (
    <View style={styles.eventsFooter}>
      {isLoadingCurrentTab && <ActivityIndicator />}
      {!hasMoreCurrentTab && eventsToDisplay.length > 0 && (
        <Text style={styles.eventsEndText}>Fin de la liste</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={eventsToDisplay}
        keyExtractor={(item) => item.id}
        renderItem={renderEventItem}
        contentContainerStyle={styles.profileListContent}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
      />

      <View style={styles.logoutWrapper}>
        <TouchableOpacity
          style={styles.logoutButton}
          activeOpacity={0.85}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Se déconnecter</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default PartnerScreen;

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#555555',
  },

  // Auth
  authContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 16,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 4,
  },
  authSubtitle: {
    fontSize: 14,
    color: '#555555',
    marginBottom: 16,
  },
  authToggleRow: {
    flexDirection: 'row',
    borderRadius: 20,
    backgroundColor: '#f1f7ff',
    padding: 3,
    marginBottom: 12,
  },
  authToggleButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 16,
  },
  authToggleButtonActive: {
    backgroundColor: '#1e88e5',
  },
  authToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e88e5',
  },
  authToggleTextActive: {
    color: '#ffffff',
  },
  inputGroup: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#555555',
    marginBottom: 4,
  },
  input: {
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: '#fafafa',
  },
  submitButton: {
    marginTop: 10,
    borderRadius: 20,
    backgroundColor: '#1e88e5',
    paddingVertical: 10,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  toggleModeText: {
    marginTop: 12,
    fontSize: 13,
    color: '#1e88e5',
    textAlign: 'center',
  },

  // Profil
  profileListContent: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    paddingBottom: 80,
  },
  profileHeaderContainer: {
    marginBottom: 16,
  },
  profileTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 12,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  avatarWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#e3f2fd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
    backgroundColor: '#bbdefb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarTextContainer: {
    flex: 1,
  },
  avatarName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222222',
  },
  avatarEmail: {
    fontSize: 13,
    color: '#555555',
  },
  avatarHint: {
    fontSize: 12,
    color: '#999999',
    marginTop: 4,
  },
  profileCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 14,
    backgroundColor: '#ffffff',
    marginBottom: 16,
  },
  profileSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e88e5',
    marginBottom: 8,
  },
  profileAddressRow: {
    flexDirection: 'row',
    gap: 8,
  },
  profileAddressCol: {
    flex: 1,
  },

  // Events
  eventsHeader: {
    marginBottom: 8,
  },
  eventsTabsRow: {
    flexDirection: 'row',
    borderRadius: 18,
    backgroundColor: '#f1f7ff',
    padding: 3,
    alignSelf: 'flex-start',
  },
  eventsTabButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  eventsTabButtonActive: {
    backgroundColor: '#1e88e5',
  },
  eventsTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e88e5',
  },
  eventsTabTextActive: {
    color: '#ffffff',
  },
  eventItemCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#ffffff',
  },
  eventItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222222',
    marginBottom: 4,
  },
  eventItemDate: {
    fontSize: 12,
    color: '#555555',
    marginBottom: 2,
  },
  eventItemStatus: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1e88e5',
  },
  eventsFooter: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  eventsEndText: {
    fontSize: 12,
    color: '#999999',
  },

  // Logout
  logoutWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 16,
    alignItems: 'center',
  },
  logoutButton: {
    borderRadius: 20,
    backgroundColor: '#e53935',
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});
