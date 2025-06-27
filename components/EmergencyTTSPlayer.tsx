import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Platform } from 'react-native';
import { Volume2, VolumeX, Globe, Settings } from 'lucide-react-native';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

interface EmergencyTTSData {
    bloodType?: string;
    allergies: string[];
    medications: string[];
    emergencyContacts: Array<{
        name: string;
        relationship: string;
        phone: string;
    }>;
    medicalConditions: string[];
}

interface EmergencyTTSPlayerProps {
    emergencyData: EmergencyTTSData;
    autoPlay?: boolean;
    onPlaybackComplete?: () => void;
}

export function EmergencyTTSPlayer({
    emergencyData,
    autoPlay = false,
    onPlaybackComplete
}: EmergencyTTSPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState<'en-US' | 'es-ES' | 'fr-FR'>('en-US');
    const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);

    useEffect(() => {
        // Check if speech synthesis is supported (only on web)
        if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
            setIsSupported(true);

            // Auto-play for emergency situations
            if (autoPlay) {
                handleEmergencyPlayback();
            }
        } else if (Platform.OS !== 'web') {
            // For native platforms, check if we can use ElevenLabs
            setIsSupported(!!process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY);

            if (autoPlay && process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY) {
                handleNativeEmergencyPlayback();
            }
        }

        return () => {
            // Cleanup on unmount
            if (Platform.OS === 'web' && typeof window !== 'undefined' && window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        };
    }, [autoPlay]);

    const generateEmergencyScript = (data: EmergencyTTSData, language: string): string => {
        switch (language) {
            case 'es-ES':
                return generateSpanishScript(data);
            case 'fr-FR':
                return generateFrenchScript(data);
            default:
                return generateEnglishScript(data);
        }
    };

    const generateEnglishScript = (data: EmergencyTTSData): string => {
        let script = "Emergency medical information. ";

        if (data.bloodType) {
            script += `Blood type: ${data.bloodType}. `;
        }

        if (data.allergies.length > 0) {
            script += `Critical allergies: ${data.allergies.slice(0, 3).join(', ')}. `;
        }

        if (data.medications.length > 0) {
            script += `Current medications: ${data.medications.slice(0, 3).join(', ')}. `;
        }

        if (data.emergencyContacts.length > 0) {
            const primary = data.emergencyContacts[0];
            script += `Emergency contact: ${primary.name}, ${primary.relationship}, ${primary.phone}. `;
        }

        if (data.medicalConditions.length > 0) {
            script += `Medical conditions: ${data.medicalConditions.slice(0, 2).join(', ')}. `;
        }

        return script;
    };

    const generateSpanishScript = (data: EmergencyTTSData): string => {
        let script = "Información médica de emergencia. ";

        if (data.bloodType) {
            script += `Tipo de sangre: ${data.bloodType}. `;
        }

        if (data.allergies.length > 0) {
            script += `Alergias críticas: ${data.allergies.slice(0, 3).join(', ')}. `;
        }

        return script;
    };

    const generateFrenchScript = (data: EmergencyTTSData): string => {
        let script = "Informations médicales d'urgence. ";

        if (data.bloodType) {
            script += `Groupe sanguin: ${data.bloodType}. `;
        }

        if (data.allergies.length > 0) {
            script += `Allergies critiques: ${data.allergies.slice(0, 3).join(', ')}. `;
        }

        return script;
    };

    const handleEmergencyPlayback = async () => {
        if (!isSupported || Platform.OS !== 'web' || typeof window === 'undefined') {
            Alert.alert('Not Supported', 'Text-to-speech is not supported on this device/browser.');
            return;
        }

        try {
            setIsPlaying(true);

            // Cancel any ongoing speech
            window.speechSynthesis.cancel();

            const script = generateEmergencyScript(emergencyData, selectedLanguage);
            const utterance = new SpeechSynthesisUtterance(script);

            utterance.lang = selectedLanguage;
            utterance.rate = 0.9;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;

            utterance.onend = () => {
                setIsPlaying(false);
                setCurrentUtterance(null);
                onPlaybackComplete?.();
            };

            utterance.onerror = (event) => {
                console.error('Speech synthesis error:', event);
                setIsPlaying(false);
                setCurrentUtterance(null);
                Alert.alert('Playback Error', 'Unable to play emergency information audio');
            };

            setCurrentUtterance(utterance);
            window.speechSynthesis.speak(utterance);

        } catch (error) {
            console.error('Emergency TTS playback failed:', error);
            setIsPlaying(false);
            Alert.alert('Playback Error', 'Unable to play emergency information audio');
        }
    };

    const handleNativeEmergencyPlayback = async () => {
        if (Platform.OS === 'web') return;

        try {
            setIsPlaying(true);

            const script = generateEmergencyScript(emergencyData, selectedLanguage);

            // Import ElevenLabs service dynamically
            const { elevenLabsService } = await import('@/lib/elevenlabs');
            const voiceResponse = await elevenLabsService.textToSpeech(script);

            if (voiceResponse.audioUrl) {
                // Import expo-av dynamically
                const { Audio } = await import('expo-av');

                const { sound } = await Audio.Sound.createAsync(
                    { uri: voiceResponse.audioUrl },
                    { shouldPlay: true }
                );

                sound.setOnPlaybackStatusUpdate((status) => {
                    if (status.isLoaded && status.didJustFinish) {
                        setIsPlaying(false);
                        sound.unloadAsync();
                        onPlaybackComplete?.();
                    }
                });
            } else {
                // Fallback to simulated playback
                setTimeout(() => {
                    setIsPlaying(false);
                    onPlaybackComplete?.();
                }, Math.max(3000, script.length * 50));
            }

        } catch (error) {
            console.error('Native emergency TTS playback failed:', error);
            setIsPlaying(false);
            Alert.alert('Playback Error', 'Unable to play emergency information audio');
        }
    };

    const handleStop = () => {
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        setIsPlaying(false);
        setCurrentUtterance(null);
    };

    const handleLanguageChange = (language: 'en-US' | 'es-ES' | 'fr-FR') => {
        setSelectedLanguage(language);
    };

    const handlePlayback = () => {
        if (Platform.OS === 'web') {
            handleEmergencyPlayback();
        } else {
            handleNativeEmergencyPlayback();
        }
    };

    return (
        <Card style={styles.container}>
            <View style={styles.header}>
                <Volume2 size={24} color="#EF4444" />
                <Text style={styles.title}>Emergency Audio Readout</Text>
            </View>

            {!isSupported && (
                <View style={styles.notSupportedContainer}>
                    <Text style={styles.notSupportedText}>
                        {Platform.OS === 'web'
                            ? 'Text-to-speech is not supported on this browser. Please try using Chrome, Firefox, or Safari.'
                            : 'ElevenLabs API key not configured. Audio readout is not available.'
                        }
                    </Text>
                </View>
            )}

            <View style={styles.controls}>
                <Button
                    title={isPlaying ? "Stop Reading" : "Read Emergency Info"}
                    onPress={isPlaying ? handleStop : handlePlayback}
                    variant={isPlaying ? "danger" : "primary"}
                    style={styles.playButton}
                    disabled={!isSupported}
                >
                    {isPlaying ? <VolumeX size={16} color="#FFFFFF" /> : <Volume2 size={16} color="#FFFFFF" />}
                </Button>

                {isSupported && Platform.OS === 'web' && (
                    <View style={styles.languageSelector}>
                        <Globe size={16} color="#6B7280" />
                        <Text style={styles.languageLabel}>Language:</Text>
                        {(['en-US', 'es-ES', 'fr-FR'] as const).map(lang => (
                            <Button
                                key={lang}
                                title={lang.split('-')[0].toUpperCase()}
                                onPress={() => handleLanguageChange(lang)}
                                variant={selectedLanguage === lang ? "primary" : "outline"}
                                size="small"
                                style={styles.languageButton}
                                disabled={isPlaying}
                            />
                        ))}
                    </View>
                )}
            </View>

            <View style={styles.emergencyNote}>
                <Text style={styles.emergencyText}>
                    🚨 This audio readout provides critical medical information for emergency responders.
                    {Platform.OS === 'web'
                        ? ' Ensure browser volume is adequate and speakers are functioning.'
                        : ' Ensure device volume is adequate.'
                    }
                </Text>
            </View>

            {isSupported && (
                <View style={styles.accessibilityInfo}>
                    <Text style={styles.accessibilityTitle}>Audio Status:</Text>
                    <Text style={styles.accessibilityDetail}>
                        ✓ Text-to-Speech: {Platform.OS === 'web' ? 'Web Speech API' : 'ElevenLabs API'}
                    </Text>
                    <Text style={styles.accessibilityDetail}>
                        ✓ Current Language: {selectedLanguage}
                    </Text>
                    <Text style={styles.accessibilityDetail}>
                        ✓ Status: {isPlaying ? 'Playing' : 'Ready'}
                    </Text>
                </View>
            )}
        </Card>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FEF2F2',
        borderWidth: 2,
        borderColor: '#FECACA',
        marginBottom: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#DC2626',
        marginLeft: 8,
    },
    notSupportedContainer: {
        backgroundColor: '#FEF3C7',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    notSupportedText: {
        fontSize: 14,
        color: '#A16207',
        textAlign: 'center',
    },
    controls: {
        marginBottom: 16,
    },
    playButton: {
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    languageSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
    },
    languageLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    languageButton: {
        minWidth: 50,
    },
    accessibilityInfo: {
        backgroundColor: '#F0F9FF',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    accessibilityTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0C4A6E',
        marginBottom: 8,
    },
    accessibilityDetail: {
        fontSize: 12,
        color: '#0369A1',
        marginBottom: 2,
    },
    emergencyNote: {
        backgroundColor: '#FEF3C7',
        padding: 12,
        borderRadius: 8,
    },
    emergencyText: {
        fontSize: 12,
        color: '#A16207',
        lineHeight: 16,
    },
});