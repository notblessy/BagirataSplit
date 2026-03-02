import { useCallback, useEffect, useState } from "react";
import { BagirataApiService } from "../services/BagirataApiService";
import { DatabaseService } from "../services/DatabaseService";
import { eventService, REFRESH_HISTORY } from "../services/EventService";
import { useAuth } from "../contexts/AuthContext";
import { BagirataSummary, Splitted } from "../types";

const PAGE_SIZE = 10;

export function useHistory() {
  const { isAuthenticated } = useAuth();

  // Local splits
  const [localSplits, setLocalSplits] = useState<Splitted[]>([]);

  // API splits
  const [apiSplits, setApiSplits] = useState<BagirataSummary[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadLocalSplits = useCallback(async () => {
    try {
      await DatabaseService.initializeDatabase();
      const bills = await DatabaseService.getAllSplittedBills();
      setLocalSplits(bills);
    } catch (error) {
      console.error("Error loading local splits:", error);
    }
  }, []);

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

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setPage(1);
    if (isAuthenticated) {
      await loadApiSplits(1, searchQuery);
    } else {
      await loadLocalSplits();
    }
    setIsRefreshing(false);
  }, [isAuthenticated, searchQuery, loadApiSplits, loadLocalSplits]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || !isAuthenticated) return;
    setIsLoadingMore(true);
    const nextPage = page + 1;
    await loadApiSplits(nextPage, searchQuery, true);
    setPage(nextPage);
    setIsLoadingMore(false);
  }, [hasMore, isLoadingMore, isAuthenticated, page, searchQuery, loadApiSplits]);

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

  // Listen for refresh events
  useEffect(() => {
    const unsubscribe = eventService.on(REFRESH_HISTORY, refresh);
    return unsubscribe;
  }, [refresh]);

  // Search debounce
  useEffect(() => {
    if (!isAuthenticated) return;
    const timer = setTimeout(() => {
      setPage(1);
      loadApiSplits(1, searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, isAuthenticated, loadApiSplits]);

  return {
    localSplits,
    apiSplits,
    isLoading,
    isLoadingMore,
    isRefreshing,
    hasMore,
    searchQuery,
    setSearchQuery,
    refresh,
    loadMore,
  };
}
