declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_SUPABASE_URL: string;
      EXPO_PUBLIC_SUPABASE_ANON_KEY: string;
      EXPO_PUBLIC_ALGORAND_SERVER: string;
      EXPO_PUBLIC_ALGORAND_TOKEN: string;
      EXPO_PUBLIC_ALGORAND_PORT: string;
      EXPO_PUBLIC_ALGORAND_APP_ID: string;
      EXPO_PUBLIC_ELEVENLABS_API_KEY: string;
      EXPO_PUBLIC_ELEVENLABS_VOICE_ID: string;
      EXPO_PUBLIC_REVENUECAT_API_KEY: string;
      EXPO_PUBLIC_IPFS_API_ENDPOINT: string;
      EXPO_PUBLIC_IPFS_API_KEY: string;
    }
  }
}

export {};
