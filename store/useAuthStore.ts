import { create } from 'zustand';
import { supabase, Profile } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    isPremium?: boolean
  ) => Promise<void>;
  signOut: () => Promise<void>;
  loadProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: false,

  signIn: async (email: string, password: string) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      set({ user: data.user });
      await get().loadProfile();
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  signUp: async (
    email: string,
    password: string,
    fullName: string,
    isPremium: boolean = false
  ) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            subscription_status: isPremium ? 'premium' : 'free',
          },
          emailRedirectTo: undefined,
        },
      });

      if (error) {
        if (
          error.message?.includes('already registered') ||
          error.message?.includes('already exists') ||
          error.message?.includes('User already registered')
        ) {
          throw new Error(
            'An account with this email already exists. Please sign in instead.'
          );
        }
        throw error;
      }

      if (!data.user) {
        throw new Error('Failed to create account. Please try again.');
      }

      set({ user: data.user });
      await get().loadProfile();
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut();
      set({ user: null, profile: null });
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  },

  loadProfile: async () => {
    const user = get().user;
    if (!user) return;

    try {
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create it
        const subscriptionStatus =
          user.user_metadata?.subscription_status || 'free';

        const profileData = {
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || 'User',
          subscription_status: subscriptionStatus as 'free' | 'premium',
        };

        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert(profileData)
          .select()
          .single();

        if (createError) {
          console.error('Profile creation error:', createError);
          // Set basic profile as fallback
          set({
            profile: {
              ...profileData,
              avatar_url: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          });
          return;
        }

        data = newProfile;
      } else if (error) {
        console.error('Load profile error:', error);
        return;
      }

      set({ profile: data });
    } catch (error) {
      console.error('Load profile error:', error);
    }
  },

  updateProfile: async (updates: Partial<Profile>) => {
    const user = get().user;
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      set({ profile: data });
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },
}));
