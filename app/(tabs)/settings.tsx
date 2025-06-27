import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  User,
  Shield,
  Crown,
  HelpCircle,
  LogOut,
  ChevronRight,
  Mail,
  Star,
  Check,
  Zap,
  FileCheck,
  Mic,
  BarChart3
} from 'lucide-react-native';
import { useAuthStore } from '@/store/useAuthStore';
import { usePremiumStore } from '@/store/usePremiumStore';
import { clearSecureStorage } from '@/lib/storage';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function SettingsScreen() {
  const { user, profile, signOut, updateProfile } = useAuthStore();
  const { features, userSubscription, loading, loadPremiumFeatures, loadUserSubscription, upgradeToPremium, hasFeature } = usePremiumStore();
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    loadPremiumFeatures();
    loadUserSubscription();
  }, []);

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearSecureStorage();
              await signOut();
              router.replace('/(auth)/login');
            } catch (error) {
              console.error('Sign out error:', error);
            }
          },
        },
      ]
    );
  };

  const handleUpgradeToPremium = async () => {
    Alert.alert(
      'Upgrade to Premium',
      'Would you like to upgrade to Premium for $9.99/month? This will unlock voice assistance, document verification, and more features.\n\n(Demo mode - no payment required)',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Upgrade',
          onPress: async () => {
            setUpgrading(true);
            try {
              await upgradeToPremium();

              Alert.alert(
                'Welcome to Premium! 🎉',
                'You now have access to all premium features including voice assistance and document verification.',
                [{ text: 'Awesome!' }]
              );
            } catch (error) {
              Alert.alert('Upgrade Failed', 'Please try again later.');
            } finally {
              setUpgrading(false);
            }
          },
        },
      ]
    );
  };

  const getFeatureIcon = (featureKey: string) => {
    switch (featureKey) {
      case 'voice_assistant':
        return <Mic size={20} color="#8B5CF6" />;
      case 'document_verification':
        return <FileCheck size={20} color="#10B981" />;
      case 'unlimited_uploads':
        return <Zap size={20} color="#F59E0B" />;
      case 'priority_support':
        return <Star size={20} color="#EF4444" />;
      case 'advanced_analytics':
        return <BarChart3 size={20} color="#0EA5E9" />;
      default:
        return <Shield size={20} color="#6B7280" />;
    }
  };

  const SettingsItem = ({
    icon,
    title,
    subtitle,
    onPress,
    showChevron = true,
    rightElement
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onPress: () => void;
    showChevron?: boolean;
    rightElement?: React.ReactNode;
  }) => (
    <Card style={styles.settingsItem}>
      <View style={styles.itemContent} onTouchEnd={onPress}>
        <View style={styles.itemLeft}>
          <View style={styles.iconContainer}>{icon}</View>
          <View style={styles.itemText}>
            <Text style={styles.itemTitle}>{title}</Text>
            {subtitle && <Text style={styles.itemSubtitle}>{subtitle}</Text>}
          </View>
        </View>
        <View style={styles.itemRight}>
          {rightElement}
          {showChevron && <ChevronRight size={20} color="#9CA3AF" />}
        </View>
      </View>
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
              <Text style={styles.title}>Settings</Text>
              <Text style={styles.subtitle}>Manage your account and premium features</Text>
            </View>
          </View>
        </View>

        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <User size={32} color="#6B7280" />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profile?.full_name || 'User'}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
              <View style={styles.subscriptionBadge}>
                {profile?.subscription_status === 'premium' ? (
                  <>
                    <Crown size={12} color="#F59E0B" />
                    <Text style={styles.premiumText}>Premium Member</Text>
                  </>
                ) : (
                  <Text style={styles.freeText}>Free Plan</Text>
                )}
              </View>
            </View>
          </View>
        </Card>

        {/* Premium Upgrade Section */}
        {profile?.subscription_status === 'free' && (
          <>
            <Text style={styles.sectionTitle}>🚀 Upgrade to Premium</Text>
            <Card style={styles.premiumUpgradeCard}>
              <View style={styles.premiumUpgradeContent}>
                <View style={styles.premiumUpgradeHeader}>
                  <Crown size={40} color="#F59E0B" />
                  <View style={styles.premiumUpgradeHeaderText}>
                    <Text style={styles.premiumUpgradeTitle}>HealthGuardian Premium</Text>
                    <Text style={styles.premiumUpgradePrice}>$9.99/month</Text>
                    <Text style={styles.premiumUpgradeNote}>(Demo - No payment required)</Text>
                  </View>
                </View>

                <View style={styles.premiumUpgradeFeatures}>
                  <Text style={styles.premiumUpgradeFeaturesTitle}>Premium Features:</Text>
                  {features.map((feature) => (
                    <View key={feature.id} style={styles.premiumUpgradeFeature}>
                      {getFeatureIcon(feature.feature_key)}
                      <View style={styles.premiumUpgradeFeatureText}>
                        <Text style={styles.premiumUpgradeFeatureName}>{feature.name}</Text>
                        <Text style={styles.premiumUpgradeFeatureDesc}>{feature.description}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                <Button
                  title={upgrading ? "Upgrading..." : "Upgrade to Premium"}
                  onPress={handleUpgradeToPremium}
                  variant="secondary"
                  style={styles.premiumUpgradeButton}
                  disabled={upgrading || loading}
                />
              </View>
            </Card>
          </>
        )}

        {/* Premium Features Display */}
        {profile?.subscription_status === 'premium' && features.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>✨ Your Premium Features</Text>
            {features.map((feature) => (
              <Card key={feature.id} style={styles.featureCard}>
                <View style={styles.featureContent}>
                  <View style={styles.featureHeader}>
                    {getFeatureIcon(feature.feature_key)}
                    <Text style={styles.featureName}>{feature.name}</Text>
                    <View style={styles.featureActiveStatus}>
                      <Check size={16} color="#10B981" />
                      <Text style={styles.featureActiveText}>Active</Text>
                    </View>
                  </View>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </Card>
            ))}
          </>
        )}

        {/* Account Section */}
        <Text style={styles.sectionTitle}>Account</Text>

        {profile?.subscription_status === 'premium' && (
          <SettingsItem
            icon={<Star size={20} color="#F59E0B" />}
            title="Premium Subscription"
            subtitle="Manage your premium features and billing"
            onPress={() => {
              const activeFeatures = features.filter(f => hasFeature(f.feature_key));
              Alert.alert(
                'Premium Subscription',
                `You have access to ${activeFeatures.length} premium features:\n\n${activeFeatures.map(f => `✓ ${f.name}`).join('\n')}\n\nSubscription Status: Active\nNext Billing: Demo Mode`
              );
            }}
            rightElement={
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumBadgeText}>Active</Text>
              </View>
            }
          />
        )}

        <SettingsItem
          icon={<Shield size={20} color="#0EA5E9" />}
          title="Privacy & Security"
          subtitle="Manage your data and security settings"
          onPress={() => {
            Alert.alert(
              'Privacy & Security',
              'Your data is encrypted and secured using blockchain technology. All health information is stored securely and only accessible to you.\n\n🔐 End-to-end encryption\n⛓️ Blockchain verification\n🔒 Zero-knowledge architecture\n🛡️ HIPAA compliant storage'
            );
          }}
        />

        <SettingsItem
          icon={<User size={20} color="#6B7280" />}
          title="Account Information"
          subtitle="View and edit your profile details"
          onPress={() => {
            Alert.alert(
              'Account Information',
              `Name: ${profile?.full_name || 'Not set'}\nEmail: ${user?.email || 'Not set'}\nSubscription: ${profile?.subscription_status || 'free'}\nMember since: ${profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}`
            );
          }}
        />

        {/* Support Section */}
        <Text style={styles.sectionTitle}>Support & Help</Text>

        <SettingsItem
          icon={<HelpCircle size={20} color="#6B7280" />}
          title="Help & Support"
          subtitle="Get help and contact support"
          onPress={() => {
            Alert.alert(
              'Help & Support',
              'Need help with HealthGuardian?\n\n📧 Email: support@healthguardian.app\n💬 Live Chat: Available 24/7 for Premium users\n📚 Help Center: healthguardian.app/help\n🎥 Video Tutorials: Available in app\n\nResponse time:\n• Premium: Within 2 hours\n• Free: Within 24 hours'
            );
          }}
        />

        <SettingsItem
          icon={<Mail size={20} color="#6B7280" />}
          title="Send Feedback"
          subtitle="Help us improve HealthGuardian"
          onPress={() => {
            Alert.alert(
              'Send Feedback',
              'We\'d love to hear from you!\n\n📧 feedback@healthguardian.app\n⭐ App Store Reviews\n💡 Feature Requests\n🐛 Bug Reports\n\nYour feedback helps us make HealthGuardian better for everyone. Thank you for being part of our community!'
            );
          }}
        />

        <SettingsItem
          icon={<Star size={20} color="#F59E0B" />}
          title="Rate HealthGuardian"
          subtitle="Share your experience with others"
          onPress={() => {
            Alert.alert(
              'Rate HealthGuardian',
              'Enjoying HealthGuardian? Please consider leaving a review!\n\n⭐ Your rating helps others discover our app\n💬 Share what you love most\n🚀 Help us reach more people who need secure health storage\n\nThank you for your support!'
            );
          }}
        />

        {/* App Information */}
        <Text style={styles.sectionTitle}>About</Text>

        <SettingsItem
          icon={<Shield size={20} color="#0EA5E9" />}
          title="About HealthGuardian"
          subtitle="Learn more about our mission and technology"
          onPress={() => {
            Alert.alert(
              'About HealthGuardian',
              'HealthGuardian is a revolutionary health data management platform that combines the security of blockchain technology with the convenience of modern mobile apps.\n\n🏥 Emergency-ready health records\n⛓️ Algorand blockchain security\n🔐 End-to-end encryption\n🎤 AI voice assistant\n📱 QR code emergency access\n\nVersion: 1.0.0\nBuilt with ❤️ for your health and safety'
            );
          }}
          showChevron={false}
        />

        {/* Sign Out */}
        <View style={styles.signOutSection}>
          <Button
            title="Sign Out"
            onPress={handleSignOut}
            variant="danger"
            style={styles.signOutButton}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.version}>HealthGuardian v1.0.0</Text>
          <Text style={styles.copyright}>
            © 2025 HealthGuardian. Secured by Algorand blockchain.
          </Text>
          <Text style={styles.footerNote}>
            Your health data is encrypted and secured using military-grade encryption and blockchain technology.
          </Text>
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
  profileCard: {
    marginBottom: 32,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  subscriptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
  },
  premiumText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
    marginLeft: 4,
  },
  freeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    marginTop: 8,
  },
  premiumUpgradeCard: {
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#FCD34D',
    marginBottom: 24,
  },
  premiumUpgradeContent: {
    alignItems: 'center',
  },
  premiumUpgradeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  premiumUpgradeHeaderText: {
    marginLeft: 16,
    flex: 1,
  },
  premiumUpgradeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#92400E',
  },
  premiumUpgradePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#A16207',
    marginTop: 2,
  },
  premiumUpgradeNote: {
    fontSize: 12,
    color: '#A16207',
    fontStyle: 'italic',
    marginTop: 2,
  },
  premiumUpgradeFeatures: {
    alignSelf: 'stretch',
    marginBottom: 24,
  },
  premiumUpgradeFeaturesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 16,
  },
  premiumUpgradeFeature: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    backgroundColor: '#FEF9C3',
    padding: 12,
    borderRadius: 8,
  },
  premiumUpgradeFeatureText: {
    marginLeft: 12,
    flex: 1,
  },
  premiumUpgradeFeatureName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  premiumUpgradeFeatureDesc: {
    fontSize: 13,
    color: '#A16207',
    lineHeight: 18,
  },
  premiumUpgradeButton: {
    minWidth: 200,
    height: 48,
  },
  featureCard: {
    marginBottom: 8,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  featureContent: {
    paddingVertical: 8,
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
    flex: 1,
  },
  featureActiveStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featureActiveText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginLeft: 28,
  },
  settingsItem: {
    marginBottom: 8,
    paddingVertical: 16,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  itemText: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  premiumBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  premiumBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  signOutSection: {
    marginTop: 32,
    marginBottom: 32,
  },
  signOutButton: {
    backgroundColor: '#10B981',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  version: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  copyright: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 8,
  },
  footerNote: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 20,
  },
});