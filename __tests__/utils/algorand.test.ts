import { createHealthDataHash } from '@/lib/algorand';

// Mock crypto-js
jest.mock('crypto-js', () => ({
  SHA256: jest.fn(() => ({
    toString: jest.fn(() => 'mocked-hash-123'),
  })),
}));

describe('Algorand Utils', () => {
  test('should create consistent hash for same data', async () => {
    const healthData = {
      full_name: 'John Doe',
      blood_type: 'A+',
      allergies: ['Penicillin'],
    };

    const hash1 = await createHealthDataHash(healthData);
    const hash2 = await createHealthDataHash(healthData);

    expect(hash1).toBe(hash2);
    expect(hash1).toBe('mocked-hash-123');
  });

  test('should create different hashes for different data', async () => {
    const CryptoJS = require('crypto-js');
    
    // Reset mock to return different values
    CryptoJS.SHA256
      .mockReturnValueOnce({ toString: () => 'hash-1' })
      .mockReturnValueOnce({ toString: () => 'hash-2' });

    const data1 = { name: 'John' };
    const data2 = { name: 'Jane' };

    const hash1 = await createHealthDataHash(data1);
    const hash2 = await createHealthDataHash(data2);

    expect(hash1).toBe('hash-1');
    expect(hash2).toBe('hash-2');
    expect(hash1).not.toBe(hash2);
  });

  test('should handle empty data', async () => {
    const emptyData = {};
    const hash = await createHealthDataHash(emptyData);
    
    expect(hash).toBe('mocked-hash-123');
    expect(typeof hash).toBe('string');
  });

  test('should handle complex nested data', async () => {
    const complexData = {
      personal: {
        name: 'John Doe',
        age: 30,
      },
      medical: {
        conditions: ['diabetes', 'hypertension'],
        medications: [
          { name: 'Metformin', dosage: '500mg' },
          { name: 'Lisinopril', dosage: '10mg' },
        ],
      },
      contacts: [
        { name: 'Jane Doe', phone: '555-0123' },
      ],
    };

    const hash = await createHealthDataHash(complexData);
    
    expect(hash).toBe('mocked-hash-123');
    expect(typeof hash).toBe('string');
  });
});