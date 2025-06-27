import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mic, Crown } from 'lucide-react-native';
import { useAuthStore } from '@/store/useAuthStore';
import { VoiceAssistant } from '@/components/VoiceAssistant';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function VoiceScreen() {
  const { profile } = useAuthStore();

  const isPremium = profile?.subscription_status === 'premium';

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
                <Text style={styles.title}>Voice Assistant</Text>
                <Text style={styles.subtitle}>
                  AI-powered voice interaction for your health data
                </Text>
              </View>
            </View>
          </View>

          <Card style={styles.upgradePrompt}>
            <View style={styles.upgradeContent}>
              <Crown size={48} color="#F59E0B" />
              <Text style={styles.upgradeTitle}>Premium Feature</Text>
              <Text style={styles.upgradeDescription}>
                The Voice Assistant is available for Premium subscribers only.
                Upgrade your account to access AI-powered voice interactions with your health data.
              </Text>

              <View style={styles.featureList}>
                <Text style={styles.featureItem}>• Natural voice commands</Text>
                <Text style={styles.featureItem}>• Instant health data queries</Text>
                <Text style={styles.featureItem}>• Hands-free accessibility</Text>
                <Text style={styles.featureItem}>• Emergency voice activation</Text>
              </View>

              <Button
                title="Upgrade to Premium"
                onPress={() => {
                  // Note: RevenueCat integration requires native build
                }}
                variant="secondary"
                style={styles.upgradeButton}
              />
            </View>
          </Card>

          <Card style={styles.demoCard}>
            <Text style={styles.demoTitle}>Voice Commands Preview</Text>
            <View style={styles.commandList}>
              <Text style={styles.commandItem}>"What is my blood type?"</Text>
              <Text style={styles.commandItem}>"What are my allergies?"</Text>
              <Text style={styles.commandItem}>"Who is my emergency contact?"</Text>
              <Text style={styles.commandItem}>"What medications am I taking?"</Text>
              <Text style={styles.commandItem}>"Read my medical conditions"</Text>
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
              <Text style={styles.title}>Voice Assistant</Text>
              <Text style={styles.subtitle}>
                Ask about your health information using natural voice commands
              </Text>
            </View>
          </View>
        </View>

        <VoiceAssistant />

        <Card style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Mic size={20} color="#0EA5E9" />
            <Text style={styles.tipsTitle}>Voice Tips</Text>
          </View>
          <View style={styles.tipsList}>
            <Text style={styles.tip}>• Speak clearly and at normal volume</Text>
            <Text style={styles.tip}>• Wait for the listening indicator before speaking</Text>
            <Text style={styles.tip}>• Use natural language - ask questions as you would to a person</Text>
            <Text style={styles.tip}>• The assistant works best in quiet environments</Text>
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
  demoCard: {
    marginTop: 24,
  },
  demoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  commandList: {
    paddingLeft: 8,
  },
  commandItem: {
    fontSize: 14,
    color: '#0EA5E9',
    fontStyle: 'italic',
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
  },
  tipsCard: {
    marginTop: 24,
    marginBottom: 32,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 8,
  },
  tipsList: {
    paddingLeft: 8,
  },
  tip: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
});