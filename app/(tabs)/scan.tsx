import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Animated,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { UnifiedSplitScreen } from "../../components/UnifiedSplitScreen";
import { Colors } from "../../constants/Colors";
import { useColorScheme } from "../../hooks/useColorScheme";
import { ScannerService } from "../../services/ScannerService";

const TIPS = [
  {
    icon: "sunny",
    color: "#E67E22",
    backgroundColor: "rgba(255, 193, 132, 0.12)",
    text: "Ensure good lighting when taking the photo",
  },
  {
    icon: "expand",
    color: "#E74C3C",
    backgroundColor: "rgba(255, 151, 151, 0.12)",
    text: "Keep the receipt flat and fully visible",
  },
  {
    icon: "eye",
    color: "#27AE60",
    backgroundColor: "rgba(174, 230, 174, 0.12)",
    text: "Make sure text is clear and readable",
  },
];

export default function ScanScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress] = useState(new Animated.Value(0));

  // Navigation state
  const [currentScreen, setCurrentScreen] = useState<
    "main" | "split" | "manual"
  >("main");
  const [scannedText, setScannedText] = useState<string | null>(null);

  // Tips slideshow state
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(1));
  const [isAnimating, setIsAnimating] = useState(false);

  const advanceTip = useCallback(() => {
    if (isAnimating) return;

    setIsAnimating(true);
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setCurrentTipIndex((prevIndex) => (prevIndex + 1) % TIPS.length);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setIsAnimating(false);
      });
    });
  }, [isAnimating, fadeAnim]);

  // Auto-rotate tips every 3 seconds
  useEffect(() => {
    if (currentScreen !== "main") return; // Only run slideshow on main screen

    const interval = setInterval(() => {
      advanceTip();
    }, 3000);

    return () => clearInterval(interval);
  }, [advanceTip, currentScreen]);

  const handleTipPress = () => {
    // Manually advance to next tip only if on main screen
    if (currentScreen === "main") {
      advanceTip();
    }
  };

  // Cleanup animations when screen changes
  useEffect(() => {
    if (currentScreen !== "main") {
      setIsAnimating(false);
    }
  }, [currentScreen]);

  const handleScanReceipt = async () => {
    setIsScanning(true);

    // Animate scanning progress
    Animated.timing(scanProgress, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: false,
    }).start();

    try {
      console.log("Starting scan process...");

      // Check if scanner is available before proceeding
      const isAvailable = await ScannerService.isAvailable();
      if (!isAvailable) {
        Alert.alert(
          "Scanner Unavailable",
          "Document scanner is not available on this device.",
          [{ text: "OK" }]
        );
        return;
      }

      // Use actual document scanner
      const scanResult = await ScannerService.scanDocumentWithOCR();

      console.log("Scan result:", scanResult);

      if (scanResult.success && scanResult.text) {
        // Store the extracted text for recognition processing
        setScannedText(scanResult.text);
        setCurrentScreen("split");
      } else {
        Alert.alert(
          "Scan Failed",
          scanResult.message || "Failed to scan receipt. Please try again.",
          [{ text: "OK" }]
        );
      }
    } catch (error: any) {
      console.error("Scan error:", error);

      // Handle specific iOS camera errors
      if (Platform.OS === "ios") {
        if (
          error.message?.includes("camera") ||
          error.message?.includes("Camera")
        ) {
          Alert.alert(
            "Camera Permission Required",
            "Please enable camera access for Bagirata in Settings > Privacy & Security > Camera",
            [
              { text: "Cancel" },
              {
                text: "Open Settings",
                onPress: () => {
                  // You can use Linking to open settings
                  // Linking.openSettings();
                },
              },
            ]
          );
          return;
        }
      }

      Alert.alert(
        "Scan Error",
        "An error occurred while scanning. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsScanning(false);
      scanProgress.setValue(0);
    }
  };

  const handleManualEntry = () => {
    setCurrentScreen("manual");
  };

  const handleBackToMain = () => {
    setCurrentScreen("main");
    setScannedText(null);
  };

  const handleShareSplit = async (splitData: any) => {
    try {
      // The UnifiedSplitScreen now handles the backend saving and sharing
      // splitData will include the shareUrl from the backend response

      if (splitData.shareUrl) {
        // Use React Native's Share API to share the split
        await Share.share({
          message: `Check out this split bill: ${splitData.name}\n\nView and pay your share: ${splitData.shareUrl}`,
          url: splitData.shareUrl,
          title: `Split Bill: ${splitData.name}`,
        });
      }

      // Navigate back to main screen after successful share
      handleBackToMain();
    } catch (error: any) {
      console.error("Share error:", error);
      Alert.alert("Share Error", "Failed to share split. Please try again.", [
        { text: "OK" },
      ]);
    }
  };

  // Show unified split screen for scan or manual flow
  if (currentScreen === "split") {
    return (
      <UnifiedSplitScreen
        scannedText={scannedText || undefined}
        isManualEntry={false}
        onBack={handleBackToMain}
        onShare={handleShareSplit}
      />
    );
  }

  if (currentScreen === "manual") {
    return (
      <UnifiedSplitScreen
        isManualEntry={true}
        onBack={handleBackToMain}
        onShare={handleShareSplit}
      />
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="scan" size={32} color={colors.tint} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>
            Scan Receipt
          </Text>
          <Text style={[styles.subtitle, { color: colors.text }]}>
            Digitize your receipts and split bills instantly
          </Text>
        </View>

        {/* Tips Slideshow */}
        <View style={styles.tipsSection}>
          <TouchableOpacity onPress={handleTipPress} activeOpacity={0.8}>
            <Animated.View
              style={[
                styles.tipSlideshow,
                {
                  backgroundColor: TIPS[currentTipIndex].backgroundColor,
                  borderLeftColor: TIPS[currentTipIndex].color,
                  opacity: fadeAnim,
                },
              ]}
            >
              <Ionicons
                name={TIPS[currentTipIndex].icon as any}
                size={16}
                color={TIPS[currentTipIndex].color}
                style={styles.tipIcon}
              />
              <Text style={[styles.tipText, { color: colors.text }]}>
                {TIPS[currentTipIndex].text}
              </Text>
            </Animated.View>
          </TouchableOpacity>

          {/* Tip indicators */}
          <View style={styles.tipIndicators}>
            {TIPS.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.tipIndicator,
                  {
                    backgroundColor:
                      index === currentTipIndex
                        ? TIPS[currentTipIndex].color
                        : colors.text + "20",
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.section}>
          <View
            style={[
              styles.buttonsContainer,
              {
                backgroundColor:
                  colorScheme === "dark"
                    ? "rgba(255, 255, 255, 0.02)"
                    : "rgba(0, 0, 0, 0.02)",
                borderColor:
                  colorScheme === "dark"
                    ? "rgba(255, 255, 255, 0.05)"
                    : "rgba(0, 0, 0, 0.05)",
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.scanButton,
                {
                  backgroundColor: colors.tint,
                },
                isScanning && styles.scanButtonDisabled,
              ]}
              onPress={handleScanReceipt}
              disabled={isScanning}
            >
              {isScanning ? (
                <View style={styles.buttonContent}>
                  <Animated.View
                    style={[
                      styles.loadingDot,
                      {
                        transform: [
                          {
                            scale: scanProgress.interpolate({
                              inputRange: [0, 0.5, 1],
                              outputRange: [1, 1.2, 1],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                  <Text style={[styles.buttonText, { color: "#fff" }]}>
                    Scanning...
                  </Text>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Ionicons name="camera" size={20} color="#fff" />
                  <Text style={[styles.buttonText, { color: "#fff" }]}>
                    Scan Receipt
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View
                style={[styles.dividerLine, { backgroundColor: colors.text }]}
              />
              <Text style={[styles.dividerText, { color: colors.text }]}>
                OR
              </Text>
              <View
                style={[styles.dividerLine, { backgroundColor: colors.text }]}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.manualButton,
                {
                  borderColor: colors.tint,
                  backgroundColor: colors.background,
                },
              ]}
              onPress={handleManualEntry}
            >
              <View style={styles.buttonContent}>
                <Ionicons name="pencil" size={20} color={colors.tint} />
                <Text style={[styles.buttonText, { color: colors.tint }]}>
                  Manual Split
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
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
    paddingBottom: 20,
    alignItems: "center",
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(74, 147, 207, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 30,
    paddingBottom: 60,
  },
  // Tips slideshow styles
  tipsSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  tipSlideshow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
    borderLeftWidth: 6,
  },
  tipIndicators: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
  },
  tipIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  buttonsContainer: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cameraPreview: {
    height: 280,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: "dashed",
    marginBottom: 20,
    overflow: "hidden",
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  scanFrame: {
    width: "80%",
    height: "70%",
    borderRadius: 12,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  corner: {
    position: "absolute",
    width: 20,
    height: 20,
    borderWidth: 3,
  },
  topLeft: {
    top: -1,
    left: -1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: -1,
    right: -1,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: -1,
    left: -1,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: -1,
    right: -1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 8,
  },
  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    opacity: 0.8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  cameraContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  cameraText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "500",
  },
  scanButton: {
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    transform: [{ translateY: 0 }],
  },
  scanButtonDisabled: {
    opacity: 0.6,
    transform: [{ translateY: 1 }],
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
    letterSpacing: 0.5,
  },
  loadingDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    marginRight: 8,
  },
  manualButton: {
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    opacity: 0.15,
  },
  dividerText: {
    marginHorizontal: 20,
    fontSize: 11,
    fontWeight: "600",
    opacity: 0.5,
    textTransform: "uppercase",
    letterSpacing: 1.5,
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
