import React from "react";
import { Alert, Share } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { UnifiedSplitScreen } from "@/components/UnifiedSplitScreen";

export default function ResultFlowScreen() {
  const params = useLocalSearchParams<{
    scannedText?: string;
    isManualEntry?: string;
  }>();

  const handleBack = () => {
    router.back();
  };

  const handleShare = async (splitData: any) => {
    try {
      if (splitData.shareUrl) {
        await Share.share({
          message: `Check out this split bill: ${splitData.name}\n\nView and pay your share: ${splitData.shareUrl}`,
          url: splitData.shareUrl,
          title: `Split Bill: ${splitData.name}`,
        });
      }
      router.back();
    } catch (error: any) {
      console.error("Share error:", error);
      Alert.alert("Share Error", "Failed to share split. Please try again.");
    }
  };

  return (
    <UnifiedSplitScreen
      scannedText={params.scannedText || undefined}
      isManualEntry={params.isManualEntry === "true"}
      onBack={handleBack}
      onShare={handleShare}
    />
  );
}
