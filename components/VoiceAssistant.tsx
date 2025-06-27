"use client"

import { useState, useEffect } from "react"
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from "react-native"
import { Mic, MicOff, Volume2, Headphones, Loader } from "lucide-react-native"
import { useHealthStore } from "@/store/useHealthStore"
import { textToSpeech, processVoiceCommand } from "@/lib/elevenlabs"
import { Card } from "./ui/Card"
import { Button } from "./ui/Button"

export function VoiceAssistant() {
  const { healthRecord } = useHealthStore()
  const [isListening, setIsListening] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [response, setResponse] = useState("")
  const [isSupported, setIsSupported] = useState(false)
  const [selectedExample, setSelectedExample] = useState<string | null>(null)
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Check platform support
    if (Platform.OS === "web") {
      const hasWebkitSpeechRecognition = "webkitSpeechRecognition" in window
      const hasSpeechRecognition = "SpeechRecognition" in window
      setIsSupported(hasWebkitSpeechRecognition || hasSpeechRecognition)
    } else {
      // For native platforms, assume supported
      setIsSupported(true)
    }
  }, [])

  const startListening = async () => {
    if (!healthRecord) {
      Alert.alert("No Health Data", "Please set up your health profile first to use voice commands.")
      return
    }

    if (!isSupported) {
      Alert.alert(
        "Not Supported",
        "Voice recognition is not supported on this browser/device. Please try using Chrome, Firefox, or Safari, or use the example commands below.",
      )
      return
    }

    setIsListening(true)
    setTranscript("")
    setResponse("")

    if (Platform.OS === "web") {
      try {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition

        if (SpeechRecognition) {
          const recognition = new SpeechRecognition()
          recognition.continuous = false
          recognition.interimResults = false
          recognition.lang = "en-US"
          recognition.maxAlternatives = 1

          recognition.onstart = () => {
            console.log("Speech recognition started")
          }

          recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript
            console.log("Speech recognition result:", transcript)
            setTranscript(transcript)
            setIsListening(false)
            processVoiceCommandHandler(transcript)
          }

          recognition.onerror = (event: any) => {
            console.error("Speech recognition error:", event.error)
            setIsListening(false)

            let errorMessage = "Speech recognition failed. "
            switch (event.error) {
              case "no-speech":
                errorMessage += "No speech was detected. Please try again."
                break
              case "audio-capture":
                errorMessage += "No microphone was found. Please check your microphone."
                break
              case "not-allowed":
                errorMessage += "Microphone access was denied. Please allow microphone access."
                break
              case "network":
                errorMessage += "Network error occurred. Please check your connection."
                break
              default:
                errorMessage += "Please try again or use the example commands."
            }

            setResponse(errorMessage)
          }

          recognition.onend = () => {
            console.log("Speech recognition ended")
            setIsListening(false)
          }

          recognition.start()
        }
      } catch (error) {
        console.error("Failed to start speech recognition:", error)
        setIsListening(false)
      }
    } else {
      // For native platforms, simulate listening for now
      setTimeout(() => {
        if (isListening) {
          setIsListening(false)
          setTranscript("What is my blood type?")
          processVoiceCommandHandler("What is my blood type?")
        }
      }, 3000)
    }
  }

  const stopListening = () => {
    setIsListening(false)
    if (Platform.OS === "web" && typeof window !== "undefined") {
      // Stop any ongoing speech recognition
      console.log("Stopping speech recognition")
    }
  }

  const processVoiceCommandHandler = async (command: string) => {
    try {
      setIsPlaying(true)

      if (!healthRecord) {
        const response =
          "I don't have access to your health data yet. Please set up your health profile first in the Health tab."
        setResponse(response)
        await playResponse(response)
        return
      }

      // Process the command and generate response
      const responseText = await processVoiceCommand(command, healthRecord)
      setResponse(responseText)

      // Play the response
      await playResponse(responseText)
    } catch (error) {
      console.error("Voice command processing error:", error)
      const errorResponse = "Sorry, I had trouble processing that request. Please try again."
      setResponse(errorResponse)
      await playResponse(errorResponse)
    }
  }

  const playResponse = async (text: string) => {
    try {
      setIsPlaying(true)

      // Stop any currently playing audio
      if (currentAudio) {
        currentAudio.pause()
        currentAudio.currentTime = 0
      }

      if (Platform.OS === "web") {
        // Try ElevenLabs first, fallback to Web Speech API
        try {
          const voiceResponse = await textToSpeech(text)

          if (voiceResponse.audioUrl) {
            const audio = new Audio(voiceResponse.audioUrl)
            setCurrentAudio(audio)

            audio.onended = () => {
              setIsPlaying(false)
              setCurrentAudio(null)
              if (voiceResponse.audioUrl && voiceResponse.audioUrl.startsWith("blob:")) {
                URL.revokeObjectURL(voiceResponse.audioUrl)
              }
            }

            audio.onerror = () => {
              console.warn("Audio playback failed, falling back to Speech Synthesis")
              fallbackToSpeechSynthesis(text)
            }

            await audio.play()
          } else {
            fallbackToSpeechSynthesis(text)
          }
        } catch (elevenLabsError) {
          console.warn("ElevenLabs failed, falling back to Speech Synthesis:", elevenLabsError)
          fallbackToSpeechSynthesis(text)
        }
      } else {
        // For native platforms, use ElevenLabs with expo-av
        try {
          const voiceResponse = await textToSpeech(text)

          if (voiceResponse.audioUrl) {
            const { Audio } = await import("expo-av")

            const { sound } = await Audio.Sound.createAsync({ uri: voiceResponse.audioUrl }, { shouldPlay: true })

            sound.setOnPlaybackStatusUpdate((status) => {
              if (status.isLoaded && status.didJustFinish) {
                setIsPlaying(false)
                sound.unloadAsync()
              }
            })
          } else {
            // Fallback to simulated playback
            setTimeout(() => setIsPlaying(false), Math.max(2000, text.length * 50))
          }
        } catch (error) {
          console.error("Native TTS error:", error)
          setTimeout(() => setIsPlaying(false), Math.max(2000, text.length * 50))
        }
      }
    } catch (error) {
      console.error("Audio playback error:", error)
      setIsPlaying(false)
    }
  }

  const fallbackToSpeechSynthesis = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1.0
      utterance.volume = 1.0
      utterance.lang = "en-US"

      utterance.onend = () => {
        setIsPlaying(false)
      }

      utterance.onerror = () => {
        setIsPlaying(false)
      }

      window.speechSynthesis.speak(utterance)
    } else {
      setTimeout(() => setIsPlaying(false), 3000)
    }
  }

  const handleExamplePress = async (example: string) => {
    if (!healthRecord) {
      Alert.alert("No Health Data", "Please set up your health profile first to use voice commands.")
      return
    }

    setSelectedExample(example)
    setTranscript(example)
    await processVoiceCommandHandler(example)
    setTimeout(() => setSelectedExample(null), 2000)
  }

  const examples = [
    "What is my blood type?",
    "What are my allergies?",
    "Who is my emergency contact?",
    "What medications am I taking?",
    "What are my medical conditions?",
    "Give me my health summary",
    "Share my emergency data",
  ]

  return (
    <Card style={styles.container}>
      <Text style={styles.title}>Voice Assistant</Text>

      {/* Platform Info */}
      {Platform.OS === "web" && (
        <View style={styles.platformInfo}>
          <Headphones size={16} color="#0EA5E9" />
          <Text style={styles.platformText}>
            {isSupported
              ? "Voice recognition enabled - speak clearly into your microphone"
              : "Voice recognition not supported - try example commands below"}
          </Text>
        </View>
      )}

      {/* Voice Button */}
      <TouchableOpacity
        style={[
          styles.voiceButton,
          isListening && styles.voiceButtonActive,
          isPlaying && styles.voiceButtonPlaying,
          !isSupported && styles.voiceButtonDisabled,
        ]}
        onPress={isListening ? stopListening : startListening}
        disabled={isPlaying}
      >
        {isListening ? (
          <MicOff size={32} color="#FFFFFF" />
        ) : isPlaying ? (
          <Loader size={32} color="#FFFFFF" />
        ) : (
          <Mic size={32} color={!isSupported ? "#9CA3AF" : "#FFFFFF"} />
        )}
      </TouchableOpacity>

      <Text style={styles.status}>
        {isListening
          ? "Listening... Speak now!"
          : isPlaying
            ? "Speaking..."
            : isSupported
              ? "Tap to speak or try an example below"
              : "Voice not supported - try examples below"}
      </Text>

      {/* Transcript */}
      {transcript && (
        <View style={styles.transcriptContainer}>
          <Text style={styles.transcriptLabel}>You asked:</Text>
          <Text style={styles.transcript}>"{transcript}"</Text>
        </View>
      )}

      {/* Response */}
      {response && (
        <View style={styles.responseContainer}>
          <View style={styles.responseHeader}>
            <Volume2 size={16} color="#10B981" />
            <Text style={styles.responseLabel}>HealthGuardian:</Text>
            {isPlaying && (
              <View style={styles.playingIndicator}>
                <Text style={styles.playingText}>Speaking...</Text>
              </View>
            )}
          </View>
          <Text style={styles.response}>{response}</Text>
        </View>
      )}

      {/* Example Commands */}
      <View style={styles.examplesContainer}>
        <Text style={styles.examplesTitle}>Try asking:</Text>
        {examples.map((example, index) => (
          <Button
            key={index}
            title={example}
            onPress={() => handleExamplePress(example)}
            variant="outline"
            size="small"
            style={[styles.exampleButton, selectedExample === example && styles.exampleButtonActive]}
            textStyle={[styles.exampleText, selectedExample === example && styles.exampleTextActive]}
            disabled={isListening || isPlaying}
          />
        ))}
      </View>

      {!healthRecord && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>
            💡 Set up your health profile first to get personalized responses from the voice assistant.
          </Text>
        </View>
      )}

      {/* Voice Tips */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>Voice Tips:</Text>
        <Text style={styles.tip}>• Speak clearly and at normal volume</Text>
        <Text style={styles.tip}>• Wait for the listening indicator before speaking</Text>
        <Text style={styles.tip}>• Use natural language - ask questions as you would to a person</Text>
        {Platform.OS === "web" && (
          <>
            <Text style={styles.tip}>• Allow microphone access when prompted by your browser</Text>
            <Text style={styles.tip}>• Works best in Chrome, Firefox, and Safari browsers</Text>
          </>
        )}
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 16,
  },
  platformInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F9FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  platformText: {
    fontSize: 12,
    color: "#0369A1",
    marginLeft: 6,
    textAlign: "center",
    flex: 1,
  },
  voiceButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#0EA5E9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  voiceButtonActive: {
    backgroundColor: "#EF4444",
  },
  voiceButtonPlaying: {
    backgroundColor: "#10B981",
  },
  voiceButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  status: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 24,
    textAlign: "center",
    fontWeight: "500",
  },
  transcriptContainer: {
    backgroundColor: "#F3F4F6",
    padding: 16,
    borderRadius: 12,
    width: "100%",
    marginBottom: 16,
  },
  transcriptLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  transcript: {
    fontSize: 16,
    color: "#1F2937",
    fontStyle: "italic",
  },
  responseContainer: {
    backgroundColor: "#ECFDF5",
    padding: 16,
    borderRadius: 12,
    width: "100%",
    marginBottom: 24,
  },
  responseHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  responseLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10B981",
    marginLeft: 4,
  },
  playingIndicator: {
    marginLeft: "auto",
    backgroundColor: "#BBF7D0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  playingText: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "600",
  },
  response: {
    fontSize: 16,
    color: "#1F2937",
    lineHeight: 24,
  },
  examplesContainer: {
    width: "100%",
  },
  examplesTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  exampleButton: {
    marginBottom: 8,
    borderColor: "#E5E7EB",
  },
  exampleButtonActive: {
    backgroundColor: "#EBF8FF",
    borderColor: "#0EA5E9",
  },
  exampleText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "left",
  },
  exampleTextActive: {
    color: "#0EA5E9",
    fontWeight: "600",
  },
  warningContainer: {
    backgroundColor: "#FEF3C7",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    width: "100%",
  },
  warningText: {
    fontSize: 14,
    color: "#A16207",
    textAlign: "center",
  },
  tipsContainer: {
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    width: "100%",
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  tip: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 16,
    marginBottom: 4,
  },
})
