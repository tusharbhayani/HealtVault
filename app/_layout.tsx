import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { setupCryptoPolyfill } from '@/lib/crypto-polyfill';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function RootLayout() {
  useFrameworkReady();

  const { user, isAuthInitialized, setAuthInitialized } = useAuthStore();

  useEffect(() => {
    const init = async () => {
      setupCryptoPolyfill();

      try {
        // ✅ Fetch initial session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.warn("Session fetch error:", error.message);
        }

        if (session?.user) {
          useAuthStore.setState({ user: session.user });
          const { loadProfile } = useAuthStore.getState();
          await loadProfile();
        } else {
          // ✅ Important: explicitly reset state
          useAuthStore.setState({ user: null, profile: null });
        }

        // ✅ Subscribe to future auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (session?.user) {
              useAuthStore.setState({ user: session.user });
              const { loadProfile } = useAuthStore.getState();
              await loadProfile();
            } else {
              useAuthStore.setState({ user: null, profile: null });
            }

            setAuthInitialized(true); // 👈 Also move this inside here to ensure it waits
          }
        );

        setAuthInitialized(true); // ✅ Now safe to mark as initialized

        return () => subscription.unsubscribe();
      } catch (err) {
        console.error("Auth init error:", err);
        useAuthStore.setState({ user: null, profile: null });
        setAuthInitialized(true);
      }
    };

    init();
  }, [setAuthInitialized]);

  if (!isAuthInitialized) {
    return <LoadingSpinner message="Loading..." />;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="emergency/[id]" />
          </>
        ) : (
          <Stack.Screen name="(auth)" />
        )}
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
