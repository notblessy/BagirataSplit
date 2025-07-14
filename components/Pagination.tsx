// Pagination.tsx

import { AntDesign } from '@expo/vector-icons';
import * as Device from 'expo-device';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AdEventType, InterstitialAd, TestIds } from 'react-native-google-mobile-ads';

const iosAdmobInterstitial = "ca-app-pub-8857414531432199/1481715708";
const androidAdmobInterstitial = "ca-app-pub-8857414531432199/1481715708";
const productionID = Device.osName === 'Android' ? androidAdmobInterstitial : iosAdmobInterstitial;
const adUnitId = __DEV__ ? TestIds.INTERSTITIAL : productionID;
// Make sure to always use a test ID when not in production 

const interstitial = InterstitialAd.createForAdRequest(adUnitId, {
  keywords: ['finance', 'expense', 'receipt', 'bill'], // Update based on the most relevant keywords for your app/users
  requestNonPersonalizedAdsOnly: true, // Update based on the initial tracking settings from initialization earlier
});

interface PaginationProps {
  onPrevious?: () => void;
  onNext?: () => void;
}

const Pagination: React.FC<PaginationProps> = ({ onPrevious, onNext }) => {
  const [loaded, setLoaded] = useState<boolean>(false);

  useEffect(() => {
    // Event listener for when the ad is loaded
    const unsubscribeLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      setLoaded(true);
    });

    // Event listener for when the ad is closed
    const unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      setLoaded(false);

      // Load a new ad when the current ad is closed
      interstitial.load();
    });

    // Start loading the interstitial ad straight away
    interstitial.load();

    // Unsubscribe from events on unmount
    return () => {
      unsubscribeLoaded();
      unsubscribeClosed();
    };
  }, []);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          if (loaded) { interstitial.show(); }
          if (onPrevious) onPrevious();
        }}
      >
        <AntDesign name="arrowleft" size={24} color="#fdb833" />
        <Text style={styles.buttonText}>Previous</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          if (loaded) { interstitial.show(); }
          if (onNext) onNext();
        }}
      >
        <Text style={styles.buttonText}>Next</Text>
        <AntDesign name="arrowright" size={24} color="#fdb833" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginVertical: 8,
    paddingHorizontal: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  buttonText: {
    marginHorizontal: 5,
    fontSize: 16,
  },
});

export default Pagination;
