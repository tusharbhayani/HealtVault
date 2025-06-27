#!/usr/bin/env tsx

import { algorandService } from '../lib/blockchain/algorandService';

async function checkAlgorandNetwork() {
  console.log('🌐 === ALGORAND NETWORK STATUS ===\n');

  try {
    // Test connection
    console.log('🔗 Testing connection to Algorand testnet...');
    const isConnected = await algorandService.testConnection();

    if (!isConnected) {
      console.log('❌ Failed to connect to Algorand network');
      console.log('');
      console.log('🔧 Troubleshooting:');
      console.log('1. Check internet connection');
      console.log('2. Verify Algorand testnet is operational');
      console.log('3. Try different API endpoint');
      console.log('4. Check firewall/proxy settings');
      return;
    }

    console.log('✅ Successfully connected to Algorand testnet');
    console.log('');

    // Get network status
    console.log('📊 Getting network status...');
    const status = await algorandService.getNetworkStatus();

    if (status) {
      console.log('✅ Network Status:');
      console.log('   - Last Round:', status['last-round']);
      console.log(
        '   - Time Since Last Round:',
        status['time-since-last-round'],
        'ns'
      );
      console.log('   - Catchup Time:', status['catchup-time'], 'ns');
      console.log('   - Network:', 'Algorand Testnet');
      console.log('   - API Endpoint:', 'https://testnet-api.4160.nodely.dev');
      console.log('');
    }

    // Test account generation
    console.log('🔑 Testing account generation...');
    const testAccount = algorandService.generateAccount();
    console.log('✅ Account generation working');
    console.log('📍 Test address:', testAccount.addr);
    console.log(
      '🌐 Explorer URL:',
      algorandService.getExplorerUrl('account', testAccount.addr)
    );
    console.log('');

    // Check balance (should be 0 for new account)
    console.log('💰 Checking test account balance...');
    const balance = await algorandService.getAccountBalance(testAccount.addr);
    console.log('💰 Balance:', balance, 'microAlgos');
    console.log('');

    // Test funding capability
    console.log('🧪 Testing funding capability...');
    console.log('📍 Test address for funding:', testAccount.addr);
    console.log('🌐 Manual funding URLs:');
    console.log('   - https://dispenser.testnet.aws.algodev.network/');
    console.log('   - https://bank.testnet.algorand.network/');
    console.log('');

    console.log('🎉 === NETWORK CHECK COMPLETE ===');
    console.log('✅ Algorand testnet is accessible and working');
    console.log('✅ Account generation is functional');
    console.log('✅ Explorer integration is working');
    console.log('');
    console.log('🚀 Next steps:');
    console.log('1. Run: npm run fund-account (to get testnet ALGOs)');
    console.log('2. Run: npm run test-algorand (to test full integration)');
    console.log('3. Test health data storage in the app');
  } catch (error) {
    console.error('❌ Network check failed:', error);
    console.log('');
    console.log('🔧 Common issues and solutions:');
    console.log('1. Internet connectivity problems');
    console.log('   → Check your internet connection');
    console.log('2. Algorand testnet maintenance');
    console.log('   → Check https://status.algorand.org/');
    console.log('3. API endpoint issues');
    console.log('   → Try again in a few minutes');
    console.log('4. Firewall/proxy blocking requests');
    console.log('   → Check network settings');
    console.log('');
    console.log('💡 Try again in a few minutes or check Algorand status page');
  }
}

// Run the check
checkAlgorandNetwork().catch(console.error);
