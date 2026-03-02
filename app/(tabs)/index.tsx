import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import HistoryDetailPage from "../../components/HistoryDetailPage";
import { BagirataColors, Colors } from "../../constants/Colors";
import { useAuth } from "../../contexts/AuthContext";
import { useUserProfile } from "../../contexts/UserProfileContext";
import { useColorScheme } from "../../hooks/useColorScheme";
import { BagirataApiService } from "../../services/BagirataApiService";
import { DatabaseService } from "../../services/DatabaseService";
import { eventService, REFRESH_HISTORY } from "../../services/EventService";
import { ScannerService } from "../../services/ScannerService";
import { BagirataSummary, Splitted } from "../../types";
import InlineAd from "../../components/InlineAd";

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();
  const { isAuthenticated, isLoading: isAuthLoading, currentUser } = useAuth();
  const { userProfile } = useUserProfile();

  const [recentSplits, setRecentSplits] = useState<Splitted[]>([]);
  const [apiSplits, setApiSplits] = useState<BagirataSummary[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedSplit, setSelectedSplit] = useState<Splitted | null>(null);
  const [showDetailPage, setShowDetailPage] = useState(false);

  const displayName =
    currentUser?.name || userProfile?.name || "there";

  const loadRecentSplits = useCallback(async () => {
    if (isAuthLoading) return;
    try {
      if (isAuthenticated) {
        const response = await BagirataApiService.getHistory(1, 4);
        if (response.success && response.data) {
          setApiSplits(response.data);
        }
      } else {
        await DatabaseService.initializeDatabase();
        const bills = await DatabaseService.getAllSplittedBills();
        setRecentSplits(bills.slice(0, 4));
      }
    } catch (error) {
      console.error("Error loading recent splits:", error);
    }
  }, [isAuthenticated, isAuthLoading]);

  useEffect(() => {
    loadRecentSplits();
  }, [loadRecentSplits]);

  // Listen for refresh events
  useEffect(() => {
    const unsubscribe = eventService.on(REFRESH_HISTORY, loadRecentSplits);
    return unsubscribe;
  }, [loadRecentSplits]);

  const handleScanReceipt = async () => {
    setIsScanning(true);
    try {
      const isAvailable = await ScannerService.isAvailable();
      if (!isAvailable) {
        Alert.alert(
          "Scanner Unavailable",
          "Document scanner is not available on this device."
        );
        return;
      }

      const scanResult = await ScannerService.scanDocumentWithOCR();
      if (scanResult.success && scanResult.text) {
        router.push({
          pathname: "/result-flow",
          params: { scannedText: scanResult.text },
        });
      } else if (scanResult.message) {
        Alert.alert("Scan Failed", scanResult.message);
      }
    } catch (error: any) {
      console.error("Scan error:", error);
      if (
        error.message?.includes("camera") ||
        error.message?.includes("Camera") ||
        error.message?.includes("permission")
      ) {
        Alert.alert(
          "Camera Permission Required",
          Platform.OS === "ios"
            ? "Please enable camera access in Settings > Privacy & Security > Camera"
            : "Please enable camera access in Settings > Apps > Bagirata > Permissions",
          [
            { text: "Cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ]
        );
      } else {
        Alert.alert("Scan Error", "An error occurred while scanning.");
      }
    } finally {
      setIsScanning(false);
    }
  };

  const handleManualEntry = () => {
    router.push({
      pathname: "/result-flow",
      params: { isManualEntry: "true" },
    });
  };

  const handleSplitPress = (split: Splitted) => {
    setSelectedSplit(split);
    setShowDetailPage(true);
  };

  const getTotalAmount = (split: Splitted): number => {
    return split.friends.reduce((sum, friend) => sum + (friend.total || 0), 0);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { color: colors.text }]}>
              Hello, {displayName}
            </Text>
            <Text style={[styles.subtitle, { color: BagirataColors.secondaryText }]}>
              Split bills easily
            </Text>
          </View>
          <Pressable
            style={[styles.profileButton, { backgroundColor: BagirataColors.primary }]}
            onPress={() => {
              if (isAuthenticated) {
                router.push("/(tabs)/profile");
              } else {
                router.push("/login");
              }
            }}
          >
            {currentUser?.name || userProfile?.name ? (
              <Text style={styles.profileButtonText}>
                {(currentUser?.name || userProfile?.name || "U")
                  .charAt(0)
                  .toUpperCase()}
              </Text>
            ) : (
              <Ionicons name="person-outline" size={20} color="#fff" />
            )}
          </Pressable>
        </View>

        {/* Create Bagirata Card */}
        <View
          style={[
            styles.createCard,
            {
              backgroundColor: colorScheme === "dark" ? "#1E1E1E" : "#fff",
              borderColor: colorScheme === "dark" ? "#333" : "#E5E5E5",
            },
          ]}
        >
          <Text style={[styles.createCardTitle, { color: colors.text }]}>
            Create Bagirata
          </Text>
          <Text
            style={[styles.createCardSubtitle, { color: BagirataColors.secondaryText }]}
          >
            Scan a receipt or enter items manually
          </Text>

          <View style={styles.createButtons}>
            <Pressable
              style={[styles.scanButton, isScanning && styles.buttonDisabled]}
              onPress={handleScanReceipt}
              disabled={isScanning}
            >
              <Ionicons name="camera" size={20} color="#fff" />
              <Text style={styles.scanButtonText}>
                {isScanning ? "Scanning..." : "Scan"}
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.manualButton,
                { borderColor: BagirataColors.primary },
              ]}
              onPress={handleManualEntry}
            >
              <Ionicons name="pencil" size={20} color={BagirataColors.primary} />
              <Text style={[styles.manualButtonText, { color: BagirataColors.primary }]}>
                Manual
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Recent Bagirata */}
        {(isAuthenticated ? apiSplits.length > 0 : recentSplits.length > 0) && (
          <View style={styles.recentSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Recent Bagirata
              </Text>
              <Pressable onPress={() => router.push("/(tabs)/bagirata")}>
                <Text style={[styles.viewAllText, { color: BagirataColors.primary }]}>
                  View All
                </Text>
              </Pressable>
            </View>

            {isAuthenticated
              ? apiSplits.map((split) => (
                  <Pressable
                    key={split.id}
                    style={[
                      styles.splitCard,
                      {
                        backgroundColor:
                          colorScheme === "dark" ? "#1E1E1E" : "#fff",
                        borderColor:
                          colorScheme === "dark" ? "#333" : "#E5E5E5",
                      },
                    ]}
                    onPress={() => {
                      // Navigate to bagirata tab for full detail
                      router.push("/(tabs)/bagirata");
                    }}
                  >
                    <View style={styles.splitCardLeft}>
                      <View
                        style={[
                          styles.splitIcon,
                          {
                            backgroundColor:
                              colorScheme === "dark" ? "#2A2A2A" : BagirataColors.dimmedLight,
                          },
                        ]}
                      >
                        <Ionicons
                          name="document-text-outline"
                          size={20}
                          color={BagirataColors.primary}
                        />
                      </View>
                      <View style={styles.splitInfo}>
                        <Text
                          style={[styles.splitName, { color: colors.text }]}
                          numberOfLines={1}
                        >
                          {split.name}
                        </Text>
                        <Text style={[styles.splitDate, { color: BagirataColors.secondaryText }]}>
                          {new Date(split.createdAt).toLocaleDateString()} &middot;{" "}
                          {split.friendCount} friends
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.splitTotal, { color: BagirataColors.primary }]}>
                      {DatabaseService.formatCurrency(
                        split.grandTotal,
                        (split.currencyCode as any) || "IDR"
                      )}
                    </Text>
                  </Pressable>
                ))
              : recentSplits.map((split) => (
                  <Pressable
                    key={split.id}
                    style={[
                      styles.splitCard,
                      {
                        backgroundColor:
                          colorScheme === "dark" ? "#1E1E1E" : "#fff",
                        borderColor:
                          colorScheme === "dark" ? "#333" : "#E5E5E5",
                      },
                    ]}
                    onPress={() => handleSplitPress(split)}
                  >
                    <View style={styles.splitCardLeft}>
                      <View
                        style={[
                          styles.splitIcon,
                          {
                            backgroundColor:
                              colorScheme === "dark" ? "#2A2A2A" : BagirataColors.dimmedLight,
                          },
                        ]}
                      >
                        <Ionicons
                          name="document-text-outline"
                          size={20}
                          color={BagirataColors.primary}
                        />
                      </View>
                      <View style={styles.splitInfo}>
                        <Text
                          style={[styles.splitName, { color: colors.text }]}
                          numberOfLines={1}
                        >
                          {split.name}
                        </Text>
                        <Text style={[styles.splitDate, { color: BagirataColors.secondaryText }]}>
                          {DatabaseService.formatDate(split.createdAt)} &middot;{" "}
                          {split.friends.length} friends
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.splitTotal, { color: BagirataColors.primary }]}>
                      {DatabaseService.formatCurrency(
                        getTotalAmount(split),
                        split.currencyCode
                      )}
                    </Text>
                  </Pressable>
                ))}
          </View>
        )}

        {/* Ad */}
        <InlineAd />

        {(isAuthenticated ? apiSplits.length === 0 : recentSplits.length === 0) && (
          <View style={styles.emptyState}>
            <Ionicons
              name="receipt-outline"
              size={48}
              color={BagirataColors.dimmed}
            />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No split bills yet
            </Text>
            <Text
              style={[styles.emptySubtitle, { color: BagirataColors.secondaryText }]}
            >
              Create your first bagirata by scanning a receipt or entering items
              manually
            </Text>
          </View>
        )}
      </ScrollView>

      {/* History Detail Modal */}
      {selectedSplit && (
        <HistoryDetailPage
          split={selectedSplit}
          visible={showDetailPage}
          onClose={() => {
            setShowDetailPage(false);
            setSelectedSplit(null);
          }}
          onSplitDeleted={loadRecentSplits}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 26,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  profileButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  createCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
  },
  createCardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  createCardSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  createButtons: {
    flexDirection: "row",
    gap: 12,
  },
  scanButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BagirataColors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    gap: 8,
  },
  scanButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  manualButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    paddingVertical: 14,
    borderWidth: 2,
    gap: 8,
  },
  manualButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  recentSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "600",
  },
  splitCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  splitCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  splitIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  splitInfo: {
    flex: 1,
  },
  splitName: {
    fontSize: 15,
    fontWeight: "600",
  },
  splitDate: {
    fontSize: 12,
    marginTop: 2,
  },
  splitTotal: {
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 8,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 24,
  },
});
