import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "../../components/ThemedText";
import { ThemedView } from "../../components/ThemedView";
import { Colors } from "../../constants/Colors";
import { useColorScheme } from "../../hooks/useColorScheme";
import { DataService } from "../../services/DataService";
import { Ionicons } from "@expo/vector-icons";

export default function ScanScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [isScanning, setIsScanning] = useState(false);

  const handleScanReceipt = () => {
    setIsScanning(true);

    // Simulate scanning process
    setTimeout(() => {
      setIsScanning(false);
      const mockScanResult = DataService.simulateSplitBillScan();

      Alert.alert(
        "Receipt Scanned!",
        `Found: ${mockScanResult.name}\nWith ${mockScanResult.items.length} items`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Continue Split",
            onPress: () => {
              // Navigate to split screen or show split details
              console.log("Continue with split:", mockScanResult);
            },
          },
        ]
      );
    }, 2000);
  };

  const handleManualEntry = () => {
    Alert.alert("Manual Entry", "Manual entry feature coming soon!", [
      { text: "OK" },
    ]);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Scan Receipt
          </ThemedText>
          <ThemedText type="default" style={styles.subtitle}>
            Scan receipts or enter manually
          </ThemedText>
        </ThemedView>

        {/* Scan Options */}
        <ThemedView style={styles.section}>
          <TouchableOpacity
            style={[
              styles.scanButton,
              { backgroundColor: colors.tint },
              isScanning && styles.scanButtonDisabled,
            ]}
            onPress={handleScanReceipt}
            disabled={isScanning}
          >
            <Ionicons
              name={isScanning ? "hourglass-outline" : "camera-outline"}
              size={24}
              color="#fff"
              style={styles.scanButtonIcon}
            />
            <Text style={styles.scanButtonText}>
              {isScanning ? "Scanning..." : "Scan Receipt"}
            </Text>
            <Text style={styles.scanButtonSubtext}>
              {isScanning
                ? "Processing receipt..."
                : "Take a photo of your receipt"}
            </Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View
              style={[styles.dividerLine, { backgroundColor: colors.text }]}
            />
            <Text style={[styles.dividerText, { color: colors.text }]}>OR</Text>
            <View
              style={[styles.dividerLine, { backgroundColor: colors.text }]}
            />
          </View>

          <TouchableOpacity
            style={[styles.manualButton, { borderColor: colors.tint }]}
            onPress={handleManualEntry}
          >
            <Ionicons
              name="pencil-outline"
              size={20}
              color={colors.tint}
              style={styles.manualButtonIcon}
            />
            <Text style={[styles.manualButtonText, { color: colors.tint }]}>
              Manual Entry
            </Text>
            <Text style={[styles.manualButtonSubtext, { color: colors.text }]}>
              Enter receipt details manually
            </Text>
          </TouchableOpacity>
        </ThemedView>

        {/* Tips */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Tips for Better Scanning
          </ThemedText>
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <Ionicons
                name="bulb-outline"
                size={16}
                color={colors.tint}
                style={styles.tipIcon}
              />
              <Text style={[styles.tipText, { color: colors.text }]}>
                Ensure good lighting when taking the photo
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons
                name="resize-outline"
                size={16}
                color={colors.tint}
                style={styles.tipIcon}
              />
              <Text style={[styles.tipText, { color: colors.text }]}>
                Keep the receipt flat and fully visible
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons
                name="search-outline"
                size={16}
                color={colors.tint}
                style={styles.tipIcon}
              />
              <Text style={[styles.tipText, { color: colors.text }]}>
                Make sure text is clear and readable
              </Text>
            </View>
          </View>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 30,
  },
  scanButton: {
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
  },
  scanButtonDisabled: {
    opacity: 0.6,
  },
  scanButtonIcon: {
    marginBottom: 12,
  },
  scanButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  scanButtonSubtext: {
    color: "#fff",
    fontSize: 14,
    opacity: 0.8,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    opacity: 0.3,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    fontWeight: "500",
    opacity: 0.6,
  },
  manualButton: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  manualButtonIcon: {
    marginBottom: 12,
  },
  manualButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  manualButtonSubtext: {
    fontSize: 14,
    opacity: 0.7,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  tipIcon: {
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
