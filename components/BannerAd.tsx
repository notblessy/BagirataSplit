import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

// AdMob IDs from your app.json configuration
const iosAdmobBanner = "ca-app-pub-8857414531432199/5229556891";
const androidAdmobBanner = "ca-app-pub-8857414531432199/5229556891"; // You may want different IDs for iOS/Android
const productionID = Platform.OS === 'android' ? androidAdmobBanner : iosAdmobBanner;

// Use test ID in development, production ID in production
const adUnitId = __DEV__ ? TestIds.BANNER : productionID;

interface BannerAdComponentProps {
  size?: BannerAdSize;
  style?: any;
}

export default function BannerAdComponent({ 
  size = BannerAdSize.ANCHORED_ADAPTIVE_BANNER,
  style
}: BannerAdComponentProps) {
  return (
    <View style={[styles.container, style]}>
      <BannerAd
        unitId={adUnitId}
        size={size}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
          keywords: ['finance', 'expense', 'receipt', 'bill', 'split'],
        }}
        onAdLoaded={() => {
          console.log('🟢 Banner ad loaded successfully');
        }}
        onAdFailedToLoad={(error) => {
          console.log('🔴 Banner ad failed to load:', error);
        }}
        onAdOpened={() => {
          console.log('🤩 Banner ad opened');
        }}
        onAdClosed={() => {
          console.log('😔 Banner ad closed');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
});
