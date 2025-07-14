import * as Device from 'expo-device';
import { useCallback, useEffect, useState } from 'react';
import {
  AdEventType,
  InterstitialAd,
  TestIds
} from 'react-native-google-mobile-ads';

// Production ad unit IDs (replace these with your actual AdMob IDs)
const iosAdmobInterstitial = "ca-app-pub-8857414531432199/1481715708";
const androidAdmobInterstitial = "ca-app-pub-8857414531432199/1481715708";

const productionID = Device.osName === 'Android' ? androidAdmobInterstitial : iosAdmobInterstitial;
const adUnitId = __DEV__ ? TestIds.INTERSTITIAL : productionID;

// Create the interstitial ad
const interstitial = InterstitialAd.createForAdRequest(adUnitId, {
  requestNonPersonalizedAdsOnly: true,
});

export const useInterstitialAdPlaceholder = () => {
  const [loaded, setLoaded] = useState<boolean>(false);

  useEffect(() => {
    // Event listener for when the ad is loaded
    const unsubscribeLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      console.log('🟢 Interstitial ad loaded successfully');
      setLoaded(true);
    });

    // Event listener for when the ad fails to load
    const unsubscribeError = interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
      console.log('� Interstitial ad failed to load:', error);
      setLoaded(false);
    });

    // Event listener for when the ad is closed
    const unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      console.log('😔 Interstitial ad closed');
      setLoaded(false);
      // Load a new ad when the current ad is closed
      interstitial.load();
    });

    // Event listener for when the ad is opened
    const unsubscribeOpened = interstitial.addAdEventListener(AdEventType.OPENED, () => {
      console.log('🤩 Interstitial ad opened');
    });

    // Start loading the interstitial ad straight away
    interstitial.load();

    // Unsubscribe from events on unmount
    return () => {
      unsubscribeLoaded();
      unsubscribeError();
      unsubscribeClosed();
      unsubscribeOpened();
    };
  }, []);

  const showInterstitialAd = useCallback(async (): Promise<void> => {
    if (loaded) {
      try {
        await interstitial.show();
        console.log('🟢 Interstitial ad shown successfully');
      } catch (error) {
        console.log('🔴 Failed to show interstitial ad:', error);
        // Continue with app flow even if ad fails
      }
    } else {
      console.log('🔵 Interstitial ad not loaded yet');
      // Try to load an ad for next time
      interstitial.load();
    }
  }, [loaded]);

  const isAdLoaded = useCallback((): boolean => {
    return loaded;
  }, [loaded]);

  const preloadAd = useCallback((): void => {
    if (!loaded) {
      console.log('🔵 Preloading interstitial ad');
      interstitial.load();
    }
  }, [loaded]);

  return {
    showInterstitialAd,
    isAdLoaded,
    preloadAd,
  };
};

export default useInterstitialAdPlaceholder;
