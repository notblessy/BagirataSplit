import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { BagirataColors } from "@/constants/Colors";

export default function LoginScreen() {
  const { login, isLoading, errorMessage, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return;
    const success = await login(email.trim(), password);
    if (success) {
      router.back();
    }
  };

  const handleRegister = () => {
    clearError();
    router.replace("/register");
  };

  const isDisabled = !email.trim() || !password.trim() || isLoading;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable style={styles.closeButton} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#666" />
        </Pressable>

        <View style={styles.header}>
          <Ionicons name="lock-closed-outline" size={64} color={BagirataColors.primary} />
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Log in to continue</Text>
        </View>

        {errorMessage && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Pressable
            style={[styles.loginButton, isDisabled && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isDisabled}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Log In</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <Pressable onPress={handleRegister}>
            <Text style={styles.linkText}>Register</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 0,
    padding: 8,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#11181C",
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: BagirataColors.secondaryText,
    marginTop: 8,
  },
  errorContainer: {
    backgroundColor: BagirataColors.errorBackground,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorText: {
    color: BagirataColors.dangerRed,
    textAlign: "center",
    fontSize: 14,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: BagirataColors.dimmedLight,
    borderRadius: 10,
    padding: 16,
    fontSize: 16,
    color: "#11181C",
  },
  loginButton: {
    backgroundColor: BagirataColors.primary,
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  footerText: {
    color: BagirataColors.secondaryText,
    fontSize: 14,
  },
  linkText: {
    color: BagirataColors.linkBlue,
    fontSize: 14,
    fontWeight: "600",
  },
});
