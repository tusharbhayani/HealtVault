import { useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { router } from "expo-router"
import { Shield, QrCode, Heart, AlertTriangle, Activity, Users, FileText, TestTube, ExternalLink } from "lucide-react-native"
import { useAuthStore } from "@/store/useAuthStore"
import { useHealthStore } from "@/store/useHealthStore"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { QRCodeDisplay } from "@/components/QRCodeDisplay"
import { getExplorerUrl } from "@/lib/algorand"

export default function DashboardScreen() {
  const { user, profile } = useAuthStore()
  const { healthRecord, qrCodeData, loadHealthRecord, generateQRCode, loading, loadTestData, blockchainStatus } =
    useHealthStore()

  useEffect(() => {
    if (!user) {
      router.replace("/(auth)/login")
      return
    }

    loadHealthRecord()
  }, [user])

  useEffect(() => {
    if (healthRecord && !qrCodeData) {
      generateQRCode()
    }
  }, [healthRecord, qrCodeData])

  const handleLoadTestData = async () => {
    Alert.alert(
      "Load Test Data",
      "This will load comprehensive test health data for demonstration purposes. This will replace any existing health information.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Load Test Data",
          onPress: async () => {
            try {
              await loadTestData()
              Alert.alert(
                "Test Data Loaded! 🎉",
                "Comprehensive test health data has been loaded. You can now:\n\n• Test voice assistant features\n• Try QR code scanning\n• Verify document functionality\n• Test emergency access\n• View blockchain verification",
              )
            } catch (error) {
              console.error("Test data loading error:", error)
              Alert.alert("Error", "Failed to load test data. Please try again.")
            }
          },
        },
      ],
    )
  }

  const handleViewOnBlockchain = () => {
    if (healthRecord?.algorand_tx_id) {
      const explorerUrl = getExplorerUrl('transaction', healthRecord.algorand_tx_id)
      Alert.alert(
        "View on Algorand Blockchain",
        `View your health data transaction on the Algorand blockchain explorer?\n\nTransaction ID: ${healthRecord.algorand_tx_id.substring(0, 20)}...`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "View on Explorer",
            onPress: () => {
              // In a real app, this would open the URL
              Alert.alert(
                "Blockchain Explorer",
                `Your transaction is verified on Algorand blockchain!\n\nExplorer URL:\n${explorerUrl}\n\nTransaction ID:\n${healthRecord.algorand_tx_id}`
              )
            }
          }
        ]
      )
    } else {
      Alert.alert("No Blockchain Data", "This health record hasn't been stored on the blockchain yet.")
    }
  }

  if (!user) {
    return <LoadingSpinner message="Loading..." />
  }

  if (loading) {
    return <LoadingSpinner message="Loading your health data..." />
  }

  const hasHealthData =
    healthRecord &&
    (healthRecord.blood_type ||
      healthRecord.allergies?.length ||
      healthRecord.medications?.length ||
      healthRecord.emergency_contacts?.length)

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  }

  const getBlockchainStatusText = () => {
    switch (blockchainStatus) {
      case "storing":
        return "⛓️ Storing on Algorand blockchain..."
      case "verifying":
        return "🔍 Verifying blockchain data..."
      case "success":
        return "✅ Verified on Algorand blockchain"
      case "error":
        return "⚠️ Blockchain verification pending"
      default:
        return ""
    }
  }

  const getBlockchainStatusStyle = () => {
    switch (blockchainStatus) {
      case "success":
        return styles.successCard
      case "error":
        return styles.warningCard
      case "storing":
      case "verifying":
        return styles.loadingCard
      default:
        return {}
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.welcomeSection}>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.name}>{profile?.full_name || "User"}</Text>
          </View>

          <View style={styles.statusBadge}>
            <Shield size={16} color="#10B981" />
            <Text style={styles.statusText}>{profile?.subscription_status === "premium" ? "Premium" : "Free"}</Text>
          </View>
        </View>

        {/* Blockchain Status */}
        {blockchainStatus !== "idle" && (
          <Card style={[styles.statusCard, getBlockchainStatusStyle()]}>
            <View style={styles.statusContent}>
              <Text style={styles.statusText}>{getBlockchainStatusText()}</Text>
              {healthRecord?.algorand_tx_id && blockchainStatus === "success" && (
                <Button
                  title="View on Blockchain"
                  onPress={handleViewOnBlockchain}
                  variant="outline"
                  size="small"
                  style={styles.blockchainButton}
                >
                  <ExternalLink size={14} color="#0EA5E9" />
                </Button>
              )}
            </View>
          </Card>
        )}

        {/* Hero Section */}
        <Card style={styles.heroCard}>
          <View style={styles.heroContent}>
            <Image
              source={{
                uri: "https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=800",
              }}
              style={styles.heroImage}
            />
            <View style={styles.heroText}>
              <Text style={styles.heroTitle}>Your Health, Secured</Text>
              <Text style={styles.heroSubtitle}>
                Algorand blockchain-powered emergency medical information at your fingertips
              </Text>
            </View>
          </View>
        </Card>

        {/* Test Data Section */}
        {!hasHealthData && (
          <Card style={styles.testDataCard}>
            <View style={styles.testDataContent}>
              <TestTube size={32} color="#8B5CF6" />
              <Text style={styles.testDataTitle}>Try with Test Data</Text>
              <Text style={styles.testDataDescription}>
                Load comprehensive test health data to explore all features including voice assistant, QR scanning, blockchain verification, and emergency access.
              </Text>
              <Button
                title="Load Test Data"
                onPress={handleLoadTestData}
                variant="secondary"
                style={styles.testDataButton}
                disabled={loading}
              />
            </View>
          </Card>
        )}

        {/* Setup Prompt or QR Code */}
        {!hasHealthData ? (
          <Card style={styles.setupCard}>
            <View style={styles.setupPrompt}>
              <AlertTriangle size={48} color="#F59E0B" />
              <Text style={styles.setupTitle}>Complete Your Health Profile</Text>
              <Text style={styles.setupDescription}>
                Set up your emergency health information to generate your QR code and enable blockchain verification.
              </Text>
              <Button
                title="Set Up Health Profile"
                onPress={() => router.push("/(tabs)/health")}
                variant="primary"
                style={styles.setupButton}
              />
            </View>
          </Card>
        ) : (
          <>
            {qrCodeData && (
              <QRCodeDisplay
                data={qrCodeData}
                title="Your Emergency QR Code"
                size={180}
                patientName={healthRecord?.full_name}
              />
            )}

            {/* Blockchain Verification Status */}
            {healthRecord && (
              <Card style={[
                styles.verificationCard,
                healthRecord.is_blockchain_verified ? styles.verifiedCard : styles.unverifiedCard
              ]}>
                <View style={styles.verificationContent}>
                  <Shield size={24} color={healthRecord.is_blockchain_verified ? "#10B981" : "#F59E0B"} />
                  <View style={styles.verificationText}>
                    <Text style={[
                      styles.verificationTitle,
                      healthRecord.is_blockchain_verified ? styles.verifiedText : styles.unverifiedText
                    ]}>
                      {healthRecord.is_blockchain_verified ? "Blockchain Verified" : "Verification Pending"}
                    </Text>
                    <Text style={styles.verificationDescription}>
                      {healthRecord.is_blockchain_verified
                        ? "Data integrity confirmed on Algorand blockchain"
                        : "Blockchain verification in progress"
                      }
                    </Text>
                    {healthRecord.algorand_tx_id && (
                      <Text style={styles.transactionId}>
                        TX: {healthRecord.algorand_tx_id.substring(0, 20)}...
                      </Text>
                    )}
                  </View>
                  {healthRecord.algorand_tx_id && (
                    <Button
                      title="View"
                      onPress={handleViewOnBlockchain}
                      variant="outline"
                      size="small"
                      style={styles.viewButton}
                    >
                      <ExternalLink size={12} color="#0EA5E9" />
                    </Button>
                  )}
                </View>
              </Card>
            )}

            {/* Health Summary */}
            <Card>
              <Text style={styles.sectionTitle}>Health Summary</Text>
              <View style={styles.summaryGrid}>
                <View style={styles.summaryItem}>
                  <Activity size={20} color="#EF4444" />
                  <View style={styles.summaryContent}>
                    <Text style={styles.summaryLabel}>Blood Type</Text>
                    <Text style={styles.summaryValue}>{healthRecord.blood_type || "Not set"}</Text>
                  </View>
                </View>

                <View style={styles.summaryItem}>
                  <AlertTriangle size={20} color="#F59E0B" />
                  <View style={styles.summaryContent}>
                    <Text style={styles.summaryLabel}>Allergies</Text>
                    <Text style={styles.summaryValue}>
                      {healthRecord.allergies?.length ? `${healthRecord.allergies.length} listed` : "None"}
                    </Text>
                  </View>
                </View>

                <View style={styles.summaryItem}>
                  <FileText size={20} color="#8B5CF6" />
                  <View style={styles.summaryContent}>
                    <Text style={styles.summaryLabel}>Medications</Text>
                    <Text style={styles.summaryValue}>
                      {healthRecord.medications?.length ? `${healthRecord.medications.length} active` : "None"}
                    </Text>
                  </View>
                </View>

                <View style={styles.summaryItem}>
                  <Users size={20} color="#10B981" />
                  <View style={styles.summaryContent}>
                    <Text style={styles.summaryLabel}>Emergency Contacts</Text>
                    <Text style={styles.summaryValue}>
                      {healthRecord.emergency_contacts?.length
                        ? `${healthRecord.emergency_contacts.length} contacts`
                        : "None"}
                    </Text>
                  </View>
                </View>
              </View>
            </Card>
          </>
        )}

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/(tabs)/health")}>
            <Heart size={32} color="#EF4444" />
            <Text style={styles.actionTitle}>Update Health Info</Text>
            <Text style={styles.actionDescription}>Manage your medical information</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/(tabs)/voice")}>
            <Shield size={32} color="#0EA5E9" />
            <Text style={styles.actionTitle}>Voice Assistant</Text>
            <Text style={styles.actionDescription}>Ask about your health data</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/(tabs)/verify")}>
            <FileText size={32} color="#8B5CF6" />
            <Text style={styles.actionTitle}>Verify Documents</Text>
            <Text style={styles.actionDescription}>Check document authenticity</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/emergency/demo")}>
            <QrCode size={32} color="#10B981" />
            <Text style={styles.actionTitle}>Emergency View</Text>
            <Text style={styles.actionDescription}>Preview emergency access</Text>
          </TouchableOpacity>
        </View>

        {/* Feature Highlights */}
        <Card style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>✨ Available Features</Text>
          <View style={styles.featuresList}>
            <Text style={styles.featureItem}>🎤 Voice Assistant (Premium)</Text>
            <Text style={styles.featureItem}>📱 QR Code Scanner</Text>
            <Text style={styles.featureItem}>🔐 Document Verification (Premium)</Text>
            <Text style={styles.featureItem}>🚨 Emergency Data Access</Text>
            <Text style={styles.featureItem}>⛓️ Algorand Blockchain Security</Text>
            <Text style={styles.featureItem}>🔊 Text-to-Speech Emergency Readout</Text>
            <Text style={styles.featureItem}>🌐 Blockchain Explorer Integration</Text>
          </View>
        </Card>

        {/* Premium Upgrade */}
        {profile?.subscription_status === "free" && (
          <Card style={styles.upgradeCard}>
            <View style={styles.upgradeContent}>
              <View style={styles.upgradeHeader}>
                <Shield size={24} color="#F59E0B" />
                <Text style={styles.upgradeTitle}>Unlock Premium Features</Text>
              </View>
              <Text style={styles.upgradeDescription}>
                Get voice assistance, document verification, and enhanced blockchain security features.
              </Text>
              <View style={styles.upgradeFeatures}>
                <Text style={styles.upgradeFeature}>• Voice AI Assistant</Text>
                <Text style={styles.upgradeFeature}>• Document Verification</Text>
                <Text style={styles.upgradeFeature}>• Unlimited Uploads</Text>
                <Text style={styles.upgradeFeature}>• Priority Support</Text>
              </View>
              <Button
                title="Upgrade to Premium"
                onPress={() => {
                  router.push("/(tabs)/settings")
                }}
                variant="secondary"
                size="small"
                style={styles.upgradeButton}
              />
            </View>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 20,
    marginBottom: 24,
  },
  welcomeSection: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: "#6B7280",
  },
  name: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1F2937",
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10B981",
    marginLeft: 4,
  },
  statusCard: {
    marginBottom: 16,
    padding: 16,
  },
  statusContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  blockchainButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
  },
  successCard: {
    backgroundColor: "#ECFDF5",
    borderColor: "#10B981",
    borderWidth: 1,
  },
  warningCard: {
    backgroundColor: "#FEF3C7",
    borderColor: "#F59E0B",
    borderWidth: 1,
  },
  loadingCard: {
    backgroundColor: "#EFF6FF",
    borderColor: "#3B82F6",
    borderWidth: 1,
  },
  verificationCard: {
    marginBottom: 16,
  },
  verifiedCard: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  unverifiedCard: {
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FCD34D",
  },
  verificationContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  verificationText: {
    marginLeft: 12,
    flex: 1,
  },
  verificationTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  verifiedText: {
    color: "#10B981",
  },
  unverifiedText: {
    color: "#F59E0B",
  },
  verificationDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  transactionId: {
    fontSize: 12,
    color: "#9CA3AF",
    fontFamily: "monospace",
  },
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
  },
  heroCard: {
    marginBottom: 24,
    padding: 0,
    overflow: "hidden",
  },
  heroContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  heroImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
  },
  heroText: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  testDataCard: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    marginBottom: 16,
  },
  testDataContent: {
    alignItems: "center",
    paddingVertical: 16,
  },
  testDataTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#374151",
    marginTop: 12,
    marginBottom: 8,
  },
  testDataDescription: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },
  testDataButton: {
    minWidth: 160,
  },
  setupCard: {
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FCD34D",
  },
  setupPrompt: {
    alignItems: "center",
    paddingVertical: 20,
  },
  setupTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#92400E",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  setupDescription: {
    fontSize: 16,
    color: "#A16207",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  setupButton: {
    minWidth: 200,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginTop: 32,
    marginBottom: 16,
  },
  summaryGrid: {
    marginTop: 16,
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
  },
  summaryContent: {
    marginLeft: 12,
    flex: 1,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: "47%",
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginTop: 12,
    marginBottom: 4,
    textAlign: "center",
  },
  actionDescription: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  featuresCard: {
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    marginTop: 24,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0C4A6E",
    marginBottom: 16,
  },
  featuresList: {
    gap: 8,
  },
  featureItem: {
    fontSize: 14,
    color: "#0369A1",
    lineHeight: 20,
  },
  upgradeCard: {
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FCD34D",
    marginTop: 24,
    marginBottom: 32,
  },
  upgradeContent: {
    alignItems: "center",
  },
  upgradeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  upgradeTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#92400E",
    marginLeft: 8,
  },
  upgradeDescription: {
    fontSize: 14,
    color: "#A16207",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },
  upgradeFeatures: {
    alignSelf: "stretch",
    marginBottom: 20,
  },
  upgradeFeature: {
    fontSize: 14,
    color: "#A16207",
    marginBottom: 4,
  },
  upgradeButton: {
    minWidth: 160,
  },
})