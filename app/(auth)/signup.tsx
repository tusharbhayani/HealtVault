import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { Shield, Eye, EyeOff, AlertCircle, CheckCircle, Crown } from 'lucide-react-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuthStore } from '@/store/useAuthStore';

export default function SignUpScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPremiumSignup, setIsPremiumSignup] = useState(false);
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  const { signUp, loading } = useAuthStore();

  const validateForm = () => {
    const newErrors: any = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    try {
      setErrors({});
      await signUp(email.trim(), password, fullName.trim(), isPremiumSignup);
      router.replace('/(tabs)');
    } catch (error: any) {
      let errorMessage = 'An error occurred. Please try again.';

      if (error.message?.includes('already exists') ||
        error.message?.includes('already registered') ||
        error.message?.includes('User already registered')) {
        errorMessage = 'An account with this email already exists. Please sign in instead.';
      } else if (error.message?.includes('Invalid email')) {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.message?.includes('Password')) {
        errorMessage = 'Password must be at least 6 characters long.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setErrors({ general: errorMessage });
    }
  };

  if (loading) {
    return <LoadingSpinner message="Creating your account..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Shield size={56} color="#10B981" strokeWidth={1.5} />
              </View>
              <Text style={styles.title}>Join HealthGuardian</Text>
              <Text style={styles.subtitle}>
                Create your secure health profile and emergency vault
              </Text>
            </View>

            {errors.general && (
              <View style={styles.errorContainer}>
                <AlertCircle size={20} color="#EF4444" />
                <Text style={styles.errorText}>{errors.general}</Text>
              </View>
            )}

            <View style={styles.form}>
              <Input
                label="Full Name"
                value={fullName}
                onChangeText={setFullName}
                error={errors.fullName}
                required
                placeholder="Enter your full name"
                autoComplete="name"
              />

              <Input
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={errors.email}
                required
                placeholder="Enter your email"
              />

              <View style={styles.passwordContainer}>
                <Input
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  error={errors.password}
                  required
                  placeholder="Create a password"
                />
                <Button
                  title=""
                  onPress={() => setShowPassword(!showPassword)}
                  variant="ghost"
                  style={styles.eyeButton}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#6B7280" />
                  ) : (
                    <Eye size={20} color="#6B7280" />
                  )}
                </Button>
              </View>

              <View style={styles.passwordContainer}>
                <Input
                  label="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  error={errors.confirmPassword}
                  required
                  placeholder="Confirm your password"
                />
                <Button
                  title=""
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  variant="ghost"
                  style={styles.eyeButton}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} color="#6B7280" />
                  ) : (
                    <Eye size={20} color="#6B7280" />
                  )}
                </Button>
              </View>

              {/* Premium Signup Option */}
              <View style={styles.premiumContainer}>
                <View style={styles.premiumHeader}>
                  <Crown size={20} color="#F59E0B" />
                  <Text style={styles.premiumTitle}>Premium Account (Demo)</Text>
                </View>
                <View style={styles.premiumToggle}>
                  <View style={styles.premiumInfo}>
                    <Text style={styles.premiumDescription}>
                      Sign up as a Premium user to access voice assistant, document verification, and advanced features.
                    </Text>
                    <Text style={styles.premiumNote}>
                      (For demonstration purposes - no payment required)
                    </Text>
                  </View>
                  <Switch
                    value={isPremiumSignup}
                    onValueChange={setIsPremiumSignup}
                    trackColor={{ false: '#D1D5DB', true: '#FCD34D' }}
                    thumbColor={isPremiumSignup ? '#F59E0B' : '#9CA3AF'}
                  />
                </View>
                {isPremiumSignup && (
                  <View style={styles.premiumFeatures}>
                    <Text style={styles.premiumFeaturesTitle}>Premium Features Included:</Text>
                    <Text style={styles.premiumFeature}>• AI Voice Assistant</Text>
                    <Text style={styles.premiumFeature}>• Document Verification</Text>
                    <Text style={styles.premiumFeature}>• Unlimited Uploads</Text>
                    <Text style={styles.premiumFeature}>• Priority Support</Text>
                  </View>
                )}
              </View>

              <Button
                title={isPremiumSignup ? "Create Premium Account" : "Create Account"}
                onPress={handleSignUp}
                style={[styles.signUpButton, isPremiumSignup && styles.premiumSignUpButton]}
                disabled={loading}
              />

              <View style={styles.linkContainer}>
                <Text style={styles.linkText}>Already have an account? </Text>
                <Link href="/(auth)/login" asChild>
                  <Text style={styles.link}>Sign In</Text>
                </Link>
              </View>

              <View style={styles.noteContainer}>
                <CheckCircle size={16} color="#10B981" />
                <Text style={styles.noteText}>
                  No email verification required - start using HealthGuardian immediately after signup.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginLeft: 8,
    flex: 1,
  },
  form: {
    width: '100%',
  },
  passwordContainer: {
    position: 'relative',
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 36,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  premiumContainer: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  premiumTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
    marginLeft: 8,
  },
  premiumToggle: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  premiumInfo: {
    flex: 1,
    marginRight: 16,
  },
  premiumDescription: {
    fontSize: 14,
    color: '#A16207',
    lineHeight: 20,
    marginBottom: 4,
  },
  premiumNote: {
    fontSize: 12,
    color: '#92400E',
    fontStyle: 'italic',
  },
  premiumFeatures: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#FCD34D',
  },
  premiumFeaturesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  premiumFeature: {
    fontSize: 13,
    color: '#A16207',
    marginBottom: 4,
  },
  signUpButton: {
    marginTop: 8,
    marginBottom: 32,
    height: 56,
  },
  premiumSignUpButton: {
    backgroundColor: '#F59E0B',
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  linkText: {
    fontSize: 16,
    color: '#6B7280',
  },
  link: {
    fontSize: 16,
    color: '#0EA5E9',
    fontWeight: '600',
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  noteText: {
    fontSize: 14,
    color: '#166534',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
});