import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BagirataColors, Colors } from "../constants/Colors";
import { useColorScheme } from "../hooks/useColorScheme";
import { BagirataApiService } from "../services/BagirataApiService";
import { DatabaseService } from "../services/DatabaseService";
import { Splitted, SplittedFriend } from "../types";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";
import BagirataAvatar from "./BagirataAvatar";
import CopyButton from "./CopyButton";
import ParticipantCard from "./ParticipantCard";
import BannerAdComponent from "./BannerAd";

interface HistoryDetailPageProps {
  split: Splitted;
  visible: boolean;
  onClose: () => void;
  onSplitDeleted?: () => void;
}

export default function HistoryDetailPage({
  split,
  visible,
  onClose,
  onSplitDeleted,
}: HistoryDetailPageProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [isLoading, setIsLoading] = useState(false);

  const formatCurrency = (amount: number) => {
    return DatabaseService.formatCurrency(amount, split.currencyCode);
  };

  const getTotalAmount = (split: Splitted): number => {
    return split.friends.reduce((sum, friend) => sum + (friend.total || 0), 0);
  };

  const handleDeleteSplit = () => {
    Alert.alert(
      "Delete Split",
      `Are you sure you want to delete "${split.name}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsLoading(true);
            try {
              const deleted = await DatabaseService.deleteSplit(split.id);
              if (deleted) {
                if (split.slug) {
                  try {
                    await BagirataApiService.deleteSplit(split.slug);
                  } catch {
                    // Backend deletion is best-effort
                  }
                }
                onSplitDeleted?.();
                onClose();
              } else {
                throw new Error("Failed to delete");
              }
            } catch (error) {
              console.error("Delete split error:", error);
              Alert.alert("Error", "Failed to delete split.");
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleReshareLink = async () => {
    if (!split.slug && !split.shareUrl) {
      Alert.alert("Error", "This split doesn't have a share link.");
      return;
    }

    setIsLoading(true);
    try {
      const shareUrl = split.shareUrl;
      if (shareUrl) {
        await Share.share({
          message: `Check out this split bill: ${split.name}\n\nView and pay your share: ${shareUrl}`,
          url: shareUrl,
          title: `Split Bill: ${split.name}`,
        });
      } else {
        throw new Error("No share URL");
      }
    } catch (error) {
      console.error("Reshare error:", error);
      Alert.alert("Error", "Failed to share. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.background,
              borderBottomColor: colorScheme === "dark" ? "#3A3A3C" : "#e0e0e0",
            },
          ]}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons
                name="close"
                size={24}
                color={colorScheme === "dark" ? "#fff" : "#333"}
              />
            </TouchableOpacity>
            <View style={styles.headerTitle}>
              <ThemedText type="title" style={styles.title}>
                {split.name}
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                {DatabaseService.formatDate(split.createdAt)}
              </ThemedText>
            </View>
            <View style={styles.headerRight} />
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Summary Card */}
          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor: colorScheme === "dark" ? "#262626" : "#f8f9fa",
                borderColor: colorScheme === "dark" ? "#3A3A3C" : "#e0e0e0",
              },
            ]}
          >
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <ThemedText style={styles.summaryLabel}>
                  Total Amount
                </ThemedText>
                <ThemedText
                  type="title"
                  style={[styles.summaryValue, { color: BagirataColors.primary }]}
                >
                  {formatCurrency(getTotalAmount(split))}
                </ThemedText>
              </View>
              <View style={styles.summaryItem}>
                <ThemedText style={styles.summaryLabel}>People</ThemedText>
                <ThemedText type="title" style={styles.summaryValue}>
                  {split.friends.length}
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Bank Info Card */}
          {(split.bankName || split.bankAccount) && (
            <View
              style={[
                styles.bankCard,
                {
                  backgroundColor: colorScheme === "dark" ? "#262626" : "#f8f9fa",
                  borderColor: colorScheme === "dark" ? "#3A3A3C" : "#e0e0e0",
                },
              ]}
            >
              <View style={styles.bankHeader}>
                <Ionicons
                  name="card-outline"
                  size={18}
                  color={BagirataColors.primary}
                />
                <Text style={[styles.bankTitle, { color: colors.text }]}>
                  Bank Transfer Info
                </Text>
              </View>
              {split.bankName && (
                <View style={styles.bankRow}>
                  <Text
                    style={[
                      styles.bankLabel,
                      { color: BagirataColors.secondaryText },
                    ]}
                  >
                    Bank
                  </Text>
                  <View style={styles.bankValueRow}>
                    <Text style={[styles.bankValue, { color: colors.text }]}>
                      {split.bankName}
                    </Text>
                  </View>
                </View>
              )}
              {split.bankAccount && (
                <View style={styles.bankRow}>
                  <Text
                    style={[
                      styles.bankLabel,
                      { color: BagirataColors.secondaryText },
                    ]}
                  >
                    Account
                  </Text>
                  <View style={styles.bankValueRow}>
                    <Text style={[styles.bankValue, { color: colors.text }]}>
                      {split.bankAccount}
                    </Text>
                    <CopyButton text={split.bankAccount} />
                  </View>
                </View>
              )}
              {split.bankNumber && (
                <View style={styles.bankRow}>
                  <Text
                    style={[
                      styles.bankLabel,
                      { color: BagirataColors.secondaryText },
                    ]}
                  >
                    Number
                  </Text>
                  <View style={styles.bankValueRow}>
                    <Text style={[styles.bankValue, { color: colors.text }]}>
                      {split.bankNumber}
                    </Text>
                    <CopyButton text={split.bankNumber} />
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Participants */}
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionHeader}>
              Split Breakdown
            </ThemedText>
            {split.friends.map((friend) => (
              <ParticipantCard
                key={friend.id}
                participant={friend}
                isYou={friend.me}
                currencyCode={split.currencyCode}
              />
            ))}
          </ThemedView>
        </ScrollView>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: BagirataColors.primary }]}
            onPress={handleReshareLink}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <View style={styles.actionButtonContent}>
                <Ionicons
                  name="share-outline"
                  size={18}
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
                <ThemedText style={styles.actionButtonText}>
                  Reshare Link
                </ThemedText>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: BagirataColors.dangerRed }]}
            onPress={handleDeleteSplit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <View style={styles.actionButtonContent}>
                <Ionicons
                  name="trash-outline"
                  size={18}
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
                <ThemedText style={styles.actionButtonText}>
                  Delete Split
                </ThemedText>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <BannerAdComponent style={styles.bannerAd} />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    alignItems: "center",
  },
  headerRight: {
    width: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  summaryCard: {
    padding: 20,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "bold",
  },
  bankCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  bankHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  bankTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  bankRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  bankLabel: {
    fontSize: 13,
  },
  bankValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bankValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  bannerAd: {
    paddingVertical: 8,
    backgroundColor: "transparent",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    marginBottom: 20,
  },
  actionButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
