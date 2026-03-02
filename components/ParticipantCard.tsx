import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from "react-native";
import BagirataAvatar from "./BagirataAvatar";
import { BagirataColors, Colors } from "../constants/Colors";
import { useColorScheme } from "../hooks/useColorScheme";
import { DatabaseService } from "../services/DatabaseService";
import { CurrencyCode, FriendOther, SplittedFriend } from "../types";

// Enable LayoutAnimation on Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ParticipantCardProps {
  participant: SplittedFriend;
  isYou?: boolean;
  currencyCode?: CurrencyCode;
}

export default function ParticipantCard({
  participant,
  isYou = false,
  currencyCode,
}: ParticipantCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const itemCount = participant.items?.length ?? 0;

  return (
    <Pressable
      style={[
        styles.card,
        {
          backgroundColor: colorScheme === "dark" ? "#1E1E1E" : "#fff",
          borderColor: colorScheme === "dark" ? "#333" : "#E5E5E5",
        },
      ]}
      onPress={toggleExpand}
    >
      {/* Collapsed Header */}
      <View style={styles.header}>
        <BagirataAvatar
          name={participant.name}
          size={36}
          accentColor={participant.accentColor}
        />
        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Text
              style={[styles.name, { color: colors.text }]}
              numberOfLines={1}
            >
              {participant.name}
            </Text>
            {isYou && (
              <View style={styles.youBadge}>
                <Text style={styles.youBadgeText}>You</Text>
              </View>
            )}
          </View>
          <Text
            style={[styles.meta, { color: BagirataColors.secondaryText }]}
          >
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={[styles.total, { color: BagirataColors.primary }]}>
            {DatabaseService.formatCurrency(participant.total || 0, currencyCode)}
          </Text>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={16}
            color={BagirataColors.secondaryText}
          />
        </View>
      </View>

      {/* Expanded Items */}
      {expanded && participant.items && (
        <View style={styles.itemsContainer}>
          {participant.items.map((item, index) => (
            <View
              key={index}
              style={[
                styles.itemRow,
                {
                  borderTopColor:
                    colorScheme === "dark" ? "#333" : "#f0f0f0",
                },
              ]}
            >
              <View style={styles.itemInfo}>
                <Text
                  style={[styles.itemName, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                <Text
                  style={[
                    styles.itemQty,
                    { color: BagirataColors.secondaryText },
                  ]}
                >
                  x{item.qty}
                </Text>
              </View>
              <Text
                style={[
                  styles.itemPrice,
                  { color: colors.text },
                ]}
              >
                {DatabaseService.formatCurrency(item.subTotal || 0, currencyCode)}
              </Text>
            </View>
          ))}

          {/* Other charges */}
          {participant.others &&
            participant.others.length > 0 && (
              <View style={styles.otherSection}>
                <Text
                  style={[
                    styles.otherTitle,
                    { color: BagirataColors.secondaryText },
                  ]}
                >
                  Other Charges
                </Text>
                {participant.others.map((other: FriendOther, index: number) => (
                  <View key={index} style={styles.itemRow}>
                    <Text
                      style={[styles.itemName, { color: colors.text }]}
                    >
                      {other.name}
                    </Text>
                    <Text
                      style={[
                        styles.itemPrice,
                        {
                          color:
                            other.type === "discount" || other.type === "deduction"
                              ? BagirataColors.dangerRed
                              : colors.text,
                        },
                      ]}
                    >
                      {other.type === "discount" || other.type === "deduction"
                        ? "-"
                        : ""}
                      {DatabaseService.formatCurrency(
                        Math.abs(other.amount || 0),
                        currencyCode
                      )}
                    </Text>
                  </View>
                ))}
              </View>
            )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
  },
  youBadge: {
    backgroundColor: BagirataColors.primary + "20",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  youBadgeText: {
    color: BagirataColors.primary,
    fontSize: 10,
    fontWeight: "600",
  },
  meta: {
    fontSize: 12,
    marginTop: 2,
  },
  headerRight: {
    alignItems: "flex-end",
    gap: 2,
  },
  total: {
    fontSize: 14,
    fontWeight: "700",
  },
  itemsContainer: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  itemInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 6,
  },
  itemName: {
    fontSize: 14,
    flex: 1,
  },
  itemQty: {
    fontSize: 12,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  otherSection: {
    marginTop: 8,
  },
  otherTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
});
