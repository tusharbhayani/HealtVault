import { Platform } from 'react-native';

interface ElevenLabsConfig {
  apiKey: string;
  voiceId: string;
  baseUrl: string;
}

interface VoiceResponse {
  text: string;
  audioUrl?: string;
  audioBlob?: Blob;
}

class ElevenLabsService {
  private config: ElevenLabsConfig;

  constructor() {
    this.config = {
      apiKey: process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY || '',
      voiceId:
        process.env.EXPO_PUBLIC_ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL',
      baseUrl: 'https://api.elevenlabs.io/v1',
    };
  }

  async textToSpeech(
    text: string,
    options?: { voiceId?: string }
  ): Promise<VoiceResponse> {
    if (!this.config.apiKey) {
      console.warn('ElevenLabs API key not configured');
      return { text };
    }

    try {
      const voiceId = options?.voiceId || this.config.voiceId;

      const response = await fetch(
        `${this.config.baseUrl}/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            Accept: 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.config.apiKey,
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.5,
              style: 0.0,
              use_speaker_boost: true,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `ElevenLabs API error: ${response.status} ${response.statusText}`
        );
      }

      const audioBlob = await response.blob();

      if (Platform.OS === 'web') {
        const audioUrl = URL.createObjectURL(audioBlob);
        return { text, audioUrl, audioBlob };
      } else {
        // For native platforms, convert blob to base64
        const reader = new FileReader();
        return new Promise((resolve, reject) => {
          reader.onload = () => {
            const base64 = reader.result as string;
            resolve({ text, audioUrl: base64 });
          };
          reader.onerror = reject;
          reader.readAsDataURL(audioBlob);
        });
      }
    } catch (error) {
      console.error('ElevenLabs TTS error:', error);
      return { text };
    }
  }

  async processVoiceCommand(command: string, healthData: any): Promise<string> {
    const lowerCommand = command.toLowerCase();

    // Enhanced command processing
    if (
      lowerCommand.includes('blood type') ||
      lowerCommand.includes('blood group')
    ) {
      return healthData.blood_type
        ? `Your blood type is ${healthData.blood_type}`
        : 'Your blood type is not specified in your health profile';
    }

    if (
      lowerCommand.includes('allergies') ||
      lowerCommand.includes('allergy')
    ) {
      if (healthData.allergies?.length > 0) {
        return `Your allergies are: ${healthData.allergies.join(
          ', '
        )}. Please inform medical staff immediately if you're experiencing an allergic reaction.`;
      }
      return 'You have no allergies listed in your health profile';
    }

    if (
      lowerCommand.includes('medications') ||
      lowerCommand.includes('prescriptions') ||
      lowerCommand.includes('drugs')
    ) {
      if (healthData.medications?.length > 0) {
        return `Your current medications are: ${healthData.medications.join(
          ', '
        )}. Always inform healthcare providers about all medications you're taking.`;
      }
      return 'You have no medications listed in your health profile';
    }

    if (
      lowerCommand.includes('emergency contact') ||
      lowerCommand.includes('contact')
    ) {
      const contacts = healthData.emergency_contacts || [];
      if (contacts.length > 0) {
        const primary = contacts[0];
        return `Your primary emergency contact is ${primary.name}, who is your ${primary.relationship}. Their phone number is ${primary.phone}.`;
      }
      return 'No emergency contacts are listed in your health profile';
    }

    if (
      lowerCommand.includes('medical conditions') ||
      lowerCommand.includes('conditions') ||
      lowerCommand.includes('health conditions')
    ) {
      if (healthData.medical_conditions?.length > 0) {
        return `Your medical conditions include: ${healthData.medical_conditions.join(
          ', '
        )}. Make sure to inform healthcare providers about these conditions.`;
      }
      return 'You have no medical conditions listed in your health profile';
    }

    if (lowerCommand.includes('share') && lowerCommand.includes('emergency')) {
      return 'To share your emergency data, show your QR code to first responders or medical personnel. They can scan it to access your critical health information instantly.';
    }

    if (lowerCommand.includes('summary') || lowerCommand.includes('overview')) {
      const summary = [];
      if (healthData.blood_type)
        summary.push(`Blood type: ${healthData.blood_type}`);
      if (healthData.allergies?.length)
        summary.push(`${healthData.allergies.length} allergies`);
      if (healthData.medications?.length)
        summary.push(`${healthData.medications.length} medications`);
      if (healthData.emergency_contacts?.length)
        summary.push(
          `${healthData.emergency_contacts.length} emergency contacts`
        );
      if (healthData.medical_conditions?.length)
        summary.push(
          `${healthData.medical_conditions.length} medical conditions`
        );

      if (summary.length > 0) {
        return `Here's your health summary: ${summary.join(', ')}.`;
      }
      return 'Your health profile is not complete yet. Please add your information in the Health tab.';
    }

    return "I didn't understand that command. Try asking about your blood type, allergies, medications, emergency contacts, medical conditions, or say 'health summary' for an overview.";
  }

  async getAvailableVoices(): Promise<any[]> {
    if (!this.config.apiKey) return [];

    try {
      const response = await fetch(`${this.config.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.config.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.status}`);
      }

      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error('Failed to fetch ElevenLabs voices:', error);
      return [];
    }
  }
}

const elevenLabsService = new ElevenLabsService();

// Export functions to maintain compatibility with existing code
export async function textToSpeech(
  text: string,
  options?: { voiceId?: string }
): Promise<VoiceResponse> {
  return elevenLabsService.textToSpeech(text, options);
}

export async function processVoiceCommand(
  command: string,
  healthData: any
): Promise<string> {
  return elevenLabsService.processVoiceCommand(command, healthData);
}

export async function getAvailableVoices(): Promise<any[]> {
  return elevenLabsService.getAvailableVoices();
}

export { elevenLabsService };
