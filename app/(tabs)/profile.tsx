import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ActionSheet, { ActionSheetRef } from "react-native-actions-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ProfileSheet from "../../components/ProfileSheet";
import { BagirataColors, Colors } from "../../constants/Colors";
import { useAuth } from "../../contexts/AuthContext";
import { useUserProfile } from "../../contexts/UserProfileContext";
import { useColorScheme } from "../../hooks/useColorScheme";
import { DatabaseService } from "../../services/DatabaseService";
import { Friend } from "../../types";
import InlineAd from "../../components/InlineAd";

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();
  const { isAuthenticated, currentUser, logout, deleteAccount } = useAuth();
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
  const [showProfileSheet, setShowProfileSheet] = useState(false);

  const addFriendSheetRef = useRef<ActionSheetRef>(null);

  const loadData = useCallback(async () => {
    try {
      await DatabaseService.initializeDatabase();
      const allFriends = await DatabaseService.getAllFriends();
      await refreshUserProfile();

      const nonMeFriends = allFriends.filter((friend: Friend) => !friend.me);
      setFriends(nonMeFriends);

      const counts: Record<string, number> = {};
      for (const friend of nonMeFriends) {
        counts[friend.id] = await DatabaseService.getFriendSplitCount(
          friend.id,
        );
      }
      setFriendSplitCounts(counts);

      if (needsProfileSetup && !isAuthenticated) {
        setShowProfileSheet(true);
      }
    } catch (error) {
      console.error("Error loading friends:", error);
    }
  }, [refreshUserProfile, needsProfileSetup, isAuthenticated]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const closeAddFriendSheet = useCallback(() => {
    setEditingFriend(null);
    setNewFriendName("");
    addFriendSheetRef.current?.hide();
  }, []);

  const handleAddFriend = useCallback(async () => {
    if (newFriendName.trim()) {
      const newFriend = await DatabaseService.addFriend({
        name: newFriendName.trim(),
        me: false,
        accentColor: DatabaseService.getRandomAccentColor(),
      });
      if (newFriend) {
        loadData();
        closeAddFriendSheet();
      }
    }
  }, [newFriendName, loadData, closeAddFriendSheet]);

  const handleEditFriend = useCallback((friend: Friend) => {
    setEditingFriend(friend);
    setNewFriendName(friend.name);
    addFriendSheetRef.current?.show();
  }, []);

  const handleUpdateFriend = useCallback(async () => {
    if (editingFriend && newFriendName.trim()) {
      const updatedFriend = await DatabaseService.updateFriend(
        editingFriend.id,
        { name: newFriendName.trim() },
      );
      if (updatedFriend) {
        loadData();
        closeAddFriendSheet();
      }
    }
  }, [editingFriend, newFriendName, loadData, closeAddFriendSheet]);

  const handleDeleteFriend = useCallback(
    (friend: Friend) => {
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
        ],
      );
    },
    [loadData],
  );

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This action cannot be undone. All your data will be permanently deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: async () => {
            const success = await deleteAccount();
            if (!success) {
              Alert.alert("Error", "Failed to delete account.");
            }
          },
        },
      ],
    );
  };

  const openAddFriendModal = useCallback(() => {
    setEditingFriend(null);
    setNewFriendName("");
    addFriendSheetRef.current?.show();
  }, []);

  const modalStyles = useMemo(
    () => ({
      container: {
        backgroundColor: colors.background,
        height: 350,
        maxHeight: 450,
      },
      modalContainer: {
        backgroundColor: colors.background,
      },
      textInput: {
        borderColor: colors.tint,
        color: colors.text,
      },
      cancelButton: {
        backgroundColor: colorScheme === "dark" ? "#3A3A3C" : "#f0f0f0",
      },
      cancelButtonText: {
        color: colorScheme === "dark" ? "#fff" : "#666",
      },
      saveButton: {
        backgroundColor: colors.tint,
      },
    }),
    [colors.background, colors.tint, colors.text, colorScheme],
  );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={[styles.pageTitle, { color: colors.text }]}>Profile</Text>

        {/* Auth Profile Section */}
        {isAuthenticated && currentUser ? (
          <View
            style={[
              styles.profileCard,
              {
                backgroundColor: colorScheme === "dark" ? "#1E1E1E" : "#fff",
                borderColor: colorScheme === "dark" ? "#333" : "#E5E5E5",
              },
            ]}
          >
            <View
              style={[
                styles.profileAvatar,
                { backgroundColor: BagirataColors.primary },
              ]}
            >
              <Text style={styles.profileAvatarText}>
                {currentUser.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.text }]}>
                {currentUser.name}
              </Text>
              <Text
                style={[
                  styles.profileEmail,
                  { color: BagirataColors.secondaryText },
                ]}
              >
                {currentUser.email}
              </Text>
            </View>
          </View>
        ) : !isAuthenticated ? (
          <View
            style={[
              styles.loginPrompt,
              {
                backgroundColor: colorScheme === "dark" ? "#1E1E1E" : "#fff",
                borderColor: colorScheme === "dark" ? "#333" : "#E5E5E5",
              },
            ]}
          >
            <Ionicons
              name="person-circle-outline"
              size={48}
              color={BagirataColors.dimmed}
            />
            <Text style={[styles.loginPromptTitle, { color: colors.text }]}>
              Not Logged In
            </Text>
            <Text
              style={[
                styles.loginPromptSubtitle,
                { color: BagirataColors.secondaryText },
              ]}
            >
              Log in to sync your splits and access groups
            </Text>
            <Pressable
              style={styles.loginButton}
              onPress={() => router.push("/login")}
            >
              <Text style={styles.loginButtonText}>Log In</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Local Profile */}
        {myProfile && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Local Profile
            </Text>
            <TouchableOpacity
              style={[
                styles.friendCard,
                {
                  backgroundColor:
                    colorScheme === "dark" ? "#1E1E1E" : "#f8f9fa",
                  borderColor: BagirataColors.primary,
                  borderWidth: 1,
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
                <Text style={[styles.friendName, { color: colors.text }]}>
                  {myProfile.name} (You)
                </Text>
                <Text
                  style={[
                    styles.friendStats,
                    { color: BagirataColors.secondaryText },
                  ]}
                >
                  Your profile for split bills
                </Text>
              </View>
              <Ionicons name="pencil-outline" size={20} color={colors.icon} />
            </TouchableOpacity>
          </View>
        )}

        {/* Friends Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Friends ({friends.length})
            </Text>
            <Pressable
              style={styles.addFriendButton}
              onPress={openAddFriendModal}
            >
              <Ionicons
                name="person-add"
                size={18}
                color={BagirataColors.primary}
              />
            </Pressable>
          </View>

          {friends.length === 0 ? (
            <View style={styles.emptyFriends}>
              <Ionicons
                name="people-outline"
                size={36}
                color={BagirataColors.dimmed}
              />
              <Text
                style={[
                  styles.emptyFriendsText,
                  { color: BagirataColors.secondaryText },
                ]}
              >
                No friends yet. Add friends to split bills.
              </Text>
            </View>
          ) : (
            friends.map((friend) => (
              <TouchableOpacity
                key={friend.id}
                style={[
                  styles.friendCard,
                  {
                    backgroundColor:
                      colorScheme === "dark" ? "#1E1E1E" : "#f8f9fa",
                  },
                ]}
                onPress={() => handleEditFriend(friend)}
              >
                <View
                  style={[
                    styles.avatar,
                    { backgroundColor: friend.accentColor },
                  ]}
                >
                  <Text style={styles.avatarText}>
                    {friend.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.friendInfo}>
                  <Text style={[styles.friendName, { color: colors.text }]}>
                    {friend.name}
                  </Text>
                  <Text
                    style={[
                      styles.friendStats,
                      { color: BagirataColors.secondaryText },
                    ]}
                  >
                    {friendSplitCounts[friend.id] || 0} split bills together
                  </Text>
                </View>
                <Pressable
                  style={styles.deleteButton}
                  onPress={() => handleDeleteFriend(friend)}
                >
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={BagirataColors.dangerRed}
                  />
                </Pressable>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Ad */}
        <InlineAd />

        {/* Account Actions */}
        {isAuthenticated && (
          <View style={styles.section}>
            <Pressable style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons
                name="log-out-outline"
                size={20}
                color={BagirataColors.dangerRed}
              />
              <Text style={styles.logoutButtonText}>Log Out</Text>
            </Pressable>
            <Pressable
              style={styles.deleteAccountButton}
              onPress={handleDeleteAccount}
            >
              <Ionicons
                name="trash-outline"
                size={20}
                color={BagirataColors.dangerRed}
              />
              <Text style={styles.deleteAccountText}>Delete Account</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* ActionSheet for Add/Edit Friend */}
      <ActionSheet
        ref={addFriendSheetRef}
        containerStyle={{ backgroundColor: colors.background }}
        gestureEnabled={false}
        closeOnPressBack={true}
        onClose={closeAddFriendSheet}
      >
        <View style={[styles.bottomSheetContainer, modalStyles.container]}>
          <View
            style={[
              styles.modalContainer,
              modalStyles.modalContainer,
              { paddingBottom: insets.bottom },
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
              <TouchableOpacity onPress={closeAddFriendSheet}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingFriend ? "Edit Friend" : "Add Friend"}
              </Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView
              style={styles.modalContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.inputContainer}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={colors.icon}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.textInput, modalStyles.textInput]}
                  value={newFriendName}
                  onChangeText={setNewFriendName}
                  placeholder="Friend's name"
                  placeholderTextColor={colors.text + "60"}
                  returnKeyType="done"
                  onSubmitEditing={
                    editingFriend ? handleUpdateFriend : handleAddFriend
                  }
                  blurOnSubmit={true}
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, modalStyles.cancelButton]}
                  onPress={closeAddFriendSheet}
                >
                  <Text
                    style={[
                      styles.cancelButtonText,
                      modalStyles.cancelButtonText,
                    ]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, modalStyles.saveButton]}
                  onPress={editingFriend ? handleUpdateFriend : handleAddFriend}
                >
                  <Text style={styles.saveButtonText}>
                    {editingFriend ? "Update" : "Add"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </ActionSheet>

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
                Alert.alert("Error", "Failed to save profile.");
              }
            } catch (error) {
              Alert.alert("Error", "Failed to save profile.");
            }
          }}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
    marginBottom: 20,
    borderWidth: 1,
  },
  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  profileAvatarText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 14,
  },
  loginPrompt: {
    alignItems: "center",
    padding: 24,
    borderRadius: 14,
    marginBottom: 20,
    borderWidth: 1,
  },
  loginPromptTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 4,
  },
  loginPromptSubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 20,
  },
  loginButton: {
    backgroundColor: BagirataColors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 12,
  },
  addFriendButton: {
    padding: 8,
    marginBottom: 12,
  },
  friendCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  avatarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  friendStats: {
    fontSize: 13,
  },
  deleteButton: {
    padding: 8,
  },
  emptyFriends: {
    alignItems: "center",
    paddingVertical: 24,
  },
  emptyFriendsText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 10,
    backgroundColor: BagirataColors.errorBackground,
    gap: 8,
    marginBottom: 12,
  },
  logoutButtonText: {
    color: BagirataColors.dangerRed,
    fontSize: 15,
    fontWeight: "600",
  },
  deleteAccountButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 10,
    gap: 8,
  },
  deleteAccountText: {
    color: BagirataColors.dangerRed,
    fontSize: 14,
    fontWeight: "500",
  },
  // ActionSheet styles
  bottomSheetContainer: {
    paddingBottom: 20,
  },
  modalContainer: {
    flex: 1,
    paddingTop: 3,
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
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 6,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
