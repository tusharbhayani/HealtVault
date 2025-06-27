import { Platform } from 'react-native';

// Helper function to detect if data is an Algorand account
function isAlgorandAccount(data: any): boolean {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.addr === 'string' &&
    data.addr.length === 58 &&
    data.sk !== undefined
  );
}

// Helper function to serialize Algorand account for storage
function serializeAlgorandAccount(account: any): any {
  if (!isAlgorandAccount(account)) {
    return account;
  }

  return {
    ...account,
    sk:
      account.sk instanceof Uint8Array
        ? Array.from(account.sk) // Convert Uint8Array to regular array
        : account.sk,
    _isAlgorandAccount: true, // Flag to identify during deserialization
  };
}

// Helper function to deserialize Algorand account from storage
function deserializeAlgorandAccount(data: any): any {
  if (!data || typeof data !== 'object' || !data._isAlgorandAccount) {
    return data;
  }

  return {
    ...data,
    sk: Array.isArray(data.sk)
      ? new Uint8Array(data.sk) // Convert array back to Uint8Array
      : data.sk,
    _isAlgorandAccount: undefined, // Remove the flag
  };
}

// Web-compatible encryption implementation
const createWebCompatibleEncryption = async (
  data: string,
  key: string
): Promise<string> => {
  if (Platform.OS === 'web') {
    // Simple base64 encoding for web (in production, use proper encryption)
    return btoa(data);
  } else {
    // Use expo-secure-store for native platforms
    return data; // SecureStore handles encryption internally
  }
};

const createWebCompatibleDecryption = async (
  encryptedData: string,
  key: string
): Promise<string> => {
  if (Platform.OS === 'web') {
    // Simple base64 decoding for web
    try {
      return atob(encryptedData);
    } catch {
      return encryptedData; // Return as-is if not base64
    }
  } else {
    return encryptedData; // SecureStore handles decryption internally
  }
};

export async function encryptAndStore(key: string, data: any): Promise<void> {
  try {
    // Serialize Algorand account if needed
    const serializedData = serializeAlgorandAccount(data);
    const jsonString = JSON.stringify(serializedData);

    if (Platform.OS === 'web') {
      // Use localStorage for web
      const encrypted = await createWebCompatibleEncryption(jsonString, key);
      localStorage.setItem(key, encrypted);
    } else {
      // Use expo-secure-store for native
      const SecureStore = await import('expo-secure-store');
      await SecureStore.setItemAsync(key, jsonString);
    }
  } catch (error) {
    console.error('Encryption/storage error:', error);
    throw error;
  }
}

export async function retrieveAndDecrypt(key: string): Promise<any> {
  try {
    let encrypted: string | null = null;

    if (Platform.OS === 'web') {
      // Use localStorage for web
      encrypted = localStorage.getItem(key);
    } else {
      // Use expo-secure-store for native
      const SecureStore = await import('expo-secure-store');
      encrypted = await SecureStore.getItemAsync(key);
    }

    if (!encrypted) return null;

    const decrypted = await createWebCompatibleDecryption(encrypted, key);
    const parsedData = JSON.parse(decrypted);

    // Deserialize Algorand account if needed
    return deserializeAlgorandAccount(parsedData);
  } catch (error) {
    console.error('Decryption/retrieval error:', error);
    return null;
  }
}

export async function clearSecureStorage(): Promise<void> {
  try {
    const keys = ['health_data', 'algorand_account', 'user_preferences'];

    if (Platform.OS === 'web') {
      // Clear localStorage for web
      keys.forEach((key) => localStorage.removeItem(key));
    } else {
      // Clear expo-secure-store for native
      const SecureStore = await import('expo-secure-store');
      for (const key of keys) {
        await SecureStore.deleteItemAsync(key);
      }
    }
  } catch (error) {
    console.error('Clear storage error:', error);
  }
}
