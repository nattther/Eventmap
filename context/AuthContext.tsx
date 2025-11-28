// contexts/AuthContext.tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile as firebaseUpdateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

import { auth, firestore } from '@/lib/firebase';

export type UserRole = 'user' | 'partner';

export type AppUser = {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;

  // 🔹 Adresse de base du lieu partenaire (sert pour tous ses événements)
  venueName?: string;
  venueAddress?: string;
  venueCity?: string;
  venueZip?: string;

  avatarUrl?: string;
};

type AuthContextValue = {
  user: AppUser | null;
  isLoading: boolean;

  registerUser: (params: {
    email: string;
    password: string;
    displayName: string;
  }) => Promise<void>;

  registerPartner: (params: {
    email: string;
    password: string;
    displayName: string;
    venueName: string;
    venueAddress: string;
    venueCity: string;
    venueZip: string;
  }) => Promise<void>;

  login: (params: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (partial: Partial<AppUser>) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

const USERS_COLLECTION = 'users';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const buildAppUserFromFirebase = useCallback(
    (firebaseUser: FirebaseUser, userDocData?: any): AppUser => {
      const base: AppUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email ?? userDocData?.email ?? '',
        displayName:
          userDocData?.displayName ??
          firebaseUser.displayName ??
          firebaseUser.email?.split('@')[0] ??
          'Utilisateur',
        role: (userDocData?.role as UserRole) ?? 'user',

        venueName: userDocData?.venueName ?? undefined,
        venueAddress: userDocData?.venueAddress ?? undefined,
        venueCity: userDocData?.venueCity ?? undefined,
        venueZip: userDocData?.venueZip ?? undefined,

        avatarUrl: userDocData?.avatarUrl ?? undefined,
      };

      return base;
    },
    [],
  );

  // 🔹 Écoute globale de l'état de connexion Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const ref = doc(firestore, USERS_COLLECTION, firebaseUser.uid);
        const snap = await getDoc(ref);
        const data = snap.exists() ? snap.data() : undefined;

        const appUser = buildAppUserFromFirebase(firebaseUser, data);
        setUser(appUser);
      } catch (error) {
        console.warn('Erreur chargement profil utilisateur :', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [buildAppUserFromFirebase]);

  const createUserDocument = useCallback(
    async (params: {
      firebaseUser: FirebaseUser;
      role: UserRole;
      displayName: string;
      extraProfile?: Partial<AppUser>;
    }) => {
      const { firebaseUser, role, displayName, extraProfile } = params;
      const ref = doc(firestore, USERS_COLLECTION, firebaseUser.uid);

      await setDoc(
        ref,
        {
          email: firebaseUser.email,
          displayName,
          role,
          venueName: extraProfile?.venueName ?? null,
          venueAddress: extraProfile?.venueAddress ?? null,
          venueCity: extraProfile?.venueCity ?? null,
          venueZip: extraProfile?.venueZip ?? null,
          avatarUrl: extraProfile?.avatarUrl ?? null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    },
    [],
  );

  const registerBase = useCallback(
    async (params: {
      email: string;
      password: string;
      displayName: string;
      role: UserRole;
      extraProfile?: Partial<AppUser>;
    }) => {
      const { email, password, displayName, role, extraProfile } = params;
      setIsLoading(true);

      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);

        await firebaseUpdateProfile(cred.user, {
          displayName,
        });

        await createUserDocument({
          firebaseUser: cred.user,
          role,
          displayName,
          extraProfile,
        });
        // onAuthStateChanged mettra `user` à jour
      } finally {
        setIsLoading(false);
      }
    },
    [createUserDocument],
  );

  const registerUser: AuthContextValue['registerUser'] = useCallback(
    async ({ email, password, displayName }) => {
      await registerBase({
        email,
        password,
        displayName,
        role: 'user',
      });
    },
    [registerBase],
  );

  const registerPartner: AuthContextValue['registerPartner'] = useCallback(
    async ({ email, password, displayName, venueName, venueAddress, venueCity, venueZip }) => {
      await registerBase({
        email,
        password,
        displayName,
        role: 'partner',
        extraProfile: {
          venueName,
          venueAddress,
          venueCity,
          venueZip,
        },
      });
    },
    [registerBase],
  );

  const login: AuthContextValue['login'] = useCallback(async ({ email, password }) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout: AuthContextValue['logout'] = useCallback(async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile: AuthContextValue['updateProfile'] = useCallback(
    async (partial) => {
      if (!user) return;

      const ref = doc(firestore, USERS_COLLECTION, user.uid);

      const payload: Record<string, unknown> = {
        ...partial,
        updatedAt: serverTimestamp(),
      };

      delete payload.uid;

      await updateDoc(ref, payload);

      setUser((prev) =>
        prev
          ? {
              ...prev,
              ...partial,
            }
          : prev,
      );

      if (partial.displayName) {
        const current = auth.currentUser;
        if (current) {
          await firebaseUpdateProfile(current, {
            displayName: partial.displayName,
          });
        }
      }
    },
    [user],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        registerUser,
        registerPartner,
        login,
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
