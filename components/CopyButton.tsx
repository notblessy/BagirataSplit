import React, { useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { BagirataColors } from "../constants/Colors";

interface CopyButtonProps {
  text: string;
  label?: string;
}

export default function CopyButton({ text, label }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Pressable
      style={[
        styles.button,
        copied && styles.buttonCopied,
      ]}
      onPress={handleCopy}
    >
      <Ionicons
        name={copied ? "checkmark" : "copy-outline"}
        size={14}
        color={copied ? "#27AE60" : BagirataColors.primary}
      />
      <Text
        style={[
          styles.text,
          { color: copied ? "#27AE60" : BagirataColors.primary },
        ]}
      >
        {copied ? "Copied!" : label || "Copy"}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: BagirataColors.primary + "40",
  },
  buttonCopied: {
    borderColor: "#27AE60",
    backgroundColor: "#27AE6010",
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
  },
});
