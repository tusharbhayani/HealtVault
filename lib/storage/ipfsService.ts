// IPFS Integration for Decentralized Document Storage
export interface IPFSUploadResult {
  hash: string;
  size: number;
  url: string;
  pinned: boolean;
}

export interface DocumentMetadata {
  filename: string;
  contentType: string;
  size: number;
  uploadedAt: string;
  encryptionKey: string;
  ipfsHash: string;
  checksum: string;
}

export class IPFSStorageService {
  private apiEndpoint: string;
  private apiKey: string;

  constructor() {
    // Using Pinata as IPFS provider (replace with your preferred service)
    this.apiEndpoint =
      process.env.EXPO_PUBLIC_IPFS_API_ENDPOINT || 'https://api.pinata.cloud';
    this.apiKey = process.env.EXPO_PUBLIC_IPFS_API_KEY || '';
  }

  async uploadEncryptedDocument(
    encryptedData: Blob | Buffer,
    metadata: Omit<DocumentMetadata, 'ipfsHash' | 'uploadedAt'>
  ): Promise<IPFSUploadResult> {
    try {
      // Create form data for IPFS upload
      const formData = new FormData();
      formData.append('file', encryptedData as any, metadata.filename);

      // Add metadata
      const pinataMetadata = {
        name: metadata.filename,
        keyvalues: {
          contentType: metadata.contentType,
          size: metadata.size.toString(),
          checksum: metadata.checksum,
          encrypted: 'true',
        },
      };
      formData.append('pinataMetadata', JSON.stringify(pinataMetadata));

      // Upload to IPFS via Pinata
      const response = await fetch(
        `${this.apiEndpoint}/pinning/pinFileToIPFS`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`IPFS upload failed: ${response.statusText}`);
      }

      const result = await response.json();

      return {
        hash: result.IpfsHash,
        size: result.PinSize,
        url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
        pinned: true,
      };
    } catch (error) {
      console.error('IPFS upload error:', error);
      throw new Error(`Failed to upload to IPFS: ${error}`);
    }
  }

  async retrieveDocument(ipfsHash: string): Promise<Blob> {
    try {
      const response = await fetch(
        `https://gateway.pinata.cloud/ipfs/${ipfsHash}`
      );

      if (!response.ok) {
        throw new Error(`Failed to retrieve document: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('IPFS retrieval error:', error);
      throw new Error(`Failed to retrieve from IPFS: ${error}`);
    }
  }

  async pinDocument(ipfsHash: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiEndpoint}/pinning/pinByHash`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          hashToPin: ipfsHash,
          pinataMetadata: {
            name: `Document-${ipfsHash}`,
            keyvalues: {
              pinned_at: new Date().toISOString(),
            },
          },
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('IPFS pinning error:', error);
      return false;
    }
  }

  async unpinDocument(ipfsHash: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.apiEndpoint}/pinning/unpin/${ipfsHash}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      return response.ok;
    } catch (error) {
      console.error('IPFS unpinning error:', error);
      return false;
    }
  }

  // Generate content-addressed hash for verification
  async generateChecksum(data: Blob | Buffer): Promise<string> {
    if (
      typeof window !== 'undefined' &&
      window.crypto &&
      window.crypto.subtle
    ) {
      // Web environment
      const arrayBuffer =
        data instanceof Blob ? await data.arrayBuffer() : data.buffer;
      const hashBuffer = await window.crypto.subtle.digest(
        'SHA-256',
        arrayBuffer
      );
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } else {
      // Node environment (for testing)
      const crypto = require('crypto');
      const buffer =
        data instanceof Blob ? Buffer.from(await data.arrayBuffer()) : data;
      return crypto.createHash('sha256').update(buffer).digest('hex');
    }
  }

  // Verify document integrity
  async verifyDocumentIntegrity(
    ipfsHash: string,
    expectedChecksum: string
  ): Promise<boolean> {
    try {
      const document = await this.retrieveDocument(ipfsHash);
      const actualChecksum = await this.generateChecksum(document);
      return actualChecksum === expectedChecksum;
    } catch (error) {
      console.error('Document verification error:', error);
      return false;
    }
  }
}

export const ipfsService = new IPFSStorageService();
