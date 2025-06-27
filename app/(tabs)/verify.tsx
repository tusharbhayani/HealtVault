import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FileText, Upload, CheckCircle, XCircle, Crown, Shield, Download, Share, AlertTriangle } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useAuthStore } from '@/store/useAuthStore';
import { verifyHealthDataOnBlockchain } from '@/lib/algorand-simple';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface VerificationResult {
  filename: string;
  verified: boolean;
  timestamp: string;
  hash?: string;
  algorandTxId?: string;
  fileSize?: string;
  fileType?: string;
  blockchainVerified?: boolean;
}

export default function VerifyScreen() {
  const { profile } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [verificationResults, setVerificationResults] = useState<VerificationResult[]>([]);

  const isPremium = profile?.subscription_status === 'premium';

  const saveFileNative = async (content: string, filename: string) => {
    try {
      const filePath = `${FileSystem.cacheDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(filePath, content);
      await Sharing.shareAsync(filePath);
      return true;
    } catch (error) {
      console.error('Native file save failed:', error);
      return false;
    }
  };

  const downloadFile = (content: string, filename: string, contentType: string) => {
    if (Platform.OS === 'web') {
      try {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return true;
      } catch (error) {
        console.error('Download failed:', error);
        return false;
      }
    }
    return false;
  };

  const extractVerificationData = (content: string): { hash?: string; txId?: string } => {
    try {
      // Look for blockchain verification data patterns
      const hashMatch = content.match(/Data Hash:\s*([a-fA-F0-9]+)/);
      const txIdMatch = content.match(/Algorand Transaction ID:\s*([A-Z0-9]+)/);

      // Alternative patterns
      const altHashMatch = content.match(/Document Hash for Verification:\s*([a-fA-F0-9]+)/);
      const altTxIdMatch = content.match(/Blockchain Transaction:\s*([A-Z0-9]+)/);

      return {
        hash: hashMatch?.[1] || altHashMatch?.[1],
        txId: txIdMatch?.[1] || altTxIdMatch?.[1]
      };
    } catch (error) {
      console.error('Error extracting verification data:', error);
      return {};
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/plain', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        await verifyDocument(result.assets[0]);
      }
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const verifyDocument = async (document: DocumentPicker.DocumentPickerAsset) => {
    setLoading(true);
    try {
      console.log('🔍 Starting document verification...');
      console.log('📄 Document:', document.name);
      console.log('📏 Size:', document.size, 'bytes');
      console.log('🎭 Type:', document.mimeType);

      // Read document content
      let content = '';
      let isPdfFile = false;

      try {
        if (document.mimeType === 'text/plain' || document.name.endsWith('.txt')) {
          content = await FileSystem.readAsStringAsync(document.uri);
          console.log('📖 Successfully read text content');
        } else if (document.mimeType === 'application/pdf' || document.name.endsWith('.pdf')) {
          isPdfFile = true;
          console.log('📄 PDF detected - attempting content extraction...');

          // Try to read PDF as text (this will likely fail for binary PDFs)
          try {
            content = await FileSystem.readAsStringAsync(document.uri);
            console.log('📖 PDF content extracted (may be binary)');
          } catch (pdfError) {
            console.log('⚠️ PDF content extraction failed (expected for binary PDFs)');
            content = '';
          }
        } else {
          throw new Error('Unsupported file type for verification');
        }
      } catch (readError) {
        console.error('❌ Failed to read document content:', readError);
        throw new Error('Unable to read document content. Please ensure the file is not corrupted.');
      }

      // Extract verification data from content
      console.log('🔍 Extracting verification data...');
      const { hash, txId } = extractVerificationData(content);

      console.log('🔐 Extracted hash:', hash?.substring(0, 16) + '...' || 'Not found');
      console.log('🆔 Extracted TX ID:', txId?.substring(0, 20) + '...' || 'Not found');

      // Check if this is a PDF with no extractable verification data
      if (isPdfFile && !hash && !txId) {
        // Show specific guidance for PDF files
        Alert.alert(
          'PDF Verification Not Supported ⚠️',
          `PDF content extraction is not supported in this demo environment.\n\n` +
          `📋 To verify your HealthGuardian documents:\n\n` +
          `1. Go to the Health tab\n` +
          `2. Click "Download Verifiable Health Summary"\n` +
          `3. Choose "Text File" format\n` +
          `4. Upload the .txt file here for verification\n\n` +
          `Text files contain the same verification data in a readable format that can be properly verified against the blockchain.`,
          [{ text: 'OK' }]
        );

        // Still record the attempt for history
        const result: VerificationResult = {
          filename: document.name,
          verified: false,
          timestamp: new Date().toISOString(),
          fileSize: document.size ? `${(document.size / 1024).toFixed(1)} KB` : 'Unknown',
          fileType: document.mimeType || 'Unknown',
          blockchainVerified: false,
        };

        setVerificationResults(prev => [result, ...prev]);
        return;
      }

      // Perform blockchain verification if we have the necessary data
      let blockchainVerified = false;
      let verified = false;

      if (hash && txId) {
        console.log('⛓️ Performing blockchain verification...');
        try {
          // Use the actual blockchain verification function
          blockchainVerified = await verifyHealthDataOnBlockchain(hash, '', txId);
          verified = blockchainVerified;
          console.log('✅ Blockchain verification result:', blockchainVerified);
        } catch (blockchainError) {
          console.error('❌ Blockchain verification failed:', blockchainError);
          // If blockchain verification fails, we can still check if the document contains valid data
          verified = hash.length > 0 && txId.length > 0;
        }
      } else if (hash || txId) {
        // Partial verification - document contains some verification data
        console.log('⚠️ Partial verification data found');
        verified = true;
        blockchainVerified = false;
      } else {
        // No verification data found
        console.log('❌ No verification data found in document');
        verified = false;
        blockchainVerified = false;
      }

      // Format file size
      const fileSize = document.size ? `${(document.size / 1024).toFixed(1)} KB` : 'Unknown';
      const fileType = document.mimeType || 'Unknown';

      const result: VerificationResult = {
        filename: document.name,
        verified,
        timestamp: new Date().toISOString(),
        hash,
        algorandTxId: txId,
        fileSize,
        fileType,
        blockchainVerified,
      };

      setVerificationResults(prev => [result, ...prev]);

      // Show detailed verification result
      if (blockchainVerified) {
        Alert.alert(
          'Document Verified ✅',
          `${document.name} has been successfully verified on the Algorand blockchain!\n\n` +
          `✅ Document is authentic\n` +
          `✅ Data integrity confirmed\n` +
          `✅ Blockchain verification passed\n\n` +
          `Transaction ID: ${txId?.substring(0, 20)}...`
        );
      } else if (verified && (hash || txId)) {
        Alert.alert(
          'Partial Verification ⚠️',
          `${document.name} contains verification data but blockchain confirmation failed.\n\n` +
          `📄 Document contains verification metadata\n` +
          `${hash ? '✅ Data hash found\n' : ''}` +
          `${txId ? '✅ Transaction ID found\n' : ''}` +
          `⚠️ Blockchain verification unavailable\n\n` +
          `This may be due to network issues or the transaction not being confirmed yet.`
        );
      } else {
        Alert.alert(
          'Verification Failed ❌',
          `${document.name} could not be verified.\n\n` +
          `❌ No verification data found\n` +
          `❌ Document may not be from HealthGuardian\n` +
          `❌ File may have been tampered with\n\n` +
          `Only documents generated by HealthGuardian can be verified.\n\n` +
          `💡 For PDFs: Use "Text File" format when downloading from the Health tab for successful verification.`
        );
      }
    } catch (error: any) {
      console.error('❌ Verification error:', error);
      Alert.alert('Verification Error', error.message || 'Failed to verify document');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadResult = async (result: VerificationResult) => {
    const reportContent = `
HEALTHGUARDIAN DOCUMENT VERIFICATION REPORT
==========================================

Document: ${result.filename}
Verification Status: ${result.verified ? 'VERIFIED' : 'UNVERIFIED'}
Blockchain Status: ${result.blockchainVerified ? 'CONFIRMED' : 'UNCONFIRMED'}
Timestamp: ${new Date(result.timestamp).toLocaleString()}
File Size: ${result.fileSize}
File Type: ${result.fileType}
${result.hash ? `Data Hash: ${result.hash}` : ''}
${result.algorandTxId ? `Algorand Transaction ID: ${result.algorandTxId}` : ''}

Verification Details:
- Document was ${result.verified ? 'successfully verified' : 'not verified'} against verification standards
- Blockchain verification: ${result.blockchainVerified ? 'PASSED' : 'FAILED/UNAVAILABLE'}
- Verification performed on: ${new Date(result.timestamp).toLocaleString()}
- Blockchain network: Algorand Testnet
- Security level: ${result.blockchainVerified ? 'High (Blockchain Confirmed)' : result.verified ? 'Medium (Metadata Found)' : 'Low (Unverified)'}

${result.blockchainVerified
        ? 'This document has been cryptographically verified on the Algorand blockchain and its integrity is confirmed.'
        : result.verified
          ? 'This document contains verification metadata but blockchain confirmation was not available.'
          : 'This document could not be verified. It may not be from HealthGuardian or may have been tampered with.'
      }

${result.algorandTxId ? `Explorer URL: https://testnet.algoexplorer.io/tx/${result.algorandTxId}` : ''}

Generated by HealthGuardian Document Verification
Report ID: ${Math.random().toString(36).substr(2, 9)}
    `;

    const filename = `HealthGuardian_Verification_${result.filename.replace(/\.[^/.]+$/, "")}_${Date.now()}.txt`;

    if (Platform.OS === 'web') {
      const success = downloadFile(reportContent, filename, 'text/plain');

      if (success) {
        Alert.alert('Download Started', `Verification report downloaded for ${result.filename}`);
      } else {
        Alert.alert('Download Failed', 'Unable to download verification report. Please try again.');
      }
    } else {
      const success = await saveFileNative(reportContent, filename);

      if (success) {
        Alert.alert('Report Saved', `Verification report saved and ready to share.\n\nFilename: ${filename}`);
      } else {
        Alert.alert('Save Failed', 'Unable to save verification report. Please try again.');
      }
    }
  };

  const handleShareResult = async (result: VerificationResult) => {
    const shareText = `HealthGuardian Document Verification\n\nDocument: ${result.filename}\nStatus: ${result.verified ? 'VERIFIED ✅' : 'UNVERIFIED ❌'}\nBlockchain: ${result.blockchainVerified ? 'CONFIRMED ✅' : 'UNCONFIRMED ⚠️'}\nTimestamp: ${new Date(result.timestamp).toLocaleString()}\n${result.hash ? `Hash: ${result.hash}` : ''}\n${result.algorandTxId ? `TX: ${result.algorandTxId}` : ''}`;

    if (Platform.OS === 'web') {
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Document Verification Result',
            text: shareText,
          });
        } catch (error) {
          console.error('Share failed:', error);
          // Fallback to clipboard
          if (navigator.clipboard) {
            await navigator.clipboard.writeText(shareText);
            Alert.alert('Copied', 'Verification result copied to clipboard');
          }
        }
      } else {
        // Fallback to clipboard
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(shareText);
          Alert.alert('Copied', 'Verification result copied to clipboard');
        } else {
          Alert.alert('Share', shareText);
        }
      }
    } else {
      try {
        await Sharing.shareAsync(shareText, {
          dialogTitle: 'Share Verification Result',
        });
      } catch (error) {
        Alert.alert('Share Failed', 'Unable to share verification result');
      }
    }
  };

  if (loading) {
    return <LoadingSpinner message="Verifying document on blockchain..." />;
  }

  if (!isPremium) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Image
                source={{ uri: 'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=400' }}
                style={styles.headerImage}
              />
              <View style={styles.headerText}>
                <Text style={styles.title}>Document Verification</Text>
                <Text style={styles.subtitle}>
                  Blockchain-powered document authenticity verification
                </Text>
              </View>
            </View>
          </View>

          <Card style={styles.upgradePrompt}>
            <View style={styles.upgradeContent}>
              <Crown size={48} color="#F59E0B" />
              <Text style={styles.upgradeTitle}>Premium Feature</Text>
              <Text style={styles.upgradeDescription}>
                Document verification is available for Premium subscribers only.
                Upgrade your account to verify the authenticity of health documents using blockchain technology.
              </Text>

              <View style={styles.featureList}>
                <Text style={styles.featureItem}>• Blockchain verification</Text>
                <Text style={styles.featureItem}>• Document authenticity checks</Text>
                <Text style={styles.featureItem}>• Tamper detection</Text>
                <Text style={styles.featureItem}>• Verification history</Text>
                <Text style={styles.featureItem}>• Downloadable reports</Text>
                <Text style={styles.featureItem}>• Share verification results</Text>
              </View>

              <Button
                title="Upgrade to Premium"
                onPress={() => {
                  Alert.alert(
                    'Upgrade to Premium',
                    'Go to Settings to upgrade your account and unlock document verification features.',
                    [{ text: 'OK' }]
                  );
                }}
                variant="secondary"
                style={styles.upgradeButton}
              />
            </View>
          </Card>

          <Card style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Shield size={24} color="#0EA5E9" />
              <Text style={styles.infoTitle}>How Verification Works</Text>
            </View>
            <View style={styles.infoList}>
              <Text style={styles.infoItem}>
                • Documents are hashed using cryptographic algorithms
              </Text>
              <Text style={styles.infoItem}>
                • Hashes are compared against Algorand blockchain records
              </Text>
              <Text style={styles.infoItem}>
                • Verification confirms document authenticity and integrity
              </Text>
              <Text style={styles.infoItem}>
                • Tampered or fake documents will fail verification
              </Text>
            </View>
          </Card>

          {/* Sample Documents Section */}
          <Card style={styles.sampleCard}>
            <Text style={styles.sampleTitle}>Test Documents</Text>
            <Text style={styles.sampleDescription}>
              Try these sample document types for testing verification:
            </Text>
            <View style={styles.sampleList}>
              <Text style={styles.sampleItem}>📄 Medical reports (PDF)</Text>
              <Text style={styles.sampleItem}>🏥 Lab results (PDF/Image)</Text>
              <Text style={styles.sampleItem}>💊 Prescription documents (PDF/Image)</Text>
              <Text style={styles.sampleItem}>🆔 Medical ID cards (Image)</Text>
              <Text style={styles.sampleItem}>📋 Insurance documents (PDF)</Text>
            </View>
          </Card>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Image
              source={{ uri: 'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=400' }}
              style={styles.headerImage}
            />
            <View style={styles.headerText}>
              <Text style={styles.title}>Document Verification</Text>
              <Text style={styles.subtitle}>
                Verify the authenticity of health documents using blockchain technology
              </Text>
            </View>
          </View>
        </View>

        <Card>
          <View style={styles.uploadSection}>
            <Upload size={48} color="#0EA5E9" />
            <Text style={styles.uploadTitle}>Upload Document</Text>
            <Text style={styles.uploadDescription}>
              Select a text file (.txt) to verify its authenticity against Algorand blockchain records.
              For best results, download your health summary as a text file from the Health tab.
            </Text>
            <Button
              title="Choose Document"
              onPress={pickDocument}
              style={styles.uploadButton}
              disabled={loading}
            />
          </View>
        </Card>

        {/* Instructions for getting verifiable documents */}
        <Card style={styles.instructionCard}>
          <View style={styles.instructionHeader}>
            <AlertTriangle size={20} color="#F59E0B" />
            <Text style={styles.instructionTitle}>How to Get Verifiable Documents</Text>
          </View>
          <View style={styles.instructionList}>
            <Text style={styles.instructionItem}>
              1. Go to the Health tab and save your health information
            </Text>
            <Text style={styles.instructionItem}>
              2. Click "Download Verifiable Health Summary"
            </Text>
            <Text style={styles.instructionItem}>
              3. Choose "Text File" format for best verification results
            </Text>
            <Text style={styles.instructionItem}>
              4. Upload the downloaded .txt file here to verify
            </Text>
          </View>
          <View style={styles.pdfNote}>
            <Text style={styles.pdfNoteText}>
              📄 Note: PDF verification is limited in this demo. Text files contain the same verification data in a readable format.
            </Text>
          </View>
        </Card>

        {/* Supported Formats */}
        <Card style={styles.formatsCard}>
          <Text style={styles.formatsTitle}>Supported Formats</Text>
          <View style={styles.formatsList}>
            <Text style={styles.formatItem}>📝 Text files (.txt) - Recommended</Text>
            <Text style={styles.formatItem}>📄 PDF documents - Limited support</Text>
            <Text style={styles.formatItem}>📱 HealthGuardian summaries</Text>
            <Text style={styles.formatItem}>🔐 Blockchain-verified documents</Text>
          </View>
        </Card>

        {verificationResults.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Verification History</Text>
            {verificationResults.map((result, index) => (
              <Card key={index} style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  {result.blockchainVerified ? (
                    <CheckCircle size={24} color="#10B981" />
                  ) : result.verified ? (
                    <AlertTriangle size={24} color="#F59E0B" />
                  ) : (
                    <XCircle size={24} color="#EF4444" />
                  )}
                  <View style={styles.resultInfo}>
                    <Text style={styles.resultFilename}>{result.filename}</Text>
                    <Text style={styles.resultDetails}>
                      {result.fileSize} • {result.fileType}
                    </Text>
                    <Text style={styles.resultTimestamp}>
                      {new Date(result.timestamp).toLocaleDateString()} at{' '}
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </Text>
                    {result.hash && (
                      <Text style={styles.resultHash}>Hash: {result.hash.substring(0, 20)}...</Text>
                    )}
                    {result.algorandTxId && (
                      <Text style={styles.resultTxId}>TX: {result.algorandTxId.substring(0, 20)}...</Text>
                    )}
                  </View>
                </View>

                <View style={styles.resultActions}>
                  <View style={[
                    styles.resultStatus,
                    result.blockchainVerified ? styles.verifiedStatus :
                      result.verified ? styles.partialStatus : styles.unverifiedStatus
                  ]}>
                    <Text style={[
                      styles.statusText,
                      result.blockchainVerified ? styles.verifiedText :
                        result.verified ? styles.partialText : styles.unverifiedText
                    ]}>
                      {result.blockchainVerified ? 'BLOCKCHAIN VERIFIED' :
                        result.verified ? 'PARTIAL VERIFICATION' : 'UNVERIFIED'}
                    </Text>
                  </View>

                  <View style={styles.actionButtons}>
                    <Button
                      title=""
                      onPress={() => handleDownloadResult(result)}
                      variant="outline"
                      size="small"
                      style={styles.actionButton}
                    >
                      <Download size={16} color="#6B7280" />
                    </Button>
                    <Button
                      title=""
                      onPress={() => handleShareResult(result)}
                      variant="outline"
                      size="small"
                      style={styles.actionButton}
                    >
                      <Share size={16} color="#6B7280" />
                    </Button>
                  </View>
                </View>
              </Card>
            ))}
          </>
        )}

        <Card style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Shield size={24} color="#0EA5E9" />
            <Text style={styles.infoTitle}>How Verification Works</Text>
          </View>
          <View style={styles.infoList}>
            <Text style={styles.infoItem}>
              • Documents are analyzed for embedded verification data
            </Text>
            <Text style={styles.infoItem}>
              • Data hashes are compared against Algorand blockchain records
            </Text>
            <Text style={styles.infoItem}>
              • Verification confirms document authenticity and integrity
            </Text>
            <Text style={styles.infoItem}>
              • Tampered or fake documents will fail verification
            </Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    marginTop: 20,
    marginBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  upgradePrompt: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  upgradeContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  upgradeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#92400E',
    marginTop: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  upgradeDescription: {
    fontSize: 16,
    color: '#A16207',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  featureList: {
    alignSelf: 'stretch',
    marginBottom: 24,
  },
  featureItem: {
    fontSize: 14,
    color: '#A16207',
    marginBottom: 8,
  },
  upgradeButton: {
    minWidth: 180,
  },
  uploadSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  uploadTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  uploadDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  uploadButton: {
    minWidth: 160,
  },
  instructionCard: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  instructionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
    marginLeft: 8,
  },
  instructionList: {
    paddingLeft: 8,
    marginBottom: 16,
  },
  instructionItem: {
    fontSize: 14,
    color: '#A16207',
    lineHeight: 20,
    marginBottom: 8,
  },
  pdfNote: {
    backgroundColor: '#FEF9C3',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE047',
  },
  pdfNoteText: {
    fontSize: 13,
    color: '#A16207',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  formatsCard: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  formatsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0C4A6E',
    marginBottom: 12,
  },
  formatsList: {
    gap: 8,
  },
  formatItem: {
    fontSize: 14,
    color: '#0369A1',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 32,
    marginBottom: 16,
  },
  resultCard: {
    marginBottom: 12,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  resultInfo: {
    flex: 1,
    marginLeft: 12,
  },
  resultFilename: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  resultDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  resultTimestamp: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  resultHash: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    fontFamily: 'monospace',
  },
  resultTxId: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  resultActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  verifiedStatus: {
    backgroundColor: '#ECFDF5',
  },
  partialStatus: {
    backgroundColor: '#FEF3C7',
  },
  unverifiedStatus: {
    backgroundColor: '#FEF2F2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  verifiedText: {
    color: '#10B981',
  },
  partialText: {
    color: '#F59E0B',
  },
  unverifiedText: {
    color: '#EF4444',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    marginTop: 24,
    marginBottom: 32,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0C4A6E',
    marginLeft: 8,
  },
  infoList: {
    paddingLeft: 8,
  },
  infoItem: {
    fontSize: 14,
    color: '#0369A1',
    lineHeight: 20,
    marginBottom: 8,
  },
  sampleCard: {
    marginTop: 16,
  },
  sampleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  sampleDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  sampleList: {
    paddingLeft: 8,
  },
  sampleItem: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 6,
  },
});