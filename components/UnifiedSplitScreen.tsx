import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import { useRecognizeReceipt } from "../hooks/useSplitApi";
import { AssignedItem, Friend, OtherItem, SplitItem } from "../types";
import { DataService } from "../services/DataService";

type FlowStep = "review" | "bank" | "assign" | "share";

interface UnifiedSplitScreenProps {
  splitData?: SplitItem | null;
  scannedText?: string;
  isManualEntry?: boolean;
  onBack: () => void;
  onShare: (data: any) => void;
}

export function UnifiedSplitScreen({
  splitData,
  scannedText,
  isManualEntry = false,
  onBack,
  onShare,
}: UnifiedSplitScreenProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [currentStep, setCurrentStep] = useState<FlowStep>("review");
  const [currentSplitData, setCurrentSplitData] = useState<SplitItem | null>(
    splitData || null
  );
  const [friends, setFriends] = useState<Friend[]>([]);

  // Manual entry states
  const [splitName, setSplitName] = useState("");
  const [items, setItems] = useState<AssignedItem[]>([]);

  // Form states for adding items
  const [showAddItemSheet, setShowAddItemSheet] = useState(false);
  const [showAddOtherSheet, setShowAddOtherSheet] = useState(false);
  const [editingItem, setEditingItem] = useState<AssignedItem | null>(null);

  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemQty, setItemQty] = useState("1");

  const [otherName, setOtherName] = useState("");
  const [otherAmount, setOtherAmount] = useState("");
  const [otherType, setOtherType] = useState<"addition" | "discount" | "tax">(
    "tax"
  );
  const [otherUsePercentage, setOtherUsePercentage] = useState(false);

  // Bank info states
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [showBankSheet, setShowBankSheet] = useState(false);

  // Assignment states
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [currentAssignmentItem, setCurrentAssignmentItem] =
    useState<AssignedItem | null>(null);

  // Use API hook for recognizing receipt text (only for scan flow)
  const {
    data: recognizeData,
    error: recognizeError,
    isLoading: isRecognizing,
    recognize,
  } = useRecognizeReceipt(null);

  // Trigger recognition when scannedText is available
  useEffect(() => {
    if (!isManualEntry && scannedText) {
      recognize(scannedText);
    }
  }, [scannedText, isManualEntry, recognize]);

  useEffect(() => {
    if (recognizeData && recognizeData.success && !isManualEntry) {
      // Convert recognized data to split format
      const newSplitData: SplitItem = {
        id: Date.now().toString(),
        name: recognizeData.data.merchant_name || "Split from Receipt",
        status: "draft",
        friends: friends.map((friend) => ({
          id: friend.id,
          friendId: friend.id,
          name: friend.name,
          me: friend.me,
          accentColor: friend.accentColor,
          qty: 0,
          subTotal: 0,
          createdAt: friend.createdAt,
        })),
        items: recognizeData.data.items.map((item, index) => ({
          id: (Date.now() + index).toString(),
          name: item.name,
          qty: item.quantity,
          price: item.price,
          equal: false,
          friends: [],
          createdAt: new Date(),
        })),
        otherPayments: [],
        createdAt: new Date(),
      };

      // Add tax if available
      if (recognizeData.data.tax) {
        newSplitData.otherPayments.push({
          id: (Date.now() + 1000).toString(),
          name: "Tax",
          type: "tax",
          usePercentage: false,
          amount: recognizeData.data.tax,
          createdAt: new Date(),
        });
      }

      // Add service charge if available
      if (recognizeData.data.service_charge) {
        newSplitData.otherPayments.push({
          id: (Date.now() + 2000).toString(),
          name: "Service Charge",
          type: "addition",
          usePercentage: false,
          amount: recognizeData.data.service_charge,
          createdAt: new Date(),
        });
      }

      // Add discount if available
      if (recognizeData.data.discount) {
        newSplitData.otherPayments.push({
          id: (Date.now() + 3000).toString(),
          name: "Discount",
          type: "discount",
          usePercentage: false,
          amount: recognizeData.data.discount,
          createdAt: new Date(),
        });
      }

      setCurrentSplitData(newSplitData);
    }
  }, [recognizeData, isManualEntry, friends]);

  useEffect(() => {
    if (recognizeError) {
      Alert.alert(
        "Recognition Error",
        "Failed to recognize receipt. Please try again.",
        [{ text: "OK", onPress: onBack }]
      );
    }
  }, [recognizeError, onBack]);

  useEffect(() => {
    // Load friends data
    const loadFriends = async () => {
      try {
        const friendsData = await DataService.getAllFriends();
        setFriends(friendsData);
      } catch (error) {
        console.error("Error loading friends:", error);
      }
    };
    loadFriends();
  }, []);

  // Initialize for manual entry
  useEffect(() => {
    if (isManualEntry && !currentSplitData) {
      // Start with empty state for manual entry
      setItems([]);
      setSplitName("");
    }
  }, [isManualEntry, currentSplitData]);

  // Create split data from manual entry
  const createSplitFromManualEntry = () => {
    if (!splitName.trim()) {
      Alert.alert("Error", "Please enter a split name");
      return;
    }

    if (items.length === 0) {
      Alert.alert("Error", "Please add at least one item");
      return;
    }

    const newSplitData: SplitItem = {
      id: Date.now().toString(),
      name: splitName.trim(),
      status: "draft",
      friends: friends.map((friend) => ({
        id: friend.id,
        friendId: friend.id,
        name: friend.name,
        me: friend.me,
        accentColor: friend.accentColor,
        qty: 0,
        subTotal: 0,
        createdAt: friend.createdAt,
      })),
      items: items,
      otherPayments: [],
      createdAt: new Date(),
    };

    setCurrentSplitData(newSplitData);
  };

  // Navigation functions
  const handleNext = () => {
    if (currentStep === "review") {
      if (isManualEntry && !currentSplitData) {
        createSplitFromManualEntry();
        return;
      }
      if (!currentSplitData) {
        Alert.alert("Error", "No split data available");
        return;
      }
      if (currentSplitData.name.length > 25) {
        Alert.alert("Error", "Split name cannot exceed 25 characters");
        return;
      }
      setCurrentStep("assign"); // Skip bank step
    } else if (currentStep === "assign") {
      setCurrentStep("share");
    } else if (currentStep === "share") {
      if (currentSplitData) {
        onShare(currentSplitData);
      }
    }
  };

  const handleBack = () => {
    if (currentStep === "review") {
      onBack();
    } else if (currentStep === "assign") {
      setCurrentStep("review");
    } else if (currentStep === "share") {
      setCurrentStep("assign");
    }
  };

  // Item management functions
  const addItem = () => {
    if (!itemName.trim() || !itemPrice.trim()) {
      Alert.alert("Error", "Please enter item name and price");
      return;
    }

    const price = parseFloat(itemPrice);
    const qty = parseInt(itemQty) || 1;

    if (isNaN(price) || price <= 0) {
      Alert.alert("Error", "Please enter a valid price");
      return;
    }

    if (qty <= 0) {
      Alert.alert("Error", "Please enter a valid quantity");
      return;
    }

    const newItem: AssignedItem = {
      id: Date.now().toString(),
      name: itemName.trim(),
      qty,
      price,
      equal: false,
      friends: [],
      createdAt: new Date(),
    };

    if (editingItem) {
      // Update existing item
      if (currentSplitData) {
        const updatedItems = currentSplitData.items.map((item) =>
          item.id === editingItem.id
            ? { ...item, name: itemName.trim(), price, qty }
            : item
        );
        setCurrentSplitData({ ...currentSplitData, items: updatedItems });
      } else {
        const updatedItems = items.map((item) =>
          item.id === editingItem.id
            ? { ...item, name: itemName.trim(), price, qty }
            : item
        );
        setItems(updatedItems);
      }
    } else {
      // Add new item
      if (currentSplitData) {
        setCurrentSplitData({
          ...currentSplitData,
          items: [...currentSplitData.items, newItem],
        });
      } else {
        setItems([...items, newItem]);
      }
    }

    setEditingItem(null);
    setItemName("");
    setItemPrice("");
    setItemQty("1");
    setShowAddItemSheet(false);
  };

  const editItem = (item: AssignedItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemPrice(item.price.toString());
    setItemQty(item.qty.toString());
    setShowAddItemSheet(true);
  };

  const deleteItem = (itemId: string) => {
    Alert.alert("Delete Item", "Are you sure you want to delete this item?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          if (currentSplitData) {
            const updatedItems = currentSplitData.items.filter(
              (item) => item.id !== itemId
            );
            setCurrentSplitData({ ...currentSplitData, items: updatedItems });
          } else {
            setItems(items.filter((item) => item.id !== itemId));
          }
        },
      },
    ]);
  };

  const addOther = () => {
    if (!otherName.trim() || !otherAmount.trim()) {
      Alert.alert("Error", "Please enter name and amount");
      return;
    }

    const amount = parseFloat(otherAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    const newOther: OtherItem = {
      id: Date.now().toString(),
      name: otherName.trim(),
      type: otherType,
      usePercentage: otherUsePercentage,
      amount,
      createdAt: new Date(),
    };

    if (currentSplitData) {
      setCurrentSplitData({
        ...currentSplitData,
        otherPayments: [...currentSplitData.otherPayments, newOther],
      });
    }

    setOtherName("");
    setOtherAmount("");
    setOtherType("tax");
    setOtherUsePercentage(false);
    setShowAddOtherSheet(false);
  };

  const deleteOther = (otherId: string) => {
    if (!currentSplitData) return;

    Alert.alert(
      "Delete Other Payment",
      "Are you sure you want to delete this other payment?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            const updatedOthers = currentSplitData.otherPayments.filter(
              (other) => other.id !== otherId
            );
            setCurrentSplitData({
              ...currentSplitData,
              otherPayments: updatedOthers,
            });
          },
        },
      ]
    );
  };

  // Assignment functions
  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriends((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId]
    );
  };

  const assignItemToFriends = (item: AssignedItem) => {
    if (selectedFriends.length === 0) {
      Alert.alert("Error", "Please select at least one friend");
      return;
    }

    if (!currentSplitData) return;

    const updatedItems = currentSplitData.items.map((splitItem) => {
      if (splitItem.id === item.id) {
        return {
          ...splitItem,
          friends: selectedFriends.map((friendId) => {
            const friend = friends.find((f) => f.id === friendId);
            return {
              id: friendId,
              friendId: friendId,
              name: friend?.name || "",
              me: friend?.me || false,
              accentColor: friend?.accentColor || "#007AFF",
              qty: Math.floor(item.qty / selectedFriends.length), // Split equally for now
              subTotal:
                Math.floor(item.qty / selectedFriends.length) * item.price,
              createdAt: friend?.createdAt || new Date(),
            };
          }),
        };
      }
      return splitItem;
    });

    setCurrentSplitData({ ...currentSplitData, items: updatedItems });
    setSelectedFriends([]);
    setCurrentAssignmentItem(null);
  };

  const calculateFriendTotal = (friendId: string) => {
    if (!currentSplitData) return 0;

    return currentSplitData.items.reduce((total, item) => {
      const friendAssignment = item.friends.find((f) => f.id === friendId);
      if (friendAssignment) {
        return total + item.price * friendAssignment.qty;
      }
      return total;
    }, 0);
  };

  const calculateTotal = () => {
    const currentItems = currentSplitData?.items || items;
    const itemsTotal = currentItems.reduce(
      (sum: number, item: AssignedItem) => sum + item.price * item.qty,
      0
    );

    if (currentSplitData?.otherPayments) {
      const othersTotal = currentSplitData.otherPayments.reduce(
        (sum: number, other: OtherItem) => {
          if (other.usePercentage) {
            return sum + (itemsTotal * other.amount) / 100;
          }
          return sum + other.amount;
        },
        0
      );
      return itemsTotal + othersTotal;
    }

    return itemsTotal;
  };

  // Bank info functions
  const addBankInfo = () => {
    if (!bankName.trim() || !accountNumber.trim() || !accountName.trim()) {
      Alert.alert("Error", "Please fill in all bank information fields");
      return;
    }

    setShowBankSheet(false);
    Alert.alert("Success", "Bank information added successfully");
  };

  const clearBankInfo = () => {
    setBankName("");
    setAccountNumber("");
    setAccountName("");
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case "review":
        return isManualEntry ? "Manual Split" : "Review Items";
      case "assign":
        return "Assign Items";
      case "share":
        return "Share Split";
      default:
        return "Split Bill";
    }
  };

  const getStepSubtitle = () => {
    switch (currentStep) {
      case "review":
        return isManualEntry
          ? "Add items manually"
          : "Review and edit scanned items";
      case "assign":
        return "Assign items to friends and add bank info";
      case "share":
        return "Review and share the final split";
      default:
        return "";
    }
  };

  // Loading state for scan recognition
  if (!isManualEntry && isRecognizing) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Recognizing receipt...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.title, { color: colors.text }]}>
            {getStepTitle()}
          </Text>
          <Text style={[styles.subtitle, { color: colors.text }]}>
            {getStepSubtitle()}
          </Text>
        </View>
      </View>

      {/* Progress Steps */}
      <View style={styles.progressContainer}>
        {["review", "assign", "share"].map((step, index) => (
          <View key={step} style={styles.progressStep}>
            <View
              style={[
                styles.progressDot,
                {
                  backgroundColor:
                    ["review", "assign", "share"].indexOf(currentStep) >= index
                      ? colors.tint
                      : colors.text + "30",
                },
              ]}
            />
            {index < 2 && (
              <View
                style={[
                  styles.progressLine,
                  {
                    backgroundColor:
                      ["review", "assign", "share"].indexOf(currentStep) > index
                        ? colors.tint
                        : colors.text + "30",
                  },
                ]}
              />
            )}
          </View>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {currentStep === "review" && (
          <View style={styles.stepContent}>
            {/* Split Title */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {isManualEntry ? "Split Name" : "Split Details"}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { borderColor: colors.text + "30", color: colors.text },
                ]}
                value={currentSplitData?.name || splitName}
                onChangeText={(text) => {
                  if (currentSplitData) {
                    setCurrentSplitData({ ...currentSplitData, name: text });
                  } else {
                    setSplitName(text);
                  }
                }}
                placeholder="Enter split name (e.g., Dinner at Restaurant)"
                placeholderTextColor={colors.text + "60"}
                maxLength={25}
              />
            </View>

            {/* Items Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Items ({(currentSplitData?.items || items).length})
              </Text>

              {(currentSplitData?.items || items).map((item) => (
                <View
                  key={item.id}
                  style={[styles.itemCard, { borderColor: colors.text + "20" }]}
                >
                  <View style={styles.itemHeader}>
                    <Text style={[styles.itemName, { color: colors.text }]}>
                      {item.name}
                    </Text>
                    <View style={styles.itemActions}>
                      <TouchableOpacity
                        onPress={() => editItem(item)}
                        style={styles.actionButton}
                      >
                        <Ionicons name="pencil" size={16} color={colors.tint} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => deleteItem(item.id)}
                        style={styles.actionButton}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={16}
                          color="#ff4444"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={[styles.itemPrice, { color: colors.text }]}>
                    {DataService.formatCurrency(item.price)} × {item.qty} ={" "}
                    {DataService.formatCurrency(item.price * item.qty)}
                  </Text>
                </View>
              ))}

              <TouchableOpacity
                style={[styles.addButton, { borderColor: colors.tint }]}
                onPress={() => setShowAddItemSheet(true)}
              >
                <Ionicons name="add" size={20} color={colors.tint} />
                <Text style={[styles.addButtonText, { color: colors.tint }]}>
                  Add Item
                </Text>
              </TouchableOpacity>
            </View>

            {/* Other Payments Section */}
            {currentSplitData && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Other Payments ({currentSplitData.otherPayments.length})
                </Text>

                {currentSplitData.otherPayments.map((other) => (
                  <View
                    key={other.id}
                    style={[
                      styles.otherCard,
                      { borderColor: colors.text + "20" },
                    ]}
                  >
                    <View style={styles.otherHeader}>
                      <Text style={[styles.otherName, { color: colors.text }]}>
                        {other.name} ({other.type})
                      </Text>
                      <TouchableOpacity
                        onPress={() => deleteOther(other.id)}
                        style={styles.actionButton}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={16}
                          color="#ff4444"
                        />
                      </TouchableOpacity>
                    </View>
                    <Text style={[styles.otherAmount, { color: colors.text }]}>
                      {other.usePercentage
                        ? `${other.amount}%`
                        : DataService.formatCurrency(other.amount)}
                    </Text>
                  </View>
                ))}

                <TouchableOpacity
                  style={[styles.addButton, { borderColor: colors.tint }]}
                  onPress={() => setShowAddOtherSheet(true)}
                >
                  <Ionicons name="add" size={20} color={colors.tint} />
                  <Text style={[styles.addButtonText, { color: colors.tint }]}>
                    Add Other Payment
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Total */}
            <View style={styles.section}>
              <View
                style={[
                  styles.totalCard,
                  { backgroundColor: colors.tint + "10" },
                ]}
              >
                <Text style={[styles.totalLabel, { color: colors.text }]}>
                  Total Amount
                </Text>
                <Text style={[styles.totalAmount, { color: colors.tint }]}>
                  {DataService.formatCurrency(calculateTotal())}
                </Text>
              </View>
            </View>
          </View>
        )}

        {currentStep === "assign" && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepDescription, { color: colors.text }]}>
              Assign items to friends who ordered them and add your bank
              information.
            </Text>

            {/* Bank Information Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Bank Information
                </Text>
                {bankName ? (
                  <TouchableOpacity
                    onPress={clearBankInfo}
                    style={styles.clearButton}
                  >
                    <Text
                      style={[styles.clearButtonText, { color: colors.tint }]}
                    >
                      Clear
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {bankName ? (
                <View
                  style={[
                    styles.bankInfoDisplay,
                    { borderColor: colors.text + "20" },
                  ]}
                >
                  <Text
                    style={[styles.bankDisplayText, { color: colors.text }]}
                  >
                    {bankName} - {accountNumber}
                  </Text>
                  <Text
                    style={[styles.bankDisplaySubtext, { color: colors.text }]}
                  >
                    {accountName}
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.addBankButton, { borderColor: colors.tint }]}
                  onPress={() => setShowBankSheet(true)}
                >
                  <Ionicons name="add" size={20} color={colors.tint} />
                  <Text
                    style={[styles.addBankButtonText, { color: colors.tint }]}
                  >
                    Add Bank Information
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {currentAssignmentItem ? (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Assigning: {currentAssignmentItem.name}
                </Text>

                <View style={styles.friendsSelectionContainer}>
                  {friends.map((friend) => (
                    <TouchableOpacity
                      key={friend.id}
                      style={[
                        styles.friendSelectionCard,
                        {
                          borderColor: selectedFriends.includes(friend.id)
                            ? colors.tint
                            : colors.text + "20",
                          backgroundColor: selectedFriends.includes(friend.id)
                            ? colors.tint + "10"
                            : "transparent",
                        },
                      ]}
                      onPress={() => toggleFriendSelection(friend.id)}
                    >
                      <View
                        style={[
                          styles.friendAvatar,
                          { backgroundColor: friend.accentColor },
                        ]}
                      >
                        <Text style={styles.friendInitial}>
                          {friend.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <Text style={[styles.friendName, { color: colors.text }]}>
                        {friend.name}
                      </Text>
                      {selectedFriends.includes(friend.id) && (
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color={colors.tint}
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.assignmentActions}>
                  <TouchableOpacity
                    style={[
                      styles.assignButton,
                      { backgroundColor: colors.tint },
                    ]}
                    onPress={() => assignItemToFriends(currentAssignmentItem)}
                  >
                    <Text style={styles.assignButtonText}>
                      Assign to Selected Friends
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.cancelButton,
                      { borderColor: colors.text + "30" },
                    ]}
                    onPress={() => {
                      setCurrentAssignmentItem(null);
                      setSelectedFriends([]);
                    }}
                  >
                    <Text
                      style={[styles.cancelButtonText, { color: colors.text }]}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Items to Assign
                  </Text>

                  {currentSplitData?.items.map((item) => (
                    <View
                      key={item.id}
                      style={[
                        styles.itemAssignCard,
                        { borderColor: colors.text + "20" },
                      ]}
                    >
                      <View style={styles.itemAssignHeader}>
                        <View>
                          <Text
                            style={[styles.itemName, { color: colors.text }]}
                          >
                            {item.name}
                          </Text>
                          <Text
                            style={[styles.itemPrice, { color: colors.text }]}
                          >
                            {DataService.formatCurrency(item.price)} ×{" "}
                            {item.qty}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={[
                            styles.assignItemButton,
                            { backgroundColor: colors.tint },
                          ]}
                          onPress={() => setCurrentAssignmentItem(item)}
                        >
                          <Text style={styles.assignItemButtonText}>
                            Assign
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {item.friends.length > 0 && (
                        <View style={styles.assignedFriends}>
                          <Text
                            style={[
                              styles.assignedLabel,
                              { color: colors.text },
                            ]}
                          >
                            Assigned to:
                          </Text>
                          {item.friends.map((assignedFriend) => (
                            <Text
                              key={assignedFriend.id}
                              style={[
                                styles.assignedFriendName,
                                { color: colors.tint },
                              ]}
                            >
                              {assignedFriend.name} ({assignedFriend.qty}x)
                            </Text>
                          ))}
                        </View>
                      )}
                    </View>
                  ))}
                </View>

                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Friends Summary
                  </Text>
                  {friends.map((friend) => {
                    const total = calculateFriendTotal(friend.id);
                    return (
                      <View
                        key={friend.id}
                        style={[
                          styles.friendSummaryCard,
                          { borderColor: colors.text + "20" },
                        ]}
                      >
                        <View
                          style={[
                            styles.friendAvatar,
                            { backgroundColor: friend.accentColor },
                          ]}
                        >
                          <Text style={styles.friendInitial}>
                            {friend.name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.friendSummaryInfo}>
                          <Text
                            style={[styles.friendName, { color: colors.text }]}
                          >
                            {friend.name}
                          </Text>
                          <Text
                            style={[styles.friendTotal, { color: colors.tint }]}
                          >
                            {DataService.formatCurrency(total)}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </>
            )}
          </View>
        )}

        {currentStep === "share" && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepDescription, { color: colors.text }]}>
              Review the final split and share with your friends.
            </Text>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Split Summary
              </Text>

              {/* Split Details */}
              <View
                style={[
                  styles.summaryCard,
                  { borderColor: colors.text + "20" },
                ]}
              >
                <Text style={[styles.summaryTitle, { color: colors.text }]}>
                  {currentSplitData?.name}
                </Text>
                <Text style={[styles.summaryDate, { color: colors.text }]}>
                  {currentSplitData?.createdAt.toLocaleDateString()}
                </Text>
                <Text style={[styles.summaryTotal, { color: colors.tint }]}>
                  Total: {DataService.formatCurrency(calculateTotal())}
                </Text>
              </View>

              {/* Friends breakdown */}
              {friends.map((friend) => {
                const total = calculateFriendTotal(friend.id);
                if (total === 0) return null;

                return (
                  <View
                    key={friend.id}
                    style={[
                      styles.friendShareCard,
                      { borderColor: colors.text + "20" },
                    ]}
                  >
                    <View style={styles.friendShareHeader}>
                      <View
                        style={[
                          styles.friendAvatar,
                          { backgroundColor: friend.accentColor },
                        ]}
                      >
                        <Text style={styles.friendInitial}>
                          {friend.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.friendShareInfo}>
                        <Text
                          style={[styles.friendName, { color: colors.text }]}
                        >
                          {friend.name}
                        </Text>
                        <Text
                          style={[
                            styles.friendShareAmount,
                            { color: colors.tint },
                          ]}
                        >
                          {DataService.formatCurrency(total)}
                        </Text>
                      </View>
                    </View>

                    {/* Show items for this friend */}
                    {currentSplitData?.items
                      .filter((item) =>
                        item.friends.some((f) => f.id === friend.id)
                      )
                      .map((item) => {
                        const friendAssignment = item.friends.find(
                          (f) => f.id === friend.id
                        );
                        if (!friendAssignment) return null;

                        return (
                          <Text
                            key={item.id}
                            style={[
                              styles.friendItemDetail,
                              { color: colors.text },
                            ]}
                          >
                            • {item.name} ({friendAssignment.qty}x) -{" "}
                            {DataService.formatCurrency(
                              item.price * friendAssignment.qty
                            )}
                          </Text>
                        );
                      })}
                  </View>
                );
              })}

              {/* Bank Information */}
              {bankName && (
                <View
                  style={[
                    styles.bankInfoCard,
                    { borderColor: colors.text + "20" },
                  ]}
                >
                  <Text style={[styles.bankInfoTitle, { color: colors.text }]}>
                    Payment Information
                  </Text>
                  <Text style={[styles.bankInfoDetail, { color: colors.text }]}>
                    Bank: {bankName}
                  </Text>
                  <Text style={[styles.bankInfoDetail, { color: colors.text }]}>
                    Account: {accountNumber}
                  </Text>
                  <Text style={[styles.bankInfoDetail, { color: colors.text }]}>
                    Name: {accountName}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <View style={styles.bottomSafeArea}>
          <TouchableOpacity
            style={[styles.nextButton, { backgroundColor: colors.tint }]}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>
              {currentStep === "share" ? "Share Split" : "Next"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Add Item Sheet */}
      {showAddItemSheet && (
        <View style={styles.overlay}>
          <View style={[styles.sheet, { backgroundColor: colors.background }]}>
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>
                {editingItem ? "Edit Item" : "Add Item"}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowAddItemSheet(false);
                  setEditingItem(null);
                  setItemName("");
                  setItemPrice("");
                  setItemQty("1");
                }}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.sheetContent}>
              <TextInput
                style={[
                  styles.sheetInput,
                  { borderColor: colors.text + "30", color: colors.text },
                ]}
                value={itemName}
                onChangeText={setItemName}
                placeholder="Item name"
                placeholderTextColor={colors.text + "60"}
              />
              <View style={styles.sheetRow}>
                <TextInput
                  style={[
                    styles.sheetInput,
                    styles.priceInput,
                    { borderColor: colors.text + "30", color: colors.text },
                  ]}
                  value={itemPrice}
                  onChangeText={setItemPrice}
                  placeholder="Price"
                  placeholderTextColor={colors.text + "60"}
                  keyboardType="numeric"
                />
                <TextInput
                  style={[
                    styles.sheetInput,
                    styles.qtyInput,
                    { borderColor: colors.text + "30", color: colors.text },
                  ]}
                  value={itemQty}
                  onChangeText={setItemQty}
                  placeholder="Qty"
                  placeholderTextColor={colors.text + "60"}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.sheetButton, { backgroundColor: colors.tint }]}
              onPress={addItem}
            >
              <Text style={styles.sheetButtonText}>
                {editingItem ? "Update Item" : "Add Item"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Add Other Sheet */}
      {showAddOtherSheet && (
        <View style={styles.overlay}>
          <View style={[styles.sheet, { backgroundColor: colors.background }]}>
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>
                Add Other Payment
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowAddOtherSheet(false);
                  setOtherName("");
                  setOtherAmount("");
                  setOtherType("tax");
                  setOtherUsePercentage(false);
                }}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.sheetContent}>
              <TextInput
                style={[
                  styles.sheetInput,
                  { borderColor: colors.text + "30", color: colors.text },
                ]}
                value={otherName}
                onChangeText={setOtherName}
                placeholder="Name (e.g., Tax, Service charge)"
                placeholderTextColor={colors.text + "60"}
              />

              <View style={styles.typeSelector}>
                {(["tax", "addition", "discount"] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeOption,
                      {
                        backgroundColor:
                          otherType === type ? colors.tint : "transparent",
                        borderColor:
                          otherType === type ? colors.tint : colors.text + "30",
                      },
                    ]}
                    onPress={() => setOtherType(type)}
                  >
                    <Text
                      style={[
                        styles.typeText,
                        { color: otherType === type ? "#fff" : colors.text },
                      ]}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.sheetRow}>
                <TextInput
                  style={[
                    styles.sheetInput,
                    styles.priceInput,
                    { borderColor: colors.text + "30", color: colors.text },
                  ]}
                  value={otherAmount}
                  onChangeText={setOtherAmount}
                  placeholder="Amount"
                  placeholderTextColor={colors.text + "60"}
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  style={[
                    styles.percentageToggle,
                    {
                      backgroundColor: otherUsePercentage
                        ? colors.tint
                        : "transparent",
                      borderColor: colors.text + "30",
                    },
                  ]}
                  onPress={() => setOtherUsePercentage(!otherUsePercentage)}
                >
                  <Text
                    style={[
                      styles.percentageText,
                      { color: otherUsePercentage ? "#fff" : colors.text },
                    ]}
                  >
                    %
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.sheetButton, { backgroundColor: colors.tint }]}
              onPress={addOther}
            >
              <Text style={styles.sheetButtonText}>Add Payment</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Bank Info Sheet */}
      {showBankSheet && (
        <View style={styles.overlay}>
          <View style={[styles.sheet, { backgroundColor: colors.background }]}>
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>
                Add Bank Information
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowBankSheet(false);
                }}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.sheetContent}>
              <TextInput
                style={[
                  styles.sheetInput,
                  { borderColor: colors.text + "30", color: colors.text },
                ]}
                value={bankName}
                onChangeText={setBankName}
                placeholder="Bank Name (e.g., BCA, Mandiri)"
                placeholderTextColor={colors.text + "60"}
              />
              <TextInput
                style={[
                  styles.sheetInput,
                  { borderColor: colors.text + "30", color: colors.text },
                ]}
                value={accountNumber}
                onChangeText={setAccountNumber}
                placeholder="Account Number"
                placeholderTextColor={colors.text + "60"}
                keyboardType="numeric"
              />
              <TextInput
                style={[
                  styles.sheetInput,
                  { borderColor: colors.text + "30", color: colors.text },
                ]}
                value={accountName}
                onChangeText={setAccountName}
                placeholder="Account Name"
                placeholderTextColor={colors.text + "60"}
              />
            </View>

            <TouchableOpacity
              style={[styles.sheetButton, { backgroundColor: colors.tint }]}
              onPress={addBankInfo}
            >
              <Text style={styles.sheetButtonText}>Add Bank Info</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingTop: 10,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  progressStep: {
    flex: 1,
    alignItems: "center",
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressLine: {
    position: "absolute",
    top: 6,
    width: "100%",
    height: 2,
    borderRadius: 1,
  },
  stepContent: {
    width: "100%",
  },
  stepDescription: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 20,
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  itemCard: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "500",
  },
  itemActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  itemPrice: {
    fontSize: 14,
    opacity: 0.8,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 12,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
  otherCard: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
  },
  otherHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  otherName: {
    fontSize: 16,
    fontWeight: "500",
  },
  otherAmount: {
    fontSize: 14,
    opacity: 0.8,
  },
  totalCard: {
    padding: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: "bold",
  },
  bottomActions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#00000020",
    paddingBottom: 70,
  },
  bottomSafeArea: {
    width: "100%",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  bankInfoDisplay: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
  },
  bankDisplayText: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  bankDisplaySubtext: {
    fontSize: 14,
    opacity: 0.7,
  },
  addBankButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
  },
  addBankButtonText: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
  nextButton: {
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  sheet: {
    width: "90%",
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    elevation: 4,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  sheetContent: {
    marginBottom: 24,
  },
  sheetInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  sheetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  priceInput: {
    flex: 1,
    marginRight: 8,
  },
  qtyInput: {
    flex: 1,
    marginLeft: 8,
  },
  sheetButton: {
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  sheetButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  typeSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  typeOption: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    marginRight: 8,
  },
  typeText: {
    fontSize: 16,
    fontWeight: "500",
  },
  percentageToggle: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  percentageText: {
    fontSize: 16,
    fontWeight: "500",
  },
  friendsSelectionContainer: {
    marginBottom: 20,
  },
  friendSelectionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderWidth: 2,
    borderRadius: 8,
    marginBottom: 12,
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  friendInitial: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  friendName: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },
  assignmentActions: {
    marginTop: 20,
  },
  assignButton: {
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  assignButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  cancelButton: {
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  itemAssignCard: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
  },
  itemAssignHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  assignItemButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  assignItemButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
  },
  assignedFriends: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#00000010",
  },
  assignedLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  assignedFriendName: {
    fontSize: 14,
    marginBottom: 2,
  },
  friendSummaryCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
  },
  friendSummaryInfo: {
    flex: 1,
    marginLeft: 12,
  },
  friendTotal: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 4,
  },
  summaryCard: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  summaryDate: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8,
  },
  summaryTotal: {
    fontSize: 20,
    fontWeight: "bold",
  },
  friendShareCard: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
  },
  friendShareHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  friendShareInfo: {
    flex: 1,
    marginLeft: 12,
  },
  friendShareAmount: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 4,
  },
  friendItemDetail: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 4,
    paddingLeft: 52,
  },
  bankInfoCard: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 16,
  },
  bankInfoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  bankInfoDetail: {
    fontSize: 14,
    marginBottom: 4,
  },
});
