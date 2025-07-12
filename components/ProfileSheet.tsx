import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../constants/Colors";
import { useColorScheme } from "../hooks/useColorScheme";
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
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
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
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View
        style={[
          styles.header,
          {
            backgroundColor: colorScheme === "dark" ? "#2c2c2e" : "#fff",
            borderBottomColor: colorScheme === "dark" ? "#3c3c3e" : "#e1e5e9",
          },
        ]}
      >
        {!isFirstTime && (
          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={[styles.cancelText, { color: colors.tint }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        )}
        {isFirstTime && <View style={styles.cancelButton} />}
        <Text style={[styles.title, { color: colors.text }]}>
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
            style={[
              styles.saveText,
              { color: isNameValid ? colors.tint : "#999" },
            ]}
          >
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Personal Information
          </Text>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>
            Name *
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colorScheme === "dark" ? "#3A3A3C" : "#fff",
                borderColor: colorScheme === "dark" ? "#5C5C5E" : "#e1e5e9",
                color: colors.text,
              },
            ]}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor={colorScheme === "dark" ? "#8E8E93" : "#999"}
          />
          {(isFirstTime || !profile) && (
            <Text
              style={[styles.helpText, { color: colors.text, opacity: 0.7 }]}
            >
              This will be used to identify you in split bills
            </Text>
          )}
        </View>

        {/* Bank Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Bank Information (Optional)
          </Text>
          <Text
            style={[
              styles.sectionSubtitle,
              { color: colors.text, opacity: 0.7 },
            ]}
          >
            Add your bank details to make payments easier
          </Text>

          <Text style={[styles.fieldLabel, { color: colors.text }]}>
            Bank Name
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colorScheme === "dark" ? "#3A3A3C" : "#fff",
                borderColor: colorScheme === "dark" ? "#5C5C5E" : "#e1e5e9",
                color: colors.text,
              },
            ]}
            value={bankName}
            onChangeText={setBankName}
            placeholder="e.g., Bank Central Asia"
            placeholderTextColor={colorScheme === "dark" ? "#8E8E93" : "#999"}
          />

          <Text style={[styles.fieldLabel, { color: colors.text }]}>
            Account Holder Name
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colorScheme === "dark" ? "#3A3A3C" : "#fff",
                borderColor: colorScheme === "dark" ? "#5C5C5E" : "#e1e5e9",
                color: colors.text,
              },
            ]}
            value={bankAccountName}
            onChangeText={setBankAccountName}
            placeholder="Name as shown on bank account"
            placeholderTextColor={colorScheme === "dark" ? "#8E8E93" : "#999"}
          />

          <Text style={[styles.fieldLabel, { color: colors.text }]}>
            Account Number
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colorScheme === "dark" ? "#3A3A3C" : "#fff",
                borderColor: colorScheme === "dark" ? "#5C5C5E" : "#e1e5e9",
                color: colors.text,
              },
            ]}
            value={bankAccountNumber}
            onChangeText={setBankAccountNumber}
            placeholder="Your bank account number"
            placeholderTextColor={colorScheme === "dark" ? "#8E8E93" : "#999"}
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
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  cancelButton: {
    padding: 4,
  },
  cancelText: {
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  saveButton: {
    padding: 4,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveText: {
    fontSize: 16,
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
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  helpText: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: "italic",
  },
});
