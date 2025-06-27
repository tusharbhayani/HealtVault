import { create } from 'zustand';
import {
  supabase,
  type HealthRecord,
  type EmergencyContact,
} from '@/lib/supabase';
import {
  createHealthDataHash,
  storeHealthDataOnBlockchain,
  verifyHealthDataOnBlockchain,
  generateAlgorandAccount,
  getExplorerUrl,
} from '@/lib/algorand-simple';
import { encryptAndStore, retrieveAndDecrypt } from '@/lib/storage';
import { useAuthStore } from './useAuthStore';

interface HealthState {
  healthRecord: HealthRecord | null;
  loading: boolean;
  qrCodeData: string | null;
  blockchainStatus: 'idle' | 'storing' | 'verifying' | 'success' | 'error';
  saveHealthRecord: (data: Partial<HealthRecord>) => Promise<void>;
  loadHealthRecord: () => Promise<void>;
  generateQRCode: () => Promise<string>;
  getPublicHealthData: (qrCodeId: string) => Promise<HealthRecord | null>;
  updateEmergencyContacts: (contacts: EmergencyContact[]) => Promise<void>;
  verifyBlockchainData: (healthRecord: HealthRecord) => Promise<boolean>;
  getTestHealthData: () => HealthRecord;
  loadTestData: () => Promise<void>;
}

export const useHealthStore = create<HealthState>((set, get) => ({
  healthRecord: null,
  loading: false,
  qrCodeData: null,
  blockchainStatus: 'idle',

  getTestHealthData: () =>
    ({
      id: 'test-record-123',
      user_id: 'test-user-456',
      full_name: 'Dr. Emily Sarah Johnson',
      blood_type: 'O-',
      allergies: [
        'Penicillin (severe anaphylaxis)',
        'Shellfish (hives, swelling)',
        'Latex (contact dermatitis)',
      ],
      medications: [
        'Metformin 1000mg twice daily (diabetes)',
        'Lisinopril 20mg once daily (hypertension)',
        'Atorvastatin 40mg at bedtime (cholesterol)',
      ],
      medical_conditions: [
        'Type 2 Diabetes Mellitus (well-controlled)',
        'Essential Hypertension',
        'Hyperlipidemia',
      ],
      emergency_contacts: [
        {
          name: 'Dr. Michael Robert Johnson',
          relationship: 'Spouse (Cardiologist)',
          phone: '+1 (555) 123-4567',
          email: 'dr.mjohnson@cardiocenter.com',
        },
        {
          name: 'Dr. Sarah Michelle Williams',
          relationship: 'Primary Care Physician',
          phone: '+1 (555) 987-6543',
          email: 'dr.williams@familymed.com',
        },
      ],
      data_hash: 'test_hash_f7c3bc1d808e04732adf679965ccc34ca7ae3441',
      algorand_tx_id: 'TEST_TX_ABC123DEF456',
      qr_code_id: 'HG_test456_1642789123',
      user_algorand_address: 'TEST_ALGO_ADDRESS_123456789',
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-20T14:45:00Z',
      is_blockchain_verified: true,
    } as HealthRecord),

  loadTestData: async () => {
    set({ loading: true });
    try {
      const user = useAuthStore.getState().user;
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('📋 Loading test health data...');
      const testData = get().getTestHealthData();

      await get().saveHealthRecord({
        full_name: testData.full_name,
        blood_type: testData.blood_type,
        allergies: testData.allergies,
        medications: testData.medications,
        medical_conditions: testData.medical_conditions,
        emergency_contacts: testData.emergency_contacts,
      });

      console.log('✅ Test data loaded successfully!');
    } catch (error) {
      console.error('❌ Failed to load test data:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  saveHealthRecord: async (data: Partial<HealthRecord>) => {
    set({ loading: true, blockchainStatus: 'storing' });
    try {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('User not authenticated');

      console.log('💾 === SAVING HEALTH RECORD TO BLOCKCHAIN ===');

      // Create health data hash
      const dataHash = await createHealthDataHash(data);
      console.log(
        '🔐 Health data hash created:',
        dataHash.substring(0, 16) + '...'
      );

      // Generate QR code ID
      const qrCodeId = `HG_${user.id.slice(0, 8)}_${Date.now()}`;

      // Generate or retrieve Algorand account
      let algorandAccount;
      try {
        algorandAccount = await retrieveAndDecrypt('algorand_account');

        if (!algorandAccount) {
          console.log('🔑 Generating new Algorand account...');
          algorandAccount = generateAlgorandAccount();
          await encryptAndStore('algorand_account', algorandAccount);
          console.log(
            '🔑 New Algorand account generated:',
            algorandAccount.addr
          );
        } else {
          console.log(
            '🔑 Using existing Algorand account:',
            algorandAccount.addr
          );

          // Ensure the secret key is a Uint8Array
          if (
            algorandAccount.sk &&
            !(algorandAccount.sk instanceof Uint8Array)
          ) {
            console.log('🔧 Converting secret key to Uint8Array...');
            algorandAccount.sk = new Uint8Array(algorandAccount.sk);
          }
        }
      } catch (error) {
        console.log('🔑 Generating new Algorand account (fallback)...');
        algorandAccount = generateAlgorandAccount();
        await encryptAndStore('algorand_account', algorandAccount);
      }

      // Validate account
      if (
        !algorandAccount ||
        !algorandAccount.addr ||
        algorandAccount.addr.length !== 58
      ) {
        throw new Error(
          `Invalid Algorand account: address length ${
            algorandAccount?.addr?.length || 0
          }`
        );
      }

      if (
        !algorandAccount.sk ||
        !(algorandAccount.sk instanceof Uint8Array) ||
        algorandAccount.sk.length !== 64
      ) {
        throw new Error(
          `Invalid secret key: type ${algorandAccount.sk?.constructor?.name}, length ${algorandAccount.sk?.length}`
        );
      }

      // Store on blockchain
      let algorandTxId: string;
      let isBlockchainVerified = false;

      try {
        console.log('⛓️ === STORING ON ALGORAND BLOCKCHAIN ===');
        console.log('📍 Account Address:', algorandAccount.addr);
        console.log('🔐 Data Hash:', dataHash.substring(0, 16) + '...');
        console.log('🌐 Network: Algorand Testnet');

        algorandTxId = await storeHealthDataOnBlockchain(
          algorandAccount,
          dataHash
        );
        isBlockchainVerified = true;

        console.log('✅ === BLOCKCHAIN STORAGE SUCCESSFUL ===');
        console.log('🆔 Transaction ID:', algorandTxId);
        console.log(
          '🌐 Explorer URL:',
          getExplorerUrl('transaction', algorandTxId)
        );

        set({ blockchainStatus: 'success' });
      } catch (blockchainError) {
        console.error('❌ === BLOCKCHAIN STORAGE FAILED ===');
        console.error('❌ Error:', blockchainError);
        set({ blockchainStatus: 'error' });

        if (blockchainError.message?.includes('insufficient funds')) {
          throw new Error(
            'Account needs funding. Please run: npm run fund-account'
          );
        } else if (blockchainError.message?.includes('network')) {
          throw new Error(
            'Network error. Please check connection and try again.'
          );
        } else {
          throw new Error(
            `Blockchain storage failed: ${blockchainError.message}`
          );
        }
      }

      const recordData: Partial<HealthRecord> = {
        ...data,
        user_id: user.id,
        data_hash: dataHash,
        algorand_tx_id: algorandTxId,
        qr_code_id: qrCodeId,
        user_algorand_address: algorandAccount.addr,
        is_blockchain_verified: isBlockchainVerified,
      };

      // Save to Supabase
      console.log('💾 Saving to Supabase database...');
      const { data: savedRecord, error } = await supabase
        .from('health_records')
        .upsert(recordData)
        .select()
        .single();

      if (error) throw error;

      // Store locally
      await encryptAndStore('health_data', savedRecord);

      set({
        healthRecord: savedRecord,
        qrCodeData: qrCodeId,
        blockchainStatus: 'success',
      });

      console.log('🎉 === HEALTH RECORD SAVED SUCCESSFULLY ===');
      console.log(
        '🌐 Transaction Explorer:',
        getExplorerUrl('transaction', algorandTxId)
      );
      console.log('💾 Supabase record ID:', savedRecord.id);
    } catch (error) {
      console.error('❌ Save health record error:', error);
      set({ blockchainStatus: 'error' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  loadHealthRecord: async () => {
    set({ loading: true });
    try {
      const user = useAuthStore.getState().user;
      if (!user) return;

      console.log('📖 Loading health record...');

      const { data, error } = await supabase
        .from('health_records')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        console.log('📊 Health record loaded from Supabase');

        // Verify blockchain status
        if (
          data.data_hash &&
          data.user_algorand_address &&
          data.algorand_tx_id
        ) {
          console.log('🔍 Verifying blockchain data...');
          console.log('🆔 Transaction ID:', data.algorand_tx_id);

          set({ blockchainStatus: 'verifying' });

          try {
            const isVerified = await verifyHealthDataOnBlockchain(
              data.data_hash,
              data.user_algorand_address,
              data.algorand_tx_id
            );
            data.is_blockchain_verified = isVerified;
            set({ blockchainStatus: isVerified ? 'success' : 'error' });

            console.log('✅ Blockchain verification completed:', isVerified);
          } catch (verificationError) {
            console.warn(
              '⚠️ Blockchain verification failed:',
              verificationError
            );
            data.is_blockchain_verified = false;
            set({ blockchainStatus: 'error' });
          }
        }

        set({ healthRecord: data, qrCodeData: data.qr_code_id });
        await encryptAndStore('health_data', data);
      } else {
        const localData = await retrieveAndDecrypt('health_data');
        if (localData) {
          set({ healthRecord: localData, qrCodeData: localData.qr_code_id });
        }
      }
    } catch (error) {
      console.error('❌ Load health record error:', error);
      const localData = await retrieveAndDecrypt('health_data');
      if (localData) {
        set({ healthRecord: localData, qrCodeData: localData.qr_code_id });
      }
    } finally {
      set({ loading: false });
    }
  },

  generateQRCode: async () => {
    const { healthRecord } = get();
    if (!healthRecord) throw new Error('No health record found');

    const qrData = JSON.stringify({
      id: healthRecord.qr_code_id,
      type: 'health_guardian_emergency',
      timestamp: new Date().toISOString(),
      version: '1.0',
    });

    set({ qrCodeData: qrData });
    return qrData;
  },

  getPublicHealthData: async (qrCodeId: string) => {
    try {
      console.log('🔍 Fetching public health data for QR:', qrCodeId);

      if (qrCodeId === 'demo' || qrCodeId.includes('test')) {
        console.log('📋 Returning demo data');
        return get().getTestHealthData();
      }

      const { data, error } = await supabase
        .from('health_records')
        .select('*')
        .eq('qr_code_id', qrCodeId)
        .single();

      if (error) {
        console.error('❌ Error fetching health data:', error);
        return null;
      }

      console.log('📊 Health data fetched from Supabase');

      // Verify blockchain status for public access
      let isBlockchainVerified = false;
      if (data.data_hash && data.user_algorand_address && data.algorand_tx_id) {
        try {
          isBlockchainVerified = await verifyHealthDataOnBlockchain(
            data.data_hash,
            data.user_algorand_address,
            data.algorand_tx_id
          );
          console.log(
            '✅ Public blockchain verification:',
            isBlockchainVerified
          );
        } catch (verificationError) {
          console.warn(
            '⚠️ Public blockchain verification failed:',
            verificationError
          );
        }
      }

      return {
        ...data,
        is_blockchain_verified: isBlockchainVerified,
      } as HealthRecord;
    } catch (error) {
      console.error('❌ Get public health data error:', error);
      return null;
    }
  },

  updateEmergencyContacts: async (contacts: EmergencyContact[]) => {
    const { healthRecord } = get();
    if (!healthRecord) return;

    await get().saveHealthRecord({
      ...healthRecord,
      emergency_contacts: contacts,
    });
  },

  verifyBlockchainData: async (healthRecord: HealthRecord) => {
    if (!healthRecord.data_hash || !healthRecord.user_algorand_address) {
      return false;
    }

    set({ blockchainStatus: 'verifying' });

    try {
      const isVerified = await verifyHealthDataOnBlockchain(
        healthRecord.data_hash,
        healthRecord.user_algorand_address,
        healthRecord.algorand_tx_id
      );
      set({ blockchainStatus: isVerified ? 'success' : 'error' });
      return isVerified;
    } catch (error) {
      console.error('Blockchain verification failed:', error);
      set({ blockchainStatus: 'error' });
      return false;
    }
  },
}));
