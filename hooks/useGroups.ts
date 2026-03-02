import { useCallback, useEffect, useState } from "react";
import { BagirataApiService } from "../services/BagirataApiService";
import { useAuth } from "../contexts/AuthContext";
import { GroupListItem } from "../types";

export function useGroups() {
  const { isAuthenticated } = useAuth();
  const [groups, setGroups] = useState<GroupListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadGroups = useCallback(async () => {
    if (!isAuthenticated) {
      setGroups([]);
      return;
    }
    setIsLoading(true);
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

  const createGroup = useCallback(
    async (data: {
      name: string;
      bankName?: string;
      bankAccount?: string;
      bankNumber?: string;
      currencyCode?: string;
    }) => {
      try {
        const response = await BagirataApiService.createGroup(data);
        if (response.success) {
          await loadGroups();
          return true;
        }
        return false;
      } catch (error) {
        console.error("Error creating group:", error);
        return false;
      }
    },
    [loadGroups]
  );

  const deleteGroup = useCallback(
    async (groupId: string) => {
      try {
        await BagirataApiService.deleteGroup(groupId);
        await loadGroups();
        return true;
      } catch (error) {
        console.error("Error deleting group:", error);
        return false;
      }
    },
    [loadGroups]
  );

  return {
    groups,
    isLoading,
    loadGroups,
    createGroup,
    deleteGroup,
  };
}
