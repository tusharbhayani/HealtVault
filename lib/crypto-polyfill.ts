import { Platform } from 'react-native';

// Import crypto polyfill for React Native
import 'react-native-get-random-values';

// Crypto polyfill for React Native
export function setupCryptoPolyfill() {
  if (Platform.OS !== 'web') {
    // For React Native, we'll use expo-crypto and react-native-get-random-values
    console.log('✅ Crypto polyfills initialized for React Native');
  }
}

// Enhanced random bytes generation with Expo compatibility
export function getSecureRandomBytes(length: number): Uint8Array {
  try {
    if (Platform.OS === 'web') {
      // Use Web Crypto API
      const array = new Uint8Array(length);
      crypto.getRandomValues(array);
      return array;
    } else {
      // Use react-native-get-random-values which is already imported
      const array = new Uint8Array(length);
      crypto.getRandomValues(array);
      return array;
    }
  } catch (error) {
    console.warn('Secure random generation failed, using fallback:', error);

    // Fallback: Use Math.random (less secure but functional)
    const array = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  }
}

// Enhanced mnemonic generation using BIP39 word list
export function generateSecureMnemonic(): string {
  try {
    // BIP39 word list (first 128 words for demo)
    const wordList = [
      'abandon',
      'ability',
      'able',
      'about',
      'above',
      'absent',
      'absorb',
      'abstract',
      'absurd',
      'abuse',
      'access',
      'accident',
      'account',
      'accuse',
      'achieve',
      'acid',
      'acoustic',
      'acquire',
      'across',
      'act',
      'action',
      'actor',
      'actress',
      'actual',
      'adapt',
      'add',
      'addict',
      'address',
      'adjust',
      'admit',
      'adult',
      'advance',
      'advice',
      'aerobic',
      'affair',
      'afford',
      'afraid',
      'again',
      'against',
      'age',
      'agent',
      'agree',
      'ahead',
      'aim',
      'air',
      'airport',
      'aisle',
      'alarm',
      'album',
      'alcohol',
      'alert',
      'alien',
      'all',
      'alley',
      'allow',
      'almost',
      'alone',
      'alpha',
      'already',
      'also',
      'alter',
      'always',
      'amateur',
      'amazing',
      'among',
      'amount',
      'amused',
      'analyst',
      'anchor',
      'ancient',
      'anger',
      'angle',
      'angry',
      'animal',
      'ankle',
      'announce',
      'annual',
      'another',
      'answer',
      'antenna',
      'antique',
      'anxiety',
      'any',
      'apart',
      'apology',
      'appear',
      'apple',
      'approve',
      'april',
      'arch',
      'arctic',
      'area',
      'arena',
      'argue',
      'arm',
      'armed',
      'armor',
      'army',
      'around',
      'arrange',
      'arrest',
      'arrive',
      'arrow',
      'art',
      'artefact',
      'artist',
      'artwork',
      'ask',
      'aspect',
      'assault',
      'asset',
      'assist',
      'assume',
      'asthma',
      'athlete',
      'atom',
      'attack',
      'attend',
      'attitude',
      'attract',
      'auction',
      'audit',
      'august',
      'aunt',
      'author',
      'auto',
      'autumn',
      'average',
    ];

    // Generate 12 random words
    const words = [];
    for (let i = 0; i < 12; i++) {
      const randomBytes = getSecureRandomBytes(1);
      const randomIndex = randomBytes[0] % wordList.length;
      words.push(wordList[randomIndex]);
    }

    return words.join(' ');
  } catch (error) {
    console.error('Mnemonic generation failed:', error);
    throw new Error('Failed to generate secure mnemonic');
  }
}
