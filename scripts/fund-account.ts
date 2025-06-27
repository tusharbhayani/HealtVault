#!/usr/bin/env tsx

import { algorandService } from '../lib/blockchain/algorandService';

async function fundTestAccount() {
  console.log('💰 === ALGORAND ACCOUNT FUNDING ===\n');

  try {
    // Generate a test account
    console.log('🔑 Generating test account...');
    const account = algorandService.generateAccount();
    console.log('✅ Account generated');
    console.log('📍 Address:', account.addr);
    console.log(
      '🌐 Explorer:',
      algorandService.getExplorerUrl('account', account.addr)
    );
    console.log('');

    // Check initial balance
    console.log('💰 Checking initial balance...');
    const initialBalance = await algorandService.getAccountBalance(
      account.addr
    );
    console.log('💰 Initial balance:', initialBalance, 'microAlgos');
    console.log('');

    // Use the enhanced funding method
    console.log('💰 Attempting to fund account...');
    const fundingSuccess = await algorandService.ensureAccountFunded(
      account.addr
    );

    if (fundingSuccess) {
      const finalBalance = await algorandService.getAccountBalance(
        account.addr
      );
      console.log('🎉 === FUNDING SUCCESSFUL ===');
      console.log('💰 Final balance:', finalBalance, 'microAlgos');
      console.log('💰 Received:', finalBalance - initialBalance, 'microAlgos');
      console.log(
        '🌐 View account:',
        algorandService.getExplorerUrl('account', account.addr)
      );
      console.log('');
      console.log('🚀 Next steps:');
      console.log('1. Run: npm run test-algorand');
      console.log('2. Test health data storage in the app');
    } else {
      console.log('❌ === FUNDING FAILED ===');
      console.log('');
      console.log('💡 Manual funding options:');
      console.log('1. Visit: https://dispenser.testnet.aws.algodev.network/');
      console.log('2. Visit: https://bank.testnet.algorand.network/');
      console.log('3. Paste this address:', account.addr);
      console.log('');
      console.log('⚠️ Common issues:');
      console.log('- Rate limiting (wait 5-10 minutes between requests)');
      console.log('- Testnet maintenance');
      console.log('- Network connectivity');
    }
  } catch (error) {
    console.error('❌ Funding process failed:', error);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('1. Check internet connection');
    console.log('2. Try again in a few minutes');
    console.log('3. Use manual funding if automated funding fails');
  }
}

// Run the funding
fundTestAccount().catch(console.error);
