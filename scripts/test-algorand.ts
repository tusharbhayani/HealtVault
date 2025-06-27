#!/usr/bin/env tsx

import { algorandService } from '../lib/blockchain/algorandService';

async function testAlgorandIntegration() {
  console.log('🧪 === TESTING ALGORAND INTEGRATION ===\n');

  try {
    // Test 1: Network Connection
    console.log('1️⃣ Testing network connection...');
    const isConnected = await algorandService.testConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to Algorand network');
    }
    console.log('✅ Network connection successful\n');

    // Test 2: Account Generation
    console.log('2️⃣ Testing account generation...');
    const account = algorandService.generateAccount();
    console.log('✅ Account generated successfully');
    console.log('📍 Address:', account.addr);
    console.log('📍 Address length:', account.addr.length);
    console.log('🔐 Secret key length:', account.sk.length);
    console.log(
      '🌐 Explorer URL:',
      algorandService.getExplorerUrl('account', account.addr)
    );
    console.log('');

    // Test 3: Account Balance
    console.log('3️⃣ Checking account balance...');
    const balance = await algorandService.getAccountBalance(account.addr);
    console.log('💰 Balance:', balance, 'microAlgos');

    if (balance < 100000) {
      console.log('⚠️ Low balance detected, attempting to fund account...');
      const fundingSuccess = await algorandService.ensureAccountFunded(
        account.addr
      );

      if (!fundingSuccess) {
        console.log('❌ Automatic funding failed');
        console.log('💡 Please run: npm run fund-account');
        console.log(
          '💡 Or fund manually at: https://dispenser.testnet.aws.algodev.network/'
        );
        console.log('📍 Address:', account.addr);
        return;
      }

      const newBalance = await algorandService.getAccountBalance(account.addr);
      console.log('✅ Account funded! New balance:', newBalance, 'microAlgos');
    }
    console.log('');

    // Test 4: Health Data Storage
    console.log('4️⃣ Testing health data storage...');
    const testDataHash = 'test_hash_' + Date.now();
    console.log('🔐 Test data hash:', testDataHash);

    try {
      const transaction = await algorandService.storeHealthDataInTransaction(
        account,
        testDataHash
      );
      console.log('✅ Health data stored successfully!');
      console.log('🆔 Transaction ID:', transaction.txId);
      console.log('📦 Block Number:', transaction.blockNumber);
      console.log('🌐 Explorer URL:', transaction.explorerUrl);
      console.log('');

      // Test 5: Data Verification
      console.log('5️⃣ Testing data verification...');
      const isVerified = await algorandService.verifyHealthDataFromTransaction(
        testDataHash,
        transaction.txId
      );
      console.log(
        '🔍 Verification result:',
        isVerified ? '✅ VERIFIED' : '❌ FAILED'
      );
      console.log('');

      if (isVerified) {
        console.log('🎉 === ALL TESTS PASSED ===');
        console.log('✅ Algorand integration is working correctly!');
        console.log('🌐 View transaction:', transaction.explorerUrl);
        console.log('');
        console.log('🚀 Ready for production use:');
        console.log('- Health data can be stored on Algorand blockchain');
        console.log('- Data integrity can be verified');
        console.log('- Explorer links work for transparency');
      } else {
        console.log('❌ Verification test failed');
        console.log('💡 This might indicate a blockchain sync issue');
      }
    } catch (storageError) {
      console.error('❌ Storage test failed:', storageError);
      console.log('');
      console.log('💡 Common causes:');
      console.log(
        '   - Insufficient account balance (run: npm run fund-account)'
      );
      console.log('   - Network connectivity issues');
      console.log('   - Algorand testnet temporarily unavailable');
      console.log('   - Rate limiting from too many requests');
      console.log('');
      console.log('🔧 Suggested fixes:');
      console.log('1. Wait 5-10 minutes and try again');
      console.log('2. Check account balance and fund if needed');
      console.log('3. Verify network connection');
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('');
    console.log('🔧 Troubleshooting steps:');
    console.log('1. Check internet connection');
    console.log('2. Verify Algorand testnet is accessible');
    console.log('3. Try running: npm run check-network');
    console.log('4. Try running: npm run fund-account');
  }
}

// Run the test
testAlgorandIntegration().catch(console.error);
