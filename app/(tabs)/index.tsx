import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import HistoryDetailPage from "../../components/HistoryDetailPage";
import ProfileSheet from "../../components/ProfileSheet";
import { ThemedText } from "../../components/ThemedText";
import { ThemedView } from "../../components/ThemedView";
import { Colors } from "../../constants/Colors";
import { useUserProfile } from "../../contexts/UserProfileContext";
import { useColorScheme } from "../../hooks/useColorScheme";
import { DatabaseService } from "../../services/DatabaseService";
import { Friend, Splitted } from "../../types";
export default function HistoryScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const {
    userProfile,
    refreshUserProfile,
    updateUserProfile,
    needsProfileSetup,
  } = useUserProfile();

  const [allSplittedBills, setAllSplittedBills] = useState<Splitted[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [displayCount, setDisplayCount] = useState(5);
  const [showProfileSheet, setShowProfileSheet] = useState(false);
  const [selectedSplit, setSelectedSplit] = useState<Splitted | null>(null);
  const [showDetailPage, setShowDetailPage] = useState(false);

  // Function to reload splits data
  const reloadSplits = async () => {
    try {
      const bills = await DatabaseService.getAllSplittedBills();
      setAllSplittedBills(bills);
    } catch (error) {
      console.error("Error reloading splits:", error);
    }
  };

  // Initialize database and load data
  useEffect(() => {
    const initializeData = async () => {
      try {
        await DatabaseService.initializeDatabase();
        const bills = await DatabaseService.getAllSplittedBills();
        await refreshUserProfile();

        setAllSplittedBills(bills);

        // Show profile sheet only if user needs profile setup
        if (needsProfileSetup) {
          setShowProfileSheet(true);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        Alert.alert("Error", "Failed to load data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, [userProfile, refreshUserProfile, needsProfileSetup]);

  const formatCurrency = (amount: number) => {
    return DatabaseService.formatCurrency(amount);
  };

  const handleSplitPress = (split: Splitted) => {
    setSelectedSplit(split);
    setShowDetailPage(true);
  };
  const getTotalAmount = (split: Splitted): number => {
    return split.friends.reduce((sum, friend) => sum + (friend.total || 0), 0);
  };

  const displayedBills = allSplittedBills.slice(0, displayCount);
  const hasMoreBills = displayCount < allSplittedBills.length;

  const loadMoreBills = () => {
    setDisplayCount((prev) => Math.min(prev + 5, allSplittedBills.length));
  };
  const renderAvatarGroup = (friends: any[]) => {
    const maxShow = 2;
    const friendsToShow = friends.slice(0, maxShow);
    const remainingCount = friends.length - maxShow;
    return (
      <View style={styles.avatarGroup}>
        {friendsToShow.map((friend, index) => (
          <View
            key={friend.id}
            style={[
              styles.avatar,
              {
                backgroundColor: friend.accentColor,
                marginLeft: index > 0 ? -8 : 0,
                zIndex: maxShow - index,
                borderColor: colorScheme === "dark" ? "#2c2c2e" : "#fff",
              },
            ]}
          >
            <Text
              style={[
                styles.avatarText,
                { color: colorScheme === "dark" ? "#fff" : "#fff" },
              ]}
            >
              {friend.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        ))}
        {remainingCount > 0 && (
          <View
            style={[
              styles.avatar,
              styles.remainingAvatar,
              {
                borderColor: colorScheme === "dark" ? "#2c2c2e" : "#fff",
                backgroundColor: colorScheme === "dark" ? "#3A3A3C" : "#ccc",
              },
            ]}
          >
            <Text
              style={[
                styles.remainingText,
                { color: colorScheme === "dark" ? "#fff" : "#666" },
              ]}
            >
              +{remainingCount}
            </Text>
          </View>
        )}
      </View>
    );
  };
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <ThemedView style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerText}>
              <ThemedText type="title" style={styles.title}>
                Split Bill History
              </ThemedText>
              <ThemedText type="default" style={styles.subtitle}>
                Manage and view your split bill history
              </ThemedText>
            </View>
            <TouchableOpacity
              style={[
                styles.profileButton,
                {
                  backgroundColor:
                    colorScheme === "dark" ? "#3A3A3C" : colors.tint,
                },
              ]}
              onPress={() => setShowProfileSheet(true)}
            >
              {userProfile?.name ? (
                <Text
                  style={[
                    styles.profileButtonText,
                    { color: colorScheme === "dark" ? "#fff" : "#fff" },
                  ]}
                >
                  {userProfile.name.charAt(0).toUpperCase()}
                </Text>
              ) : (
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={colorScheme === "dark" ? "#fff" : "#fff"}
                />
              )}
            </TouchableOpacity>
          </View>
        </ThemedView>
        {/* Split Bills List */}
        <ThemedView style={styles.section}>
          {isLoading ? (
            <ThemedView style={styles.emptyState}>
              <Ionicons
                name="refresh-outline"
                size={48}
                color={colors.icon}
                style={styles.emptyIcon}
              />
              <ThemedText style={styles.emptyTitle}>
                Loading split bills...
              </ThemedText>
            </ThemedView>
          ) : allSplittedBills.length === 0 ? (
            <ThemedView style={styles.emptyState}>
              <Ionicons
                name="document-text-outline"
                size={48}
                color={colors.icon}
                style={styles.emptyIcon}
              />
              <ThemedText style={styles.emptyTitle}>
                No split bills yet
              </ThemedText>
              <ThemedText style={styles.emptySubtitle}>
                Start by scanning a receipt to create your first split bill
              </ThemedText>
            </ThemedView>
          ) : (
            <>
              {displayedBills.map((split: Splitted) => (
                <TouchableOpacity
                  key={split.id}
                  style={[
                    styles.splitCard,
                    {
                      backgroundColor:
                        colorScheme === "dark" ? "#262626" : "#f8f9fa",
                    },
                  ]}
                  onPress={() => handleSplitPress(split)}
                >
                  {/* Card Header */}
                  <View style={styles.splitHeader}>
                    <View style={styles.splitHeaderLeft}>
                      <View
                        style={[
                          styles.splitIcon,
                          {
                            backgroundColor:
                              colorScheme === "dark" ? "#3A3A3C" : "#f0f0f0",
                          },
                        ]}
                      >
                        <Ionicons
                          name="receipt-outline"
                          size={24}
                          color={colors.tint}
                        />
                      </View>
                      <View style={styles.splitInfo}>
                        <ThemedText
                          type="defaultSemiBold"
                          style={styles.splitName}
                        >
                          {split.name}
                        </ThemedText>
                        <ThemedText style={styles.splitDate}>
                          {DatabaseService.formatDate(split.createdAt)}
                        </ThemedText>
                      </View>
                    </View>
                  </View>

                  {/* Card Body */}
                  <View style={styles.splitBody}>
                    <View style={styles.splitAmount}>
                      {renderAvatarGroup(split.friends)}
                    </View>
                    <View style={styles.splitAmount}>
                      <ThemedText style={styles.totalLabel}>Total</ThemedText>
                      <ThemedText
                        style={[styles.totalAmount, { color: colors.text }]}
                      >
                        {formatCurrency(getTotalAmount(split))}
                      </ThemedText>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}

              {/* Load More Button */}
              {hasMoreBills && (
                <TouchableOpacity
                  style={[
                    styles.loadMoreButton,
                    {
                      backgroundColor:
                        colorScheme === "dark" ? "#3A3A3C" : "#E5E5E5",
                    },
                  ]}
                  onPress={loadMoreBills}
                >
                  <ThemedText
                    style={[
                      styles.loadMoreText,
                      { color: colorScheme === "dark" ? "#fff" : "#333" },
                    ]}
                  >
                    Load More
                  </ThemedText>
                </TouchableOpacity>
              )}
            </>
          )}
        </ThemedView>
      </ScrollView>
      {/* Profile Sheet Modal */}
      <Modal
        visible={showProfileSheet}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          if (userProfile) {
            setShowProfileSheet(false);
          }
        }}
      >
        <ProfileSheet
          onClose={() => setShowProfileSheet(false)}
          profile={userProfile}
          isFirstTime={!userProfile}
          onSave={async (updatedProfile: Friend) => {
            try {
              const success = await updateUserProfile(updatedProfile);
              if (success) {
                setShowProfileSheet(false);
              } else {
                Alert.alert(
                  "Error",
                  "Failed to save profile. Please try again."
                );
              }
            } catch (error) {
              console.error("Error saving profile:", error);
              Alert.alert("Error", "Failed to save profile. Please try again.");
            }
          }}
        />
      </Modal>

      {/* History Detail Page Modal */}
      {selectedSplit && (
        <HistoryDetailPage
          split={selectedSplit}
          visible={showDetailPage}
          onClose={() => {
            setShowDetailPage(false);
            setSelectedSplit(null);
          }}
          onSplitDeleted={reloadSplits}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  section: {
    marginBottom: 24,
    paddingBottom: 60,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: "center",
  },
  splitCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    position: "relative",
  },
  splitHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  splitHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  splitHeaderRight: {
    marginLeft: 12,
  },
  splitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  splitBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  totalLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  totalAmount: {
    fontSize: 14,
    fontWeight: "bold",
  },
  splitInfo: {
    flex: 1,
  },
  splitName: {
    fontSize: 16,
  },
  splitDate: {
    fontSize: 12,
    opacity: 0.7,
  },
  splitAmount: {
    alignItems: "flex-end",
  },
  myAmount: {
    fontSize: 16,
    fontWeight: "bold",
  },
  myLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  splitDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  avatarGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  remainingAvatar: {
    marginLeft: -8,
  },
  remainingText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  splitStats: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  friendCount: {
    fontSize: 12,
    opacity: 0.7,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerText: {
    flex: 1,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  profileButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  loadMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
    alignSelf: "center",
    paddingHorizontal: 24,
    marginBottom: 60,
  },
  loadMoreText: {
    fontSize: 16,
    fontWeight: "600",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  devToggle: {
    padding: 8,
  },
  devPanel: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: "#f0f8ff",
  },
  devPanelTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    color: "#333",
  },
  devButtonsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  devButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  devButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});
