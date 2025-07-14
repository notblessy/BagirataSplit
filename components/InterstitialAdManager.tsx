import { useEffect, useRef } from 'react';
import {
  InterstitialAd,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';

class InterstitialAdManager {
  private static instance: InterstitialAdManager | null = null;
  private interstitialAd: InterstitialAd | null = null;
  private isLoaded: boolean = false;
  private isLoading: boolean = false;

  // Use production ad unit ID or test ID for development
  private readonly adUnitId = __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-8857414531432199/1481715708';

  constructor() {
    this.createInterstitialAd();
  }

  static getInstance(): InterstitialAdManager {
    if (!InterstitialAdManager.instance) {
      InterstitialAdManager.instance = new InterstitialAdManager();
    }
    return InterstitialAdManager.instance;
  }

  private createInterstitialAd() {
    this.interstitialAd = InterstitialAd.createForAdRequest(this.adUnitId, {
      requestNonPersonalizedAdsOnly: true,
    });

    this.interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
      console.log('🟢 Interstitial ad loaded successfully');
      this.isLoaded = true;
      this.isLoading = false;
    });

    this.interstitialAd.addAdEventListener(AdEventType.ERROR, (error) => {
      console.log('🔴 Interstitial ad failed to load:', error);
      this.isLoaded = false;
      this.isLoading = false;
      // Try to reload after a delay
      setTimeout(() => {
        this.loadAd();
      }, 5000);
    });

    this.interstitialAd.addAdEventListener(AdEventType.OPENED, () => {
      console.log('🤩 Interstitial ad opened');
    });

    this.interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
      console.log('😔 Interstitial ad closed');
      this.isLoaded = false;
      // Preload the next ad
      this.loadAd();
    });
  }

  loadAd() {
    if (this.isLoading || this.isLoaded) {
      return;
    }

    this.isLoading = true;
    if (this.interstitialAd) {
      this.interstitialAd.load();
    }
  }

  showAd(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.interstitialAd) {
        console.log('🔵 Interstitial ad not initialized');
        this.loadAd();
        reject(new Error('Ad not initialized'));
        return;
      }

      if (!this.isLoaded) {
        console.log('🔵 Interstitial ad not loaded yet');
        this.loadAd();
        reject(new Error('Ad not loaded'));
        return;
      }

      this.interstitialAd.show().then(() => {
        resolve();
      }).catch((error) => {
        console.log('🔴 Failed to show interstitial ad:', error);
        reject(error);
      });
    });
  }

  getLoadedStatus(): boolean {
    return this.isLoaded;
  }
}

// Hook for React components
export const useInterstitialAd = () => {
  const adManagerRef = useRef<InterstitialAdManager>(InterstitialAdManager.getInstance());

  useEffect(() => {
    const adManager = adManagerRef.current;
    // Preload the ad when the hook is first used
    adManager.loadAd();

    return () => {
      // Cleanup if needed
    };
  }, []);

  const showInterstitialAd = async (): Promise<void> => {
    const adManager = adManagerRef.current;
    try {
      await adManager.showAd();
    } catch (error) {
      console.log('Failed to show interstitial ad:', error);
      // Continue with the app flow even if ad fails
    }
  };

  const isAdLoaded = (): boolean => {
    return adManagerRef.current.getLoadedStatus();
  };

  const preloadAd = (): void => {
    adManagerRef.current.loadAd();
  };

  return {
    showInterstitialAd,
    isAdLoaded,
    preloadAd,
  };
};

export default InterstitialAdManager;
