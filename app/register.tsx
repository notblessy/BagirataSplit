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

export default function RegisterScreen() {
  const { register, isLoading, errorMessage, clearError } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || passwordMismatch) return;
    const success = await register(name.trim(), email.trim(), password);
    if (success) {
      router.back();
    }
  };

  const handleLogin = () => {
    clearError();
    router.replace("/login");
  };

  const isDisabled =
    !name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim() || passwordMismatch || isLoading;

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
          <Ionicons name="person-add-outline" size={64} color={BagirataColors.primary} />
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to get started</Text>
        </View>

        {errorMessage && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Name"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
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
          <View>
            <TextInput
              style={[styles.input, passwordMismatch && styles.inputError]}
              placeholder="Confirm Password"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
            {passwordMismatch && (
              <Text style={styles.fieldError}>Passwords do not match</Text>
            )}
          </View>

          <Pressable
            style={[styles.registerButton, isDisabled && styles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={isDisabled}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.registerButtonText}>Register</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Pressable onPress={handleLogin}>
            <Text style={styles.linkText}>Log In</Text>
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
  inputError: {
    borderWidth: 1,
    borderColor: BagirataColors.dangerRed,
  },
  fieldError: {
    color: BagirataColors.dangerRed,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  registerButton: {
    backgroundColor: BagirataColors.primary,
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
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
