import { create } from 'zustand';
import { useHealthStore } from './useHealthStore';
import { elevenLabsService } from '@/lib/elevenlabs';
import { Platform } from 'react-native';

interface VoiceState {
  isListening: boolean;
  isPlaying: boolean;
  transcript: string;
  response: string;
  startListening: () => Promise<void>;
  stopListening: () => void;
  processVoiceCommand: (command: string) => Promise<void>;
  playResponse: (text: string) => Promise<void>;
}

export const useVoiceStore = create<VoiceState>((set, get) => ({
  isListening: false,
  isPlaying: false,
  transcript: '',
  response: '',

  startListening: async () => {
    set({ isListening: true, transcript: '', response: '' });

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // Use Web Speech API for web
      const SpeechRecognition =
        (window as any).webkitSpeechRecognition ||
        (window as any).SpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();

        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          console.log('Speech recognition started');
        };

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          console.log('Speech recognition result:', transcript);
          set({ transcript, isListening: false });
          get().processVoiceCommand(transcript);
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          set({ isListening: false });

          // Provide helpful error messages
          let errorMessage = 'Speech recognition failed. ';
          switch (event.error) {
            case 'no-speech':
              errorMessage += 'No speech was detected. Please try again.';
              break;
            case 'audio-capture':
              errorMessage +=
                'No microphone was found. Please check your microphone.';
              break;
            case 'not-allowed':
              errorMessage +=
                'Microphone access was denied. Please allow microphone access.';
              break;
            case 'network':
              errorMessage +=
                'Network error occurred. Please check your connection.';
              break;
            default:
              errorMessage += 'Please try again or use the example commands.';
          }

          set({ response: errorMessage });
        };

        recognition.onend = () => {
          console.log('Speech recognition ended');
          set({ isListening: false });
        };

        try {
          recognition.start();
        } catch (error) {
          console.error('Failed to start speech recognition:', error);
          set({ isListening: false });
        }
      } else {
        // Fallback for browsers without speech recognition
        console.log('Speech recognition not supported, using fallback');
        setTimeout(() => {
          const { isListening } = get();
          if (isListening) {
            set({
              isListening: false,
              transcript: 'What is my blood type?', // Simulated transcript
            });
            get().processVoiceCommand('What is my blood type?');
          }
        }, 3000);
      }
    } else {
      // For native platforms, simulate listening for now
      setTimeout(() => {
        const { isListening } = get();
        if (isListening) {
          set({
            isListening: false,
            transcript: 'What is my blood type?', // Simulated transcript
          });
          get().processVoiceCommand('What is my blood type?');
        }
      }, 3000);
    }
  },

  stopListening: () => {
    set({ isListening: false });

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // Stop any ongoing speech recognition
      const SpeechRecognition =
        (window as any).webkitSpeechRecognition ||
        (window as any).SpeechRecognition;
      if (SpeechRecognition) {
        // Note: Individual recognition instances handle their own stopping
        console.log('Stopping speech recognition');
      }
    }
  },

  processVoiceCommand: async (command: string) => {
    try {
      set({ transcript: command, isPlaying: true });

      const healthRecord = useHealthStore.getState().healthRecord;
      if (!healthRecord) {
        const response =
          "I don't have access to your health data yet. Please set up your health profile first in the Health tab.";
        set({ response, isPlaying: false });
        await get().playResponse(response);
        return;
      }

      // Process the command and generate response
      const responseText = await elevenLabsService.processVoiceCommand(
        command,
        healthRecord
      );
      set({ response: responseText });

      // Play the response
      await get().playResponse(responseText);
    } catch (error) {
      console.error('Voice command processing error:', error);
      const errorResponse =
        'Sorry, I had trouble processing that request. Please try again.';
      set({ response: errorResponse, isPlaying: false });
      await get().playResponse(errorResponse);
    }
  },

  playResponse: async (text: string) => {
    try {
      set({ isPlaying: true });

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        // Use Web Speech API for web
        if ('speechSynthesis' in window) {
          // Cancel any ongoing speech
          window.speechSynthesis.cancel();

          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 0.9;
          utterance.pitch = 1.0;
          utterance.volume = 1.0;
          utterance.lang = 'en-US';

          utterance.onstart = () => {
            console.log('Speech synthesis started');
          };

          utterance.onend = () => {
            console.log('Speech synthesis ended');
            set({ isPlaying: false });
          };

          utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            set({ isPlaying: false });
          };

          window.speechSynthesis.speak(utterance);
        } else {
          // Fallback: just show text for 3 seconds
          console.log('Speech synthesis not supported, using fallback');
          setTimeout(() => set({ isPlaying: false }), 3000);
        }
      } else {
        // For native platforms, use ElevenLabs API with expo-av
        try {
          const voiceResponse = await elevenLabsService.textToSpeech(text);

          if (voiceResponse.audioUrl) {
            // Import expo-av dynamically for native platforms
            const { Audio } = await import('expo-av');

            // Play audio using expo-av
            const { sound } = await Audio.Sound.createAsync(
              { uri: voiceResponse.audioUrl },
              { shouldPlay: true }
            );

            sound.setOnPlaybackStatusUpdate((status) => {
              if (status.isLoaded && status.didJustFinish) {
                set({ isPlaying: false });
                sound.unloadAsync();
              }
            });
          } else {
            // Fallback to simulated playback
            setTimeout(
              () => set({ isPlaying: false }),
              Math.max(2000, text.length * 50)
            );
          }
        } catch (error) {
          console.error('Native TTS error:', error);
          // Fallback to simulated playback
          setTimeout(
            () => set({ isPlaying: false }),
            Math.max(2000, text.length * 50)
          );
        }
      }
    } catch (error) {
      console.error('Audio playback error:', error);
      set({ isPlaying: false });
    }
  },
}));
