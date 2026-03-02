import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BagirataColors, Colors } from "../../../constants/Colors";
import { useColorScheme } from "../../../hooks/useColorScheme";
import { BagirataApiService } from "../../../services/BagirataApiService";
import { DatabaseService } from "../../../services/DatabaseService";
import { GroupSummary } from "../../../types";

export default function GroupDetailScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();
  const { groupId, groupName } = useLocalSearchParams<{
    groupId: string;
    groupName: string;
  }>();

  const [summary, setSummary] = useState<GroupSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadGroupSummary = useCallback(async () => {
    if (!groupId) return;
    try {
      const response = await BagirataApiService.getGroupSummary(groupId);
      if (response.success && response.data) {
        setSummary(response.data);
      }
    } catch (error) {
      console.error("Error loading group summary:", error);
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadGroupSummary();
  }, [loadGroupSummary]);

  const handleShareGroup = async () => {
    if (!summary) return;
    try {
      await Share.share({
        message: `Check out our group "${summary.name}" on Bagirata!`,
        title: summary.name,
      });
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            paddingTop: insets.top,
          },
        ]}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.pageTitle, { color: colors.text }]}>
            {groupName || "Group"}
          </Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BagirataColors.primary} />
        </View>
      </View>
    );
  }

  if (!summary) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            paddingTop: insets.top,
          },
        ]}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Group</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Group not found
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top,
        },
      ]}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.pageTitle, { color: colors.text }]}>
          {summary.name}
        </Text>
        <Pressable onPress={handleShareGroup} style={styles.shareButton}>
          <Ionicons
            name="share-outline"
            size={22}
            color={BagirataColors.primary}
          />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Group Info Card */}
        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: colorScheme === "dark" ? "#1E1E1E" : "#fff",
              borderColor: colorScheme === "dark" ? "#333" : "#E5E5E5",
            },
          ]}
        >
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: BagirataColors.secondaryText }]}>
              Total Splits
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {summary.splits?.length ?? 0}
            </Text>
          </View>
          {summary.bankName && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: BagirataColors.secondaryText }]}>
                Bank
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {summary.bankName}
              </Text>
            </View>
          )}
          {summary.bankAccount && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: BagirataColors.secondaryText }]}>
                Account
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {summary.bankAccount} ({summary.bankNumber})
              </Text>
            </View>
          )}
        </View>

        {/* Participants */}
        {summary.participants && summary.participants.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Participants
            </Text>
            {summary.participants.map((participant, index) => (
              <View
                key={index}
                style={[
                  styles.participantCard,
                  {
                    backgroundColor:
                      colorScheme === "dark" ? "#1E1E1E" : "#f8f9fa",
                  },
                ]}
              >
                <View
                  style={[
                    styles.participantAvatar,
                    { backgroundColor: BagirataColors.primary },
                  ]}
                >
                  <Text style={styles.participantAvatarText}>
                    {participant.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.participantInfo}>
                  <Text
                    style={[styles.participantName, { color: colors.text }]}
                  >
                    {participant.name}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.participantTotal,
                    { color: BagirataColors.primary },
                  ]}
                >
                  {DatabaseService.formatCurrency(participant.total, (summary.currencyCode as any) || "IDR")}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Splits */}
        {summary.splits && summary.splits.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Bagiratas
            </Text>
            {summary.splits.map((split, index) => (
              <View
                key={index}
                style={[
                  styles.splitCard,
                  {
                    backgroundColor:
                      colorScheme === "dark" ? "#1E1E1E" : "#fff",
                    borderColor:
                      colorScheme === "dark" ? "#333" : "#E5E5E5",
                  },
                ]}
              >
                <View style={styles.splitInfo}>
                  <Text
                    style={[styles.splitName, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {split.name}
                  </Text>
                  <Text
                    style={[
                      styles.splitDate,
                      { color: BagirataColors.secondaryText },
                    ]}
                  >
                    {new Date(split.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.splitTotal,
                    { color: BagirataColors.primary },
                  ]}
                >
                  {DatabaseService.formatCurrency(split.grandTotal, (summary.currencyCode as any) || "IDR")}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
    width: 40,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  shareButton: {
    padding: 4,
    width: 40,
    alignItems: "flex-end",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 12,
  },
  participantCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  participantAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  participantAvatarText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 15,
    fontWeight: "500",
  },
  participantTotal: {
    fontSize: 14,
    fontWeight: "700",
  },
  splitCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
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
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
});
