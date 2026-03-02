import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BagirataColors } from "../constants/Colors";
import { useColorScheme } from "../hooks/useColorScheme";
import { Colors } from "../constants/Colors";
import { CurrencyCode } from "../types";
import { DatabaseService } from "../services/DatabaseService";

interface BagirataCardProps {
  name: string;
  date: string;
  total: number;
  friendCount: number;
  currencyCode?: CurrencyCode;
  onPress: () => void;
}

export default function BagirataCard({
  name,
  date,
  total,
  friendCount,
  currencyCode,
  onPress,
}: BagirataCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <Pressable
      style={[
        styles.card,
        {
          backgroundColor: colorScheme === "dark" ? "#1E1E1E" : "#fff",
          borderColor: colorScheme === "dark" ? "#333" : "#E5E5E5",
        },
      ]}
      onPress={onPress}
    >
      <View style={styles.left}>
        <View
          style={[
            styles.iconContainer,
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
        <View style={styles.info}>
          <Text
            style={[styles.name, { color: colors.text }]}
            numberOfLines={1}
          >
            {name}
          </Text>
          <Text style={[styles.meta, { color: BagirataColors.secondaryText }]}>
            {date} &middot; {friendCount} friends
          </Text>
        </View>
      </View>
      <Text style={[styles.total, { color: BagirataColors.primary }]}>
        {DatabaseService.formatCurrency(total, currencyCode)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
  },
  meta: {
    fontSize: 12,
    marginTop: 2,
  },
  total: {
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 8,
  },
});
