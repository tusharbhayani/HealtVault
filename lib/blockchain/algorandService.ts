import algosdk from 'algosdk';
import { Platform } from 'react-native';

// React Native compatible polyfills
if (Platform.OS !== 'web') {
  if (typeof global.Buffer === 'undefined') {
    const { Buffer } = require('buffer');
    global.Buffer = Buffer;
  }
}

export interface AlgorandConfig {
  server: string;
  port: number;
  token: string;
  network: 'testnet' | 'mainnet' | 'betanet';
}

export interface HealthDataTransaction {
  txId: string;
  blockNumber: number;
  timestamp: string;
  dataHash: string;
  userAddress: string;
  verified: boolean;
  explorerUrl: string;
}

export class AlgorandBlockchainService {
  private algodClient: algosdk.Algodv2;
  private config: AlgorandConfig;

  constructor(config?: AlgorandConfig) {
    // Use multiple reliable API endpoints with fallback
    this.config = config || {
      server: 'https://testnet-api.4160.nodely.dev',
      port: 443,
      token: '', // Nodely.io doesn't require token for testnet
      network: 'testnet',
    };

    this.algodClient = new algosdk.Algodv2(
      this.config.token,
      this.config.server,
      this.config.port
    );

    console.log('🔗 Algorand Service initialized:', {
      network: this.config.network,
      server: this.config.server,
    });
  }

  // Enhanced account generation with multiple fallbacks
  generateAccount(): algosdk.Account {
    console.log('🔑 === STARTING ACCOUNT GENERATION ===');

    try {
      // Method 1: Direct algosdk generation
      const account = algosdk.generateAccount();

      console.log('🔍 Generated account details:');
      console.log('   - Address:', account.addr);
      console.log('   - Address length:', account.addr?.length);
      console.log('   - SK length:', account.sk?.length);

      // Validate the account
      if (!this.isValidAccount(account)) {
        console.error('❌ Generated account failed validation');
        throw new Error('Generated account is invalid');
      }

      console.log('✅ Account generation successful!');
      return account;
    } catch (error) {
      console.error('❌ Direct generation failed:', error);
      return this.generateAccountFromMnemonic();
    }
  }

  // Alternative generation method using mnemonic
  private generateAccountFromMnemonic(): algosdk.Account {
    try {
      console.log('📝 Generating account from mnemonic...');

      const mnemonic = algosdk.generateMnemonic();
      const account = algosdk.mnemonicToSecretKey(mnemonic);

      console.log('🔍 Mnemonic-based account:');
      console.log('   - Address:', account.addr);
      console.log('   - Address length:', account.addr?.length);

      if (!this.isValidAccount(account)) {
        throw new Error('Mnemonic-based account is also invalid');
      }

      console.log('✅ Mnemonic-based generation successful!');
      return account;
    } catch (error) {
      console.error('❌ Mnemonic generation failed:', error);
      throw new Error(`All account generation methods failed: ${error}`);
    }
  }

  // Enhanced account validation
  private isValidAccount(account: any): boolean {
    try {
      if (!account || !account.addr || typeof account.addr !== 'string') {
        console.error('❌ Invalid address:', account?.addr);
        return false;
      }

      if (account.addr.length !== 58) {
        console.error('❌ Invalid address length:', account.addr.length);
        return false;
      }

      if (
        !account.sk ||
        !(account.sk instanceof Uint8Array) ||
        account.sk.length !== 64
      ) {
        console.error('❌ Invalid secret key');
        return false;
      }

      // Test address checksum
      try {
        algosdk.decodeAddress(account.addr);
        console.log('✅ Address checksum validation passed');
      } catch (checksumError) {
        console.error('❌ Address checksum validation failed:', checksumError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Account validation error:', error);
      return false;
    }
  }

  // Enhanced funding with multiple dispensers and better error handling
  async ensureAccountFunded(address: string): Promise<boolean> {
    try {
      console.log('💰 === CHECKING ACCOUNT FUNDING ===');
      console.log('📍 Address:', address);

      // Check current balance
      const accountInfo = await this.getAccountInfo(address);
      const currentBalance = accountInfo?.amount || 0;
      console.log('💰 Current balance:', currentBalance, 'microAlgos');

      const minimumBalance = 100000; // 0.1 ALGO

      if (currentBalance >= minimumBalance) {
        console.log('✅ Account has sufficient balance');
        return true;
      }

      console.log('💰 Account needs funding, trying dispensers...');

      // Try multiple funding sources with better error handling
      const fundingSources = [
        {
          name: 'Algorand Testnet Dispenser',
          url: 'https://dispenser.testnet.aws.algodev.network/',
          method: 'POST',
          body: `account=${address}`,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        },
        {
          name: 'Algorand Bank',
          url: 'https://bank.testnet.algorand.network/',
          method: 'POST',
          body: `account=${address}`,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        },
        {
          name: 'AlgoExplorer Faucet',
          url: 'https://testnet.algoexplorerapi.io/v1/faucet',
          method: 'POST',
          body: JSON.stringify({ account: address }),
          headers: { 'Content-Type': 'application/json' },
        },
      ];

      let funded = false;

      for (const dispenser of fundingSources) {
        try {
          console.log(`💰 Trying ${dispenser.name}...`);

          const response = await fetch(dispenser.url, {
            method: dispenser.method,
            headers: dispenser.headers,
            body: dispenser.body,
          });

          console.log(`📡 Response status: ${response.status}`);

          if (response.ok || response.status === 200) {
            console.log(`✅ Funding request sent to ${dispenser.name}`);
            funded = true;

            // Wait for funding to be processed
            console.log('⏳ Waiting for funding to process...');
            await new Promise((resolve) => setTimeout(resolve, 8000));

            // Verify funding
            const updatedInfo = await this.getAccountInfo(address);
            const newBalance = updatedInfo?.amount || 0;
            console.log('💰 Updated balance:', newBalance, 'microAlgos');

            if (newBalance >= minimumBalance) {
              console.log('🎉 Funding successful!');
              return true;
            }
          } else {
            const errorText = await response
              .text()
              .catch(() => 'Unknown error');
            console.warn(
              `⚠️ ${dispenser.name} failed: ${response.status} - ${errorText}`
            );
          }
        } catch (dispenserError) {
          console.warn(`⚠️ ${dispenser.name} error:`, dispenserError.message);
          continue;
        }
      }

      if (!funded) {
        console.warn('⚠️ All funding sources failed or are rate-limited');
        console.log('💡 Manual funding options:');
        console.log(
          '   1. Visit: https://dispenser.testnet.aws.algodev.network/'
        );
        console.log('   2. Visit: https://bank.testnet.algorand.network/');
        console.log(`   3. Address: ${address}`);
        return false;
      }

      return funded;
    } catch (error) {
      console.warn('⚠️ Could not check/fund account:', error);
      return false;
    }
  }

  // Get account info with better error handling
  async getAccountInfo(address: string): Promise<any> {
    try {
      return await this.algodClient.accountInformation(address).do();
    } catch (error) {
      // Account might not exist yet (0 balance)
      if (error.message?.includes('account does not exist')) {
        return { amount: 0 };
      }
      throw error;
    }
  }

  // Store health data with enhanced error handling and retry logic
  async storeHealthDataInTransaction(
    userAccount: algosdk.Account,
    dataHash: string
  ): Promise<HealthDataTransaction> {
    console.log('💾 === STORING HEALTH DATA ON ALGORAND ===');

    // Validate account
    if (!this.isValidAccount(userAccount)) {
      throw new Error('Invalid account provided for transaction');
    }

    console.log('📍 User Address:', userAccount.addr);
    console.log('🔐 Data Hash:', dataHash.substring(0, 16) + '...');

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      attempts++;
      console.log(`🔄 Transaction attempt ${attempts}/${maxAttempts}`);

      try {
        // Fund account if needed (for testnet only)
        if (this.config.network === 'testnet') {
          const fundingSuccess = await this.ensureAccountFunded(
            userAccount.addr
          );
          if (!fundingSuccess) {
            console.warn(
              '⚠️ Account funding failed, but continuing with transaction...'
            );
          }
        }

        // Get transaction parameters with retry
        console.log('📋 Getting transaction parameters...');
        const suggestedParams = await this.getTransactionParamsWithRetry();

        // Create transaction note with metadata
        const noteData = {
          type: 'HEALTH_DATA',
          hash: dataHash,
          timestamp: Date.now(),
          version: '1.0',
        };
        const noteText = JSON.stringify(noteData);
        const note = new TextEncoder().encode(noteText);

        // Create payment transaction (0 ALGO to self with note)
        const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
          from: userAccount.addr,
          to: userAccount.addr,
          amount: 0,
          note: note,
          suggestedParams: suggestedParams,
        });

        // Sign transaction
        console.log('✍️ Signing transaction...');
        const signedTxn = txn.signTxn(userAccount.sk);

        // Submit transaction
        console.log('📤 Submitting transaction...');
        const { txId } = await this.algodClient
          .sendRawTransaction(signedTxn)
          .do();
        console.log('🆔 Transaction ID:', txId);

        // Wait for confirmation with timeout
        console.log('⏳ Waiting for confirmation...');
        const confirmedTxn = await this.waitForConfirmationWithTimeout(
          txId,
          10
        );

        const transaction: HealthDataTransaction = {
          txId,
          blockNumber: confirmedTxn['confirmed-round'],
          timestamp: new Date().toISOString(),
          dataHash,
          userAddress: userAccount.addr,
          verified: true,
          explorerUrl: this.getExplorerUrl('transaction', txId),
        };

        console.log('✅ === HEALTH DATA STORED SUCCESSFULLY ===');
        console.log('🌐 Explorer URL:', transaction.explorerUrl);
        console.log('📦 Block Number:', transaction.blockNumber);

        return transaction;
      } catch (error) {
        console.error(`❌ Attempt ${attempts} failed:`, error);

        // Provide specific error guidance
        if (error.message?.includes('insufficient funds')) {
          console.log('💡 Try running: npm run fund-account');
        } else if (error.message?.includes('network')) {
          console.log('💡 Network issue - check connection');
        }

        if (attempts === maxAttempts) {
          throw new Error(
            `Failed to store health data after ${maxAttempts} attempts: ${error.message}`
          );
        }

        // Wait before retry with exponential backoff
        await new Promise((resolve) => setTimeout(resolve, 2000 * attempts));
      }
    }

    throw new Error('Maximum attempts exceeded');
  }

  // Get transaction parameters with retry logic
  private async getTransactionParamsWithRetry(): Promise<algosdk.SuggestedParams> {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const params = await this.algodClient.getTransactionParams().do();
        console.log('✅ Transaction parameters retrieved');
        return params;
      } catch (error) {
        console.error(
          `❌ Failed to get transaction params (attempt ${attempts}):`,
          error
        );

        if (attempts === maxAttempts) {
          throw error;
        }

        await new Promise((resolve) => setTimeout(resolve, 1000 * attempts));
      }
    }

    throw new Error('Failed to get transaction parameters');
  }

  // Wait for confirmation with timeout
  private async waitForConfirmationWithTimeout(
    txId: string,
    timeoutRounds: number = 10
  ): Promise<any> {
    console.log(
      `⏳ Waiting for confirmation (timeout: ${timeoutRounds} rounds)...`
    );

    try {
      const confirmedTxn = await algosdk.waitForConfirmation(
        this.algodClient,
        txId,
        timeoutRounds
      );

      console.log(
        '✅ Transaction confirmed in round:',
        confirmedTxn['confirmed-round']
      );
      return confirmedTxn;
    } catch (error) {
      console.error('❌ Confirmation timeout or error:', error);
      throw new Error(`Transaction confirmation failed: ${error.message}`);
    }
  }

  // Enhanced verification with multiple checks
  async verifyHealthDataFromTransaction(
    dataHash: string,
    txId: string
  ): Promise<boolean> {
    console.log('🔍 === VERIFYING HEALTH DATA ===');
    console.log('🆔 Transaction ID:', txId);
    console.log('🔐 Expected Hash:', dataHash.substring(0, 16) + '...');

    try {
      // Get transaction information
      const txnInfo = await this.algodClient
        .pendingTransactionInformation(txId)
        .do();

      if (!txnInfo.txn) {
        console.error('❌ Transaction not found');
        return false;
      }

      // Check if transaction is confirmed
      if (!txnInfo['confirmed-round']) {
        console.warn('⚠️ Transaction not yet confirmed');
        return false;
      }

      // Extract and verify note
      const note = txnInfo.txn.note;
      if (!note) {
        console.error('❌ No note found in transaction');
        return false;
      }

      try {
        const noteBytes = new Uint8Array(Buffer.from(note, 'base64'));
        const noteString = new TextDecoder().decode(noteBytes);
        console.log('📝 Transaction note:', noteString);

        // Try to parse as JSON (new format)
        try {
          const noteData = JSON.parse(noteString);
          const isValid =
            noteData.type === 'HEALTH_DATA' && noteData.hash === dataHash;
          console.log('✅ JSON verification result:', isValid);
          return isValid;
        } catch {
          // Fallback to old format
          const isValid = noteString.includes(`HEALTH_DATA:${dataHash}`);
          console.log('✅ Legacy verification result:', isValid);
          return isValid;
        }
      } catch (noteError) {
        console.error('❌ Failed to decode note:', noteError);
        return false;
      }
    } catch (error) {
      console.error('❌ Verification failed:', error);
      return false;
    }
  }

  // Get transaction information
  async getTransactionInfo(txId: string): Promise<any> {
    try {
      return await this.algodClient.pendingTransactionInformation(txId).do();
    } catch (error) {
      console.error('❌ Failed to get transaction info:', error);
      return null;
    }
  }

  // Get explorer URL
  getExplorerUrl(
    type: 'transaction' | 'account' | 'application',
    id: string
  ): string {
    const baseUrl =
      this.config.network === 'mainnet'
        ? 'https://algoexplorer.io'
        : 'https://testnet.algoexplorer.io';

    switch (type) {
      case 'transaction':
        return `${baseUrl}/tx/${id}`;
      case 'account':
        return `${baseUrl}/address/${id}`;
      case 'application':
        return `${baseUrl}/application/${id}`;
      default:
        return baseUrl;
    }
  }

  // Get network status
  async getNetworkStatus(): Promise<any> {
    try {
      const status = await this.algodClient.status().do();
      console.log('🌐 Network status:', {
        lastRound: status['last-round'],
        timeSinceLastRound: status['time-since-last-round'],
        catchupTime: status['catchup-time'],
      });
      return status;
    } catch (error) {
      console.error('❌ Failed to get network status:', error);
      return null;
    }
  }

  // Check account balance
  async getAccountBalance(address: string): Promise<number> {
    try {
      const accountInfo = await this.getAccountInfo(address);
      return accountInfo?.amount || 0;
    } catch (error) {
      console.error('❌ Failed to get account balance:', error);
      return 0;
    }
  }

  // Test connection to Algorand network
  async testConnection(): Promise<boolean> {
    try {
      console.log('🔗 Testing Algorand connection...');
      const status = await this.getNetworkStatus();
      const isConnected = !!status;
      console.log(
        isConnected ? '✅ Connection successful' : '❌ Connection failed'
      );
      return isConnected;
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return false;
    }
  }
}

export const algorandService = new AlgorandBlockchainService();
