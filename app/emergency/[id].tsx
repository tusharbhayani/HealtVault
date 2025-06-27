import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { AlertCircle, Phone, Shield, Heart, Users, FileText, Volume2, Download, Share, CheckCircle, XCircle } from 'lucide-react-native';
import { useHealthStore } from '@/store/useHealthStore';
import { HealthRecord } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmergencyTTSPlayer } from '@/components/EmergencyTTSPlayer';

export default function EmergencyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getPublicHealthData } = useHealthStore();
  const [healthData, setHealthData] = useState<HealthRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadEmergencyData();
    }
  }, [id]);

  const loadEmergencyData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load emergency data with blockchain verification
      const data = await getPublicHealthData(id);

      if (data) {
        setHealthData(data);
      } else {
        setError('Health record not found or access denied');
      }
    } catch (err: any) {
      console.error('Error loading emergency data:', err);
      setError('Failed to load health information');
    } finally {
      setLoading(false);
    }
  };

  const handleShareData = () => {
    if (!healthData) return;

    Alert.alert(
      'Share Emergency Data',
      `Share ${healthData.full_name}'s emergency health information?\n\nThis will create a secure, time-limited link that can be shared with other emergency responders.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Share',
          onPress: () => {
            // In a real app, this would generate a secure share link
            Alert.alert(
              'Shared Successfully',
              'Emergency data link copied to clipboard:\nhttps://healthguardian.app/emergency/secure-abc123\n\nLink expires in 24 hours.'
            );
          }
        }
      ]
    );
  };

  const handleDownloadData = () => {
    if (!healthData) return;

    Alert.alert(
      'Download Emergency Report',
      `Download a PDF report of ${healthData.full_name}'s emergency health information?\n\nThis will create a comprehensive medical summary for offline use.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Download',
          onPress: () => {
            // In a real app, this would generate and download a PDF
            Alert.alert(
              'Download Started',
              'Emergency health report is being generated and will be saved to your device.\n\nFilename: Emergency_Report_John_Doe_20250124.pdf'
            );
          }
        }
      ]
    );
  };

  if (loading) {
    return <LoadingSpinner message="Loading emergency health information..." />;
  }

  if (error || !healthData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <AlertCircle size={64} color="#EF4444" />
          <Text style={styles.errorTitle}>Access Denied</Text>
          <Text style={styles.errorMessage}>
            {error || 'This health record could not be accessed.'}
          </Text>
          <Text style={styles.errorSubtext}>
            Please verify the QR code is valid and try again.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.emergencyBadge}>
            <Shield size={24} color="#FFFFFF" />
            <Text style={styles.emergencyText}>EMERGENCY ACCESS</Text>
          </View>
          <Image
            source={{ uri: 'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=400' }}
            style={styles.headerImage}
          />
          <Text style={styles.title}>Medical Information</Text>
          <Text style={styles.subtitle}>
            Patient: {healthData.full_name}
          </Text>
          <Text style={styles.patientId}>
            ID: {healthData.qr_code_id}
          </Text>
        </View>

        {/* Blockchain Verification Status */}
        <Card style={[
          styles.verificationCard,
          healthData.is_blockchain_verified ? styles.verifiedCard : styles.unverifiedCard
        ]}>
          <View style={styles.verificationContent}>
            {healthData.is_blockchain_verified ? (
              <CheckCircle size={24} color="#10B981" />
            ) : (
              <XCircle size={24} color="#F59E0B" />
            )}
            <View style={styles.verificationText}>
              <Text style={[
                styles.verificationTitle,
                healthData.is_blockchain_verified ? styles.verifiedText : styles.unverifiedText
              ]}>
                {healthData.is_blockchain_verified ? 'Blockchain Verified' : 'Verification Pending'}
              </Text>
              <Text style={styles.verificationDescription}>
                {healthData.is_blockchain_verified
                  ? 'Data integrity confirmed on Algorand blockchain'
                  : 'Unable to verify data integrity at this time'
                }
              </Text>
            </View>
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            title="Share Data"
            onPress={handleShareData}
            variant="outline"
            size="small"
            style={styles.actionButton}
          >
            <Share size={16} color="#0EA5E9" />
          </Button>
          <Button
            title="Download Report"
            onPress={handleDownloadData}
            variant="outline"
            size="small"
            style={styles.actionButton}
          >
            <Download size={16} color="#0EA5E9" />
          </Button>
        </View>

        {/* Emergency TTS Player */}
        <EmergencyTTSPlayer
          emergencyData={{
            bloodType: healthData.blood_type,
            allergies: healthData.allergies || [],
            medications: healthData.medications || [],
            emergencyContacts: healthData.emergency_contacts || [],
            medicalConditions: healthData.medical_conditions || []
          }}
          autoPlay={false}
        />

        {/* Critical Information */}
        <Card style={styles.criticalInfo}>
          <View style={styles.criticalHeader}>
            <Heart size={24} color="#EF4444" />
            <Text style={styles.sectionTitle}>Critical Information</Text>
          </View>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Blood Type</Text>
              <Text style={styles.infoValue}>
                {healthData.blood_type || 'Not specified'}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Last Updated</Text>
              <Text style={styles.infoValue}>
                {new Date(healthData.updated_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </Card>

        {/* Allergies */}
        {healthData.allergies && healthData.allergies.length > 0 && (
          <Card style={styles.alertCard}>
            <Text style={styles.alertTitle}>⚠️ CRITICAL ALLERGIES</Text>
            <Text style={styles.alertSubtitle}>
              Immediate medical attention required if exposed
            </Text>
            {healthData.allergies.map((allergy, index) => (
              <View key={index} style={styles.alertItemContainer}>
                <AlertCircle size={16} color="#EF4444" />
                <Text style={styles.alertItem}>{allergy}</Text>
              </View>
            ))}
          </Card>
        )}

        {/* Current Medications */}
        {healthData.medications && healthData.medications.length > 0 && (
          <Card>
            <View style={styles.sectionHeader}>
              <FileText size={20} color="#8B5CF6" />
              <Text style={styles.sectionTitle}>Current Medications</Text>
            </View>
            <Text style={styles.sectionSubtitle}>
              Active prescriptions and dosages
            </Text>
            {healthData.medications.map((medication, index) => (
              <View key={index} style={styles.medicationItem}>
                <Text style={styles.listItem}>• {medication}</Text>
              </View>
            ))}
          </Card>
        )}

        {/* Medical Conditions */}
        {healthData.medical_conditions && healthData.medical_conditions.length > 0 && (
          <Card>
            <View style={styles.sectionHeader}>
              <Heart size={20} color="#EF4444" />
              <Text style={styles.sectionTitle}>Medical Conditions</Text>
            </View>
            <Text style={styles.sectionSubtitle}>
              Known medical history and diagnoses
            </Text>
            {healthData.medical_conditions.map((condition, index) => (
              <View key={index} style={styles.conditionItem}>
                <Text style={styles.listItem}>• {condition}</Text>
              </View>
            ))}
          </Card>
        )}

        {/* Emergency Contacts */}
        {healthData.emergency_contacts && healthData.emergency_contacts.length > 0 && (
          <Card>
            <View style={styles.sectionHeader}>
              <Users size={20} color="#10B981" />
              <Text style={styles.sectionTitle}>Emergency Contacts</Text>
            </View>
            <Text style={styles.sectionSubtitle}>
              Authorized contacts for medical decisions
            </Text>
            {healthData.emergency_contacts.map((contact, index) => (
              <View key={index} style={styles.contactItem}>
                <View style={styles.contactHeader}>
                  <Phone size={16} color="#0EA5E9" />
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <View style={styles.priorityBadge}>
                    <Text style={styles.priorityText}>#{index + 1}</Text>
                  </View>
                </View>
                <Text style={styles.contactRelation}>{contact.relationship}</Text>
                <Text style={styles.contactPhone}>{contact.phone}</Text>
                {contact.email && (
                  <Text style={styles.contactEmail}>{contact.email}</Text>
                )}
              </View>
            ))}
          </Card>
        )}

        {/* Medical Instructions */}
        <Card style={styles.instructionsCard}>
          <View style={styles.instructionsHeader}>
            <Volume2 size={20} color="#F59E0B" />
            <Text style={styles.instructionsTitle}>Emergency Instructions</Text>
          </View>
          <View style={styles.instructionsList}>
            <Text style={styles.instructionItem}>
              1. Check for medical alert bracelet or necklace
            </Text>
            <Text style={styles.instructionItem}>
              2. Contact primary emergency contact immediately
            </Text>
            <Text style={styles.instructionItem}>
              3. Inform medical team of all listed allergies
            </Text>
            <Text style={styles.instructionItem}>
              4. Provide current medication list to attending physician
            </Text>
            <Text style={styles.instructionItem}>
              5. Consider medical conditions when planning treatment
            </Text>
          </View>
        </Card>

        {/* Disclaimer */}
        <Card style={styles.disclaimer}>
          <View style={styles.disclaimerHeader}>
            <Shield size={20} color="#0C4A6E" />
            <Text style={styles.disclaimerTitle}>Emergency Use Only</Text>
          </View>
          <Text style={styles.disclaimerText}>
            This information is provided for emergency medical care only.
            Access is logged and monitored for HIPAA compliance. Please contact
            emergency services (911) if immediate medical attention is required.
          </Text>
          <Text style={styles.disclaimerFooter}>
            Data hash: {healthData.data_hash?.substring(0, 16)}... •
            Algorand Address: {healthData.user_algorand_address?.substring(0, 16)}...
          </Text>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#EF4444',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  header: {
    marginTop: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  emergencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  emergencyText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
    letterSpacing: 1,
  },
  headerImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  patientId: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  verificationCard: {
    marginBottom: 16,
  },
  verifiedCard: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  unverifiedCard: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  verificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verificationText: {
    marginLeft: 12,
    flex: 1,
  },
  verificationTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  verifiedText: {
    color: '#10B981',
  },
  unverifiedText: {
    color: '#F59E0B',
  },
  verificationDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  criticalInfo: {
    backgroundColor: '#FEF2F2',
    borderWidth: 2,
    borderColor: '#FECACA',
  },
  criticalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    marginLeft: 28,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  infoItem: {
    flex: 1,
    minWidth: '45%',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  alertCard: {
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#FCD34D',
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 8,
  },
  alertSubtitle: {
    fontSize: 14,
    color: '#A16207',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  alertItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  alertItem: {
    fontSize: 16,
    color: '#92400E',
    fontWeight: '600',
    marginLeft: 8,
  },
  medicationItem: {
    marginBottom: 8,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  conditionItem: {
    marginBottom: 8,
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
  },
  listItem: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  contactItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 8,
    flex: 1,
  },
  priorityBadge: {
    backgroundColor: '#0EA5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  contactRelation: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
    marginLeft: 24,
  },
  contactPhone: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0EA5E9',
    marginBottom: 2,
    marginLeft: 24,
  },
  contactEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 24,
  },
  instructionsCard: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
    marginLeft: 8,
  },
  instructionsList: {
    paddingLeft: 8,
  },
  instructionItem: {
    fontSize: 14,
    color: '#A16207',
    lineHeight: 20,
    marginBottom: 8,
  },
  disclaimer: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginTop: 24,
    marginBottom: 32,
  },
  disclaimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  disclaimerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0C4A6E',
    marginLeft: 8,
  },
  disclaimerText: {
    fontSize: 14,
    color: '#0369A1',
    lineHeight: 20,
    marginBottom: 8,
  },
  disclaimerFooter: {
    fontSize: 12,
    color: '#0C4A6E',
    fontFamily: 'monospace',
  },
});