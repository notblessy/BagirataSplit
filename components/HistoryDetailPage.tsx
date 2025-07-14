import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../constants/Colors";
import { useColorScheme } from "../hooks/useColorScheme";
import { DataService } from "../services/DataService";
import { DatabaseService } from "../services/DatabaseService";
import { Splitted, SplittedFriend } from "../types";
import BannerAdComponent from "./BannerAd";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

interface HistoryDetailPageProps {
  split: Splitted;
  visible: boolean;
  onClose: () => void;
}

export default function HistoryDetailPage({
  split,
  visible,
  onClose,
}: HistoryDetailPageProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const formatCurrency = (amount: number) => {
    return DataService.formatCurrency(amount);
  };

  const getTotalAmount = (split: Splitted): number => {
    return split.friends.reduce((sum, friend) => sum + (friend.total || 0), 0);
  };

  const renderFriendCard = (friend: SplittedFriend) => {
    return (
      <View
        key={friend.id}
        style={[
          styles.friendCard,
          {
            backgroundColor: colorScheme === "dark" ? "#262626" : "#f8f9fa",
            borderColor: colorScheme === "dark" ? "#3A3A3C" : "#e0e0e0",
          },
        ]}
      >
        {/* Friend Header */}
        <View style={styles.friendHeader}>
          <View style={styles.friendHeaderLeft}>
            <View
              style={[
                styles.friendAvatar,
                { backgroundColor: friend.accentColor },
              ]}
            >
              <Text style={styles.friendAvatarText}>
                {friend.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.friendInfo}>
              <ThemedText type="defaultSemiBold" style={styles.friendName}>
                {friend.name} {friend.me && "(You)"}
              </ThemedText>
              <ThemedText style={styles.friendSubtotal}>
                Subtotal: {formatCurrency(friend.subTotal)}
              </ThemedText>
            </View>
          </View>
          <View style={styles.friendTotal}>
            <ThemedText style={styles.totalLabel}>Total</ThemedText>
            <ThemedText
              type="defaultSemiBold"
              style={[styles.totalAmount, { color: colors.tint }]}
            >
              {formatCurrency(friend.total)}
            </ThemedText>
          </View>
        </View>

        {/* Calculation Breakdown */}
        <View style={styles.breakdownSection}>
          {/* Show items for this friend */}
          <ThemedText
            style={[styles.friendBreakdownTitle, { color: colors.text }]}
          >
            Items:
          </ThemedText>
          {friend.items && friend.items.length > 0 ? (
            friend.items.map((item) => (
              <ThemedText
                key={item.id}
                style={[styles.friendItemDetail, { color: colors.text }]}
              >
                • {item.name} ({item.qty}x) - {formatCurrency(item.subTotal)}
              </ThemedText>
            ))
          ) : (
            <ThemedText
              style={[styles.friendItemDetail, { color: colors.text }]}
            >
              • No items assigned
            </ThemedText>
          )}

          {/* Show other payments breakdown */}
          {friend.others && friend.others.length > 0 && (
            <>
              <ThemedText
                style={[
                  styles.friendBreakdownTitle,
                  { color: colors.text, marginTop: 8 },
                ]}
              >
                Other Payments:
              </ThemedText>
              {friend.others.map((other) => (
                <ThemedText
                  key={other.id}
                  style={[styles.friendItemDetail, { color: colors.text }]}
                >
                  • {other.name} (
                  {other.usePercentage
                    ? `${((other.amount / friend.subTotal) * 100).toFixed(1)}%`
                    : formatCurrency(other.price || other.amount)}
                  ) - +{formatCurrency(other.amount)}
                </ThemedText>
              ))}
            </>
          )}

          {/* Subtotal line if there are other payments */}
          {friend.others && friend.others.length > 0 && (
            <View
              style={[
                styles.friendSubtotalLine,
                {
                  borderTopColor:
                    colorScheme === "dark" ? "#3A3A3C" : "#e0e0e0",
                },
              ]}
            >
              <ThemedText style={styles.friendSubtotalText}>
                Items Subtotal: {formatCurrency(friend.subTotal)}
              </ThemedText>
              <ThemedText
                style={[
                  styles.friendSubtotalText,
                  { color: colors.tint, fontWeight: "600" },
                ]}
              >
                Final Total: {formatCurrency(friend.total)}
              </ThemedText>
            </View>
          )}
        </View>
      </View>
    );
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
                  style={[styles.summaryValue, { color: colors.tint }]}
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

          {/* Friends List */}
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionHeader}>
              Split Breakdown
            </ThemedText>
            {split.friends.map((friend) => renderFriendCard(friend))}
          </ThemedView>
        </ScrollView>

        {/* Banner Ad at bottom */}
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
    marginBottom: 24,
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
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  friendCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  friendHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  friendHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  friendAvatarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    marginBottom: 2,
  },
  friendSubtotal: {
    fontSize: 12,
    opacity: 0.7,
  },
  friendTotal: {
    alignItems: "flex-end",
  },
  totalLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 2,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "bold",
  },
  breakdownSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  // Friend breakdown styles for share step
  friendBreakdownTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 4,
    paddingLeft: 0,
  },
  friendItemDetail: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 4,
    paddingLeft: 0,
  },
  friendSubtotalLine: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    paddingLeft: 0,
  },
  friendSubtotalText: {
    fontSize: 14,
    marginBottom: 2,
  },
  bannerAd: {
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
});
