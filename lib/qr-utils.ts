import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { Platform } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { HealthRecord } from './supabase';

export interface QRDownloadOptions {
  format: 'png' | 'pdf' | 'svg' | 'txt';
  qrCodeData: string;
  patientName?: string;
  includeInstructions?: boolean;
}

export interface HealthSummaryOptions {
  format: 'pdf' | 'txt';
  healthRecord: HealthRecord;
  includeBlockchainData?: boolean;
}

export class QRCodeManager {
  // Capture QR code as image
  static async captureQRCode(qrRef: any): Promise<string> {
    try {
      const uri = await captureRef(qrRef, {
        format: 'png',
        quality: 1.0,
        result: 'tmpfile',
      });
      return uri;
    } catch (error) {
      console.error('Failed to capture QR code:', error);
      throw new Error('Failed to capture QR code image');
    }
  }

  // Generate comprehensive health summary PDF
  static generateHealthSummaryPDF(options: HealthSummaryOptions): string {
    const { healthRecord, includeBlockchainData = true } = options;

    return `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
/F2 6 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 2000
>>
stream
BT
/F1 20 Tf
50 750 Td
(HEALTHGUARDIAN VERIFIED HEALTH SUMMARY) Tj
0 -30 Td
/F2 14 Tf
(Patient: ${healthRecord.full_name}) Tj
0 -20 Td
(Generated: ${new Date().toLocaleDateString()}) Tj
0 -20 Td
(QR Code ID: ${healthRecord.qr_code_id}) Tj

0 -40 Td
/F1 16 Tf
(BASIC INFORMATION) Tj
0 -25 Td
/F2 12 Tf
(Blood Type: ${healthRecord.blood_type || 'Not specified'}) Tj

${
  healthRecord.allergies && healthRecord.allergies.length > 0
    ? `
0 -30 Td
/F1 16 Tf
(CRITICAL ALLERGIES) Tj
0 -20 Td
/F2 12 Tf
${healthRecord.allergies
  .map((allergy, index) => `0 -15 Td (${index + 1}. ${allergy}) Tj`)
  .join('\n')}
`
    : ''
}

${
  healthRecord.medications && healthRecord.medications.length > 0
    ? `
0 -30 Td
/F1 16 Tf
(CURRENT MEDICATIONS) Tj
0 -20 Td
/F2 12 Tf
${healthRecord.medications
  .map((medication, index) => `0 -15 Td (${index + 1}. ${medication}) Tj`)
  .join('\n')}
`
    : ''
}

${
  healthRecord.medical_conditions && healthRecord.medical_conditions.length > 0
    ? `
0 -30 Td
/F1 16 Tf
(MEDICAL CONDITIONS) Tj
0 -20 Td
/F2 12 Tf
${healthRecord.medical_conditions
  .map((condition, index) => `0 -15 Td (${index + 1}. ${condition}) Tj`)
  .join('\n')}
`
    : ''
}

${
  healthRecord.emergency_contacts && healthRecord.emergency_contacts.length > 0
    ? `
0 -30 Td
/F1 16 Tf
(EMERGENCY CONTACTS) Tj
0 -20 Td
/F2 12 Tf
${healthRecord.emergency_contacts
  .map(
    (contact, index) =>
      `0 -15 Td (${index + 1}. ${contact.name} \\(${
        contact.relationship
      }\\) - ${contact.phone}) Tj`
  )
  .join('\n')}
`
    : ''
}

${
  includeBlockchainData
    ? `
0 -40 Td
/F1 16 Tf
(BLOCKCHAIN VERIFICATION DATA) Tj
0 -20 Td
/F2 10 Tf
(Data Hash: ${healthRecord.data_hash}) Tj
0 -15 Td
(Algorand Transaction ID: ${healthRecord.algorand_tx_id || 'Pending'}) Tj
0 -15 Td
(Algorand Address: ${healthRecord.user_algorand_address || 'Not available'}) Tj
0 -15 Td
(Verification Status: ${
        healthRecord.is_blockchain_verified ? 'VERIFIED' : 'PENDING'
      }) Tj
0 -15 Td
(Last Updated: ${new Date(healthRecord.updated_at).toLocaleString()}) Tj

0 -30 Td
/F1 14 Tf
(VERIFICATION INSTRUCTIONS) Tj
0 -20 Td
/F2 10 Tf
(1. Use the HealthGuardian app's Document Verification feature) Tj
0 -12 Td
(2. Upload this document to verify its authenticity) Tj
0 -12 Td
(3. The app will check the data hash against the blockchain) Tj
0 -12 Td
(4. Verified documents show blockchain confirmation) Tj

0 -25 Td
(Explorer URL: https://testnet.algoexplorer.io/tx/${
        healthRecord.algorand_tx_id || 'pending'
      }) Tj
`
    : ''
}

0 -40 Td
/F2 8 Tf
(This document is cryptographically secured and verified on the) Tj
0 -10 Td
(Algorand blockchain. Any tampering will be detected during verification.) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica-Bold
>>
endobj

6 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 7
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000274 00000 n 
0000002326 00000 n 
0000002401 00000 n 
trailer
<<
/Size 7
/Root 1 0 R
>>
startxref
2473
%%EOF`;
  }

  // Generate comprehensive health summary text
  static generateHealthSummaryText(options: HealthSummaryOptions): string {
    const { healthRecord, includeBlockchainData = true } = options;

    let content = `HEALTHGUARDIAN VERIFIED HEALTH SUMMARY
${'='.repeat(50)}

Patient: ${healthRecord.full_name}
Generated: ${new Date().toLocaleString()}
QR Code ID: ${healthRecord.qr_code_id}

BASIC INFORMATION
${'-'.repeat(20)}
Blood Type: ${healthRecord.blood_type || 'Not specified'}

`;

    if (healthRecord.allergies && healthRecord.allergies.length > 0) {
      content += `CRITICAL ALLERGIES
${'-'.repeat(20)}
${healthRecord.allergies
  .map((allergy, index) => `${index + 1}. ${allergy}`)
  .join('\n')}

`;
    }

    if (healthRecord.medications && healthRecord.medications.length > 0) {
      content += `CURRENT MEDICATIONS
${'-'.repeat(20)}
${healthRecord.medications
  .map((medication, index) => `${index + 1}. ${medication}`)
  .join('\n')}

`;
    }

    if (
      healthRecord.medical_conditions &&
      healthRecord.medical_conditions.length > 0
    ) {
      content += `MEDICAL CONDITIONS
${'-'.repeat(20)}
${healthRecord.medical_conditions
  .map((condition, index) => `${index + 1}. ${condition}`)
  .join('\n')}

`;
    }

    if (
      healthRecord.emergency_contacts &&
      healthRecord.emergency_contacts.length > 0
    ) {
      content += `EMERGENCY CONTACTS
${'-'.repeat(20)}
${healthRecord.emergency_contacts
  .map(
    (contact, index) =>
      `${index + 1}. ${contact.name} (${contact.relationship}) - ${
        contact.phone
      }${contact.email ? ` - ${contact.email}` : ''}`
  )
  .join('\n')}

`;
    }

    if (includeBlockchainData) {
      content += `BLOCKCHAIN VERIFICATION DATA
${'-'.repeat(30)}
Data Hash: ${healthRecord.data_hash}
Algorand Transaction ID: ${healthRecord.algorand_tx_id || 'Pending'}
Algorand Address: ${healthRecord.user_algorand_address || 'Not available'}
Verification Status: ${
        healthRecord.is_blockchain_verified ? 'VERIFIED ✓' : 'PENDING ⏳'
      }
Last Updated: ${new Date(healthRecord.updated_at).toLocaleString()}

VERIFICATION INSTRUCTIONS
${'-'.repeat(25)}
1. Use the HealthGuardian app's Document Verification feature
2. Upload this document to verify its authenticity
3. The app will check the data hash against the blockchain
4. Verified documents show blockchain confirmation

Explorer URL: https://testnet.algoexplorer.io/tx/${
        healthRecord.algorand_tx_id || 'pending'
      }

SECURITY NOTICE
${'-'.repeat(15)}
This document is cryptographically secured and verified on the
Algorand blockchain. Any tampering will be detected during verification.

Document Hash for Verification: ${healthRecord.data_hash}
Blockchain Transaction: ${healthRecord.algorand_tx_id || 'Pending confirmation'}

`;
    }

    content += `Generated by HealthGuardian
Report ID: ${Math.random().toString(36).substr(2, 9)}
Timestamp: ${new Date().toISOString()}
`;

    return content;
  }

  // Generate PDF with QR code
  static generatePDFContent(options: QRDownloadOptions): string {
    const {
      qrCodeData,
      patientName = 'Patient',
      includeInstructions = true,
    } = options;

    return `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
/F2 6 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 800
>>
stream
BT
/F1 18 Tf
50 750 Td
(HealthGuardian Emergency Medical Information) Tj
0 -30 Td
/F2 14 Tf
(Patient: ${patientName}) Tj
0 -20 Td
(Generated: ${new Date().toLocaleDateString()}) Tj
0 -40 Td
(QR Code ID: ${qrCodeData.substring(0, 30)}...) Tj
0 -60 Td
/F1 16 Tf
(EMERGENCY QR CODE) Tj
0 -30 Td
/F2 12 Tf
(Scan this QR code for instant access to emergency medical information) Tj
${
  includeInstructions
    ? `
0 -40 Td
/F1 14 Tf
(INSTRUCTIONS FOR FIRST RESPONDERS:) Tj
0 -20 Td
/F2 11 Tf
(1. Open HealthGuardian app or any QR scanner) Tj
0 -15 Td
(2. Scan the QR code above) Tj
0 -15 Td
(3. View critical medical information instantly) Tj
0 -15 Td
(4. Contact emergency contacts if needed) Tj
0 -30 Td
(IMPORTANT: This QR code contains encrypted medical data) Tj
0 -15 Td
(verified on the Algorand blockchain for authenticity.) Tj
`
    : ''
}
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica-Bold
>>
endobj

6 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 7
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000274 00000 n 
0000001126 00000 n 
0000001201 00000 n 
trailer
<<
/Size 7
/Root 1 0 R
>>
startxref
1273
%%EOF`;
  }

  // Generate SVG with QR code
  static generateSVGContent(options: QRDownloadOptions): string {
    const { qrCodeData, patientName = 'Patient' } = options;

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="400" height="500" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="500" fill="white" stroke="black" stroke-width="2"/>
  
  <!-- Header -->
  <text x="200" y="30" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="bold">
    HealthGuardian Emergency
  </text>
  
  <!-- Patient Name -->
  <text x="200" y="50" text-anchor="middle" font-family="Arial, sans-serif" font-size="12">
    Patient: ${patientName}
  </text>
  
  <!-- QR Code Placeholder -->
  <rect x="100" y="80" width="200" height="200" fill="white" stroke="black" stroke-width="1"/>
  <text x="200" y="190" text-anchor="middle" font-family="Arial, sans-serif" font-size="10">
    QR CODE
  </text>
  <text x="200" y="205" text-anchor="middle" font-family="Arial, sans-serif" font-size="8">
    ${qrCodeData.substring(0, 20)}...
  </text>
  
  <!-- Instructions -->
  <text x="20" y="320" font-family="Arial, sans-serif" font-size="12" font-weight="bold">
    EMERGENCY INSTRUCTIONS:
  </text>
  <text x="20" y="340" font-family="Arial, sans-serif" font-size="10">
    1. Scan QR code with HealthGuardian app
  </text>
  <text x="20" y="355" font-family="Arial, sans-serif" font-size="10">
    2. Access critical medical information
  </text>
  <text x="20" y="370" font-family="Arial, sans-serif" font-size="10">
    3. Contact emergency contacts if needed
  </text>
  
  <!-- Footer -->
  <text x="200" y="450" text-anchor="middle" font-family="Arial, sans-serif" font-size="8">
    Generated: ${new Date().toLocaleDateString()}
  </text>
  <text x="200" y="465" text-anchor="middle" font-family="Arial, sans-serif" font-size="8">
    Blockchain Verified Medical Data
  </text>
</svg>`;
  }

  // Enhanced text content generation with comprehensive emergency information
  static generateTextContent(options: QRDownloadOptions): string {
    const {
      qrCodeData,
      patientName = 'Patient',
      includeInstructions = true,
    } = options;

    let content = `HEALTHGUARDIAN EMERGENCY QR CODE
${'='.repeat(50)}

Patient: ${patientName}
Generated: ${new Date().toLocaleString()}
QR Code ID: ${qrCodeData}

EMERGENCY QR CODE DATA:
${'-'.repeat(25)}
${qrCodeData}

QR CODE USAGE:
${'-'.repeat(15)}
This QR code provides instant access to critical medical information
during emergencies. Scan with any QR code reader or the HealthGuardian app.

`;

    if (includeInstructions) {
      content += `INSTRUCTIONS FOR FIRST RESPONDERS:
${'-'.repeat(35)}

IMMEDIATE STEPS:
1. Open HealthGuardian app or any QR code scanner
2. Point camera at the QR code above
3. Tap the notification or link that appears
4. View critical medical information instantly
5. Contact emergency contacts if needed

WHAT YOU'LL FIND:
• Blood type and critical allergies
• Current medications and dosages
• Medical conditions and history
• Emergency contact information
• Special medical instructions

IMPORTANT NOTES:
${'-'.repeat(15)}
• This QR code contains encrypted medical data
• Data is verified on the Algorand blockchain
• Information is updated by the patient
• Access is logged for HIPAA compliance
• No internet required for basic emergency data

EMERGENCY CONTACT PRIORITY:
${'-'.repeat(25)}
1. Primary emergency contact (spouse/family)
2. Secondary contact (close family/friend)
3. Primary care physician
4. Specialist physicians (if applicable)

MEDICAL ALERT INFORMATION:
${'-'.repeat(25)}
• Check for medical alert bracelet/necklace
• Look for additional medical devices (pacemaker, insulin pump, etc.)
• Consider patient's medical history when planning treatment
• Verify allergies before administering any medications

BLOCKCHAIN VERIFICATION:
${'-'.repeat(22)}
This document is cryptographically secured using Algorand blockchain
technology. The medical data has been verified for authenticity and
integrity. Any tampering with the information will be detected.

PRIVACY & SECURITY:
${'-'.repeat(18)}
• Patient data is encrypted and secure
• Access is logged for audit purposes
• Only emergency medical information is shared
• Full medical records remain private

TECHNICAL SUPPORT:
${'-'.repeat(17)}
For technical issues or questions about this QR code:
• Email: support@healthguardian.app
• Emergency technical support: Available 24/7
• App download: healthguardian.app

LEGAL NOTICE:
${'-'.repeat(12)}
This information is provided for emergency medical care only.
Healthcare providers should verify critical information when possible.
Patient consent is implied for emergency medical treatment.

`;
    }

    content += `DOCUMENT INFORMATION:
${'-'.repeat(20)}
Document Type: Emergency QR Code Data
Format: Plain Text
Encoding: UTF-8
Generated By: HealthGuardian Emergency System
Document ID: ${Math.random().toString(36).substr(2, 9)}
Timestamp: ${new Date().toISOString()}

VERIFICATION:
${'-'.repeat(12)}
To verify this document's authenticity:
1. Use HealthGuardian's Document Verification feature
2. Upload this text file to the verification system
3. The app will check against blockchain records
4. Verified documents show confirmation status

For technical support: support@healthguardian.app
Emergency access: https://healthguardian.app/emergency/${qrCodeData}

© ${new Date().getFullYear()} HealthGuardian - Blockchain-Secured Medical Data
`;

    return content;
  }

  // Enhanced save file function with proper Downloads folder targeting
  static async saveFile(
    content: string,
    filename: string,
    mimeType: string
  ): Promise<string> {
    try {
      if (Platform.OS === 'web') {
        // Enhanced web download with proper filename and Downloads folder targeting
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);

        // Create a temporary anchor element for download
        const link = document.createElement('a');
        link.href = url;
        link.download = filename; // This ensures the file goes to Downloads folder
        link.style.display = 'none'; // Hide the link

        // Add to DOM, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up the blob URL
        setTimeout(() => URL.revokeObjectURL(url), 100);

        return `Downloaded: ${filename} to Downloads folder`;
      } else {
        // Mobile save to Documents directory
        const documentsDirectory = FileSystem.documentDirectory;
        const fileUri = `${documentsDirectory}${filename}`;

        await FileSystem.writeAsStringAsync(fileUri, content, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        return fileUri;
      }
    } catch (error) {
      console.error('Failed to save file:', error);
      throw new Error(`Failed to save ${filename}: ${error.message}`);
    }
  }

  // Share file
  static async shareFile(
    uri: string,
    title = 'HealthGuardian QR Code'
  ): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Web sharing
        if (navigator.share) {
          await navigator.share({
            title,
            text: 'Emergency medical QR code from HealthGuardian',
            url: uri,
          });
        } else {
          // Fallback: copy to clipboard
          if (navigator.clipboard) {
            await navigator.clipboard.writeText(uri);
            alert('QR code data copied to clipboard');
          }
        }
      } else {
        // Mobile sharing
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            dialogTitle: title,
            mimeType: 'application/octet-stream',
          });
        } else {
          throw new Error('Sharing is not available on this device');
        }
      }
    } catch (error) {
      console.error('Failed to share file:', error);
      throw new Error('Failed to share file');
    }
  }

  // Save QR code image to gallery
  static async saveToGallery(imageUri: string): Promise<void> {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === 'granted') {
          await MediaLibrary.saveToLibraryAsync(imageUri);
        } else {
          throw new Error('Gallery permission denied');
        }
      }
    } catch (error) {
      console.error('Failed to save to gallery:', error);
      throw new Error('Failed to save to gallery');
    }
  }

  // Download health summary with enhanced Downloads folder targeting
  static async downloadHealthSummary(
    options: HealthSummaryOptions
  ): Promise<string> {
    const { format, healthRecord } = options;
    const timestamp = new Date().toISOString().split('T')[0];
    const sanitizedName =
      healthRecord.full_name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Patient';
    const filename = `HealthGuardian_Summary_${sanitizedName}_${timestamp}`;

    try {
      switch (format) {
        case 'pdf': {
          const content = this.generateHealthSummaryPDF(options);
          return await this.saveFile(
            content,
            `${filename}.pdf`,
            'application/pdf'
          );
        }

        case 'txt': {
          const content = this.generateHealthSummaryText(options);
          return await this.saveFile(content, `${filename}.txt`, 'text/plain');
        }

        default:
          throw new Error(`Unsupported format: ${format}`);
      }
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  }

  // Main download function with enhanced Downloads folder targeting
  static async downloadQRCode(
    options: QRDownloadOptions,
    qrRef?: any
  ): Promise<string> {
    const { format, qrCodeData, patientName } = options;
    const timestamp = new Date().toISOString().split('T')[0];
    const sanitizedName =
      patientName?.replace(/[^a-zA-Z0-9]/g, '_') || 'Patient';
    const filename = `HealthGuardian_QR_${sanitizedName}_${timestamp}`;

    try {
      switch (format) {
        case 'png': {
          if (!qrRef)
            throw new Error('QR code reference required for PNG export');
          const imageUri = await this.captureQRCode(qrRef);

          if (Platform.OS !== 'web') {
            await this.saveToGallery(imageUri);
            return 'QR code saved to gallery';
          } else {
            return 'QR code captured successfully';
          }
        }

        case 'pdf': {
          const content = this.generatePDFContent(options);
          return await this.saveFile(
            content,
            `${filename}.pdf`,
            'application/pdf'
          );
        }

        case 'svg': {
          const content = this.generateSVGContent(options);
          return await this.saveFile(
            content,
            `${filename}.svg`,
            'image/svg+xml'
          );
        }

        case 'txt': {
          const content = this.generateTextContent(options);
          return await this.saveFile(content, `${filename}.txt`, 'text/plain');
        }

        default:
          throw new Error(`Unsupported format: ${format}`);
      }
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  }
}
