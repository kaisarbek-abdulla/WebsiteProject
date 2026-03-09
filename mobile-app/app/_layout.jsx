import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { AuthProvider, AuthContext } from '../contexts/AuthContext';
import { useContext } from 'react';

function RootLayout() {
  const auth = useContext(AuthContext);

  return (
    <Stack>
      <Stack.Screen
        name="(auth)"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="(tabs)"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}

export default function Root() {
  return (
    <AuthProvider>
      <RootLayout />
    </AuthProvider>
  );
}
