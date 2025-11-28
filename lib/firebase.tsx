// lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';


const firebaseConfig = {
  apiKey: "AIzaSyASnHoibepEtcy0iJpZosIIzitHrhrjHLs",
  authDomain: "event-project-dadce.firebaseapp.com",
  projectId: "event-project-dadce",
  storageBucket: "event-project-dadce.firebasestorage.app",
  messagingSenderId: "859508948058",
  appId: "1:859508948058:web:2f48b2e052c2e316f0ec63",
  measurementId: "G-KER7J3NVB2"
};


// Évite de réinitialiser l'app si elle existe déjà (fast refresh Expo)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);
