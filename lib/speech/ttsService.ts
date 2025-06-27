export interface TTSConfig {
  language: 'en-US' | 'es-ES' | 'fr-FR';
  voice?: string;
  rate: number;
  pitch: number;
  volume: number;
}

export interface EmergencyTTSData {
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

export class EnhancedTTSService {
  private config: TTSConfig;
  private isSupported: boolean;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor(
    config: TTSConfig = {
      language: 'en-US',
      rate: 0.9,
      pitch: 1.0,
      volume: 1.0,
    }
  ) {
    this.config = config;
    this.isSupported = 'speechSynthesis' in window;
  }

  // Emergency data readout with prioritized information
  async readEmergencyData(data: EmergencyTTSData): Promise<void> {
    if (!this.isSupported) {
      throw new Error('Text-to-speech not supported on this device');
    }

    const emergencyScript = this.generateEmergencyScript(data);
    await this.speak(emergencyScript, { priority: 'emergency' });
  }

  private generateEmergencyScript(data: EmergencyTTSData): string {
    const scripts = {
      'en-US': this.generateEnglishScript(data),
      'es-ES': this.generateSpanishScript(data),
      'fr-FR': this.generateFrenchScript(data),
    };

    return scripts[this.config.language] || scripts['en-US'];
  }

  private generateEnglishScript(data: EmergencyTTSData): string {
    let script = 'Emergency medical information. ';

    if (data.bloodType) {
      script += `Blood type: ${data.bloodType}. `;
    }

    if (data.allergies.length > 0) {
      script += `Critical allergies: ${data.allergies.join(', ')}. `;
    }

    if (data.medications.length > 0) {
      script += `Current medications: ${data.medications
        .slice(0, 3)
        .join(', ')}. `;
    }

    if (data.emergencyContacts.length > 0) {
      const primary = data.emergencyContacts[0];
      script += `Emergency contact: ${primary.name}, ${primary.relationship}, ${primary.phone}. `;
    }

    return script;
  }

  private generateSpanishScript(data: EmergencyTTSData): string {
    let script = 'Información médica de emergencia. ';

    if (data.bloodType) {
      script += `Tipo de sangre: ${data.bloodType}. `;
    }

    if (data.allergies.length > 0) {
      script += `Alergias críticas: ${data.allergies.join(', ')}. `;
    }

    return script;
  }

  private generateFrenchScript(data: EmergencyTTSData): string {
    let script = "Informations médicales d'urgence. ";

    if (data.bloodType) {
      script += `Groupe sanguin: ${data.bloodType}. `;
    }

    if (data.allergies.length > 0) {
      script += `Allergies critiques: ${data.allergies.join(', ')}. `;
    }

    return script;
  }

  async speak(
    text: string,
    options?: { priority?: 'normal' | 'emergency' }
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Cancel any ongoing speech for emergency priority
      if (options?.priority === 'emergency') {
        speechSynthesis.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = this.config.language;
      utterance.rate = this.config.rate;
      utterance.pitch = this.config.pitch;
      utterance.volume = this.config.volume;

      utterance.onend = () => {
        this.currentUtterance = null;
        resolve();
      };

      utterance.onerror = (event) => {
        this.currentUtterance = null;
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      this.currentUtterance = utterance;
      speechSynthesis.speak(utterance);
    });
  }

  stop(): void {
    if (this.isSupported) {
      speechSynthesis.cancel();
      this.currentUtterance = null;
    }
  }

  // Voice selection interface
  getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.isSupported) return [];
    return speechSynthesis
      .getVoices()
      .filter((voice) =>
        voice.lang.startsWith(this.config.language.split('-')[0])
      );
  }

  setVoice(voiceURI: string): void {
    const voices = this.getAvailableVoices();
    const selectedVoice = voices.find((voice) => voice.voiceURI === voiceURI);
    if (selectedVoice && this.currentUtterance) {
      this.currentUtterance.voice = selectedVoice;
    }
  }

  // Accessibility compliance
  async testAccessibility(): Promise<{
    isSupported: boolean;
    voiceCount: number;
    languageSupport: string[];
    responseTime: number;
  }> {
    const startTime = performance.now();

    const testResult = {
      isSupported: this.isSupported,
      voiceCount: this.getAvailableVoices().length,
      languageSupport: ['en-US', 'es-ES', 'fr-FR'].filter((lang) =>
        this.getAvailableVoices().some((voice) =>
          voice.lang.startsWith(lang.split('-')[0])
        )
      ),
      responseTime: 0,
    };

    if (this.isSupported) {
      try {
        await this.speak('Accessibility test', { priority: 'normal' });
        testResult.responseTime = performance.now() - startTime;
      } catch (error) {
        console.error('TTS accessibility test failed:', error);
      }
    }

    return testResult;
  }
}

// Performance benchmarks
export const TTS_PERFORMANCE_BENCHMARKS = {
  EMERGENCY_RESPONSE_TIME_MS: 500, // Max time to start emergency readout
  VOICE_SELECTION_TIME_MS: 100, // Max time to change voice
  LANGUAGE_SWITCH_TIME_MS: 200, // Max time to switch language
  AUDIO_QUALITY_THRESHOLD: 0.8, // Minimum quality score (0-1)
};

// Testing scenarios
export const TTS_TEST_SCENARIOS = [
  {
    name: 'Emergency Blood Type Announcement',
    data: {
      bloodType: 'O-',
      allergies: ['Penicillin'],
      medications: [],
      emergencyContacts: [],
      medicalConditions: [],
    },
    expectedDuration: 3000,
    priority: 'emergency',
  },
  {
    name: 'Critical Allergy Alert',
    data: {
      allergies: ['Shellfish', 'Nuts', 'Latex'],
      medications: [],
      emergencyContacts: [],
      medicalConditions: [],
    },
    expectedDuration: 4000,
    priority: 'emergency',
  },
  {
    name: 'Multi-language Support Test',
    languages: ['en-US', 'es-ES', 'fr-FR'],
    expectedSwitchTime: 200,
  },
];
