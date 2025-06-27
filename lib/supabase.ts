import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  subscription_status: 'free' | 'premium';
  created_at: string;
  updated_at: string;
};

export type HealthRecord = {
  id: string;
  user_id: string;
  full_name: string;
  blood_type: string;
  allergies: string[];
  medications: string[];
  medical_conditions: string[];
  emergency_contacts: EmergencyContact[];
  data_hash: string;
  algorand_tx_id?: string;
  qr_code_id: string;
  user_algorand_address: string;
  created_at: string;
  updated_at: string;
  is_blockchain_verified?: boolean;
};

export type EmergencyContact = {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
};

export type HealthDocument = {
  id: string;
  user_id: string;
  filename: string;
  file_path: string;
  document_hash: string;
  verification_status: 'pending' | 'verified' | 'unverified';
  created_at: string;
};

export type PremiumFeature = {
  id: string;
  name: string;
  description: string;
  feature_key: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type UserSubscription = {
  id: string;
  user_id: string;
  subscription_type: 'free' | 'premium';
  features: string[];
  expires_at?: string;
  created_at: string;
  updated_at: string;
};
