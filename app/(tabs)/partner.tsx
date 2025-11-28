// app/(tabs)/partner.tsx
import { useAuth } from '@/context/AuthContext';
import React, { useState } from 'react';
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

  // 🔹 Si déjà connecté en tant que partenaire → profil simple
  if (user && user.role === 'partner') {
    return <PartnerProfileScreen />;
  }

  // 🔹 Sinon → écran connexion / inscription partenaire
  return <PartnerAuthScreen />;
};

const PartnerAuthScreen: React.FC = () => {
  const { login, registerPartner, isLoading } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');

  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  // Adresse du lieu (obligatoire en inscription)
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
  }

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

        {/* Toggle Connexion / Inscription */}
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

        {/* Email + MDP */}
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

  const handleLogout = async () => {
    await logout();
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

          <Text style={styles.profileLabel}>Nom du lieu</Text>
          <Text style={styles.profileValue}>{user?.venueName ?? '-'}</Text>

          <Text style={styles.profileLabel}>Adresse du lieu</Text>
          <Text style={styles.profileValue}>
            {user?.venueAddress ?? '-'}
            {user?.venueZip || user?.venueCity
              ? `, ${user?.venueZip ?? ''} ${user?.venueCity ?? ''}`
              : ''}
          </Text>
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

  // Profil
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
