import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ProfileSheet from "../../components/ProfileSheet";
import { ThemedText } from "../../components/ThemedText";
import { ThemedView } from "../../components/ThemedView";
import { Colors } from "../../constants/Colors";
import { useUserProfile } from "../../contexts/UserProfileContext";
import { useColorScheme } from "../../hooks/useColorScheme";
import { DatabaseService } from "../../services/DatabaseService";
import { Friend } from "../../types";

export default function FriendsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const {
    userProfile: myProfile,
    refreshUserProfile,
    updateUserProfile,
    needsProfileSetup,
  } = useUserProfile();

  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendSplitCounts, setFriendSplitCounts] = useState<
    Record<string, number>
  >({});
  const [newFriendName, setNewFriendName] = useState("");
  const [editingFriend, setEditingFriend] = useState<Friend | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [showProfileSheet, setShowProfileSheet] = useState(false);

  const loadData = useCallback(async () => {
    try {
      await DatabaseService.initializeDatabase();
      const allFriends = await DatabaseService.getAllFriends();
      await refreshUserProfile();

      const nonMeFriends = allFriends.filter((friend: Friend) => !friend.me);
      setFriends(nonMeFriends);

      // Load split counts for each friend
      const counts: Record<string, number> = {};
      for (const friend of nonMeFriends) {
        counts[friend.id] = await DatabaseService.getFriendSplitCount(
          friend.id
        );
      }
      setFriendSplitCounts(counts);

      // If profile setup is needed, show profile creation modal
      if (needsProfileSetup) {
        setShowProfileSheet(true);
      }
    } catch (error) {
      console.error("Error loading friends:", error);
      Alert.alert("Error", "Failed to load friends. Please try again.");
    }
  }, [refreshUserProfile, needsProfileSetup]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddFriend = async () => {
    if (newFriendName.trim()) {
      const newFriend = await DatabaseService.addFriend({
        name: newFriendName.trim(),
        me: false,
        accentColor: DatabaseService.getRandomAccentColor(),
      });
      if (newFriend) {
        loadData(); // Reload data to get fresh state
        setNewFriendName("");
        setIsModalVisible(false);
      }
    }
  };

  const handleEditFriend = (friend: Friend) => {
    setEditingFriend(friend);
    setNewFriendName(friend.name);
    setIsModalVisible(true);
  };

  const handleUpdateFriend = async () => {
    if (editingFriend && newFriendName.trim()) {
      const updatedFriend = await DatabaseService.updateFriend(
        editingFriend.id,
        {
          name: newFriendName.trim(),
        }
      );
      if (updatedFriend) {
        loadData();
        setNewFriendName("");
        setEditingFriend(null);
        setIsModalVisible(false);
      }
    }
  };

  const handleDeleteFriend = (friend: Friend) => {
    Alert.alert(
      "Delete Friend",
      `Are you sure you want to delete ${friend.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const success = await DatabaseService.deleteFriend(friend.id);
            if (success) {
              loadData();
            } else {
              Alert.alert("Error", "Failed to delete friend");
            }
          },
        },
      ]
    );
  };

  const openAddFriendModal = () => {
    setEditingFriend(null);
    setNewFriendName("");
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setEditingFriend(null);
    setNewFriendName("");
    setIsModalVisible(false);
  };

  const renderFriendCard = (friend: Friend) => (
    <TouchableOpacity
      key={friend.id}
      style={[
        styles.friendCard,
        { backgroundColor: colorScheme === "dark" ? "#2c2c2e" : "#f8f9fa" },
      ]}
      onPress={() => handleEditFriend(friend)}
    >
      <View style={[styles.avatar, { backgroundColor: friend.accentColor }]}>
        <Text style={styles.avatarText}>
          {friend.name.charAt(0).toUpperCase()}
        </Text>
      </View>

      <View style={styles.friendInfo}>
        <ThemedText type="defaultSemiBold" style={styles.friendName}>
          {friend.name}
        </ThemedText>
        <ThemedText style={styles.friendStats}>
          {friendSplitCounts[friend.id] || 0} split bills together
        </ThemedText>
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteFriend(friend)}
      >
        <Ionicons name="trash-outline" size={20} color="#ff4444" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

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
          <ThemedText type="title" style={styles.title}>
            Friends
          </ThemedText>
          <ThemedText type="default" style={styles.subtitle}>
            Manage your friends list for split bills
          </ThemedText>
        </ThemedView>

        {/* My Profile Section */}
        {myProfile && (
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              My Profile
            </ThemedText>
            <TouchableOpacity
              style={[
                styles.friendCard,
                styles.profileCard,
                {
                  backgroundColor:
                    colorScheme === "dark" ? "#2c2c2e" : "#f8f9fa",
                },
              ]}
              onPress={() => setShowProfileSheet(true)}
            >
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: myProfile.accentColor },
                ]}
              >
                <Text style={styles.avatarText}>
                  {myProfile.name.charAt(0).toUpperCase()}
                </Text>
              </View>

              <View style={styles.friendInfo}>
                <ThemedText type="defaultSemiBold" style={styles.friendName}>
                  {myProfile.name} (You)
                </ThemedText>
                <ThemedText style={styles.friendStats}>
                  Your profile for split bills
                </ThemedText>
              </View>

              <Ionicons name="pencil-outline" size={20} color={colors.icon} />
            </TouchableOpacity>
          </ThemedView>
        )}

        {/* Add Friend Button */}
        <TouchableOpacity
          style={[
            styles.addButton,
            {
              backgroundColor: colors.tint,
            },
          ]}
          onPress={openAddFriendModal}
        >
          <Ionicons
            name="person-add"
            size={20}
            color="#fff"
            style={styles.addButtonIcon}
          />
          <Text style={[styles.addButtonText, { color: "#fff" }]}>
            Add New Friend
          </Text>
        </TouchableOpacity>

        {/* Friends List */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Friends List ({friends.length})
          </ThemedText>

          {friends.length === 0 ? (
            <ThemedView style={styles.emptyState}>
              <Ionicons
                name="people-outline"
                size={48}
                color={colors.icon}
                style={styles.emptyIcon}
              />
              <ThemedText style={styles.emptyTitle}>No friends yet</ThemedText>
              <ThemedText style={styles.emptySubtitle}>
                Add friends to start splitting bills together
              </ThemedText>
            </ThemedView>
          ) : (
            friends.map(renderFriendCard)
          )}
        </ThemedView>
      </ScrollView>

      {/* Modal for Add/Edit Friend */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <SafeAreaView
          style={[
            styles.modalContainer,
            { backgroundColor: colors.background },
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
            <TouchableOpacity onPress={closeModal}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <ThemedText type="subtitle" style={styles.modalTitle}>
              {editingFriend
                ? editingFriend.me
                  ? "Edit My Profile"
                  : "Edit Friend"
                : "Add New Friend"}
            </ThemedText>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputContainer}>
              <Ionicons
                name="person-outline"
                size={20}
                color={colors.icon}
                style={styles.inputIcon}
              />
              <TextInput
                style={[
                  styles.textInput,
                  { borderColor: colors.tint, color: colors.text },
                ]}
                placeholder={editingFriend?.me ? "Your name" : "Friend's name"}
                placeholderTextColor={colors.icon}
                value={newFriendName}
                onChangeText={setNewFriendName}
                autoFocus
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={closeModal}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.tint }]}
                onPress={editingFriend ? handleUpdateFriend : handleAddFriend}
                disabled={!newFriendName.trim()}
              >
                <Text
                  style={[
                    styles.saveButtonText,
                    { opacity: newFriendName.trim() ? 1 : 0.5 },
                  ]}
                >
                  {editingFriend ? "Update" : "Add"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Profile Sheet Modal */}
      <Modal
        visible={showProfileSheet}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          if (myProfile) {
            setShowProfileSheet(false);
          }
        }}
      >
        <ProfileSheet
          onClose={() => setShowProfileSheet(false)}
          profile={myProfile}
          isFirstTime={!myProfile}
          onSave={async (updatedProfile: Friend) => {
            try {
              const success = await updateUserProfile(updatedProfile);
              if (success) {
                loadData();
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
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  addButtonIcon: {
    marginRight: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  friendCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    marginBottom: 4,
  },
  friendStats: {
    fontSize: 14,
    opacity: 0.7,
  },
  deleteButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: "center",
    padding: 32,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: "center",
    lineHeight: 20,
  },
  sheetContent: {
    flex: 1,
    padding: 24,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 16,
  },
  sheetButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sheetButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 6,
  },
  modalContainer: {
    flex: 1,
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
  modalContent: {
    flex: 1,
    padding: 24,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 6,
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  profileCard: {
    borderWidth: 2,
    borderColor: "#4ECDC4",
  },
});
