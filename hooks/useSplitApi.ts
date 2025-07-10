import useSWR from "swr";
import { useState, useCallback } from "react";
import {
  SplitApiService,
  RecognizeReceiptResponse,
  CreateSplitRequest,
  CreateSplitResponse,
  ShareSplitResponse,
} from "../services/SplitApiService";
import { SplitItem } from "../types";

/**
 * Hook for recognizing receipt from scanned image
 */
export function useRecognizeReceipt(imageBase64: string | null) {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<RecognizeReceiptResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recognize = useCallback(async (image: string) => {
    if (!image) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await SplitApiService.recognizeReceipt(image);
      setData(result);
    } catch (err: any) {
      setError(err.message || "Failed to recognize receipt");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-recognize when imageBase64 is provided
  useState(() => {
    if (imageBase64) {
      recognize(imageBase64);
    }
  });

  return {
    data,
    error,
    isLoading,
    recognize,
    reset: () => {
      setData(null);
      setError(null);
    },
  };
}

/**
 * Hook for creating and managing splits
 */
export function useSplitOperations() {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const createSplit = useCallback(
    async (splitData: CreateSplitRequest): Promise<CreateSplitResponse> => {
      setIsCreating(true);
      try {
        const result = await SplitApiService.createSplit(splitData);
        return result;
      } catch (error: any) {
        throw new Error(error.message || "Failed to create split");
      } finally {
        setIsCreating(false);
      }
    },
    []
  );

  const updateSplit = useCallback(
    async (
      splitId: string,
      splitData: Partial<CreateSplitRequest>
    ): Promise<CreateSplitResponse> => {
      setIsUpdating(true);
      try {
        const result = await SplitApiService.updateSplit(splitId, splitData);
        return result;
      } catch (error: any) {
        throw new Error(error.message || "Failed to update split");
      } finally {
        setIsUpdating(false);
      }
    },
    []
  );

  const generateShare = useCallback(
    async (splitId: string, includeQr = true): Promise<ShareSplitResponse> => {
      setIsSharing(true);
      try {
        const result = await SplitApiService.generateShare(splitId, includeQr);
        return result;
      } catch (error: any) {
        throw new Error(error.message || "Failed to generate share");
      } finally {
        setIsSharing(false);
      }
    },
    []
  );

  return {
    createSplit,
    updateSplit,
    generateShare,
    isCreating,
    isUpdating,
    isSharing,
  };
}

/**
 * Hook for getting split details
 */
export function useSplit(splitId: string | null) {
  const { data, error, mutate } = useSWR(
    splitId ? `split-${splitId}` : null,
    () => (splitId ? SplitApiService.getSplit(splitId) : null),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    split: data as SplitItem | undefined,
    isLoading: !error && !data && splitId,
    error,
    mutate,
  };
}

/**
 * Hook for user profile and bank info
 */
export function useUserProfile() {
  const { data, error, mutate } = useSWR(
    "user-profile",
    SplitApiService.getUserProfile,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  const [isUpdatingBank, setIsUpdatingBank] = useState(false);

  const updateBankInfo = useCallback(
    async (bankInfo: {
      bank_name: string;
      account_number: string;
      account_name: string;
    }) => {
      setIsUpdatingBank(true);
      try {
        await SplitApiService.updateBankInfo(bankInfo);
        mutate(); // Refresh profile data
      } catch (error: any) {
        throw new Error(error.message || "Failed to update bank info");
      } finally {
        setIsUpdatingBank(false);
      }
    },
    [mutate]
  );

  return {
    profile: data,
    isLoading: !error && !data,
    error,
    updateBankInfo,
    isUpdatingBank,
    mutate,
  };
}

/**
 * Legacy hook for backward compatibility (used in previous implementation)
 */
export function useSaveSplit() {
  const { createSplit, isCreating } = useSplitOperations();

  const saveSplit = useCallback(
    async (splitData: any) => {
      // Transform the data to match API format
      const apiData: CreateSplitRequest = {
        name: splitData.name,
        total_amount: splitData.totalAmount || 0,
        items: splitData.items || [],
        other_payments: splitData.otherPayments || [],
        friends: splitData.friends || [],
        bank_info: splitData.bankInfo,
      };

      return createSplit(apiData);
    },
    [createSplit]
  );

  return {
    saveSplit,
    isLoading: isCreating,
  };
}
