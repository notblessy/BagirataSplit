import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
// import { useEffect } from "react";
// import mobileAds from "react-native-google-mobile-ads";
import "react-native-reanimated";

import { AuthProvider } from "@/contexts/AuthContext";
import { UserProfileProvider } from "@/contexts/UserProfileContext";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  // Initialize Google Mobile Ads
  // useEffect(() => {
  //   mobileAds()
  //     .initialize()
  //     .then((adapterStatuses) => {
  //       console.log("Google Mobile Ads initialized successfully");
  //     })
  //     .catch((error) => {
  //       console.log("Failed to initialize Google Mobile Ads:", error);
  //     });
  // }, []);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <UserProfileProvider>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="login"
              options={{ headerShown: false, presentation: "modal" }}
            />
            <Stack.Screen
              name="register"
              options={{ headerShown: false, presentation: "modal" }}
            />
            <Stack.Screen
              name="result-flow"
              options={{ headerShown: false, presentation: "fullScreenModal" }}
            />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </UserProfileProvider>
    </AuthProvider>
  );
}
