import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
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
import { useUserProfile } from "../contexts/UserProfileContext";
import { useColorScheme } from "../hooks/useColorScheme";
import {
  BagirataApiService,
  convertRecognitionToAppFormat,
  convertToBackendFormat,
} from "../services/BagirataApiService";
import { DataService } from "../services/DataService";
import { DatabaseService } from "../services/DatabaseService";
import {
  AssignedFriend,
  AssignedItem,
  Friend,
  OtherItem,
  SplitItem,
} from "../types";

import ActionSheet, { ActionSheetRef } from "react-native-actions-sheet";

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
  const { userProfile } = useUserProfile();

  const [currentStep, setCurrentStep] = useState<FlowStep>("review");
  const [currentSplitData, setCurrentSplitData] = useState<SplitItem | null>(
    splitData || null
  );
  const [friends, setFriends] = useState<Friend[]>([]);

  // Manual entry states
  const [splitName, setSplitName] = useState("");
  const [items, setItems] = useState<AssignedItem[]>([]);

  // Form states for adding items (replaced with ActionSheet refs)
  // const [showAddItemSheet, setShowAddItemSheet] = useState(false);
  // const [showAddOtherSheet, setShowAddOtherSheet] = useState(false);
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
  // const [showBankSheet, setShowBankSheet] = useState(false);
  const [useProfileBankInfo, setUseProfileBankInfo] = useState(false);

  // Assignment states
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [currentAssignmentItem, setCurrentAssignmentItem] =
    useState<AssignedItem | null>(null);
  const [friendQuantities, setFriendQuantities] = useState<{
    [friendId: string]: number;
  }>({});
  // const [showAssignmentSheet, setShowAssignmentSheet] = useState(false);

  // Participant management states
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    []
  );
  // const [showParticipantSheet, setShowParticipantSheet] = useState(false);
  const [participantSearchQuery, setParticipantSearchQuery] = useState("");
  const [filteredFriends, setFilteredFriends] = useState<Friend[]>([]);

  // Recognition states
  const [isRecognizing, setIsRecognizing] = useState(false);

  // ActionSheet refs
  const addItemSheetRef = useRef<ActionSheetRef>(null);
  const addOtherSheetRef = useRef<ActionSheetRef>(null);
  const bankSheetRef = useRef<ActionSheetRef>(null);
  const assignmentSheetRef = useRef<ActionSheetRef>(null);
  const participantSheetRef = useRef<ActionSheetRef>(null);

  // Modal control functions
  const openAddItemSheet = () => {
    addItemSheetRef.current?.show();
  };

  const closeAddItemSheet = () => {
    addItemSheetRef.current?.hide();
    setEditingItem(null);
    setItemName("");
    setItemPrice("");
    setItemQty("1");
  };

  const openAddOtherSheet = () => {
    addOtherSheetRef.current?.show();
  };

  const closeAddOtherSheet = () => {
    addOtherSheetRef.current?.hide();
    setOtherName("");
    setOtherAmount("");
    setOtherType("tax");
    setOtherUsePercentage(false);
  };

  const openBankSheet = () => {
    // Check if user has profile bank info and initialize toggle accordingly
    const hasProfileBankInfo =
      userProfile?.bankName &&
      userProfile?.bankAccountName &&
      userProfile?.bankAccountNumber;

    // Only auto-fill with profile info if there's no existing bank info
    const hasExistingBankInfo = bankName || accountNumber || accountName;

    if (hasProfileBankInfo && !hasExistingBankInfo) {
      setUseProfileBankInfo(true);
      setBankName(userProfile.bankName || "");
      setAccountName(userProfile.bankAccountName || "");
      setAccountNumber(userProfile.bankAccountNumber || "");
    } else if (!hasProfileBankInfo && !hasExistingBankInfo) {
      setUseProfileBankInfo(false);
    }
    // If there's existing bank info, don't change anything

    bankSheetRef.current?.show();
  };

  const closeBankSheet = () => {
    bankSheetRef.current?.hide();
  };

  const cancelBankSheet = () => {
    // Reset form when canceling
    setBankName("");
    setAccountName("");
    setAccountNumber("");
    setUseProfileBankInfo(false);
    closeBankSheet();
  };

  const handleToggleProfileBankInfo = (enabled: boolean) => {
    setUseProfileBankInfo(enabled);

    if (enabled && userProfile) {
      // Copy profile bank info to form
      setBankName(userProfile.bankName || "");
      setAccountName(userProfile.bankAccountName || "");
      setAccountNumber(userProfile.bankAccountNumber || "");
    } else {
      // Clear form
      setBankName("");
      setAccountName("");
      setAccountNumber("");
    }
  };

  const openAssignmentSheet = () => {
    assignmentSheetRef.current?.show();
  };

  const closeAssignmentSheet = () => {
    assignmentSheetRef.current?.hide();
    setCurrentAssignmentItem(null);
    setSelectedFriends([]);
    setFriendQuantities({});
  };

  const openParticipantSheet = () => {
    participantSheetRef.current?.show();
  };

  const closeParticipantSheet = () => {
    participantSheetRef.current?.hide();
    setParticipantSearchQuery("");
  };

  // Trigger recognition when scannedText is available
  const handleRecognition = useCallback(
    async (text: string) => {
      setIsRecognizing(true);
      try {
        const response = await BagirataApiService.recognizeReceipt(text);

        if (response.success) {
          const { items, otherPayments, splitName } =
            convertRecognitionToAppFormat(response.data);

          // Create split data from recognition
          const newSplitData: SplitItem = {
            id: response.data.id,
            name: splitName || "Split from Receipt",
            status: "draft",
            friends: [],
            items: items.map((item, index) => ({
              ...item,
              id: `${response.data.id}-item-${index}`,
              createdAt: new Date(),
              friends: [],
            })),
            otherPayments: otherPayments.map((other, index) => ({
              ...other,
              id: `${response.data.id}-other-${index}`,
              createdAt: new Date(),
            })),
            createdAt: new Date(response.data.createdAt),
          };

          setCurrentSplitData(newSplitData);
          setSplitName(newSplitData.name);
        } else {
          throw new Error(response.message || "Recognition failed");
        }
      } catch (error: any) {
        console.error("Recognition error:", error);
        Alert.alert(
          "Recognition Error",
          "Failed to recognize receipt. Please try again.",
          [{ text: "OK", onPress: onBack }]
        );
      } finally {
        setIsRecognizing(false);
      }
    },
    [onBack]
  );

  useEffect(() => {
    if (!isManualEntry && scannedText) {
      handleRecognition(scannedText);
    }
  }, [scannedText, isManualEntry, handleRecognition]);

  useEffect(() => {
    // Load friends data
    const loadFriends = async () => {
      try {
        const friendsData = await DataService.getAllFriends();
        setFriends(friendsData);

        // Leave participants empty initially - user can choose who to include
      } catch (error) {
        console.error("Error loading friends:", error);
      }
    };
    loadFriends();
  }, []);

  // Filter friends based on search query
  useEffect(() => {
    if (participantSearchQuery.trim() === "") {
      setFilteredFriends(friends);
    } else {
      setFilteredFriends(
        friends.filter((f) =>
          f.name.toLowerCase().includes(participantSearchQuery.toLowerCase())
        )
      );
    }
  }, [participantSearchQuery, friends, selectedParticipants]);

  // Sync participants with split data only on initial load or when loading different split
  const lastSplitIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (currentSplitData) {
      const splitParticipants = currentSplitData.friends.map((f) => f.friendId);

      // Only sync if this is a different split (different ID) or first load
      if (lastSplitIdRef.current !== currentSplitData.id) {
        setSelectedParticipants(splitParticipants);
        lastSplitIdRef.current = currentSplitData.id;
      }
    }
  }, [currentSplitData]);

  // Initialize for manual entry
  useEffect(() => {
    if (isManualEntry && !currentSplitData) {
      // Start with empty state for manual entry
      setItems([]);
      setSplitName("");
    }
  }, [isManualEntry, currentSplitData]);

  // Navigation functions
  const handleNext = () => {
    if (currentStep === "review") {
      // If manual entry and no current split data, create it first
      if (isManualEntry && !currentSplitData) {
        // Validate before creating
        if (!splitName.trim()) {
          Alert.alert("Error", "Please enter a split name");
          return;
        }
        if (items.length === 0) {
          Alert.alert("Error", "Please add at least one item");
          return;
        }
        if (selectedParticipants.length === 0) {
          Alert.alert("Error", "Please add at least one participant");
          return;
        }
        if (splitName.trim().length > 25) {
          Alert.alert("Error", "Split name cannot exceed 25 characters");
          return;
        }

        // Create split data
        const newSplitData: SplitItem = {
          id: Date.now().toString(),
          name: splitName.trim(),
          status: "draft",
          friends: friends
            .filter((friend) => selectedParticipants.includes(friend.id))
            .map((friend) => ({
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
        // Continue to next step immediately
        setCurrentStep("assign");
        return;
      }

      if (!currentSplitData) {
        Alert.alert("Error", "No split data available");
        return;
      }
      if (selectedParticipants.length === 0) {
        Alert.alert("Error", "Please add at least one participant");
        return;
      }
      if (currentSplitData.name.length > 25) {
        Alert.alert("Error", "Split name cannot exceed 25 characters");
        return;
      }

      setCurrentStep("assign");
    } else if (currentStep === "assign") {
      setCurrentStep("share");
    } else if (currentStep === "share") {
      if (currentSplitData) {
        handleShareSplit();
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

  const handleShareSplit = async () => {
    if (!currentSplitData) return;

    // Show loading
    setIsRecognizing(true);

    try {
      // Get participants for the split
      const participants = friends.filter((friend) =>
        selectedParticipants.includes(friend.id)
      );

      // Prepare bank info
      const bankInfo =
        bankName && accountNumber && accountName
          ? {
              bankName,
              accountNumber,
              accountName,
            }
          : undefined;

      // Convert to backend format
      const backendData = convertToBackendFormat(
        currentSplitData,
        participants,
        bankInfo
      );

      // Save to backend
      const saveResponse = await BagirataApiService.saveSplit(backendData);

      if (saveResponse.success) {
        // Save to SQLite for history
        try {
          await DatabaseService.saveSplitToHistory(
            currentSplitData,
            participants,
            bankInfo
          );
        } catch (sqliteError) {
          console.warn("Failed to save to SQLite history:", sqliteError);
          // Don't fail the whole operation if SQLite fails
        }

        // Success! Call the onShare callback with the share URL
        onShare({
          ...currentSplitData,
          shareUrl: `https://bagirata.notblessy.com/view/${saveResponse.data}`,
          slug: saveResponse.data,
        });

        Alert.alert(
          "Success!",
          "Split has been saved and shared successfully!",
          [{ text: "OK" }]
        );
      } else {
        throw new Error("Failed to save split to backend");
      }
    } catch (error: any) {
      console.error("Save split error:", error);
      Alert.alert("Save Error", "Failed to save split. Please try again.", [
        { text: "Cancel", style: "cancel" },
        { text: "Retry", onPress: handleShareSplit },
      ]);
    } finally {
      setIsRecognizing(false);
    }
  };

  // Participant management functions
  const toggleParticipant = (friendId: string) => {
    const isCurrentlySelected = selectedParticipants.includes(friendId);

    if (isCurrentlySelected) {
      // Remove participant
      setSelectedParticipants((prev) => prev.filter((id) => id !== friendId));

      // Also update currentSplitData if it exists
      if (currentSplitData) {
        setCurrentSplitData({
          ...currentSplitData,
          friends: currentSplitData.friends.filter(
            (f) => f.friendId !== friendId
          ),
        });
      }
    } else {
      // Add participant
      setSelectedParticipants((prev) => [...prev, friendId]);

      // Also update currentSplitData if it exists
      if (currentSplitData) {
        const friend = friends.find((f) => f.id === friendId);
        if (
          friend &&
          !currentSplitData.friends.some((f) => f.friendId === friendId)
        ) {
          const newAssignedFriend: AssignedFriend = {
            id: (Date.now() + Math.random()).toString(),
            friendId: friend.id,
            name: friend.name,
            me: friend.me,
            accentColor: friend.accentColor,
            qty: 0,
            subTotal: 0,
            createdAt: new Date(),
          };

          setCurrentSplitData({
            ...currentSplitData,
            friends: [...currentSplitData.friends, newAssignedFriend],
          });
        }
      }
      // Clear search query to allow easy addition of more participants
      setParticipantSearchQuery("");
    }
  };

  const addNewFriend = async (name: string) => {
    try {
      const newFriend = await DataService.addFriend({
        name: name.trim(),
        accentColor: "#007AFF",
        me: false,
      });

      // Refresh friends list
      const friendsData = await DataService.getAllFriends();
      setFriends(friendsData);

      // Add to participants
      setSelectedParticipants((prev) => [...prev, newFriend.id]);

      // Also update currentSplitData if it exists
      if (currentSplitData) {
        const newAssignedFriend: AssignedFriend = {
          id: (Date.now() + Math.random()).toString(),
          friendId: newFriend.id,
          name: newFriend.name,
          me: newFriend.me,
          accentColor: newFriend.accentColor,
          qty: 0,
          subTotal: 0,
          createdAt: new Date(),
        };

        setCurrentSplitData({
          ...currentSplitData,
          friends: [...currentSplitData.friends, newAssignedFriend],
        });
      }

      // Clear search query to allow easy addition of more participants
      setParticipantSearchQuery("");
    } catch (error) {
      console.error("Error adding friend:", error);
      Alert.alert("Error", "Failed to add friend");
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
    closeAddItemSheet();
  };

  const editItem = (item: AssignedItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemPrice(item.price.toString());
    setItemQty(item.qty.toString());
    openAddItemSheet();
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
    } else {
      // For manual entry, create a temporary split data structure
      const tempSplitData: SplitItem = {
        id: Date.now().toString(),
        name: splitName || "New Split",
        status: "draft",
        friends: friends
          .filter((friend) => selectedParticipants.includes(friend.id))
          .map((friend) => ({
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
        otherPayments: [newOther],
        createdAt: new Date(),
      };
      setCurrentSplitData(tempSplitData);
    }

    setOtherName("");
    setOtherAmount("");
    setOtherType("tax");
    setOtherUsePercentage(false);
    closeAddOtherSheet();
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
    setSelectedFriends((prev) => {
      const isCurrentlySelected = prev.includes(friendId);
      let newSelection;

      if (isCurrentlySelected) {
        newSelection = prev.filter((id) => id !== friendId);
        // Remove quantity when deselecting
        setFriendQuantities((prevQuantities) => {
          const newQuantities = { ...prevQuantities };
          delete newQuantities[friendId];
          return newQuantities;
        });
      } else {
        newSelection = [...prev, friendId];
        // Set default quantity of 1 when selecting
        setFriendQuantities((prevQuantities) => ({
          ...prevQuantities,
          [friendId]: 1,
        }));
      }

      return newSelection;
    });
  };

  const updateFriendQuantity = (friendId: string, quantity: number) => {
    setFriendQuantities((prev) => ({
      ...prev,
      [friendId]: Math.max(0, roundToTwoDecimals(quantity)),
    }));
  };

  const getTotalAssignedQuantity = () => {
    return Object.values(friendQuantities).reduce((sum, qty) => sum + qty, 0);
  };

  const getRemainingQuantity = () => {
    if (!currentAssignmentItem) return 0;
    return roundToTwoDecimals(currentAssignmentItem.qty - getTotalAssignedQuantity());
  };

  const canAssignItem = () => {
    return (
      selectedFriends.length > 0 &&
      getTotalAssignedQuantity() <= (currentAssignmentItem?.qty || 0) &&
      getTotalAssignedQuantity() > 0
    );
  };

  // Utility function for rounding to 2 decimal places
  const roundToTwoDecimals = (num: number) => {
    return Math.round(num * 100) / 100;
  };

  const assignEqually = () => {
    if (!currentAssignmentItem || selectedParticipants.length === 0) return;

    // Select all participants and assign equal quantities
    const newQuantities: { [friendId: string]: number } = {};
    const equalShare = currentAssignmentItem.qty / selectedParticipants.length;

    selectedParticipants.forEach((participantId) => {
      newQuantities[participantId] = roundToTwoDecimals(equalShare);
    });

    setSelectedFriends(selectedParticipants);
    setFriendQuantities(newQuantities);
  };

  const assignItemToFriends = (item: AssignedItem) => {
    if (selectedFriends.length === 0) {
      Alert.alert("Error", "Please select at least one friend");
      return;
    }

    const totalAssigned = getTotalAssignedQuantity();
    if (totalAssigned > item.qty) {
      Alert.alert(
        "Error",
        `Cannot assign ${totalAssigned} items when only ${item.qty} are available`
      );
      return;
    }

    if (totalAssigned === 0) {
      Alert.alert("Error", "Please assign at least 1 item to someone");
      return;
    }

    if (!currentSplitData) return;

    const updatedItems = currentSplitData.items.map((splitItem) => {
      if (splitItem.id === item.id) {
        return {
          ...splitItem,
          friends: selectedFriends
            .map((friendId) => {
              const friend = friends.find((f) => f.id === friendId);
              const assignedQty = friendQuantities[friendId] || 0;
              return {
                id: friendId,
                friendId: friendId,
                name: friend?.name || "",
                me: friend?.me || false,
                accentColor: friend?.accentColor || "#007AFF",
                qty: assignedQty,
                subTotal: roundToTwoDecimals(assignedQty * item.price),
                createdAt: friend?.createdAt || new Date(),
              };
            })
            .filter((f) => f.qty > 0), // Only include friends with assigned quantities
        };
      }
      return splitItem;
    });

    setCurrentSplitData({ ...currentSplitData, items: updatedItems });
    setSelectedFriends([]);
    setFriendQuantities({});
    setCurrentAssignmentItem(null);
  };

  const calculateFriendTotal = (friendId: string) => {
    if (!currentSplitData) return 0;

    const total = currentSplitData.items.reduce((total, item) => {
      const friendAssignment = item.friends.find((f) => f.id === friendId);
      if (friendAssignment) {
        return total + item.price * friendAssignment.qty;
      }
      return total;
    }, 0);

    return roundToTwoDecimals(total);
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
          let amount = other.amount;
          if (other.usePercentage) {
            amount = (itemsTotal * other.amount) / 100;
          }

          if (other.type === "discount") {
            return sum - amount;
          } else {
            return sum + amount;
          }
        },
        0
      );
      return roundToTwoDecimals(itemsTotal + othersTotal);
    }

    return roundToTwoDecimals(itemsTotal);
  };

  const calculateFriendTotalWithOtherPayments = (friendId: string) => {
    if (!currentSplitData) return 0;

    // Calculate base total from assigned items
    const itemsTotal = currentSplitData.items.reduce((total, item) => {
      const friendAssignment = item.friends.find((f) => f.id === friendId);
      if (friendAssignment) {
        return total + item.price * friendAssignment.qty;
      }
      return total;
    }, 0);

    // Calculate total items value for percentage calculations
    const totalItemsValue = currentSplitData.items.reduce(
      (sum, item) => sum + item.price * item.qty,
      0
    );

    // Calculate participant count for equal splitting
    const participantCount = selectedParticipants.length;

    if (participantCount === 0) return roundToTwoDecimals(itemsTotal);

    // Apply other payments
    const otherPaymentsTotal = currentSplitData.otherPayments.reduce(
      (total, other) => {
        let amount = other.amount;
        if (other.usePercentage) {
          amount = (totalItemsValue * other.amount) / 100;
        }

        if (other.type === "tax") {
          // Tax is calculated proportionally based on participant's item total
          const taxAmount = (itemsTotal * amount) / totalItemsValue;
          return total + taxAmount;
        } else {
          // Additions and discounts are split equally among participants
          const perParticipantAmount = amount / participantCount;
          if (other.type === "discount") {
            return total - perParticipantAmount;
          } else {
            return total + perParticipantAmount;
          }
        }
      },
      0
    );

    return roundToTwoDecimals(itemsTotal + otherPaymentsTotal);
  };

  // Bank info functions
  const addBankInfo = () => {
    if (!bankName.trim() || !accountNumber.trim() || !accountName.trim()) {
      Alert.alert("Error", "Please fill in all bank information fields");
      return;
    }

    closeBankSheet();
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

            {/* Participants Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Participants ({selectedParticipants.length})
              </Text>

              {selectedParticipants.length === 0 ? (
                <View style={styles.participantsContainer}>
                  <TouchableOpacity
                    style={[
                      styles.addParticipantButton,
                      { borderColor: colors.tint, marginTop: 12 },
                    ]}
                    onPress={() => openParticipantSheet()}
                  >
                    <Ionicons name="add" size={24} color={colors.tint} />
                  </TouchableOpacity>
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.participantsScroll}
                  contentContainerStyle={styles.participantsContainer}
                >
                  {selectedParticipants.map((participantId) => {
                    const participant = friends.find(
                      (f) => f.id === participantId
                    );
                    if (!participant) return null;

                    return (
                      <View key={participantId} style={styles.participantItem}>
                        <TouchableOpacity
                          style={[
                            styles.participantAvatar,
                            { backgroundColor: participant.accentColor },
                          ]}
                          onPress={() => toggleParticipant(participantId)}
                        >
                          <Text style={styles.participantInitial}>
                            {participant.name.charAt(0).toUpperCase()}
                          </Text>
                          <View style={styles.removeIndicator}>
                            <Ionicons name="close" size={12} color="white" />
                          </View>
                        </TouchableOpacity>
                        <Text
                          style={[
                            styles.participantName,
                            { color: colors.text },
                          ]}
                          numberOfLines={1}
                        >
                          {participant.me ? "You" : participant.name}
                        </Text>
                      </View>
                    );
                  })}

                  {/* Add Participant Button */}
                  <View style={styles.participantItem}>
                    <TouchableOpacity
                      style={[
                        styles.addParticipantButton,
                        { borderColor: colors.tint },
                      ]}
                      onPress={() => openParticipantSheet()}
                    >
                      <Ionicons name="add" size={24} color={colors.tint} />
                    </TouchableOpacity>
                    <Text
                      style={[styles.participantName, { color: colors.text }]}
                    >
                      Add
                    </Text>
                  </View>
                </ScrollView>
              )}
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
                onPress={() => openAddItemSheet()}
              >
                <Ionicons name="add" size={20} color={colors.tint} />
                <Text style={[styles.addButtonText, { color: colors.tint }]}>
                  Add Item
                </Text>
              </TouchableOpacity>
            </View>

            {/* Other Payments Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Other Payments ({(currentSplitData?.otherPayments || []).length}
                )
              </Text>

              {(currentSplitData?.otherPayments || []).map((other) => (
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
                onPress={() => openAddOtherSheet()}
              >
                <Ionicons name="add" size={20} color={colors.tint} />
                <Text style={[styles.addButtonText, { color: colors.tint }]}>
                  Add Other Payment
                </Text>
              </TouchableOpacity>
            </View>

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
                  onPress={() => openBankSheet()}
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
                      <Text style={[styles.itemName, { color: colors.text }]}>
                        {item.name}
                      </Text>
                      <Text style={[styles.itemPrice, { color: colors.text }]}>
                        {DataService.formatCurrency(item.price)} × {item.qty}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.assignItemButton,
                        {
                          backgroundColor:
                            colorScheme === "dark" ? "#3A3A3C" : colors.tint,
                        },
                      ]}
                      onPress={() => {
                        setCurrentAssignmentItem(item);
                        setSelectedFriends([]);
                        setFriendQuantities({});
                        openAssignmentSheet();
                      }}
                    >
                      <Text
                        style={[styles.assignItemButtonText, { color: "#fff" }]}
                      >
                        {item.friends.length > 0 ? "Re-assign" : "Assign"}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {item.friends.length > 0 && (
                    <View style={styles.assignedFriends}>
                      <Text
                        style={[styles.assignedLabel, { color: colors.text }]}
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
              {friends
                .filter((friend) => selectedParticipants.includes(friend.id))
                .map((friend) => {
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
              {friends
                .filter((friend) => selectedParticipants.includes(friend.id))
                .map((friend) => {
                  const totalWithOtherPayments =
                    calculateFriendTotalWithOtherPayments(friend.id);
                  const itemsTotal = calculateFriendTotal(friend.id);
                  if (totalWithOtherPayments === 0) return null;

                  // Calculate other payments breakdown for this friend
                  const totalItemsValue =
                    currentSplitData?.items.reduce(
                      (sum, item) => sum + item.price * item.qty,
                      0
                    ) || 0;
                  const participantCount = selectedParticipants.length;

                  return (
                    <View
                      key={friend.id}
                      style={[
                        styles.friendShareCard,
                        {
                          backgroundColor:
                            colorScheme === "dark" ? "#262626" : "#f8f9fa",
                          borderColor:
                            colorScheme === "dark" ? "#3A3A3C" : "#e0e0e0",
                        },
                      ]}
                    >
                      {/* Friend Header */}
                      <View style={styles.friendShareHeader}>
                        <View style={styles.friendHeaderLeft}>
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
                              style={[
                                styles.friendName,
                                { color: colors.text },
                              ]}
                            >
                              {friend.name} {friend.me && "(You)"}
                            </Text>
                            <Text
                              style={[
                                styles.friendSubtotal,
                                { color: colors.text },
                              ]}
                            >
                              Subtotal: {DataService.formatCurrency(itemsTotal)}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.friendTotal}>
                          <Text
                            style={[styles.totalLabel, { color: colors.text }]}
                          >
                            Total
                          </Text>
                          <Text
                            style={[
                              styles.friendShareAmount,
                              { color: colors.tint },
                            ]}
                          >
                            {DataService.formatCurrency(totalWithOtherPayments)}
                          </Text>
                        </View>
                      </View>

                      {/* Calculation Breakdown */}
                      <View style={styles.breakdownSection}>
                        {/* Show items for this friend */}
                        <Text
                          style={[
                            styles.friendBreakdownTitle,
                            { color: colors.text },
                          ]}
                        >
                          Items:
                        </Text>
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

                        {/* Show other payments breakdown */}
                        {currentSplitData?.otherPayments &&
                          currentSplitData.otherPayments.length > 0 && (
                            <>
                              <Text
                                style={[
                                  styles.friendBreakdownTitle,
                                  { color: colors.text, marginTop: 8 },
                                ]}
                              >
                                Other Payments:
                              </Text>
                              {currentSplitData.otherPayments.map((other) => {
                                let amount = other.amount;
                                if (other.usePercentage) {
                                  amount =
                                    (totalItemsValue * other.amount) / 100;
                                }

                                let friendAmount = 0;
                                if (other.type === "tax") {
                                  // Tax is calculated proportionally based on participant's item total
                                  friendAmount =
                                    (itemsTotal * amount) / totalItemsValue;
                                } else {
                                  // Additions and discounts are split equally among participants
                                  friendAmount = amount / participantCount;
                                  if (other.type === "discount") {
                                    friendAmount = -friendAmount;
                                  }
                                }

                                const displayAmount = other.usePercentage
                                  ? `${other.amount}%`
                                  : DataService.formatCurrency(amount);

                                return (
                                  <Text
                                    key={other.id}
                                    style={[
                                      styles.friendItemDetail,
                                      { color: colors.text },
                                    ]}
                                  >
                                    • {other.name} ({displayAmount}) -{" "}
                                    {friendAmount >= 0 ? "+" : ""}
                                    {DataService.formatCurrency(friendAmount)}
                                  </Text>
                                );
                              })}
                            </>
                          )}

                        {currentSplitData?.otherPayments &&
                          currentSplitData.otherPayments.length > 0 && (
                            <View
                              style={[
                                styles.friendSubtotalLine,
                                { borderTopColor: colors.text + "20" },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.friendSubtotalText,
                                  { color: colors.text },
                                ]}
                              >
                                Items Subtotal:{" "}
                                {DataService.formatCurrency(itemsTotal)}
                              </Text>
                              <Text
                                style={[
                                  styles.friendSubtotalText,
                                  { color: colors.tint, fontWeight: "600" },
                                ]}
                              >
                                Final Total:{" "}
                                {DataService.formatCurrency(
                                  totalWithOtherPayments
                                )}
                              </Text>
                            </View>
                          )}
                      </View>
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
            style={[
              styles.nextButton,
              {
                backgroundColor: colors.tint,
                opacity: currentStep === "share" && isRecognizing ? 0.6 : 1,
              },
            ]}
            onPress={handleNext}
            disabled={currentStep === "share" && isRecognizing}
          >
            {currentStep === "share" && isRecognizing ? (
              <View style={styles.loadingButtonContent}>
                <ActivityIndicator size="small" color="#fff" />
                <Text
                  style={[
                    styles.nextButtonText,
                    { color: "#fff", marginLeft: 8 },
                  ]}
                >
                  Sharing...
                </Text>
              </View>
            ) : (
              <Text style={[styles.nextButtonText, { color: "#fff" }]}>
                {currentStep === "share" ? "Share Split" : "Next"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Add Item Sheet */}
      <ActionSheet
        ref={addItemSheetRef}
        containerStyle={{
          backgroundColor: colors.background,
        }}
        headerAlwaysVisible={true}
        gestureEnabled={true}
        closeOnPressBack={true}
        onClose={closeAddItemSheet}
      >
        <View
          style={[
            styles.bottomSheetContainer,
            {
              backgroundColor: colors.background,
              maxHeight: 450,
            },
          ]}
        >
          <SafeAreaView
            style={[
              styles.modalContainer,
              {
                backgroundColor: colors.background,
                maxHeight: 450,
              },
            ]}
          >
            <View
              style={[
                styles.modalHeader,
                {
                  borderBottomColor:
                    colorScheme === "dark" ? "#3c3c3e" : "#e0e0e0",
                },
              ]}
            >
              <TouchableOpacity onPress={closeAddItemSheet}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingItem ? "Edit Item" : "Add Item"}
              </Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView
              style={styles.modalContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <TextInput
                style={[
                  styles.textInput,
                  { borderColor: colors.tint, color: colors.text },
                ]}
                value={itemName}
                onChangeText={setItemName}
                placeholder="Item name"
                placeholderTextColor={colors.text + "60"}
              />
              <View style={styles.sheetRow}>
                <TextInput
                  style={[
                    styles.textInput,
                    styles.priceInput,
                    { borderColor: colors.tint, color: colors.text },
                  ]}
                  value={itemPrice}
                  onChangeText={setItemPrice}
                  placeholder="Price"
                  placeholderTextColor={colors.text + "60"}
                  keyboardType="numeric"
                />
                <TextInput
                  style={[
                    styles.textInput,
                    styles.qtyInput,
                    { borderColor: colors.tint, color: colors.text },
                  ]}
                  value={itemQty}
                  onChangeText={setItemQty}
                  placeholder="Qty"
                  placeholderTextColor={colors.text + "60"}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    {
                      backgroundColor:
                        colorScheme === "dark" ? "#3A3A3C" : "#f0f0f0",
                    },
                  ]}
                  onPress={closeAddItemSheet}
                >
                  <Text
                    style={[
                      styles.modalCancelButtonText,
                      { color: colorScheme === "dark" ? "#fff" : "#666" },
                    ]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    {
                      backgroundColor: colors.tint,
                    },
                  ]}
                  onPress={addItem}
                >
                  <Text style={styles.saveButtonText}>
                    {editingItem ? "Update Item" : "Add Item"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </ActionSheet>

      {/* Add Other Payment Sheet */}
      <ActionSheet
        ref={addOtherSheetRef}
        containerStyle={{
          backgroundColor: colors.background,
        }}
        headerAlwaysVisible={true}
        gestureEnabled={true}
        closeOnPressBack={true}
        onClose={closeAddOtherSheet}
      >
        <View
          style={[
            styles.bottomSheetContainer,
            {
              backgroundColor: colors.background,
              maxHeight: 450,
            },
          ]}
        >
          <SafeAreaView
            style={[
              styles.modalContainer,
              {
                backgroundColor: colors.background,
                maxHeight: 450,
              },
            ]}
          >
            <View
              style={[
                styles.modalHeader,
                {
                  borderBottomColor:
                    colorScheme === "dark" ? "#3c3c3e" : "#e0e0e0",
                },
              ]}
            >
              <TouchableOpacity onPress={closeAddOtherSheet}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Add Other Payment
              </Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView
              style={styles.modalContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <TextInput
                style={[
                  styles.textInput,
                  { borderColor: colors.tint, color: colors.text },
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
                          otherType === type
                            ? colorScheme === "dark"
                              ? "#3A3A3C"
                              : colors.tint
                            : colors.text + "30",
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

              {/* Side-by-side amount input and toggle */}
              <View style={styles.formSection}>
                <Text style={[styles.amountLabel, { color: colors.text }]}>
                  Amount
                </Text>

                <View style={styles.amountInputRow}>
                  {/* Amount Input - Left Side */}
                  <View style={styles.amountInputContainer}>
                    <View style={styles.inputContainer}>
                      {!otherUsePercentage && (
                        <View style={styles.currencyPrefixContainer}>
                          <Text
                            style={[
                              styles.currencyPrefix,
                              { color: colors.text + "60" },
                            ]}
                          >
                            Rp
                          </Text>
                        </View>
                      )}
                      <TextInput
                        style={[
                          styles.textInput,
                          styles.amountInput,
                          !otherUsePercentage
                            ? styles.amountInputWithPrefix
                            : styles.amountInputWithSuffix,
                          {
                            borderColor: colors.tint,
                            color: colors.text,
                          },
                        ]}
                        value={otherAmount}
                        onChangeText={setOtherAmount}
                        placeholder={otherUsePercentage ? "10" : "15000"}
                        placeholderTextColor={colors.text + "60"}
                        keyboardType="numeric"
                      />
                      {otherUsePercentage && (
                        <View style={styles.percentageSuffixContainer}>
                          <Text
                            style={[
                              styles.percentageSuffix,
                              { color: colors.text + "60" },
                            ]}
                          >
                            %
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Toggle Switch - Right Side */}
                  <View
                    style={[
                      styles.compactToggleContainer,
                      {
                        borderColor: colors.tint,
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={[
                        styles.compactToggleOption,
                        styles.compactToggleLeft,
                        {
                          backgroundColor: !otherUsePercentage
                            ? colors.tint
                            : "transparent",
                          borderColor:
                            colorScheme === "dark" ? "#3A3A3C" : colors.tint,
                        },
                      ]}
                      onPress={() => setOtherUsePercentage(false)}
                    >
                      <Text
                        style={[
                          styles.compactToggleText,
                          {
                            color: !otherUsePercentage
                              ? "#fff"
                              : colorScheme === "dark"
                              ? "#3A3A3C"
                              : colors.tint,
                          },
                        ]}
                      >
                        Rp
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.compactToggleOption,
                        styles.compactToggleRight,
                        {
                          backgroundColor: otherUsePercentage
                            ? colors.tint
                            : "transparent",
                          borderColor: colors.tint,
                        },
                      ]}
                      onPress={() => setOtherUsePercentage(true)}
                    >
                      <Text
                        style={[
                          styles.compactToggleText,
                          {
                            color: otherUsePercentage
                              ? "#fff"
                              : colorScheme === "dark"
                              ? "#3A3A3C"
                              : colors.tint,
                          },
                        ]}
                      >
                        %
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Help text explaining the calculation */}
              <Text style={[styles.helpText, { color: colors.text + "70" }]}>
                {otherType === "tax"
                  ? otherUsePercentage
                    ? "Tax will be calculated proportionally based on each person's share of items"
                    : "Tax amount will be split proportionally based on each person's share of items"
                  : otherUsePercentage
                  ? "This amount will be calculated from total items value and split equally among all participants"
                  : "This amount will be split equally among all participants"}
              </Text>

              <View style={[styles.modalButtons, { paddingBottom: 70 }]}>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    {
                      backgroundColor:
                        colorScheme === "dark" ? "#3A3A3C" : "#f0f0f0",
                    },
                  ]}
                  onPress={closeAddOtherSheet}
                >
                  <Text
                    style={[
                      styles.modalCancelButtonText,
                      { color: colorScheme === "dark" ? "#fff" : "#666" },
                    ]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    {
                      backgroundColor: colors.tint,
                    },
                  ]}
                  onPress={addOther}
                >
                  <Text style={styles.saveButtonText}>Add Payment</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </ActionSheet>

      {/* Bank Info Sheet */}
      <ActionSheet
        ref={bankSheetRef}
        containerStyle={{
          backgroundColor: colors.background,
        }}
        headerAlwaysVisible={true}
        gestureEnabled={true}
        closeOnPressBack={true}
        onClose={closeBankSheet}
      >
        <View
          style={[
            styles.bottomSheetContainer,
            {
              backgroundColor: colors.background,
              maxHeight: 450,
            },
          ]}
        >
          <SafeAreaView
            style={[
              styles.modalContainer,
              {
                backgroundColor: colors.background,
                maxHeight: 450,
              },
            ]}
          >
            <View
              style={[
                styles.modalHeader,
                {
                  borderBottomColor:
                    colorScheme === "dark" ? "#3c3c3e" : "#e0e0e0",
                },
              ]}
            >
              <TouchableOpacity onPress={cancelBankSheet}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Add Bank Information
              </Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView
              style={styles.modalContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Use Profile Bank Info Toggle */}
              {userProfile?.bankName &&
                userProfile?.bankAccountName &&
                userProfile?.bankAccountNumber && (
                  <View
                    style={[
                      styles.toggleSection,
                      {
                        backgroundColor:
                          colorScheme === "dark" ? "#2C2C2E" : "#f8f9fa",
                      },
                    ]}
                  >
                    <View style={styles.toggleHeader}>
                      <Text
                        style={[styles.toggleLabel, { color: colors.text }]}
                      >
                        Use Profile Bank Information
                      </Text>
                      <TouchableOpacity
                        style={[
                          styles.toggleSwitch,
                          {
                            backgroundColor: useProfileBankInfo
                              ? colors.tint
                              : colors.text + "20",
                          },
                        ]}
                        onPress={() =>
                          handleToggleProfileBankInfo(!useProfileBankInfo)
                        }
                      >
                        <View
                          style={[
                            styles.toggleThumb,
                            {
                              backgroundColor: "#fff",
                              transform: [
                                { translateX: useProfileBankInfo ? 22 : 2 },
                              ],
                            },
                          ]}
                        />
                      </TouchableOpacity>
                    </View>

                    {useProfileBankInfo && (
                      <View
                        style={[
                          styles.profileBankPreview,
                          {
                            borderColor: colors.text + "20",
                            backgroundColor:
                              colorScheme === "dark" ? "#1C1C1E" : "#f0f8ff",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.profileBankText,
                            { color: colors.text },
                          ]}
                        >
                          {userProfile.bankName} -{" "}
                          {userProfile.bankAccountNumber}
                        </Text>
                        <Text
                          style={[
                            styles.profileBankSubtext,
                            { color: colors.text + "70" },
                          ]}
                        >
                          {userProfile.bankAccountName}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

              {!useProfileBankInfo && (
                <>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        borderColor: colors.tint,
                        color: colors.text,
                      },
                    ]}
                    value={bankName}
                    onChangeText={setBankName}
                    placeholder="Bank Name (e.g., BCA, Mandiri)"
                    placeholderTextColor={colors.text + "60"}
                  />
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        borderColor: colors.tint,
                        color: colors.text,
                      },
                    ]}
                    value={accountNumber}
                    onChangeText={setAccountNumber}
                    placeholder="Account Number"
                    placeholderTextColor={colors.text + "60"}
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        borderColor: colors.tint,
                        color: colors.text,
                      },
                    ]}
                    value={accountName}
                    onChangeText={setAccountName}
                    placeholder="Account Name"
                    placeholderTextColor={colors.text + "60"}
                  />
                </>
              )}

              {useProfileBankInfo && (
                <Text
                  style={[
                    styles.helpText,
                    { color: colors.text + "70", marginTop: 12 },
                  ]}
                >
                  Using bank information from your profile. Toggle off to enter
                  different details for this split.
                </Text>
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    {
                      backgroundColor:
                        colorScheme === "dark" ? "#3A3A3C" : "#f0f0f0",
                    },
                  ]}
                  onPress={cancelBankSheet}
                >
                  <Text
                    style={[
                      styles.modalCancelButtonText,
                      { color: colorScheme === "dark" ? "#fff" : "#666" },
                    ]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    {
                      backgroundColor: colors.tint,
                    },
                  ]}
                  onPress={addBankInfo}
                >
                  <Text style={styles.saveButtonText}>Add Bank Info</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </ActionSheet>

      {/* Assignment Sheet */}
      <ActionSheet
        ref={assignmentSheetRef}
        containerStyle={{
          backgroundColor: colors.background,
        }}
        headerAlwaysVisible={true}
        gestureEnabled={true}
        closeOnPressBack={true}
        onClose={closeAssignmentSheet}
      >
        <View
          style={[
            styles.bottomSheetContainer,
            {
              backgroundColor: colors.background,
              maxHeight: 600,
            },
          ]}
        >
          <SafeAreaView
            style={[
              styles.modalContainer,
              {
                backgroundColor: colors.background,
                maxHeight: 600,
              },
            ]}
          >
            <View
              style={[
                styles.modalHeader,
                {
                  borderBottomColor:
                    colorScheme === "dark" ? "#3c3c3e" : "#e0e0e0",
                },
              ]}
            >
              <TouchableOpacity onPress={closeAssignmentSheet}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Assign: {currentAssignmentItem?.name}
              </Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView
              style={styles.modalContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {currentAssignmentItem && (
                <>
                  <Text style={[styles.quantityInfo, { color: colors.text }]}>
                    Available: {currentAssignmentItem.qty} | Remaining:{" "}
                    {getRemainingQuantity()}
                  </Text>

                  {/* Assign Equally Button */}
                  <TouchableOpacity
                    style={[
                      styles.equallyButton,
                      {
                        backgroundColor: colors.tint + "20",
                        borderColor: colors.tint,
                      },
                    ]}
                    onPress={assignEqually}
                  >
                    <Ionicons name="pie-chart" size={20} color={colors.tint} />
                    <Text
                      style={[styles.equallyButtonText, { color: colors.tint }]}
                    >
                      Assign Equally to All Participants
                    </Text>
                  </TouchableOpacity>

                  <Text
                    style={[
                      styles.participantsSectionTitle,
                      { color: colors.text },
                    ]}
                  >
                    Select Participants & Set Quantities:
                  </Text>

                  <View style={styles.assignmentParticipantsList}>
                    {friends
                      .filter((friend) =>
                        selectedParticipants.includes(friend.id)
                      )
                      .map((friend) => (
                        <TouchableOpacity
                          key={friend.id}
                          style={[
                            styles.assignmentParticipantItem,
                            {
                              borderColor: selectedFriends.includes(friend.id)
                                ? colors.tint
                                : colors.text + "20",
                              backgroundColor: selectedFriends.includes(
                                friend.id
                              )
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
                          <Text
                            style={[styles.friendName, { color: colors.text }]}
                          >
                            {friend.name}
                          </Text>
                          {selectedFriends.includes(friend.id) ? (
                            <View style={styles.quantityControls}>
                              <TouchableOpacity
                                style={[
                                  styles.quantityButton,
                                  { borderColor: colors.tint },
                                ]}
                                onPress={() => {
                                  const increment =
                                    currentAssignmentItem.qty === 1 ? 0.1 : 1;
                                  updateFriendQuantity(
                                    friend.id,
                                    Math.max(
                                      0,
                                      (friendQuantities[friend.id] || 1) -
                                        increment
                                    )
                                  );
                                }}
                              >
                                <Text
                                  style={[
                                    styles.quantityButtonText,
                                    { color: colors.tint },
                                  ]}
                                >
                                  -
                                </Text>
                              </TouchableOpacity>
                              <Text
                                style={[
                                  styles.quantityText,
                                  { color: colors.text },
                                ]}
                              >
                                {(friendQuantities[friend.id] || 0) % 1 === 0
                                  ? (
                                      friendQuantities[friend.id] || 0
                                    ).toString()
                                  : (friendQuantities[friend.id] || 0).toFixed(
                                      2
                                    )}
                              </Text>
                              <TouchableOpacity
                                style={[
                                  styles.quantityButton,
                                  {
                                    borderColor:
                                      getRemainingQuantity() <= 0
                                        ? colors.text + "30"
                                        : colors.tint,
                                    opacity:
                                      getRemainingQuantity() <= 0 ? 0.5 : 1,
                                  },
                                ]}
                                onPress={() => {
                                  if (getRemainingQuantity() > 0) {
                                    const increment =
                                      currentAssignmentItem.qty === 1 ? 0.1 : 1;
                                    updateFriendQuantity(
                                      friend.id,
                                      (friendQuantities[friend.id] || 0) +
                                        increment
                                    );
                                  }
                                }}
                                disabled={getRemainingQuantity() <= 0}
                              >
                                <Text
                                  style={[
                                    styles.quantityButtonText,
                                    {
                                      color:
                                        getRemainingQuantity() <= 0
                                          ? colors.text + "30"
                                          : colors.tint,
                                    },
                                  ]}
                                >
                                  +
                                </Text>
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <Ionicons
                              name="add-circle-outline"
                              size={20}
                              color={colors.text + "50"}
                            />
                          )}
                        </TouchableOpacity>
                      ))}
                  </View>

                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[
                        styles.modalButton,
                        {
                          backgroundColor:
                            colorScheme === "dark" ? "#3A3A3C" : "#f0f0f0",
                        },
                      ]}
                      onPress={() => {
                        closeAssignmentSheet();
                      }}
                    >
                      <Text
                        style={[
                          styles.modalCancelButtonText,
                          { color: colorScheme === "dark" ? "#fff" : "#666" },
                        ]}
                      >
                        Cancel
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.modalButton,
                        {
                          backgroundColor: canAssignItem()
                            ? colors.tint
                            : colors.text + "30",
                          opacity: canAssignItem() ? 1 : 0.5,
                        },
                      ]}
                      onPress={() => {
                        assignItemToFriends(currentAssignmentItem);
                        closeAssignmentSheet();
                      }}
                      disabled={!canAssignItem()}
                    >
                      <Text style={styles.saveButtonText}>Assign Item</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          </SafeAreaView>
        </View>
      </ActionSheet>

      {/* Participant Management Sheet */}
      <ActionSheet
        ref={participantSheetRef}
        containerStyle={{
          backgroundColor: colors.background,
        }}
        headerAlwaysVisible={true}
        gestureEnabled={true}
        closeOnPressBack={true}
        onClose={closeParticipantSheet}
      >
        <View
          style={[
            styles.bottomSheetContainer,
            {
              backgroundColor: colors.background,
              maxHeight: 450,
            },
          ]}
        >
          <SafeAreaView
            style={[
              styles.modalContainer,
              {
                backgroundColor: colors.background,
                maxHeight: 450,
              },
            ]}
          >
            <View
              style={[
                styles.modalHeader,
                {
                  borderBottomColor:
                    colorScheme === "dark" ? "#3c3c3e" : "#e0e0e0",
                },
              ]}
            >
              <TouchableOpacity onPress={closeParticipantSheet}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Add Participants ({selectedParticipants.length})
              </Text>
              <TouchableOpacity onPress={closeParticipantSheet}>
                <Text style={[styles.doneButtonText, { color: colors.tint }]}>
                  Done
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <TextInput
                style={[
                  styles.textInput,
                  { borderColor: colors.tint, color: colors.text },
                ]}
                value={participantSearchQuery}
                onChangeText={setParticipantSearchQuery}
                placeholder="Search friends or enter name..."
                placeholderTextColor={colors.text + "60"}
              />

              {/* Friends List */}
              <Text
                style={[
                  styles.selectedParticipantsTitle,
                  { color: colors.text, marginTop: 16 },
                ]}
              >
                {participantSearchQuery.trim()
                  ? "Search Results"
                  : "Select Participants"}
              </Text>

              <View style={styles.friendsList}>
                {filteredFriends.map((friend) => {
                  const isSelected = selectedParticipants.includes(friend.id);
                  return (
                    <TouchableOpacity
                      key={friend.id}
                      style={[
                        styles.participantFriendItem,
                        {
                          borderColor: isSelected
                            ? colors.tint
                            : colors.text + "20",
                          borderWidth: isSelected ? 2 : 1,
                          backgroundColor: isSelected
                            ? colors.tint + "10"
                            : "transparent",
                        },
                      ]}
                      onPress={() => toggleParticipant(friend.id)}
                    >
                      <View
                        style={[
                          styles.participantFriendAvatar,
                          { backgroundColor: friend.accentColor },
                        ]}
                      >
                        <Text style={styles.participantFriendInitial}>
                          {friend.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.participantFriendName,
                          { color: colors.text },
                        ]}
                      >
                        {friend.name}
                      </Text>
                      {isSelected && (
                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color={colors.tint}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}

                {filteredFriends.length === 0 &&
                  participantSearchQuery.trim() !== "" && (
                    <TouchableOpacity
                      style={[
                        styles.addNewFriendButton,
                        { borderColor: colors.tint },
                      ]}
                      onPress={() => addNewFriend(participantSearchQuery)}
                    >
                      <Ionicons
                        name="person-add"
                        size={20}
                        color={colors.tint}
                      />
                      <Text
                        style={[
                          styles.addNewFriendText,
                          { color: colors.tint },
                        ]}
                      >
                        Add &quot;{participantSearchQuery}&quot; as new friend
                      </Text>
                    </TouchableOpacity>
                  )}
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </ActionSheet>
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
    alignItems: "center",
  },
  progressStep: {
    alignItems: "center",
    position: "relative",
    flex: 1,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    zIndex: 2,
  },
  progressLine: {
    position: "absolute",
    top: 6,
    left: "50%",
    width: "100%",
    height: 2,
    borderRadius: 1,
    zIndex: 1,
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
  },
  loadingButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  sheet: {
    width: "100%",
    maxHeight: "80%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 8,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#00000020",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  sheetContent: {
    flex: 1,
    maxHeight: 400,
  },
  sheetInput: {
    height: 48,
    width: "100%",
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
    width: 60,
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    marginLeft: 8,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: "600",
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
    fontSize: 12,
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
  },
  friendHeaderLeft: {
    flexDirection: "row",
    flex: 1,
  },
  friendShareInfo: {
    flex: 1,
  },
  friendSubtotal: {
    fontSize: 12,
    opacity: 0.7,
  },
  friendShareAmount: {
    fontSize: 16,
    fontWeight: "bold",
  },
  breakdownSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  friendItemDetail: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 4,
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
  // Participant management styles
  participantsScroll: {
    flexGrow: 0,
    paddingVertical: 16,
  },
  participantsContainer: {
    paddingHorizontal: 0,
  },
  participantItem: {
    alignItems: "center",
    width: 60,
  },
  participantAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  participantInitial: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  removeIndicator: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
  },
  participantName: {
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
    width: 60,
  },
  emptyParticipants: {
    alignItems: "center",
    padding: 20,
    borderWidth: 1,
    borderRadius: 8,
    borderStyle: "dashed",
    borderColor: "#ccc",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  addParticipantButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  // Friend list styles (using different names to avoid duplicates)
  friendsList: {
    marginTop: 12,
  },
  participantFriendItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  participantFriendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  participantFriendInitial: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  participantFriendName: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  addNewFriendButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderWidth: 2,
    borderRadius: 8,
    borderStyle: "dashed",
    marginTop: 12,
  },
  addNewFriendText: {
    fontSize: 16,
    marginLeft: 8,
    fontWeight: "500",
  },
  // Selected participants styles
  selectedParticipantsSection: {
    marginTop: 16,
    marginBottom: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e0e0e0",
  },
  selectedParticipantsTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    opacity: 0.8,
  },
  selectedParticipantsScroll: {
    maxHeight: 60,
  },
  selectedParticipantChip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 8,
    maxWidth: 120,
    // backgroundColor will be set dynamically
  },
  selectedParticipantAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedParticipantInitial: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  selectedParticipantName: {
    fontSize: 12,
    marginLeft: 6,
    marginRight: 4,
    flex: 1,
  },
  removeParticipantButton: {
    padding: 2,
  },
  // Quantity assignment styles
  quantityInfo: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 16,
    textAlign: "center",
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "600",
    minWidth: 20,
    textAlign: "center",
  },
  // Assignment sheet styles
  equallyButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    justifyContent: "center",
  },
  equallyButtonText: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  participantsSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  assignmentParticipantsList: {
    marginBottom: 16,
  },
  assignmentParticipantItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  assignmentSheetActions: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  // Friend breakdown styles for share step
  friendBreakdownTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 4,
  },
  friendSubtotalLine: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    paddingLeft: 52,
  },
  friendSubtotalText: {
    fontSize: 14,
    marginBottom: 2,
  },
  // Enhanced Other Payments form styles
  formSection: {
    marginBottom: 20,
  },
  amountLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  amountInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  inputContainer: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  amountInputContainer: {
    flex: 1,
    flexGrow: 1,
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  priceInputWithPrefix: {
    paddingLeft: 40,
  },
  percentageSuffix: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  helpText: {
    fontSize: 12,
    fontStyle: "italic",
    textAlign: "center",
  },
  toggleExplanation: {
    fontSize: 11,
    lineHeight: 14,
    marginTop: 4,
    textAlign: "center",
    fontStyle: "italic",
  },
  // Enhanced Toggle Switch Styles
  toggleSwitchContainer: {
    flexDirection: "row",
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
    overflow: "hidden",
    height: 48,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  toggleOptionLeft: {
    borderTopLeftRadius: 7,
    borderBottomLeftRadius: 7,
    borderRightWidth: 0.5,
  },
  toggleOptionRight: {
    borderTopRightRadius: 7,
    borderBottomRightRadius: 7,
    borderLeftWidth: 0.5,
  },
  toggleOptionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  // Compact Toggle Switch Styles (for side-by-side layout)
  compactToggleContainer: {
    flexDirection: "row",
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
    height: 48,
    width: 120,
  },
  compactToggleOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  compactToggleLeft: {
    borderTopLeftRadius: 7,
    borderBottomLeftRadius: 7,
    borderRightWidth: 0.5,
  },
  compactToggleRight: {
    borderTopRightRadius: 7,
    borderBottomRightRadius: 7,
    borderLeftWidth: 0.5,
  },
  compactToggleText: {
    fontSize: 16,
    fontWeight: "700",
  },
  // Enhanced Amount Input Styles
  amountInputWrapper: {
    marginBottom: 20,
  },
  amountInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 0,
  },
  percentageInput: {
    paddingRight: 40,
    textAlign: "left",
  },
  amountInputWithPrefix: {
    paddingLeft: 50,
    textAlign: "left",
  },
  amountInputWithSuffix: {
    paddingRight: 40,
    textAlign: "left",
  },
  currencyPrefixContainer: {
    position: "absolute",
    left: 1,
    top: 1,
    bottom: 1,
    width: 48,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
    backgroundColor: "transparent",
  },
  percentageSuffixContainer: {
    position: "absolute",
    right: 1,
    top: 1,
    bottom: 1,
    width: 38,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
    backgroundColor: "transparent",
  },
  // Modal styles (matching friends.tsx)
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    minHeight: "40%",
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalContent: {
    padding: 24,
    flexShrink: 1, // Allow content to shrink if needed
    paddingBottom: 100,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  textInput: {
    height: 48,
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
    width: "100%",
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  buttonOpen: {
    backgroundColor: "#F194FF",
  },
  buttonClose: {
    backgroundColor: "#2196F3",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  bottomSheetContainer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 5,
    maxHeight: "80%",
  },
  // Toggle styles for bank info modal
  toggleSection: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
  },
  toggleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  toggleSwitch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 2,
    justifyContent: "center",
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  profileBankPreview: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
  },
  profileBankText: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  profileBankSubtext: {
    fontSize: 12,
  },
});
