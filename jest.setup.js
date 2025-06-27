import 'react-native-gesture-handler/jestSetup';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock expo modules
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-crypto', () => ({
  digestStringAsync: jest.fn(() => Promise.resolve('mocked-hash')),
}));

jest.mock('expo-av', () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn(() => Promise.resolve({
        sound: {
          playAsync: jest.fn(),
          unloadAsync: jest.fn(),
          setOnPlaybackStatusUpdate: jest.fn(),
        }
      })),
    },
  },
}));

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(() => Promise.resolve({
    canceled: false,
    assets: [{ name: 'test.pdf', uri: 'file://test.pdf' }]
  })),
}));

// Mock QR Code component
jest.mock('react-native-qrcode-svg', () => 'QRCode');

// Mock Algorand SDK
jest.mock('algosdk', () => ({
  generateAccount: jest.fn(() => ({
    addr: 'mock-address',
    sk: new Uint8Array(64),
  })),
  makePaymentTxnWithSuggestedParamsFromObject: jest.fn(() => ({
    signTxn: jest.fn(() => new Uint8Array(100)),
  })),
  waitForConfirmation: jest.fn(() => Promise.resolve()),
  Algodv2: jest.fn(() => ({
    getTransactionParams: jest.fn(() => ({
      do: jest.fn(() => Promise.resolve({})),
    })),
    sendRawTransaction: jest.fn(() => ({
      do: jest.fn(() => Promise.resolve({ txId: 'mock-tx-id' })),
    })),
    pendingTransactionInformation: jest.fn(() => ({
      do: jest.fn(() => Promise.resolve({ note: 'SGVhbHRoX0RhdGE6bW9jay1oYXNo' })),
    })),
  })),
}));

// Silence the warning: Animated: `useNativeDriver` is not supported
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);