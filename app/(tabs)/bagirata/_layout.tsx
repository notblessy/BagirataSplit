import { Stack } from "expo-router";
import React from "react";

export default function BagirataLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="groups"
        options={{ presentation: "card" }}
      />
      <Stack.Screen
        name="group-detail"
        options={{ presentation: "card" }}
      />
    </Stack>
  );
}
