import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { setupCryptoPolyfill } from '@/lib/crypto-polyfill';

export default function RootLayout() {
  useFrameworkReady();

  useEffect(() => {
    // Initialize crypto polyfills first
    setupCryptoPolyfill();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);

        if (session?.user) {
          // User is signed in
          useAuthStore.setState({ user: session.user });

          // Load or create profile
          const { loadProfile } = useAuthStore.getState();
          await loadProfile();
        } else {
          // User is signed out
          useAuthStore.setState({ user: null, profile: null });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="emergency/[id]" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}