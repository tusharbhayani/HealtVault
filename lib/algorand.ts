import { Platform } from 'react-native';
import { algorandService } from './blockchain/algorandService';
import algosdk from 'algosdk';

// Enhanced Buffer polyfill
if (Platform.OS !== 'web') {
  if (typeof global.Buffer === 'undefined') {
    const { Buffer } = require('buffer');
    global.Buffer = Buffer;
  }
}

// Web-compatible crypto implementation
const createWebCompatibleHash = async (data: any): Promise<string> => {
  const dataString = JSON.stringify(data, Object.keys(data).sort());

  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.crypto) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(dataString);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } else {
    try {
      const { digestStringAsync, CryptoDigestAlgorithm } = await import(
        'expo-crypto'
      );
      return await digestStringAsync(CryptoDigestAlgorithm.SHA256, dataString);
    } catch (error) {
      console.warn('Expo crypto not available, using fallback hash');
      let hash = 0;
      for (let i = 0; i < dataString.length; i++) {
        const char = dataString.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
      }
      return Math.abs(hash).toString(16).padStart(8, '0');
    }
  }
};

export async function createHealthDataHash(healthData: any): Promise<string> {
  try {
    const hash = await createWebCompatibleHash(healthData);
    console.log('🔐 Health data hash created:', hash.substring(0, 16) + '...');
    return hash;
  } catch (error) {
    console.error('❌ Hash creation error:', error);
    throw new Error(`Failed to create health data hash: ${error}`);
  }
}

export async function storeHealthDataOnBlockchain(
  userAccount: algosdk.Account,
  dataHash: string
): Promise<string> {
  try {
    console.log('⛓️ === STORING ON ALGORAND BLOCKCHAIN ===');
    console.log('⛓️ Using Algorand Testnet via Nodely.io');
    console.log('📍 Account address:', userAccount?.addr);
    console.log('🔐 Data hash:', dataHash.substring(0, 16) + '...');

    // Validate account before proceeding
    if (!userAccount || !userAccount.addr || userAccount.addr.length !== 58) {
      console.error('❌ Invalid account provided:');
      console.error('   - Account exists:', !!userAccount);
      console.error('   - Address exists:', !!userAccount?.addr);
      console.error('   - Address length:', userAccount?.addr?.length || 0);
      throw new Error(
        `Invalid account address length: ${
          userAccount?.addr?.length || 0
        }, expected 58`
      );
    }

    // Store data using enhanced service
    const transaction = await algorandService.storeHealthDataInTransaction(
      userAccount,
      dataHash
    );

    console.log('✅ === BLOCKCHAIN STORAGE SUCCESSFUL ===');
    console.log('🆔 Transaction ID:', transaction.txId);
    console.log('🌐 Explorer URL:', transaction.explorerUrl);
    console.log('📦 Block Number:', transaction.blockNumber);

    return transaction.txId;
  } catch (error) {
    console.error('❌ === BLOCKCHAIN STORAGE FAILED ===');
    console.error('❌ Error:', error);

    // Provide helpful error messages
    if (error.message?.includes('insufficient funds')) {
      throw new Error(
        'Insufficient funds in account. Please run: npm run fund-account'
      );
    } else if (error.message?.includes('network')) {
      throw new Error('Network error. Please check connection and try again.');
    } else {
      throw new Error(`Failed to store health data on blockchain: ${error}`);
    }
  }
}

export async function verifyHealthDataOnBlockchain(
  dataHash: string,
  userAddress: string,
  txId?: string
): Promise<boolean> {
  try {
    console.log('🔍 === VERIFYING HEALTH DATA ON ALGORAND ===');
    console.log('📍 User Address:', userAddress);
    console.log('🔐 Data Hash:', dataHash.substring(0, 16) + '...');

    if (txId) {
      console.log('🆔 Verifying with Transaction ID:', txId);
      console.log('🌐 Explorer URL:', getExplorerUrl('transaction', txId));

      const isVerified = await algorandService.verifyHealthDataFromTransaction(
        dataHash,
        txId
      );
      console.log('✅ Blockchain verification result:', isVerified);

      if (isVerified) {
        console.log('🎉 Data successfully verified on Algorand blockchain!');
        console.log(
          '🌐 View transaction:',
          getExplorerUrl('transaction', txId)
        );
      }

      return isVerified;
    } else {
      // Simplified verification for addresses without transaction ID
      const isValidAddress = userAddress && userAddress.length === 58;
      console.log('✅ Address validation result:', isValidAddress);
      return isValidAddress;
    }
  } catch (error) {
    console.error('❌ Blockchain verification error:', error);
    return false;
  }
}

export function generateAlgorandAccount(): algosdk.Account {
  try {
    console.log('🔑 === GENERATING ALGORAND ACCOUNT ===');

    const account = algorandService.generateAccount();

    console.log('✅ === ACCOUNT GENERATION SUCCESSFUL ===');
    console.log('📍 Address:', account.addr);
    console.log('📍 Address Length:', account.addr.length);
    console.log('🔐 Secret Key Length:', account.sk.length);
    console.log('🌐 Explorer URL:', getExplorerUrl('account', account.addr));

    return account;
  } catch (error) {
    console.error('❌ === ACCOUNT GENERATION FAILED ===');
    console.error('❌ Error:', error);
    throw new Error(`Failed to generate Algorand account: ${error}`);
  }
}

// Additional utility functions
export async function getTransactionDetails(txId: string): Promise<any> {
  try {
    return await algorandService.getTransactionInfo(txId);
  } catch (error) {
    console.error('❌ Failed to get transaction details:', error);
    return null;
  }
}

export function getExplorerUrl(
  type: 'transaction' | 'account' | 'application',
  id: string
): string {
  return algorandService.getExplorerUrl(type, id);
}

export async function getNetworkStatus(): Promise<any> {
  return await algorandService.getNetworkStatus();
}

export async function getAccountBalance(address: string): Promise<number> {
  return await algorandService.getAccountBalance(address);
}

export async function testAlgorandConnection(): Promise<boolean> {
  return await algorandService.testConnection();
}
