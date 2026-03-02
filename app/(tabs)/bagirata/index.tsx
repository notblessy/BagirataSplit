import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import HistoryDetailPage from "../../../components/HistoryDetailPage";
import { BagirataColors, Colors } from "../../../constants/Colors";
import { useAuth } from "../../../contexts/AuthContext";
import { useColorScheme } from "../../../hooks/useColorScheme";
import { BagirataApiService } from "../../../services/BagirataApiService";
import { DatabaseService } from "../../../services/DatabaseService";
import { BagirataSummary, Splitted } from "../../../types";
import InlineAd from "../../../components/InlineAd";

export default function BagirataListScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();

  // Local splits (SQLite)
  const [localSplits, setLocalSplits] = useState<Splitted[]>([]);

  // API splits (paginated)
  const [apiSplits, setApiSplits] = useState<BagirataSummary[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Detail modal
  const [selectedSplit, setSelectedSplit] = useState<Splitted | null>(null);
  const [showDetailPage, setShowDetailPage] = useState(false);

  const PAGE_SIZE = 10;

  // Load local splits from SQLite
  const loadLocalSplits = useCallback(async () => {
    try {
      await DatabaseService.initializeDatabase();
      const bills = await DatabaseService.getAllSplittedBills();
      setLocalSplits(bills);
    } catch (error) {
      console.error("Error loading local splits:", error);
    }
  }, []);

  // Load API splits (paginated)
  const loadApiSplits = useCallback(
    async (pageNum: number, search?: string, append = false) => {
      try {
        const response = await BagirataApiService.getHistory(
          pageNum,
          PAGE_SIZE,
          search || undefined
        );
        if (response.success && response.data) {
          if (append) {
            setApiSplits((prev) => [...prev, ...response.data]);
          } else {
            setApiSplits(response.data);
          }
          setHasMore(response.data.length === PAGE_SIZE);
        } else {
          setHasMore(false);
        }
      } catch (error) {
        console.error("Error loading API splits:", error);
      }
    },
    []
  );

  // Initial load
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      if (isAuthenticated) {
        await loadApiSplits(1);
      } else {
        await loadLocalSplits();
      }
      setIsLoading(false);
    };
    init();
  }, [isAuthenticated, loadApiSplits, loadLocalSplits]);

  // Search with debounce
  useEffect(() => {
    if (!isAuthenticated) return;
    const timer = setTimeout(() => {
      setPage(1);
      loadApiSplits(1, searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, isAuthenticated, loadApiSplits]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setPage(1);
    if (isAuthenticated) {
      await loadApiSplits(1, searchQuery);
    } else {
      await loadLocalSplits();
    }
    setIsRefreshing(false);
  }, [isAuthenticated, searchQuery, loadApiSplits, loadLocalSplits]);

  const handleLoadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || !isAuthenticated) return;
    setIsLoadingMore(true);
    const nextPage = page + 1;
    await loadApiSplits(nextPage, searchQuery, true);
    setPage(nextPage);
    setIsLoadingMore(false);
  }, [hasMore, isLoadingMore, isAuthenticated, page, searchQuery, loadApiSplits]);

  const handleDeleteLocalSplit = useCallback(
    (split: Splitted) => {
      Alert.alert(
        "Delete Split",
        `Delete "${split.name}"?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                await DatabaseService.deleteSplit(split.id);
                loadLocalSplits();
              } catch (error) {
                Alert.alert("Error", "Failed to delete split.");
              }
            },
          },
        ]
      );
    },
    [loadLocalSplits]
  );

  const handleSplitPress = (split: Splitted) => {
    setSelectedSplit(split);
    setShowDetailPage(true);
  };

  const getTotalAmount = (split: Splitted): number => {
    return split.friends.reduce((sum, friend) => sum + (friend.total || 0), 0);
  };

  // Filtered local splits for non-auth users
  const filteredLocalSplits = searchQuery
    ? localSplits.filter((s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : localSplits;

  const renderLocalItem = ({ item }: { item: Splitted }) => (
    <Pressable
      style={[
        styles.splitCard,
        {
          backgroundColor: colorScheme === "dark" ? "#1E1E1E" : "#fff",
          borderColor: colorScheme === "dark" ? "#333" : "#E5E5E5",
        },
      ]}
      onPress={() => handleSplitPress(item)}
      onLongPress={() => handleDeleteLocalSplit(item)}
    >
      <View style={styles.splitCardLeft}>
        <View
          style={[
            styles.splitIcon,
            {
              backgroundColor:
                colorScheme === "dark" ? "#2A2A2A" : BagirataColors.dimmedLight,
            },
          ]}
        >
          <Ionicons
            name="document-text-outline"
            size={20}
            color={BagirataColors.primary}
          />
        </View>
        <View style={styles.splitInfo}>
          <Text
            style={[styles.splitName, { color: colors.text }]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <Text
            style={[styles.splitDate, { color: BagirataColors.secondaryText }]}
          >
            {DatabaseService.formatDate(item.createdAt)} &middot;{" "}
            {item.friends.length} friends
          </Text>
        </View>
      </View>
      <Text style={[styles.splitTotal, { color: BagirataColors.primary }]}>
        {DatabaseService.formatCurrency(getTotalAmount(item), item.currencyCode)}
      </Text>
    </Pressable>
  );

  const renderApiItem = ({ item }: { item: BagirataSummary }) => (
    <Pressable
      style={[
        styles.splitCard,
        {
          backgroundColor: colorScheme === "dark" ? "#1E1E1E" : "#fff",
          borderColor: colorScheme === "dark" ? "#333" : "#E5E5E5",
        },
      ]}
      onPress={() => {
        // For API splits, we could navigate to a detail view using slug
        // For now, show a simple info
      }}
    >
      <View style={styles.splitCardLeft}>
        <View
          style={[
            styles.splitIcon,
            {
              backgroundColor:
                colorScheme === "dark" ? "#2A2A2A" : BagirataColors.dimmedLight,
            },
          ]}
        >
          <Ionicons
            name="document-text-outline"
            size={20}
            color={BagirataColors.primary}
          />
        </View>
        <View style={styles.splitInfo}>
          <Text
            style={[styles.splitName, { color: colors.text }]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <Text
            style={[styles.splitDate, { color: BagirataColors.secondaryText }]}
          >
            {new Date(item.createdAt).toLocaleDateString()} &middot;{" "}
            {item.friendCount} friends
          </Text>
        </View>
      </View>
      <Text style={[styles.splitTotal, { color: BagirataColors.primary }]}>
        {DatabaseService.formatCurrency(
          item.grandTotal,
          (item.currencyCode as any) || "IDR"
        )}
      </Text>
    </Pressable>
  );

  const renderHeader = () => (
    <View>
      {/* Ad */}
      <InlineAd />

      {/* Groups Entry */}
      {isAuthenticated && (
        <Pressable
          style={[
            styles.groupsCard,
            {
              backgroundColor: colorScheme === "dark" ? "#1E1E1E" : "#fff",
              borderColor: colorScheme === "dark" ? "#333" : "#E5E5E5",
            },
          ]}
          onPress={() => router.push("/(tabs)/bagirata/groups")}
        >
          <View style={styles.groupsLeft}>
            <View
              style={[
                styles.groupsIcon,
                {
                  backgroundColor:
                    colorScheme === "dark" ? "#2A2A2A" : BagirataColors.dimmedLight,
                },
              ]}
            >
              <Ionicons
                name="people-outline"
                size={22}
                color={BagirataColors.primary}
              />
            </View>
            <View>
              <Text style={[styles.groupsTitle, { color: colors.text }]}>
                Groups
              </Text>
              <Text
                style={[
                  styles.groupsSubtitle,
                  { color: BagirataColors.secondaryText },
                ]}
              >
                Manage split groups
              </Text>
            </View>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={BagirataColors.secondaryText}
          />
        </Pressable>
      )}
    </View>
  );

  const renderEmpty = () => {
    if (isLoading) return null;

    if (!isAuthenticated) {
      return (
        <View style={styles.emptyState}>
          <Ionicons
            name="receipt-outline"
            size={48}
            color={BagirataColors.dimmed}
          />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {localSplits.length === 0
              ? "No split bills yet"
              : "No results found"}
          </Text>
          <Text
            style={[styles.emptySubtitle, { color: BagirataColors.secondaryText }]}
          >
            {localSplits.length === 0
              ? "Your local split history will appear here"
              : "Try a different search term"}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Ionicons
          name="cloud-outline"
          size={48}
          color={BagirataColors.dimmed}
        />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          No splits found
        </Text>
        <Text
          style={[styles.emptySubtitle, { color: BagirataColors.secondaryText }]}
        >
          {searchQuery
            ? "Try a different search term"
            : "Your shared splits will appear here"}
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={BagirataColors.primary} />
      </View>
    );
  };

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
      {/* Title */}
      <View style={styles.titleRow}>
        <Text style={[styles.pageTitle, { color: colors.text }]}>Bagirata</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor:
                colorScheme === "dark" ? "#1E1E1E" : BagirataColors.dimmedLight,
            },
          ]}
        >
          <Ionicons
            name="search-outline"
            size={18}
            color={BagirataColors.secondaryText}
          />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search splits..."
            placeholderTextColor={BagirataColors.secondaryText}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")}>
              <Ionicons
                name="close-circle"
                size={18}
                color={BagirataColors.secondaryText}
              />
            </Pressable>
          )}
        </View>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BagirataColors.primary} />
        </View>
      ) : isAuthenticated ? (
        <FlatList
          data={apiSplits}
          renderItem={renderApiItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          onRefresh={handleRefresh}
          refreshing={isRefreshing}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={filteredLocalSplits}
          renderItem={renderLocalItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          onRefresh={handleRefresh}
          refreshing={isRefreshing}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* History Detail Modal */}
      {selectedSplit && (
        <HistoryDetailPage
          split={selectedSplit}
          visible={showDetailPage}
          onClose={() => {
            setShowDetailPage(false);
            setSelectedSplit(null);
          }}
          onSplitDeleted={handleRefresh}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titleRow: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "bold",
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
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
  groupsCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  groupsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  groupsIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  groupsTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  groupsSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  splitCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  splitCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  splitIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  splitInfo: {
    flex: 1,
  },
  splitName: {
    fontSize: 15,
    fontWeight: "600",
  },
  splitDate: {
    fontSize: 12,
    marginTop: 2,
  },
  splitTotal: {
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 8,
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
  loadingMore: {
    paddingVertical: 16,
    alignItems: "center",
  },
});
