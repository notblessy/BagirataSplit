import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Receipt } from "@/types";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

interface ReceiptCardProps {
  receipt: Receipt;
  onPress?: () => void;
  showItems?: boolean;
}

export function ReceiptCard({
  receipt,
  onPress,
  showItems = true,
}: ReceiptCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const CardWrapper = onPress ? TouchableOpacity : View;

  return (
    <CardWrapper style={styles.container} onPress={onPress}>
      <ThemedView style={styles.card}>
        <View style={styles.header}>
          <ThemedText type="defaultSemiBold" style={styles.storeName}>
            {receipt.storeName}
          </ThemedText>
          <ThemedText style={[styles.amount, { color: colors.tint }]}>
            {formatCurrency(receipt.totalAmount)}
          </ThemedText>
        </View>

        <ThemedText style={styles.date}>
          {receipt.date.toLocaleDateString("id-ID", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </ThemedText>

        {showItems && (
          <View style={styles.itemsList}>
            {receipt.items.slice(0, 3).map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <ThemedText style={styles.itemName}>
                  {item.name} x{item.quantity}
                </ThemedText>
                <ThemedText style={styles.itemPrice}>
                  {formatCurrency(item.price * item.quantity)}
                </ThemedText>
              </View>
            ))}
            {receipt.items.length > 3 && (
              <ThemedText style={styles.moreItems}>
                +{receipt.items.length - 3} item lainnya
              </ThemedText>
            )}
          </View>
        )}

        {!showItems && (
          <ThemedText style={styles.itemCount}>
            {receipt.items.length} item
          </ThemedText>
        )}
      </ThemedView>
    </CardWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  storeName: {
    fontSize: 16,
    flex: 1,
  },
  amount: {
    fontSize: 16,
    fontWeight: "bold",
  },
  date: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 12,
  },
  itemsList: {
    gap: 6,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  itemName: {
    fontSize: 14,
    flex: 1,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "500",
  },
  moreItems: {
    fontSize: 12,
    opacity: 0.6,
    fontStyle: "italic",
    marginTop: 4,
  },
  itemCount: {
    fontSize: 12,
    opacity: 0.5,
  },
});
