import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { BagirataColors } from "../constants/Colors";

type AvatarStyle = "plain" | "active" | "inactive";

interface BagirataAvatarProps {
  name: string;
  size?: number;
  accentColor?: string;
  imageUri?: string;
  style?: AvatarStyle;
}

export default function BagirataAvatar({
  name,
  size = 40,
  accentColor,
  style = "plain",
}: BagirataAvatarProps) {
  const initial = name ? name.charAt(0).toUpperCase() : "?";
  const bgColor = accentColor || BagirataColors.primary;

  const containerStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: style === "inactive" ? BagirataColors.dimmed : bgColor,
    justifyContent: "center",
    alignItems: "center",
    opacity: style === "inactive" ? 0.5 : 1,
    ...(style === "active"
      ? {
          borderWidth: 2,
          borderColor: BagirataColors.primary,
        }
      : {}),
  };

  return (
    <View style={containerStyle}>
      <Text
        style={[
          styles.initial,
          { fontSize: size * 0.4 },
        ]}
      >
        {initial}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  initial: {
    color: "#fff",
    fontWeight: "bold",
  },
});
