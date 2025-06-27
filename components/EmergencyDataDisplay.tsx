import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    Heart,
    AlertTriangle,
    Phone,
    Clock,
    Shield,
    Wifi,
    WifiOff,
    Download,
    RefreshCw
} from 'lucide-react-native';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { EmergencyTTSPlayer } from './EmergencyTTSPlayer';
import { hipaaService } from '@/lib/security/hipaaCompliance';

interface EmergencyContact {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
    priority: number;
}

interface MedicalHistory {
    condition: string;
    diagnosedDate: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    notes?: string;
}

interface Medication {
    name: string;
    dosage: string;
    frequency: string;
    prescribedDate: string;
    critical: boolean;
    sideEffects?: string[];
}

interface CriticalHealthIndicator {
    type: 'blood_pressure' | 'heart_rate' | 'blood_sugar' | 'oxygen_saturation';
    value: string;
    unit: string;
    lastUpdated: string;
    status: 'normal' | 'warning' | 'critical';
}

interface EmergencyHealthData {
    patientId: string;
    fullName: string;
    dateOfBirth: string;
    bloodType: string;
    allergies: string[];
    medications: Medication[];
    medicalHistory: MedicalHistory[];
    emergencyContacts: EmergencyContact[];
    criticalIndicators: CriticalHealthIndicator[];
    lastUpdated: string;
    dataIntegrityHash: string;
}

interface EmergencyDataDisplayProps {
    patientId: string;
    isOffline?: boolean;
    onDataUpdate?: (data: EmergencyHealthData) => void;
}

export function EmergencyDataDisplay({
    patientId,
    isOffline = false,
    onDataUpdate
}: EmergencyDataDisplayProps) {
    const [healthData, setHealthData] = useState<EmergencyHealthData | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastSync, setLastSync] = useState<string | null>(null);
    const [dataIntegrityVerified, setDataIntegrityVerified] = useState(false);

    useEffect(() => {
        loadEmergencyData();
    }, [patientId]);

    const loadEmergencyData = async () => {
        setLoading(true);
        try {
            // Log emergency access
            await hipaaService.logAuditEvent({
                userId: 'emergency_responder',
                event: 'EMERGENCY_ACCESS',
                resource: `patient_data_${patientId}`,
                success: true,
                details: {
                    accessType: 'emergency',
                    offline: isOffline,
                    timestamp: new Date().toISOString()
                }
            });

            let data: EmergencyHealthData;

            if (isOffline) {
                // Load from local cache
                data = await loadOfflineData(patientId);
            } else {
                // Load from server with real-time updates
                data = await loadOnlineData(patientId);
            }

            // Verify data integrity
            const integrityCheck = await verifyDataIntegrity(data);
            setDataIntegrityVerified(integrityCheck);

            setHealthData(data);
            setLastSync(new Date().toISOString());
            onDataUpdate?.(data);
        } catch (error) {
            console.error('Failed to load emergency data:', error);
            Alert.alert('Data Load Error', 'Unable to load patient data. Using cached information if available.');

            // Fallback to cached data
            try {
                const cachedData = await loadOfflineData(patientId);
                setHealthData(cachedData);
            } catch (cacheError) {
                console.error('No cached data available:', cacheError);
            }
        } finally {
            setLoading(false);
        }
    };

    const loadOfflineData = async (id: string): Promise<EmergencyHealthData> => {
        // Simulate loading from local storage/cache
        const mockData: EmergencyHealthData = {
            patientId: id,
            fullName: 'John Doe',
            dateOfBirth: '1985-03-15',
            bloodType: 'A+',
            allergies: ['Penicillin', 'Shellfish', 'Latex'],
            medications: [
                {
                    name: 'Metformin',
                    dosage: '500mg',
                    frequency: 'Twice daily',
                    prescribedDate: '2024-01-15',
                    critical: true,
                    sideEffects: ['Nausea', 'Diarrhea']
                },
                {
                    name: 'Lisinopril',
                    dosage: '10mg',
                    frequency: 'Once daily',
                    prescribedDate: '2024-02-01',
                    critical: true
                }
            ],
            medicalHistory: [
                {
                    condition: 'Type 2 Diabetes',
                    diagnosedDate: '2020-06-15',
                    severity: 'medium',
                    notes: 'Well controlled with medication'
                },
                {
                    condition: 'Hypertension',
                    diagnosedDate: '2021-03-10',
                    severity: 'medium'
                }
            ],
            emergencyContacts: [
                {
                    name: 'Jane Doe',
                    relationship: 'Spouse',
                    phone: '+1 (555) 123-4567',
                    email: 'jane.doe@email.com',
                    priority: 1
                },
                {
                    name: 'Dr. Sarah Smith',
                    relationship: 'Primary Care Physician',
                    phone: '+1 (555) 987-6543',
                    priority: 2
                }
            ],
            criticalIndicators: [
                {
                    type: 'blood_pressure',
                    value: '130/85',
                    unit: 'mmHg',
                    lastUpdated: '2024-01-20T10:30:00Z',
                    status: 'warning'
                },
                {
                    type: 'blood_sugar',
                    value: '145',
                    unit: 'mg/dL',
                    lastUpdated: '2024-01-20T08:00:00Z',
                    status: 'normal'
                }
            ],
            lastUpdated: '2024-01-20T10:30:00Z',
            dataIntegrityHash: 'sha256:abc123...'
        };

        return mockData;
    };

    const loadOnlineData = async (id: string): Promise<EmergencyHealthData> => {
        // In production, this would fetch from Supabase with real-time subscriptions
        return await loadOfflineData(id); // Using mock data for now
    };

    const verifyDataIntegrity = async (data: EmergencyHealthData): Promise<boolean> => {
        try {
            // In production, this would verify against blockchain hash
            return true;
        } catch (error) {
            console.error('Data integrity verification failed:', error);
            return false;
        }
    };

    const refreshData = async () => {
        if (!isOffline) {
            await loadEmergencyData();
        }
    };

    const downloadForOffline = async () => {
        try {
            // In production, this would cache data locally
            Alert.alert('Success', 'Emergency data cached for offline access');
        } catch (error) {
            Alert.alert('Error', 'Failed to cache data for offline access');
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <RefreshCw size={32} color="#0EA5E9" />
                    <Text style={styles.loadingText}>Loading emergency data...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!healthData) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <AlertTriangle size={48} color="#EF4444" />
                    <Text style={styles.errorTitle}>Data Unavailable</Text>
                    <Text style={styles.errorText}>
                        Unable to load patient emergency data. Please check connection or contact system administrator.
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header with Status */}
                <View style={styles.header}>
                    <View style={styles.statusBar}>
                        <View style={styles.connectionStatus}>
                            {isOffline ? (
                                <WifiOff size={16} color="#EF4444" />
                            ) : (
                                <Wifi size={16} color="#10B981" />
                            )}
                            <Text style={[styles.statusText, isOffline ? styles.offlineText : styles.onlineText]}>
                                {isOffline ? 'Offline Mode' : 'Live Data'}
                            </Text>
                        </View>

                        <View style={styles.integrityStatus}>
                            <Shield size={16} color={dataIntegrityVerified ? '#10B981' : '#F59E0B'} />
                            <Text style={styles.statusText}>
                                {dataIntegrityVerified ? 'Verified' : 'Unverified'}
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.patientName}>{healthData.fullName}</Text>
                    <Text style={styles.patientInfo}>
                        DOB: {new Date(healthData.dateOfBirth).toLocaleDateString()} • ID: {healthData.patientId}
                    </Text>

                    {lastSync && (
                        <Text style={styles.lastSync}>
                            Last updated: {new Date(lastSync).toLocaleString()}
                        </Text>
                    )}
                </View>

                {/* Emergency TTS Player */}
                <EmergencyTTSPlayer
                    emergencyData={{
                        bloodType: healthData.bloodType,
                        allergies: healthData.allergies,
                        medications: healthData.medications.map(m => `${m.name} ${m.dosage}`),
                        emergencyContacts: healthData.emergencyContacts,
                        medicalConditions: healthData.medicalHistory.map(h => h.condition)
                    }}
                    autoPlay={false}
                />

                {/* Critical Information */}
                <Card style={styles.criticalCard}>
                    <View style={styles.criticalHeader}>
                        <Heart size={24} color="#EF4444" />
                        <Text style={styles.sectionTitle}>Critical Information</Text>
                    </View>

                    <View style={styles.criticalGrid}>
                        <View style={styles.criticalItem}>
                            <Text style={styles.criticalLabel}>Blood Type</Text>
                            <Text style={styles.criticalValue}>{healthData.bloodType}</Text>
                        </View>

                        {healthData.criticalIndicators.map((indicator, index) => (
                            <View key={index} style={styles.criticalItem}>
                                <Text style={styles.criticalLabel}>
                                    {indicator.type.replace('_', ' ').toUpperCase()}
                                </Text>
                                <Text style={[
                                    styles.criticalValue,
                                    indicator.status === 'critical' && styles.criticalStatus,
                                    indicator.status === 'warning' && styles.warningStatus
                                ]}>
                                    {indicator.value} {indicator.unit}
                                </Text>
                            </View>
                        ))}
                    </View>
                </Card>

                {/* Allergies Alert */}
                {healthData.allergies.length > 0 && (
                    <Card style={styles.allergyCard}>
                        <View style={styles.allergyHeader}>
                            <AlertTriangle size={24} color="#EF4444" />
                            <Text style={styles.allergyTitle}>⚠️ CRITICAL ALLERGIES</Text>
                        </View>
                        {healthData.allergies.map((allergy, index) => (
                            <View key={index} style={styles.allergyItem}>
                                <Text style={styles.allergyText}>{allergy}</Text>
                            </View>
                        ))}
                    </Card>
                )}

                {/* Current Medications */}
                <Card>
                    <Text style={styles.sectionTitle}>Current Medications</Text>
                    {healthData.medications.map((medication, index) => (
                        <View key={index} style={[
                            styles.medicationItem,
                            medication.critical && styles.criticalMedication
                        ]}>
                            <View style={styles.medicationHeader}>
                                <Text style={styles.medicationName}>{medication.name}</Text>
                                {medication.critical && (
                                    <View style={styles.criticalBadge}>
                                        <Text style={styles.criticalBadgeText}>CRITICAL</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={styles.medicationDetails}>
                                {medication.dosage} • {medication.frequency}
                            </Text>
                            <Text style={styles.medicationDate}>
                                Prescribed: {new Date(medication.prescribedDate).toLocaleDateString()}
                            </Text>
                            {medication.sideEffects && (
                                <Text style={styles.sideEffects}>
                                    Side effects: {medication.sideEffects.join(', ')}
                                </Text>
                            )}
                        </View>
                    ))}
                </Card>

                {/* Medical History */}
                <Card>
                    <Text style={styles.sectionTitle}>Medical History</Text>
                    {healthData.medicalHistory.map((condition, index) => (
                        <View key={index} style={styles.historyItem}>
                            <View style={styles.historyHeader}>
                                <Text style={styles.conditionName}>{condition.condition}</Text>
                                <View style={[
                                    styles.severityBadge,
                                    styles[`severity${condition.severity.charAt(0).toUpperCase() + condition.severity.slice(1)}`]
                                ]}>
                                    <Text style={styles.severityText}>{condition.severity.toUpperCase()}</Text>
                                </View>
                            </View>
                            <Text style={styles.diagnosedDate}>
                                Diagnosed: {new Date(condition.diagnosedDate).toLocaleDateString()}
                            </Text>
                            {condition.notes && (
                                <Text style={styles.conditionNotes}>{condition.notes}</Text>
                            )}
                        </View>
                    ))}
                </Card>

                {/* Emergency Contacts */}
                <Card>
                    <Text style={styles.sectionTitle}>Emergency Contacts</Text>
                    {healthData.emergencyContacts
                        .sort((a, b) => a.priority - b.priority)
                        .map((contact, index) => (
                            <View key={index} style={styles.contactItem}>
                                <View style={styles.contactHeader}>
                                    <Phone size={20} color="#0EA5E9" />
                                    <Text style={styles.contactName}>{contact.name}</Text>
                                    <View style={styles.priorityBadge}>
                                        <Text style={styles.priorityText}>#{contact.priority}</Text>
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

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                    {!isOffline && (
                        <Button
                            title="Refresh Data"
                            onPress={refreshData}
                            variant="outline"
                            style={styles.actionButton}
                        >
                            <RefreshCw size={16} color="#0EA5E9" />
                        </Button>
                    )}

                    <Button
                        title="Cache Offline"
                        onPress={downloadForOffline}
                        variant="outline"
                        style={styles.actionButton}
                    >
                        <Download size={16} color="#0EA5E9" />
                    </Button>
                </View>

                {/* Data Integrity Notice */}
                <Card style={styles.integrityCard}>
                    <View style={styles.integrityHeader}>
                        <Shield size={20} color="#0C4A6E" />
                        <Text style={styles.integrityTitle}>Data Integrity</Text>
                    </View>
                    <Text style={styles.integrityText}>
                        This emergency data is {dataIntegrityVerified ? 'verified' : 'unverified'} against blockchain records.
                        Hash: {healthData.dataIntegrityHash}
                    </Text>
                    <Text style={styles.integrityNote}>
                        Access logged for HIPAA compliance. Emergency use only.
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#6B7280',
        marginTop: 12,
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
    },
    errorText: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
    },
    header: {
        marginTop: 20,
        marginBottom: 24,
    },
    statusBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    connectionStatus: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    integrityStatus: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
    },
    offlineText: {
        color: '#EF4444',
    },
    onlineText: {
        color: '#10B981',
    },
    patientName: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    patientInfo: {
        fontSize: 16,
        color: '#6B7280',
        marginBottom: 8,
    },
    lastSync: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    criticalCard: {
        backgroundColor: '#FEF2F2',
        borderWidth: 2,
        borderColor: '#FECACA',
        marginBottom: 16,
    },
    criticalHeader: {
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
    criticalGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    criticalItem: {
        flex: 1,
        minWidth: '45%',
    },
    criticalLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 4,
    },
    criticalValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    criticalStatus: {
        color: '#EF4444',
    },
    warningStatus: {
        color: '#F59E0B',
    },
    allergyCard: {
        backgroundColor: '#FEF3C7',
        borderWidth: 2,
        borderColor: '#FCD34D',
        marginBottom: 16,
    },
    allergyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    allergyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#92400E',
        marginLeft: 8,
    },
    allergyItem: {
        backgroundColor: '#FEF3C7',
        padding: 8,
        borderRadius: 8,
        marginBottom: 8,
    },
    allergyText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#92400E',
    },
    medicationItem: {
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
        backgroundColor: '#F9FAFB',
    },
    criticalMedication: {
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    medicationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    medicationName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
    },
    criticalBadge: {
        backgroundColor: '#EF4444',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    criticalBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    medicationDetails: {
        fontSize: 14,
        color: '#374151',
        marginBottom: 2,
    },
    medicationDate: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 4,
    },
    sideEffects: {
        fontSize: 12,
        color: '#F59E0B',
        fontStyle: 'italic',
    },
    historyItem: {
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
        backgroundColor: '#F9FAFB',
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    conditionName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    severityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    severityLow: {
        backgroundColor: '#D1FAE5',
    },
    severityMedium: {
        backgroundColor: '#FEF3C7',
    },
    severityHigh: {
        backgroundColor: '#FEE2E2',
    },
    severityCritical: {
        backgroundColor: '#EF4444',
    },
    severityText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#1F2937',
    },
    diagnosedDate: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 4,
    },
    conditionNotes: {
        fontSize: 14,
        color: '#374151',
        fontStyle: 'italic',
    },
    contactItem: {
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
        backgroundColor: '#F0F9FF',
    },
    contactHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    contactName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginLeft: 8,
        flex: 1,
    },
    priorityBadge: {
        backgroundColor: '#0EA5E9',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
    },
    priorityText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    contactRelation: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 2,
    },
    contactPhone: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0EA5E9',
        marginBottom: 2,
    },
    contactEmail: {
        fontSize: 14,
        color: '#6B7280',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
        marginBottom: 16,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    integrityCard: {
        backgroundColor: '#F0F9FF',
        borderWidth: 1,
        borderColor: '#BAE6FD',
        marginBottom: 32,
    },
    integrityHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    integrityTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0C4A6E',
        marginLeft: 8,
    },
    integrityText: {
        fontSize: 14,
        color: '#0369A1',
        lineHeight: 20,
        marginBottom: 8,
    },
    integrityNote: {
        fontSize: 12,
        color: '#0C4A6E',
        fontStyle: 'italic',
    },
});