import { create } from 'zustand';
import { supabase, PremiumFeature, UserSubscription } from '@/lib/supabase';
import { useAuthStore } from './useAuthStore';

interface PremiumState {
  features: PremiumFeature[];
  userSubscription: UserSubscription | null;
  loading: boolean;
  loadPremiumFeatures: () => Promise<void>;
  loadUserSubscription: () => Promise<void>;
  upgradeToPremium: () => Promise<void>;
  hasFeature: (featureKey: string) => boolean;
}

export const usePremiumStore = create<PremiumState>((set, get) => ({
  features: [],
  userSubscription: null,
  loading: false,

  loadPremiumFeatures: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('premium_features')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      set({ features: data || [] });
    } catch (error) {
      console.error('Load premium features error:', error);
      // Set default features if database fails
      set({
        features: [
          {
            id: '1',
            name: 'Voice Assistant',
            description: 'AI-powered voice interaction with your health data',
            feature_key: 'voice_assistant',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: '2',
            name: 'Document Verification',
            description: 'Blockchain-based document authenticity verification',
            feature_key: 'document_verification',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: '3',
            name: 'Unlimited Uploads',
            description: 'Upload unlimited health documents and records',
            feature_key: 'unlimited_uploads',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: '4',
            name: 'Priority Support',
            description: '24/7 priority customer support and assistance',
            feature_key: 'priority_support',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: '5',
            name: 'Advanced Analytics',
            description: 'Detailed health insights and trend analysis',
            feature_key: 'advanced_analytics',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
      });
    } finally {
      set({ loading: false });
    }
  },

  loadUserSubscription: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        set({ userSubscription: data });
      } else {
        // Create default free subscription
        const freeSubscription: Partial<UserSubscription> = {
          user_id: user.id,
          subscription_type: 'free',
          features: [],
        };

        const { data: newSubscription, error: createError } = await supabase
          .from('user_subscriptions')
          .insert(freeSubscription)
          .select()
          .single();

        if (!createError && newSubscription) {
          set({ userSubscription: newSubscription });
        }
      }
    } catch (error) {
      console.error('Load user subscription error:', error);
    }
  },

  upgradeToPremium: async () => {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error('User not authenticated');

    set({ loading: true });
    try {
      const premiumFeatures = get().features.map((f) => f.feature_key);

      const subscriptionData: Partial<UserSubscription> = {
        user_id: user.id,
        subscription_type: 'premium',
        features: premiumFeatures,
        expires_at: new Date(
          Date.now() + 365 * 24 * 60 * 60 * 1000
        ).toISOString(), // 1 year from now
      };

      const { data, error } = await supabase
        .from('user_subscriptions')
        .upsert(subscriptionData)
        .select()
        .single();

      if (error) throw error;

      // Also update the profile
      await useAuthStore
        .getState()
        .updateProfile({ subscription_status: 'premium' });

      set({ userSubscription: data });
    } catch (error) {
      console.error('Upgrade to premium error:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  hasFeature: (featureKey: string) => {
    const { userSubscription } = get();
    const profile = useAuthStore.getState().profile;

    // Check profile subscription status first
    if (profile?.subscription_status === 'premium') {
      return true;
    }

    // Check user subscription features
    return userSubscription?.features?.includes(featureKey) || false;
  },
}));
