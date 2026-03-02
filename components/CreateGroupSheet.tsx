import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ActionSheet, { ActionSheetRef } from "react-native-actions-sheet";
import { BagirataColors, Colors } from "../constants/Colors";
import { useColorScheme } from "../hooks/useColorScheme";
import { DatabaseService } from "../services/DatabaseService";
import { CurrencyCode } from "../types";

interface CreateGroupSheetProps {
  sheetRef: React.RefObject<ActionSheetRef>;
  onSubmit: (data: CreateGroupData) => void;
  onClose: () => void;
}

export interface CreateGroupData {
  name: string;
  bankName?: string;
  bankAccount?: string;
  bankNumber?: string;
  currencyCode?: CurrencyCode;
}

export default function CreateGroupSheet({
  sheetRef,
  onSubmit,
  onClose,
}: CreateGroupSheetProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [name, setName] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankNumber, setBankNumber] = useState("");
  const [currencyCode, setCurrencyCode] = useState<CurrencyCode>("IDR");
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  const currencies = DatabaseService.getCurrencyList();

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      bankName: bankName.trim() || undefined,
      bankAccount: bankAccount.trim() || undefined,
      bankNumber: bankNumber.trim() || undefined,
      currencyCode,
    });
    resetForm();
  };

  const resetForm = () => {
    setName("");
    setBankName("");
    setBankAccount("");
    setBankNumber("");
    setCurrencyCode("IDR");
    setShowCurrencyPicker(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <ActionSheet
      ref={sheetRef}
      containerStyle={{ backgroundColor: colors.background }}
      headerAlwaysVisible={true}
      gestureEnabled={true}
      closeOnPressBack={true}
      onClose={handleClose}
    >
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background },
        ]}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              borderBottomColor:
                colorScheme === "dark" ? "#3c3c3e" : "#e0e0e0",
            },
          ]}
        >
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Create Group
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Name */}
          <Text style={[styles.label, { color: colors.text }]}>
            Group Name *
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor:
                  colorScheme === "dark" ? "#1E1E1E" : BagirataColors.dimmedLight,
                color: colors.text,
              },
            ]}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Trip to Bali"
            placeholderTextColor={BagirataColors.secondaryText}
          />

          {/* Currency */}
          <Text style={[styles.label, { color: colors.text }]}>Currency</Text>
          <TouchableOpacity
            style={[
              styles.input,
              styles.currencyPicker,
              {
                backgroundColor:
                  colorScheme === "dark" ? "#1E1E1E" : BagirataColors.dimmedLight,
              },
            ]}
            onPress={() => setShowCurrencyPicker(!showCurrencyPicker)}
          >
            <Text style={{ color: colors.text, fontSize: 15 }}>
              {currencyCode} -{" "}
              {currencies.find((c) => c.code === currencyCode)?.label || ""}
            </Text>
            <Ionicons
              name={showCurrencyPicker ? "chevron-up" : "chevron-down"}
              size={18}
              color={BagirataColors.secondaryText}
            />
          </TouchableOpacity>

          {showCurrencyPicker && (
            <View
              style={[
                styles.currencyList,
                {
                  backgroundColor:
                    colorScheme === "dark" ? "#1E1E1E" : "#fff",
                  borderColor:
                    colorScheme === "dark" ? "#333" : "#E5E5E5",
                },
              ]}
            >
              {currencies.map((currency) => (
                <TouchableOpacity
                  key={currency.code}
                  style={[
                    styles.currencyItem,
                    currency.code === currencyCode && styles.currencyItemActive,
                  ]}
                  onPress={() => {
                    setCurrencyCode(currency.code);
                    setShowCurrencyPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.currencyItemText,
                      { color: colors.text },
                      currency.code === currencyCode && {
                        color: BagirataColors.primary,
                        fontWeight: "600",
                      },
                    ]}
                  >
                    {currency.code} - {currency.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Bank Info */}
          <Text style={[styles.label, { color: colors.text }]}>
            Bank Name (optional)
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor:
                  colorScheme === "dark" ? "#1E1E1E" : BagirataColors.dimmedLight,
                color: colors.text,
              },
            ]}
            value={bankName}
            onChangeText={setBankName}
            placeholder="e.g. BCA"
            placeholderTextColor={BagirataColors.secondaryText}
          />

          <Text style={[styles.label, { color: colors.text }]}>
            Account Name (optional)
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor:
                  colorScheme === "dark" ? "#1E1E1E" : BagirataColors.dimmedLight,
                color: colors.text,
              },
            ]}
            value={bankAccount}
            onChangeText={setBankAccount}
            placeholder="e.g. John Doe"
            placeholderTextColor={BagirataColors.secondaryText}
          />

          <Text style={[styles.label, { color: colors.text }]}>
            Account Number (optional)
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor:
                  colorScheme === "dark" ? "#1E1E1E" : BagirataColors.dimmedLight,
                color: colors.text,
              },
            ]}
            value={bankNumber}
            onChangeText={setBankNumber}
            placeholder="e.g. 1234567890"
            placeholderTextColor={BagirataColors.secondaryText}
            keyboardType="number-pad"
          />

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              !name.trim() && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!name.trim()}
          >
            <Text style={styles.submitButtonText}>Create Group</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </ActionSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 550,
    maxHeight: 650,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
  },
  currencyPicker: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  currencyList: {
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
    maxHeight: 200,
  },
  currencyItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  currencyItemActive: {
    backgroundColor: BagirataColors.primary + "10",
  },
  currencyItemText: {
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: BagirataColors.primary,
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    marginTop: 24,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
