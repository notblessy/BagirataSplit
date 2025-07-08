import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Friend } from "../types";

interface ProfileSheetProps {
  onClose: () => void;
  profile?: Friend | null;
  onSave: (profile: Friend) => void;
  isFirstTime?: boolean;
}

export default function ProfileSheet({
  onClose,
  profile,
  onSave,
  isFirstTime = false,
}: ProfileSheetProps) {
  const [name, setName] = useState(profile?.name || "");
  const [bankName, setBankName] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");

  const isNameValid = name.trim().length > 0;

  const isBankInfoComplete =
    bankName.trim().length > 0 &&
    bankAccountName.trim().length > 0 &&
    bankAccountNumber.trim().length > 0;

  const handleSave = () => {
    if (!isNameValid) {
      Alert.alert("Error", "Please enter your name");
      return;
    }

    const updatedProfile: Friend = {
      id: profile?.id || Date.now().toString(),
      name: name.trim(),
      me: true,
      accentColor: profile?.accentColor || "#4A93CF",
      createdAt: profile?.createdAt || new Date(),
    };

    // TODO: Save bank info if provided
    if (isBankInfoComplete) {
      // Save bank information logic here
      console.log("Bank info:", {
        bankName,
        accountName: bankAccountName,
        accountNumber: bankAccountNumber,
      });
    }

    onSave(updatedProfile);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {!isFirstTime && (
          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        )}
        {isFirstTime && <View style={styles.cancelButton} />}
        <Text style={styles.title}>
          {isFirstTime
            ? "Welcome! Set up your profile"
            : "Profile & Bank Account"}
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          style={[styles.saveButton, !isNameValid && styles.saveButtonDisabled]}
          disabled={!isNameValid}
        >
          <Text
            style={[styles.saveText, !isNameValid && styles.saveTextDisabled]}
          >
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <Text style={styles.fieldLabel}>Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor="#999"
          />
          {(isFirstTime || !profile) && (
            <Text style={styles.helpText}>
              This will be used to identify you in split bills
            </Text>
          )}
        </View>

        {/* Bank Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bank Information (Optional)</Text>
          <Text style={styles.sectionSubtitle}>
            Add your bank details to make payments easier
          </Text>

          <Text style={styles.fieldLabel}>Bank Name</Text>
          <TextInput
            style={styles.input}
            value={bankName}
            onChangeText={setBankName}
            placeholder="e.g., Bank Central Asia"
            placeholderTextColor="#999"
          />

          <Text style={styles.fieldLabel}>Account Holder Name</Text>
          <TextInput
            style={styles.input}
            value={bankAccountName}
            onChangeText={setBankAccountName}
            placeholder="Name as shown on bank account"
            placeholderTextColor="#999"
          />

          <Text style={styles.fieldLabel}>Account Number</Text>
          <TextInput
            style={styles.input}
            value={bankAccountNumber}
            onChangeText={setBankAccountNumber}
            placeholder="Your bank account number"
            placeholderTextColor="#999"
            keyboardType="numeric"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e1e5e9",
  },
  cancelButton: {
    padding: 4,
  },
  cancelText: {
    fontSize: 16,
    color: "#007AFF",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  saveButton: {
    padding: 4,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
  },
  saveTextDisabled: {
    color: "#999",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e1e5e9",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#000",
  },
  helpText: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    fontStyle: "italic",
  },
});
