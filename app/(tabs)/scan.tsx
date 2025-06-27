import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { router } from 'expo-router';
import { ScanLine, Camera, AlertCircle, CheckCircle, Smartphone } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function ScanScreen() {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [scanResult, setScanResult] = useState<string | null>(null);

    const handleBarCodeScanned = ({ type, data }: BarcodeScanningResult) => {
        if (scanned) return;

        setScanned(true);
        setScanResult(data);

        try {
            // Parse the QR code data
            const qrData = JSON.parse(data);

            if (qrData.type === 'health_guardian_emergency' && qrData.id) {
                // Navigate to emergency screen with the scanned ID
                router.push(`/emergency/${qrData.id}`);
            } else {
                Alert.alert(
                    'Invalid QR Code',
                    'This QR code is not a valid HealthGuardian emergency code.',
                    [{ text: 'OK', onPress: () => setScanned(false) }]
                );
            }
        } catch (error) {
            // If it's not JSON, treat it as a direct ID
            if (data.startsWith('HG_') || data === 'demo') {
                router.push(`/emergency/${data}`);
            } else {
                Alert.alert(
                    'Invalid QR Code',
                    'This QR code is not recognized as a HealthGuardian emergency code.',
                    [{ text: 'OK', onPress: () => setScanned(false) }]
                );
            }
        }
    };

    const resetScanner = () => {
        setScanned(false);
        setScanResult(null);
    };

    // Web platform fallback
    if (Platform.OS === 'web') {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <Image
                            source={{ uri: 'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=400' }}
                            style={styles.headerImage}
                        />
                        <View style={styles.headerText}>
                            <Text style={styles.title}>QR Code Scanner</Text>
                            <Text style={styles.subtitle}>
                                Scan emergency health QR codes for instant access
                            </Text>
                        </View>
                    </View>
                </View>

                <Card style={styles.webNotice}>
                    <View style={styles.webNoticeContent}>
                        <Smartphone size={48} color="#F59E0B" />
                        <Text style={styles.webNoticeTitle}>Mobile Device Required</Text>
                        <Text style={styles.webNoticeDescription}>
                            QR code scanning requires camera access and works best on mobile devices.
                            Please use the HealthGuardian mobile app to scan emergency QR codes.
                        </Text>

                        <View style={styles.demoSection}>
                            <Text style={styles.demoTitle}>Try Demo Emergency View</Text>
                            <Button
                                title="View Demo Emergency Data"
                                onPress={() => router.push('/emergency/demo')}
                                variant="primary"
                                style={styles.demoButton}
                            />
                        </View>
                    </View>
                </Card>

                <Card style={styles.instructionsCard}>
                    <View style={styles.instructionsHeader}>
                        <ScanLine size={24} color="#0EA5E9" />
                        <Text style={styles.instructionsTitle}>How to Use QR Scanner</Text>
                    </View>
                    <View style={styles.instructionsList}>
                        <Text style={styles.instructionItem}>
                            • Point your camera at a HealthGuardian QR code
                        </Text>
                        <Text style={styles.instructionItem}>
                            • The scanner will automatically detect and process the code
                        </Text>
                        <Text style={styles.instructionItem}>
                            • Emergency health information will be displayed instantly
                        </Text>
                        <Text style={styles.instructionItem}>
                            • No internet connection required for basic emergency data
                        </Text>
                    </View>
                </Card>
            </SafeAreaView>
        );
    }

    // Handle camera permissions
    if (!permission) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading camera...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!permission.granted) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <Image
                            source={{ uri: 'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=400' }}
                            style={styles.headerImage}
                        />
                        <View style={styles.headerText}>
                            <Text style={styles.title}>QR Code Scanner</Text>
                            <Text style={styles.subtitle}>
                                Camera access required for scanning
                            </Text>
                        </View>
                    </View>
                </View>

                <Card style={styles.permissionCard}>
                    <View style={styles.permissionContent}>
                        <Camera size={64} color="#0EA5E9" />
                        <Text style={styles.permissionTitle}>Camera Permission Required</Text>
                        <Text style={styles.permissionDescription}>
                            We need access to your camera to scan QR codes for emergency health information.
                            Your privacy is protected - we only process QR codes locally on your device.
                        </Text>
                        <Button
                            title="Grant Camera Permission"
                            onPress={requestPermission}
                            style={styles.permissionButton}
                        />
                    </View>
                </Card>

                <Card style={styles.instructionsCard}>
                    <View style={styles.instructionsHeader}>
                        <ScanLine size={24} color="#0EA5E9" />
                        <Text style={styles.instructionsTitle}>How to Use QR Scanner</Text>
                    </View>
                    <View style={styles.instructionsList}>
                        <Text style={styles.instructionItem}>
                            • Point your camera at a HealthGuardian QR code
                        </Text>
                        <Text style={styles.instructionItem}>
                            • The scanner will automatically detect and process the code
                        </Text>
                        <Text style={styles.instructionItem}>
                            • Emergency health information will be displayed instantly
                        </Text>
                        <Text style={styles.instructionItem}>
                            • No internet connection required for basic emergency data
                        </Text>
                    </View>
                </Card>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <Image
                        source={{ uri: 'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=400' }}
                        style={styles.headerImage}
                    />
                    <View style={styles.headerText}>
                        <Text style={styles.title}>QR Code Scanner</Text>
                        <Text style={styles.subtitle}>
                            Scan emergency health QR codes for instant access
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.cameraContainer}>
                <CameraView
                    style={styles.camera}
                    facing="back"
                    barcodeScannerSettings={{
                        barcodeTypes: ['qr'],
                    }}
                    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                >
                    <View style={styles.overlay}>
                        <View style={styles.scanArea}>
                            <View style={styles.scanFrame} />
                            <Text style={styles.scanInstruction}>
                                {scanned ? 'Processing...' : 'Position QR code within the frame'}
                            </Text>
                        </View>
                    </View>
                </CameraView>
            </View>

            {scanned && (
                <Card style={styles.resultCard}>
                    <View style={styles.resultContent}>
                        <CheckCircle size={24} color="#10B981" />
                        <Text style={styles.resultText}>QR Code Scanned Successfully!</Text>
                        <Text style={styles.resultData}>
                            {scanResult ? `Data: ${scanResult.substring(0, 50)}...` : 'Processing...'}
                        </Text>
                        <Button
                            title="Scan Another Code"
                            onPress={resetScanner}
                            variant="outline"
                            size="small"
                            style={styles.resetButton}
                        />
                    </View>
                </Card>
            )}

            <Card style={styles.instructionsCard}>
                <View style={styles.instructionsHeader}>
                    <AlertCircle size={20} color="#F59E0B" />
                    <Text style={styles.instructionsTitle}>Emergency Use Only</Text>
                </View>
                <Text style={styles.emergencyText}>
                    This scanner is designed for emergency responders and authorized personnel
                    to quickly access critical health information. All scans are logged for security.
                </Text>
            </Card>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#6B7280',
    },
    permissionCard: {
        marginHorizontal: 20,
        marginBottom: 16,
    },
    permissionContent: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    permissionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        marginTop: 16,
        marginBottom: 12,
        textAlign: 'center',
    },
    permissionDescription: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
    },
    permissionButton: {
        minWidth: 200,
    },
    webNotice: {
        marginHorizontal: 20,
        marginBottom: 16,
        backgroundColor: '#FEF3C7',
        borderWidth: 1,
        borderColor: '#FCD34D',
    },
    webNoticeContent: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    webNoticeTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#92400E',
        marginTop: 16,
        marginBottom: 12,
        textAlign: 'center',
    },
    webNoticeDescription: {
        fontSize: 16,
        color: '#A16207',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
    },
    demoSection: {
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#FCD34D',
        width: '100%',
    },
    demoTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#92400E',
        marginBottom: 12,
    },
    demoButton: {
        minWidth: 200,
    },
    cameraContainer: {
        flex: 1,
        marginHorizontal: 20,
        marginBottom: 16,
        borderRadius: 16,
        overflow: 'hidden',
    },
    camera: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanArea: {
        alignItems: 'center',
    },
    scanFrame: {
        width: 250,
        height: 250,
        borderWidth: 2,
        borderColor: '#0EA5E9',
        borderRadius: 16,
        backgroundColor: 'transparent',
    },
    scanInstruction: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginTop: 20,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    resultCard: {
        marginHorizontal: 20,
        marginBottom: 16,
        backgroundColor: '#ECFDF5',
        borderWidth: 1,
        borderColor: '#BBF7D0',
    },
    resultContent: {
        alignItems: 'center',
    },
    resultText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#10B981',
        marginLeft: 8,
        marginBottom: 8,
    },
    resultData: {
        fontSize: 14,
        color: '#059669',
        marginBottom: 16,
        textAlign: 'center',
    },
    resetButton: {
        minWidth: 150,
    },
    instructionsCard: {
        marginHorizontal: 20,
        marginBottom: 20,
    },
    instructionsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    instructionsTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginLeft: 8,
    },
    instructionsList: {
        paddingLeft: 8,
    },
    instructionItem: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
        marginBottom: 8,
    },
    emergencyText: {
        fontSize: 14,
        color: '#A16207',
        lineHeight: 20,
    },
});