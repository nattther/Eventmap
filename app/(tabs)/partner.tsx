// app/(tabs)/partner.tsx
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';

import {
  subscribeToPartnerEvents,
  createEventForPartner,
  type EventDoc,
} from '@/services/eventsService';
import { useAuth } from '@/context/AuthContext';
import { buildFullAddressForGeocoding, geocodeAddressToLatLng } from '@/utils/geocoding';



type AuthMode = 'login' | 'register';

const PartnerScreen: React.FC = () => {
  const { user, isLoading } = useAuth();

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

  if (user && user.role === 'partner') {
    return <PartnerProfileScreen />;
  }

  return <PartnerAuthScreen />;
};

const PartnerAuthScreen: React.FC = () => {
  const { login, registerPartner, isLoading } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');

  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const [venueName, setVenueName] = useState<string>('');
  const [venueAddress, setVenueAddress] = useState<string>('');
  const [venueCity, setVenueCity] = useState<string>('');
  const [venueZip, setVenueZip] = useState<string>('');

  const handleSubmit = async () => {
    if (!email || !password || (mode === 'register' && !name)) {
      Alert.alert('Oups', 'Merci de remplir le nom, l’email et le mot de passe.');
      return;
    }

    if (
      mode === 'register' &&
      (!venueName.trim() ||
        !venueAddress.trim() ||
        !venueCity.trim() ||
        !venueZip.trim())
    ) {
      Alert.alert(
        'Adresse requise',
        "L'adresse du lieu est obligatoire pour créer un compte partenaire.",
      );
      return;
    }

    try {
      if (mode === 'login') {
        await login({ email: email.trim(), password });
      } else {
        await registerPartner({
          email: email.trim(),
          password,
          displayName: name.trim(),
          venueName: venueName.trim(),
          venueAddress: venueAddress.trim(),
          venueCity: venueCity.trim(),
          venueZip: venueZip.trim(),
        });
      }
    } catch (error: any) {
      console.warn('Erreur auth :', error);

      const code = error?.code as string | undefined;
      let message = "Une erreur est survenue lors de l'authentification.";

      switch (code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
          message = 'Email ou mot de passe incorrect.';
          break;
        case 'auth/user-not-found':
          message = "Aucun compte trouvé avec cet email.";
          break;
        case 'auth/too-many-requests':
          message = 'Trop de tentatives. Réessaie dans quelques minutes.';
          break;
        case 'auth/network-request-failed':
          message = 'Problème réseau. Vérifie ta connexion internet.';
          break;
        default:
          message = code ? `Erreur Firebase : ${code}` : message;
          break;
      }

      Alert.alert('Erreur', message);
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
          <>
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

            <View style={styles.addressRow}>
              <View style={[styles.inputGroup, styles.addressCol]}>
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
              <View style={[styles.inputGroup, styles.addressCol]}>
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
          </>
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
              {mode === 'login' ? 'Se connecter' : "Créer mon compte partenaire"}
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

const PartnerProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();

  const [events, setEvents] = useState<EventDoc[]>([]);

  const [newTitle, setNewTitle] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newDate, setNewDate] = useState<string>(''); // YYYY-MM-DD
  const [newStartTime, setNewStartTime] = useState<string>('18:00');
  const [newEndTime, setNewEndTime] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('');
  const [newCapacityText, setNewCapacityText] = useState<string>('');
  const [newPriceText, setNewPriceText] = useState<string>('');
  const [newIsFree, setNewIsFree] = useState<boolean>(true);

  const [eventVenueName, setEventVenueName] = useState<string>('');
  const [eventVenueAddress, setEventVenueAddress] = useState<string>('');
  const [eventVenueCity, setEventVenueCity] = useState<string>('');
  const [eventVenueZip, setEventVenueZip] = useState<string>('');

  const [isCreating, setIsCreating] = useState<boolean>(false);

  useEffect(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setNewDate(`${yyyy}-${mm}-${dd}`);
  }, []);

  useEffect(() => {
    if (user) {
      setEventVenueName(user.venueName ?? '');
      setEventVenueAddress(user.venueAddress ?? '');
      setEventVenueCity(user.venueCity ?? '');
      setEventVenueZip(user.venueZip ?? '');
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToPartnerEvents(user.uid, (items) => {
      setEvents(items);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogout = async () => {
    await logout();
  };

  const handleCreateEvent = async () => {
    if (!user) return;

    if (!newTitle.trim()) {
      Alert.alert('Titre manquant', "Merci de renseigner un titre d'événement.");
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate.trim())) {
      Alert.alert('Date invalide', 'Utilise le format YYYY-MM-DD (ex : 2025-12-31).');
      return;
    }

    if (!/^\d{2}:\d{2}$/.test(newStartTime.trim())) {
      Alert.alert(
        'Horaire invalide',
        "Utilise le format HH:MM pour l'horaire de début (ex : 18:30).",
      );
      return;
    }

    if (
      !eventVenueName.trim() ||
      !eventVenueAddress.trim() ||
      !eventVenueCity.trim() ||
      !eventVenueZip.trim()
    ) {
      Alert.alert(
        'Lieu incomplet',
        'Merci de compléter les informations du lieu pour cet événement.',
      );
      return;
    }

    const capacity =
      newCapacityText.trim().length > 0
        ? Number.parseInt(newCapacityText.trim(), 10) || 0
        : undefined;

    const price =
      !newIsFree && newPriceText.trim().length > 0
        ? Number.parseFloat(newPriceText.replace(',', '.')) || 0
        : 0;

    const title = newTitle.trim();
    const description = newDescription.trim();
    const date = newDate.trim();
    const startTime = newStartTime.trim();
    const endTime = newEndTime.trim() || undefined;
    const category = newCategory.trim() || undefined;
    const venueName = eventVenueName.trim();
    const venueAddress = eventVenueAddress.trim();
    const venueCity = eventVenueCity.trim();
    const venueZip = eventVenueZip.trim();

    try {
      setIsCreating(true);

      // 1️⃣ Construire l'adresse complète pour l'API
      const fullAddress = buildFullAddressForGeocoding({
        venueName,
        venueAddress,
        venueCity,
        venueZip,
      });

      // 2️⃣ Géocodage via Google (lat/lng)
      const { latitude, longitude } = await geocodeAddressToLatLng(fullAddress);

      // 3️⃣ Création dans Firestore AVEC les coordonnées
      await createEventForPartner(user, {
        title,
        description,
        date,
        startTime,
        endTime,
        category,
        capacity,
        price,
        currency: 'EUR',
        isFree: newIsFree,
        venueName,
        venueAddress,
        venueCity,
        venueZip,
        latitude,
        longitude,
      });

      // 4️⃣ Reset du formulaire
      setNewTitle('');
      setNewDescription('');
      setNewCategory('');
      setNewCapacityText('');
      setNewPriceText('');
      setNewIsFree(true);
    } catch (error: any) {
      console.warn('Erreur création événement :', error);

      Alert.alert(
        'Erreur',
        error?.message ??
          "Impossible de créer l'événement. Vérifie l'adresse, ton profil et ta connexion.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const formatDateLabel = (value?: string) => {
    if (!value) return '-';
    return value;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.profileContainer}>
        <Text style={styles.profileTitle}>Profil partenaire</Text>

        <View style={styles.profileCard}>
          <Text style={styles.profileLabel}>Nom / Organisation</Text>
          <Text style={styles.profileValue}>{user?.displayName}</Text>

          <Text style={styles.profileLabel}>Email</Text>
          <Text style={styles.profileValue}>{user?.email}</Text>

          <Text style={styles.profileLabel}>Nom du lieu (profil)</Text>
          <Text style={styles.profileValue}>{user?.venueName ?? '-'}</Text>

          <Text style={styles.profileLabel}>Adresse du lieu (profil)</Text>
          <Text style={styles.profileValue}>
            {user?.venueAddress ?? '-'}
            {user?.venueZip || user?.venueCity
              ? `, ${user?.venueZip ?? ''} ${user?.venueCity ?? ''}`
              : ''}
          </Text>
        </View>

        <View style={styles.profileCard}>
          <Text style={styles.profileSectionTitle}>Créer un événement</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Titre</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex : Apéro du vendredi"
              placeholderTextColor="#9e9e9e"
              value={newTitle}
              onChangeText={setNewTitle}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Décris l'ambiance, le programme, etc."
              placeholderTextColor="#9e9e9e"
              value={newDescription}
              onChangeText={setNewDescription}
              multiline
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Catégorie</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex : Apéro, Concert, Afterwork..."
              placeholderTextColor="#9e9e9e"
              value={newCategory}
              onChangeText={setNewCategory}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="2025-12-31"
              placeholderTextColor="#9e9e9e"
              value={newDate}
              onChangeText={setNewDate}
            />
          </View>

          <View style={styles.addressRow}>
            <View style={[styles.inputGroup, styles.addressCol]}>
              <Text style={styles.inputLabel}>Heure début (HH:MM)</Text>
              <TextInput
                style={styles.input}
                placeholder="18:00"
                placeholderTextColor="#9e9e9e"
                value={newStartTime}
                onChangeText={setNewStartTime}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputGroup, styles.addressCol]}>
              <Text style={styles.inputLabel}>Heure fin (optionnel)</Text>
              <TextInput
                style={styles.input}
                placeholder="21:00"
                placeholderTextColor="#9e9e9e"
                value={newEndTime}
                onChangeText={setNewEndTime}
                keyboardType="numeric"
              />
            </View>
          </View>

          <Text style={[styles.inputLabel, { marginTop: 8 }]}>
            Lieu de l&apos;événement
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nom du lieu</Text>
            <TextInput
              style={styles.input}
              value={eventVenueName}
              onChangeText={setEventVenueName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Adresse</Text>
            <TextInput
              style={styles.input}
              value={eventVenueAddress}
              onChangeText={setEventVenueAddress}
            />
          </View>

          <View style={styles.addressRow}>
            <View style={[styles.inputGroup, styles.addressCol]}>
              <Text style={styles.inputLabel}>Code postal</Text>
              <TextInput
                style={styles.input}
                value={eventVenueZip}
                onChangeText={setEventVenueZip}
              />
            </View>
            <View style={[styles.inputGroup, styles.addressCol]}>
              <Text style={styles.inputLabel}>Ville</Text>
              <TextInput
                style={styles.input}
                value={eventVenueCity}
                onChangeText={setEventVenueCity}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Capacité (nb de personnes)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex : 50"
              placeholderTextColor="#9e9e9e"
              value={newCapacityText}
              onChangeText={setNewCapacityText}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.inputLabel}>Événement gratuit ?</Text>
            <TouchableOpacity
              style={[
                styles.togglePill,
                newIsFree ? styles.togglePillOn : styles.togglePillOff,
              ]}
              activeOpacity={0.8}
              onPress={() => setNewIsFree((prev) => !prev)}
            >
              <Text
                style={[
                  styles.togglePillText,
                  newIsFree ? styles.togglePillTextOn : styles.togglePillTextOff,
                ]}
              >
                {newIsFree ? 'Gratuit' : 'Payant'}
              </Text>
            </TouchableOpacity>
          </View>

          {!newIsFree && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Prix (en €)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex : 10"
                placeholderTextColor="#9e9e9e"
                value={newPriceText}
                onChangeText={setNewPriceText}
                keyboardType="numeric"
              />
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              isCreating && styles.submitButtonDisabled,
            ]}
            activeOpacity={0.85}
            onPress={handleCreateEvent}
            disabled={isCreating}
          >
            {isCreating ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.secondaryButtonText}>
                Créer l&apos;événement
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.profileCard}>
          <Text style={styles.profileSectionTitle}>Mes événements</Text>

          {events.length === 0 ? (
            <Text style={styles.emptyEventsText}>
              Tu n&apos;as pas encore créé d&apos;événement.
            </Text>
          ) : (
            events.map((event) => (
              <View key={event.id} style={styles.eventItemCard}>
                <View style={styles.eventItemHeader}>
                  {event.isFree && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>Gratuit</Text>
                    </View>
                  )}
                  <Text style={styles.eventItemTitle}>{event.title}</Text>
                </View>

                <Text style={styles.eventItemInfo}>
                  {event.date
                    ? `Le ${formatDateLabel(event.date)} à ${
                        event.startTime ?? '—'
                      }`
                    : event.startTime
                    ? `Horaire : ${event.startTime}`
                    : 'Horaire non renseigné'}
                </Text>

                {event.category && (
                  <Text style={styles.eventItemInfo}>
                    Catégorie : {event.category}
                  </Text>
                )}

                {event.isFree ? (
                  <Text style={styles.eventItemInfo}>Prix : Gratuit</Text>
                ) : (
                  <Text style={styles.eventItemInfo}>
                    Prix : {event.price ?? '-'} €
                  </Text>
                )}

                {event.capacity && (
                  <Text style={styles.eventItemInfo}>
                    Capacité : {event.capacity} personnes
                  </Text>
                )}

                <Text style={styles.eventItemInfo}>
                  Lieu : {event.venueName} - {event.venueCity}
                </Text>
              </View>
            ))
          )}
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          activeOpacity={0.85}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Se déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>
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
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  addressRow: {
    flexDirection: 'row',
    gap: 8,
  },
  addressCol: {
    flex: 1,
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

  // Profil + events
  profileContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 16,
  },
  profileTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 8,
  },
  profileCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 14,
    backgroundColor: '#ffffff',
    marginBottom: 12,
  },
  profileLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#777777',
    marginTop: 4,
  },
  profileValue: {
    fontSize: 14,
    color: '#222222',
  },
  profileSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e88e5',
    marginBottom: 8,
  },

  secondaryButton: {
    marginTop: 10,
    borderRadius: 20,
    backgroundColor: '#1e88e5',
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 4,
  },
  togglePill: {
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
  },
  togglePillOn: {
    backgroundColor: '#e8f5e9',
    borderColor: '#43a047',
  },
  togglePillOff: {
    backgroundColor: '#ffebee',
    borderColor: '#e53935',
  },
  togglePillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  togglePillTextOn: {
    color: '#2e7d32',
  },
  togglePillTextOff: {
    color: '#c62828',
  },

  emptyEventsText: {
    fontSize: 13,
    color: '#777777',
  },
  eventItemCard: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 10,
    backgroundColor: '#ffffff',
  },
  eventItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  eventItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222222',
  },
  eventItemInfo: {
    fontSize: 12,
    color: '#555555',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: '#00e676',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },

  logoutButton: {
    marginTop: 16,
    borderRadius: 20,
    backgroundColor: '#e53935',
    paddingVertical: 10,
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});
