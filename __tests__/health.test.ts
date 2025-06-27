import { useHealthStore } from '@/store/useHealthStore';
import { createHealthDataHash } from '@/lib/algorand';

// Mock dependencies
jest.mock('@/lib/supabase');
jest.mock('@/lib/algorand');
jest.mock('@/lib/storage');
jest.mock('@/store/useAuthStore');

describe('HealthStore', () => {
  beforeEach(() => {
    useHealthStore.setState({
      healthRecord: null,
      loading: false,
      qrCodeData: null,
    });
  });

  test('should save health record successfully', async () => {
    const mockUser = { id: 'user123' };
    const mockHealthData = {
      full_name: 'John Doe',
      blood_type: 'A+',
      allergies: ['Penicillin'],
      medications: ['Aspirin'],
    };

    // Mock auth store
    const { useAuthStore } = require('@/store/useAuthStore');
    useAuthStore.getState = jest.fn(() => ({ user: mockUser }));

    // Mock hash creation
    const mockHash = 'mock-hash-123';
    (createHealthDataHash as jest.Mock).mockResolvedValue(mockHash);

    // Mock Supabase
    const { supabase } = require('@/lib/supabase');
    const mockSavedRecord = {
      ...mockHealthData,
      id: 'record123',
      user_id: mockUser.id,
      data_hash: mockHash,
      qr_code_id: 'HG_user123_123456789',
    };

    supabase.from.mockReturnValue({
      upsert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockSavedRecord,
            error: null,
          }),
        }),
      }),
    });

    const { saveHealthRecord } = useHealthStore.getState();
    await saveHealthRecord(mockHealthData);

    const state = useHealthStore.getState();
    expect(state.healthRecord).toEqual(mockSavedRecord);
    expect(createHealthDataHash).toHaveBeenCalledWith(mockHealthData);
  });

  test('should generate QR code data', async () => {
    const mockHealthRecord = {
      id: 'record123',
      qr_code_id: 'HG_user123_123456789',
      full_name: 'John Doe',
    };

    useHealthStore.setState({ healthRecord: mockHealthRecord });

    const { generateQRCode } = useHealthStore.getState();
    const qrData = await generateQRCode();

    expect(qrData).toContain('HG_user123_123456789');
    expect(qrData).toContain('health_guardian_emergency');
  });

  test('should load health record from Supabase', async () => {
    const mockUser = { id: 'user123' };
    const mockHealthRecord = {
      id: 'record123',
      user_id: mockUser.id,
      full_name: 'John Doe',
      qr_code_id: 'HG_user123_123456789',
    };

    // Mock auth store
    const { useAuthStore } = require('@/store/useAuthStore');
    useAuthStore.getState = jest.fn(() => ({ user: mockUser }));

    // Mock Supabase
    const { supabase } = require('@/lib/supabase');
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockHealthRecord,
            error: null,
          }),
        }),
      }),
    });

    const { loadHealthRecord } = useHealthStore.getState();
    await loadHealthRecord();

    const state = useHealthStore.getState();
    expect(state.healthRecord).toEqual(mockHealthRecord);
    expect(state.qrCodeData).toBe(mockHealthRecord.qr_code_id);
  });

  test('should get public health data', async () => {
    const qrCodeId = 'HG_user123_123456789';
    const mockPublicData = {
      full_name: 'John Doe',
      blood_type: 'A+',
      allergies: ['Penicillin'],
      emergency_contacts: [
        { name: 'Jane Doe', relationship: 'Spouse', phone: '555-0123' }
      ],
    };

    // Mock Supabase
    const { supabase } = require('@/lib/supabase');
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockPublicData,
            error: null,
          }),
        }),
      }),
    });

    const { getPublicHealthData } = useHealthStore.getState();
    const result = await getPublicHealthData(qrCodeId);

    expect(result).toEqual(mockPublicData);
    expect(supabase.from).toHaveBeenCalledWith('health_records');
  });

  test('should handle errors gracefully', async () => {
    const mockUser = { id: 'user123' };
    
    // Mock auth store
    const { useAuthStore } = require('@/store/useAuthStore');
    useAuthStore.getState = jest.fn(() => ({ user: mockUser }));

    // Mock Supabase error
    const { supabase } = require('@/lib/supabase');
    supabase.from.mockReturnValue({
      upsert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Database error'),
          }),
        }),
      }),
    });

    const { saveHealthRecord } = useHealthStore.getState();
    
    await expect(saveHealthRecord({ full_name: 'Test' })).rejects.toThrow('Database error');
  });
});