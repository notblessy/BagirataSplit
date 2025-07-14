import * as Device from 'expo-device';
import { useState } from 'react';
import { View } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

// Production ad unit IDs
const iosAdmobBanner = "ca-app-pub-8857414531432199/5229556891";
const androidAdmobBanner = "ca-app-pub-8857414531432199/5229556891";

const productionID = Device.osName === 'Android' ? androidAdmobBanner : iosAdmobBanner;

const InlineAd = () => {
  const [isAdLoaded, setIsAdLoaded] = useState<boolean>(false);
  
  return (
    <View style={{ height: isAdLoaded ? 'auto' : 0, alignItems: 'center', justifyContent: 'center' }}>
      <BannerAd
        // It is extremely important to use test IDs as you can be banned/restricted by Google AdMob for inappropriately using real ad banners during testing
        unitId={__DEV__ ? TestIds.BANNER : productionID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true, 
          // You can change this setting depending on whether you want to use the permissions tracking we set up in the initializing
        }}
        onAdLoaded={() => {
          console.log('🟢 Banner ad loaded successfully');
          setIsAdLoaded(true);
        }}
        onAdFailedToLoad={(error) => {
          console.log('🔴 Banner ad failed to load:', error);
          setIsAdLoaded(false);
        }}
      />
    </View>
  );
};

export default InlineAd;
