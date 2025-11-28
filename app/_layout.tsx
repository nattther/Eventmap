import { AuthProvider } from '@/context/AuthContext';
import { Slot } from 'expo-router';
import React from 'react';



export default function RootLayout() {
  return (
    <AuthProvider>
      <Slot />
    </AuthProvider>
  );
}
