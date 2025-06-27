import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Trash2, Heart, Shield, Users, AlertTriangle, Download, FileText } from 'lucide-react-native';
import { useHealthStore } from '@/store/useHealthStore';
import { EmergencyContact } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { QRCodeManager } from '@/lib/qr-utils';

export default function HealthScreen() {
  const { healthRecord, saveHealthRecord, loading } = useHealthStore();

  const [fullName, setFullName] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [allergies, setAllergies] = useState<string[]>(['']);
  const [medications, setMedications] = useState<string[]>(['']);
  const [conditions, setConditions] = useState<string[]>(['']);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
    { name: '', relationship: '', phone: '', email: '' }
  ]);

  // Reset form to initial state
  const resetForm = () => {
    setFullName('');
    setBloodType('');
    setAllergies(['']);
    setMedications(['']);
    setConditions(['']);
    setEmergencyContacts([{ name: '', relationship: '', phone: '', email: '' }]);
  };

  useEffect(() => {
    if (healthRecord) {
      setFullName(healthRecord.full_name || '');
      setBloodType(healthRecord.blood_type || '');
      setAllergies(healthRecord.allergies?.length ? healthRecord.allergies : ['']);
      setMedications(healthRecord.medications?.length ? healthRecord.medications : ['']);
      setConditions(healthRecord.medical_conditions?.length ? healthRecord.medical_conditions : ['']);
      setEmergencyContacts(
        healthRecord.emergency_contacts?.length
          ? healthRecord.emergency_contacts
          : [{ name: '', relationship: '', phone: '', email: '' }]
      );
    }
  }, [healthRecord]);

  const updateArrayField = (
    index: number,
    value: string,
    array: string[],
    setter: (arr: string[]) => void
  ) => {
    const newArray = [...array];
    newArray[index] = value;
    setter(newArray);
  };

  const addArrayField = (array: string[], setter: (arr: string[]) => void) => {
    setter([...array, '']);
  };

  const removeArrayField = (
    index: number,
    array: string[],
    setter: (arr: string[]) => void
  ) => {
    const newArray = array.filter((_, i) => i !== index);
    setter(newArray.length ? newArray : ['']);
  };

  const updateEmergencyContact = (
    index: number,
    field: keyof EmergencyContact,
    value: string
  ) => {
    const newContacts = [...emergencyContacts];
    newContacts[index] = { ...newContacts[index], [field]: value };
    setEmergencyContacts(newContacts);
  };

  const addEmergencyContact = () => {
    setEmergencyContacts([
      ...emergencyContacts,
      { name: '', relationship: '', phone: '', email: '' }
    ]);
  };

  const removeEmergencyContact = (index: number) => {
    const newContacts = emergencyContacts.filter((_, i) => i !== index);
    setEmergencyContacts(
      newContacts.length
        ? newContacts
        : [{ name: '', relationship: '', phone: '', email: '' }]
    );
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Validation Error', 'Full name is required');
      return;
    }

    try {
      const cleanAllergies = allergies.filter(a => a.trim());
      const cleanMedications = medications.filter(m => m.trim());
      const cleanConditions = conditions.filter(c => c.trim());
      const cleanContacts = emergencyContacts.filter(c => c.name.trim() && c.phone.trim());

      await saveHealthRecord({
        full_name: fullName.trim(),
        blood_type: bloodType,
        allergies: cleanAllergies,
        medications: cleanMedications,
        medical_conditions: cleanConditions,
        emergency_contacts: cleanContacts,
      });

      // Clear form after successful save
      resetForm();

      Alert.alert(
        'Success! 🎉',
        'Your health information has been saved and secured on the blockchain!\n\nThe form has been cleared and is ready for new input.',
        [{ text: 'Great!', style: 'default' }]
      );
    } catch (error: any) {
      Alert.alert('Save Failed', error.message || 'Failed to save health information');
    }
  };

  const handleDownloadVerifiableSummary = async () => {
    if (!healthRecord) {
      Alert.alert('No Health Record', 'Please save your health information first to download a verifiable summary.');
      return;
    }

    Alert.alert(
      'Download Verifiable Health Summary',
      'Choose the format for your blockchain-verified health document:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'PDF Document',
          onPress: async () => {
            try {
              const result = await QRCodeManager.downloadHealthSummary({
                format: 'pdf',
                healthRecord,
                includeBlockchainData: true,
              });
              Alert.alert(
                'Download Complete! 📄',
                `Your verifiable health summary has been downloaded.\n\n${result}\n\nThis document contains your blockchain transaction ID and data hash for verification purposes.`
              );
            } catch (error: any) {
              Alert.alert('Download Failed', error.message);
            }
          },
        },
        {
          text: 'Text File',
          onPress: async () => {
            try {
              const result = await QRCodeManager.downloadHealthSummary({
                format: 'txt',
                healthRecord,
                includeBlockchainData: true,
              });
              Alert.alert(
                'Download Complete! 📝',
                `Your verifiable health summary has been downloaded.\n\n${result}\n\nThis document contains your blockchain verification data.`
              );
            } catch (error: any) {
              Alert.alert('Download Failed', error.message);
            }
          },
        },
      ]
    );
  };

  const handleClearForm = () => {
    Alert.alert(
      'Clear Form',
      'Are you sure you want to clear all form data? This will not affect your saved health record.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: resetForm }
      ]
    );
  };

  if (loading) {
    return <LoadingSpinner message="Saving your health information..." />;
  }

  const renderArrayInput = (
    title: string,
    array: string[],
    setter: (arr: string[]) => void,
    placeholder: string,
    icon: React.ReactNode
  ) => (
    <Card>
      <View style={styles.sectionHeader}>
        {icon}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {array.map((item, index) => (
        <View key={index} style={styles.arrayInputRow}>
          <View style={styles.arrayInput}>
            <Input
              value={item}
              onChangeText={(value) => updateArrayField(index, value, array, setter)}
              placeholder={placeholder}
            />
          </View>
          {array.length > 1 && (
            <Button
              title=""
              onPress={() => removeArrayField(index, array, setter)}
              variant="danger"
              size="small"
              style={styles.removeButton}
            >
              <Trash2 size={16} color="#FFFFFF" />
            </Button>
          )}
        </View>
      ))}
      <Button
        title={`Add ${title.slice(0, -1)}`}
        onPress={() => addArrayField(array, setter)}
        variant="outline"
        size="small"
        style={styles.addButton}
      />
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Image
              source={{ uri: 'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=400' }}
              style={styles.headerImage}
            />
            <View style={styles.headerText}>
              <Text style={styles.title}>Health Information</Text>
              <Text style={styles.subtitle}>
                Keep your emergency medical information up to date and secure
              </Text>
            </View>
          </View>
        </View>

        {/* Form Status */}
        {healthRecord && (
          <Card style={styles.statusCard}>
            <View style={styles.statusContent}>
              <Shield size={20} color="#10B981" />
              <View style={styles.statusText}>
                <Text style={styles.statusTitle}>Health Record Saved</Text>
                <Text style={styles.statusDescription}>
                  Last updated: {new Date(healthRecord.updated_at).toLocaleDateString()}
                </Text>
                {healthRecord.algorand_tx_id && (
                  <Text style={styles.blockchainInfo}>
                    Blockchain TX: {healthRecord.algorand_tx_id.substring(0, 20)}...
                  </Text>
                )}
              </View>
            </View>
          </Card>
        )}

        {/* Download Verifiable Summary */}
        {healthRecord && (
          <Card style={styles.downloadCard}>
            <View style={styles.downloadContent}>
              <FileText size={24} color="#8B5CF6" />
              <View style={styles.downloadText}>
                <Text style={styles.downloadTitle}>Verifiable Health Summary</Text>
                <Text style={styles.downloadDescription}>
                  Download a blockchain-verified document containing your health information and verification data.
                </Text>
              </View>
              <Button
                title="Download"
                onPress={handleDownloadVerifiableSummary}
                variant="secondary"
                size="small"
                style={styles.downloadButton}
              >
                <Download size={16} color="#FFFFFF" />
              </Button>
            </View>
          </Card>
        )}

        {/* Basic Information */}
        <Card>
          <View style={styles.sectionHeader}>
            <Heart size={20} color="#EF4444" />
            <Text style={styles.sectionTitle}>Basic Information</Text>
          </View>
          <Input
            label="Full Name"
            value={fullName}
            onChangeText={setFullName}
            required
            placeholder="Enter your full name"
          />
          <Input
            label="Blood Type"
            value={bloodType}
            onChangeText={setBloodType}
            placeholder="e.g., A+, B-, O+, AB-"
          />
        </Card>

        {/* Medical Information */}
        {renderArrayInput(
          'Allergies',
          allergies,
          setAllergies,
          'e.g., Penicillin, Peanuts, Shellfish',
          <AlertTriangle size={20} color="#F59E0B" />
        )}

        {renderArrayInput(
          'Current Medications',
          medications,
          setMedications,
          'e.g., Aspirin 81mg daily, Metformin 500mg',
          <Shield size={20} color="#8B5CF6" />
        )}

        {renderArrayInput(
          'Medical Conditions',
          conditions,
          setConditions,
          'e.g., Diabetes, Hypertension, Asthma',
          <Heart size={20} color="#EF4444" />
        )}

        {/* Emergency Contacts */}
        <Card>
          <View style={styles.sectionHeader}>
            <Users size={20} color="#10B981" />
            <Text style={styles.sectionTitle}>Emergency Contacts</Text>
          </View>
          {emergencyContacts.map((contact, index) => (
            <View key={index} style={styles.contactContainer}>
              <View style={styles.contactHeader}>
                <Text style={styles.contactTitle}>Contact {index + 1}</Text>
                {emergencyContacts.length > 1 && (
                  <Button
                    title=""
                    onPress={() => removeEmergencyContact(index)}
                    variant="danger"
                    size="small"
                    style={styles.removeContactButton}
                  >
                    <Trash2 size={16} color="#FFFFFF" />
                  </Button>
                )}
              </View>
              <Input
                label="Name"
                value={contact.name}
                onChangeText={(value) => updateEmergencyContact(index, 'name', value)}
                required
                placeholder="Contact's full name"
              />
              <Input
                label="Relationship"
                value={contact.relationship}
                onChangeText={(value) => updateEmergencyContact(index, 'relationship', value)}
                placeholder="e.g., Spouse, Parent, Sibling, Friend"
              />
              <Input
                label="Phone"
                value={contact.phone}
                onChangeText={(value) => updateEmergencyContact(index, 'phone', value)}
                keyboardType="phone-pad"
                required
                placeholder="Phone number"
              />
              <Input
                label="Email (Optional)"
                value={contact.email}
                onChangeText={(value) => updateEmergencyContact(index, 'email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="Email address"
              />
            </View>
          ))}
          <Button
            title="Add Emergency Contact"
            onPress={addEmergencyContact}
            variant="outline"
            size="small"
            style={styles.addButton}
          />
        </Card>

        {/* Security Notice */}
        <Card style={styles.securityCard}>
          <View style={styles.securityHeader}>
            <Shield size={24} color="#0EA5E9" />
            <Text style={styles.securityTitle}>Blockchain Security</Text>
          </View>
          <Text style={styles.securityText}>
            Your health data is encrypted and secured using Algorand blockchain technology.
            A cryptographic hash of your information is stored on-chain for verification,
            while your actual data remains private and secure.
          </Text>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            title="Clear Form"
            onPress={handleClearForm}
            variant="outline"
            style={styles.clearButton}
            disabled={loading}
          />
          <Button
            title="Save Health Record"
            onPress={handleSave}
            style={styles.saveButton}
            disabled={loading}
          />
        </View>
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
  statusCard: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 16,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    marginLeft: 12,
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 2,
  },
  statusDescription: {
    fontSize: 14,
    color: '#059669',
    marginBottom: 4,
  },
  blockchainInfo: {
    fontSize: 12,
    color: '#047857',
    fontFamily: 'monospace',
  },
  downloadCard: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginBottom: 16,
  },
  downloadContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  downloadText: {
    marginLeft: 12,
    flex: 1,
  },
  downloadTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  downloadDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 8,
  },
  arrayInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  arrayInput: {
    flex: 1,
    marginRight: 8,
  },
  removeButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButton: {
    marginTop: 8,
  },
  contactContainer: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  removeContactButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  securityCard: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginTop: 16,
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0C4A6E',
    marginLeft: 8,
  },
  securityText: {
    fontSize: 14,
    color: '#0369A1',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 32,
  },
  clearButton: {
    flex: 1,
    height: 56,
  },
  saveButton: {
    flex: 2,
    height: 56,
  },
});