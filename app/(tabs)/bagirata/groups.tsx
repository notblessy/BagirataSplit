import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ActionSheetRef } from "react-native-actions-sheet";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CreateGroupSheet, { CreateGroupData } from "../../../components/CreateGroupSheet";
import { BagirataColors, Colors } from "../../../constants/Colors";
import { useAuth } from "../../../contexts/AuthContext";
import { useColorScheme } from "../../../hooks/useColorScheme";
import { BagirataApiService } from "../../../services/BagirataApiService";
import { GroupListItem } from "../../../types";

export default function GroupsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();

  const [groups, setGroups] = useState<GroupListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const createGroupSheetRef = useRef<ActionSheetRef>(null!);


  const loadGroups = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    try {
      const response = await BagirataApiService.getGroups();
      if (response.success && response.data) {
        setGroups(response.data);
      }
    } catch (error) {
      console.error("Error loading groups:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadGroups();
    setIsRefreshing(false);
  }, [loadGroups]);

  const handleDeleteGroup = useCallback(
    (group: GroupListItem) => {
      Alert.alert("Delete Group", `Delete "${group.name}"?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await BagirataApiService.deleteGroup(group.id);
              loadGroups();
            } catch (error) {
              Alert.alert("Error", "Failed to delete group.");
            }
          },
        },
      ]);
    },
    [loadGroups]
  );

  const handleCreateGroup = () => {
    createGroupSheetRef.current?.show();
  };

  const handleCreateGroupSubmit = async (data: CreateGroupData) => {
    try {
      await BagirataApiService.createGroup(data);
      createGroupSheetRef.current?.hide();
      loadGroups();
    } catch (error) {
      Alert.alert("Error", "Failed to create group.");
    }
  };

  if (!isAuthenticated) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            paddingTop: insets.top,
          },
        ]}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Groups</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loginPrompt}>
          <Ionicons
            name="people-outline"
            size={48}
            color={BagirataColors.dimmed}
          />
          <Text style={[styles.loginTitle, { color: colors.text }]}>
            Log in to use Groups
          </Text>
          <Text
            style={[
              styles.loginSubtitle,
              { color: BagirataColors.secondaryText },
            ]}
          >
            Groups let you organize splits and track shared expenses
          </Text>
          <Pressable
            style={styles.loginButton}
            onPress={() => router.push("/login")}
          >
            <Text style={styles.loginButtonText}>Log In</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const renderItem = ({ item }: { item: GroupListItem }) => (
    <Pressable
      style={[
        styles.groupCard,
        {
          backgroundColor: colorScheme === "dark" ? "#1E1E1E" : "#fff",
          borderColor: colorScheme === "dark" ? "#333" : "#E5E5E5",
        },
      ]}
      onPress={() =>
        router.push({
          pathname: "/(tabs)/bagirata/group-detail",
          params: { groupId: item.id, groupName: item.name },
        })
      }
      onLongPress={() => handleDeleteGroup(item)}
    >
      <View style={styles.groupCardLeft}>
        <View
          style={[
            styles.groupIcon,
            {
              backgroundColor:
                colorScheme === "dark" ? "#2A2A2A" : BagirataColors.dimmedLight,
            },
          ]}
        >
          <Ionicons
            name="people"
            size={20}
            color={BagirataColors.primary}
          />
        </View>
        <View style={styles.groupInfo}>
          <Text
            style={[styles.groupName, { color: colors.text }]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <Text
            style={[
              styles.groupMeta,
              { color: BagirataColors.secondaryText },
            ]}
          >
            {item.splitCount ?? 0} splits
          </Text>
        </View>
      </View>
      <Ionicons
        name="chevron-forward"
        size={18}
        color={BagirataColors.secondaryText}
      />
    </Pressable>
  );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top,
        },
      ]}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.pageTitle, { color: colors.text }]}>Groups</Text>
        <Pressable onPress={handleCreateGroup} style={styles.addButton}>
          <Ionicons name="add" size={24} color={BagirataColors.primary} />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BagirataColors.primary} />
        </View>
      ) : (
        <FlatList
          data={groups}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onRefresh={handleRefresh}
          refreshing={isRefreshing}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons
                name="people-outline"
                size={48}
                color={BagirataColors.dimmed}
              />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No groups yet
              </Text>
              <Text
                style={[
                  styles.emptySubtitle,
                  { color: BagirataColors.secondaryText },
                ]}
              >
                Create a group to organize your splits
              </Text>
            </View>
          }
        />
      )}

      <CreateGroupSheet
        sheetRef={createGroupSheetRef}
        onSubmit={handleCreateGroupSubmit}
        onClose={() => createGroupSheetRef.current?.hide()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
    width: 40,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  addButton: {
    padding: 4,
    width: 40,
    alignItems: "flex-end",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  groupCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  groupCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  groupIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 15,
    fontWeight: "600",
  },
  groupMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 24,
  },
  loginPrompt: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loginTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 4,
  },
  loginSubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
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
});
