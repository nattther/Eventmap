import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Partner = {
  id: string;
  name: string;
  email: string;
  // 🔹 nouveaux champs profil
  venueName?: string;
  venueAddress?: string;
  venueCity?: string;
  venueZip?: string;
  avatarUrl?: string; // URI d'image locale ou URL distante
};

type AuthContextValue = {
  partner: Partner | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (partial: Partial<Partner>) => Promise<void>; // 🔹 nouveau
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'partner_auth';

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [partner, setPartner] = useState<Partner | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadPartner = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partner;
          setPartner(parsed);
        }
      } catch (error) {
        console.warn('Erreur chargement partenaire :', error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadPartner();
  }, []);

  useEffect(() => {
    const persistPartner = async () => {
      try {
        if (partner) {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(partner));
        } else {
          await AsyncStorage.removeItem(STORAGE_KEY);
        }
      } catch (error) {
        console.warn('Erreur persistance partenaire :', error);
      }
    };

    void persistPartner();
  }, [partner]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const fakePartner: Partner = {
        id: `partner-${Date.now()}`,
        email,
        name: email.split('@')[0] || 'Partenaire',
      };
      setPartner(fakePartner);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      setIsLoading(true);
      try {
        const fakePartner: Partner = {
          id: `partner-${Date.now()}`,
          email,
          name,
        };
        setPartner(fakePartner);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    setPartner(null);
  }, []);

  const updateProfile = useCallback(
    async (partial: Partial<Partner>) => {
      // Ici tu peux faire un PATCH /partners/:id côté backend,
      // puis mettre à jour le state avec la réponse.
      setPartner((prev) => {
        if (!prev) return prev;
        return { ...prev, ...partial };
      });
    },
    [],
  );

  return (
    <AuthContext.Provider
      value={{
        partner,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
