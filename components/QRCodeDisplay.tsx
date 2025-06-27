import { useState, useRef } from "react"
import { View, Text, StyleSheet, Alert, Platform } from "react-native"
import QRCode from "react-native-qrcode-svg"
import { Card } from "./ui/Card"
import { Button } from "./ui/Button"
import { Share, Download, Copy, ExternalLink, FileText } from "lucide-react-native"
import { QRCodeManager, type QRDownloadOptions } from "@/lib/qr-utils"

interface QRCodeDisplayProps {
  data: string
  title?: string
  size?: number
  patientName?: string
}

export function QRCodeDisplay({ data, title = "Emergency QR Code", size = 200, patientName }: QRCodeDisplayProps) {
  const [loading, setLoading] = useState(false)
  const qrRef = useRef<any>(null)

  const handleShare = async () => {
    try {
      setLoading(true)

      const shareData = {
        title: "HealthGuardian Emergency QR Code",
        text: `Emergency health information QR code for ${patientName || "patient"}`,
        url: `https://healthguardian.app/emergency/${data}`,
      }

      if (Platform.OS === "web") {
        if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
          await navigator.share(shareData)
        } else {
          // Fallback: copy to clipboard
          if (navigator.clipboard) {
            await navigator.clipboard.writeText(`https://healthguardian.app/emergency/${data}`)
            Alert.alert("Copied!", "Emergency link copied to clipboard")
          }
        }
      } else {
        // For mobile, first capture the QR code then share
        const imageUri = await QRCodeManager.captureQRCode(qrRef.current)
        await QRCodeManager.shareFile(imageUri, "HealthGuardian Emergency QR Code")
      }
    } catch (error) {
      console.error("Share failed:", error)
      Alert.alert("Share Failed", "Unable to share QR code. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    Alert.alert("Download QR Code", "Choose download format:", [
      { text: "Cancel", style: "cancel" },
      {
        text: "📱 PNG Image",
        onPress: async () => {
          try {
            setLoading(true)
            const options: QRDownloadOptions = {
              format: "png",
              qrCodeData: data,
              patientName,
              includeInstructions: true,
            }

            const result = await QRCodeManager.downloadQRCode(options, qrRef.current)
            Alert.alert("Success! 📱", `QR code image saved successfully.\n\n${result}`)
          } catch (error) {
            Alert.alert("Download Failed", error.message)
          } finally {
            setLoading(false)
          }
        },
      },
      {
        text: "📄 PDF Document",
        onPress: async () => {
          try {
            setLoading(true)
            const options: QRDownloadOptions = {
              format: "pdf",
              qrCodeData: data,
              patientName,
              includeInstructions: true,
            }

            const result = await QRCodeManager.downloadQRCode(options)
            Alert.alert("PDF Generated! 📄", "Emergency QR code document created with detailed instructions for first responders.")
          } catch (error) {
            Alert.alert("Download Failed", error.message)
          } finally {
            setLoading(false)
          }
        },
      },
      {
        text: "📝 Text File",
        onPress: async () => {
          try {
            setLoading(true)
            const options: QRDownloadOptions = {
              format: "txt",
              qrCodeData: data,
              patientName,
              includeInstructions: true,
            }

            const result = await QRCodeManager.downloadQRCode(options)
            Alert.alert("Text File Created! 📝", "QR code data and emergency instructions saved as text file. Perfect for printing or sharing via email.")
          } catch (error) {
            Alert.alert("Download Failed", error.message)
          } finally {
            setLoading(false)
          }
        },
      },
    ])
  }

  const handleQuickTextDownload = async () => {
    try {
      setLoading(true)
      const options: QRDownloadOptions = {
        format: "txt",
        qrCodeData: data,
        patientName,
        includeInstructions: true,
      }

      const result = await QRCodeManager.downloadQRCode(options)
      Alert.alert("Text File Downloaded! 📝", `Emergency QR code information saved as text file.\n\n${result}\n\nThis file contains:\n• QR code data\n• Emergency instructions\n• First responder guidance\n• Contact information`)
    } catch (error) {
      Alert.alert("Download Failed", error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyData = async () => {
    try {
      if (Platform.OS === "web" && navigator.clipboard) {
        await navigator.clipboard.writeText(data)
        Alert.alert("Copied!", "QR code data copied to clipboard")
      } else {
        // For mobile, share the data as text
        const textUri = await QRCodeManager.saveFile(data, "qr_data.txt", "text/plain")
        await QRCodeManager.shareFile(textUri, "QR Code Data")
      }
    } catch (error) {
      Alert.alert("Copy Failed", "Unable to copy QR code data")
    }
  }

  const handleViewOnline = () => {
    const emergencyUrl = `https://healthguardian.app/emergency/${data}`

    Alert.alert(
      "View Online",
      "Open emergency page in browser?\n\nThis will show how your QR code appears to emergency responders.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Open",
          onPress: () => {
            if (Platform.OS === "web") {
              window.open(emergencyUrl, "_blank")
            } else {
              Alert.alert("Emergency URL", emergencyUrl)
            }
          },
        },
      ],
    )
  }

  return (
    <Card style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.qrContainer}>
        <QRCode
          value={data}
          size={size}
          color="#000000"
          backgroundColor="#FFFFFF"
          getRef={(ref) => (qrRef.current = ref)}
        />
      </View>

      <Text style={styles.instruction}>
        Show this QR code to emergency responders for instant access to your medical information.
      </Text>

      <View style={styles.actionButtons}>
        <Button
          title={loading ? "Processing..." : "Share"}
          onPress={handleShare}
          variant="primary"
          size="small"
          style={styles.actionButton}
          disabled={loading}
        >
          <Share size={16} color="#FFFFFF" />
        </Button>

        <Button
          title="Download"
          onPress={handleDownload}
          variant="secondary"
          size="small"
          style={styles.actionButton}
          disabled={loading}
        >
          <Download size={16} color="#FFFFFF" />
        </Button>
      </View>

      <View style={styles.secondaryActions}>
        <Button
          title="📝 Text File"
          onPress={handleQuickTextDownload}
          variant="outline"
          size="small"
          style={styles.textDownloadButton}
          disabled={loading}
        >
          <FileText size={14} color="#0EA5E9" />
        </Button>

        <Button
          title="Copy Data"
          onPress={handleCopyData}
          variant="outline"
          size="small"
          style={styles.secondaryButton}
          disabled={loading}
        >
          <Copy size={14} color="#6B7280" />
        </Button>

        <Button
          title="Preview"
          onPress={handleViewOnline}
          variant="outline"
          size="small"
          style={styles.secondaryButton}
          disabled={loading}
        >
          <ExternalLink size={14} color="#6B7280" />
        </Button>
      </View>

      <View style={styles.emergencyNote}>
        <Text style={styles.emergencyText}>
          🚨 Keep this QR code accessible on your phone's lock screen or print it for your wallet.
        </Text>
      </View>

      <View style={styles.usageInstructions}>
        <Text style={styles.usageTitle}>Download Options:</Text>
        <Text style={styles.usageItem}>• 📱 PNG Image - Save to phone gallery for quick access</Text>
        <Text style={styles.usageItem}>• 📄 PDF Document - Print copy with instructions for physical backup</Text>
        <Text style={styles.usageItem}>• 📝 Text File - Emergency data in readable format for email/sharing</Text>
        <Text style={styles.usageItem}>• 🔗 Share Link - Send emergency access link to family members</Text>
      </View>

      <View style={styles.textFileInfo}>
        <Text style={styles.textFileTitle}>📝 Text File Benefits:</Text>
        <Text style={styles.textFileDetail}>• Easy to email or print</Text>
        <Text style={styles.textFileDetail}>• Contains all emergency instructions</Text>
        <Text style={styles.textFileDetail}>• Readable on any device</Text>
        <Text style={styles.textFileDetail}>• Perfect for sharing with caregivers</Text>
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 16,
    textAlign: "center",
  },
  qrContainer: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  instruction: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
    width: "100%",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
  },
  secondaryActions: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  textDownloadButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    backgroundColor: "#EBF8FF",
    borderColor: "#0EA5E9",
    borderWidth: 2,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
  },
  emergencyNote: {
    backgroundColor: "#FEF3C7",
    padding: 12,
    borderRadius: 8,
    width: "100%",
    marginBottom: 16,
  },
  emergencyText: {
    fontSize: 12,
    color: "#A16207",
    textAlign: "center",
    lineHeight: 16,
  },
  usageInstructions: {
    backgroundColor: "#F0F9FF",
    padding: 12,
    borderRadius: 8,
    width: "100%",
    marginBottom: 12,
  },
  usageTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0C4A6E",
    marginBottom: 8,
  },
  usageItem: {
    fontSize: 12,
    color: "#0369A1",
    lineHeight: 16,
    marginBottom: 4,
  },
  textFileInfo: {
    backgroundColor: "#ECFDF5",
    padding: 12,
    borderRadius: 8,
    width: "100%",
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  textFileTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#059669",
    marginBottom: 8,
  },
  textFileDetail: {
    fontSize: 12,
    color: "#047857",
    lineHeight: 16,
    marginBottom: 3,
  },
})