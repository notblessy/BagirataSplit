import axios from "axios";
import * as SecureStore from "expo-secure-store";
import {
  AssignedItem,
  BagirataSummary,
  CurrencyCode,
  Friend,
  GroupDetail,
  GroupListItem,
  GroupSummary,
  OtherItem,
  Splitted,
  User,
} from "../types";

// Base API configuration for Bagirata backend
const API_BASE_URL = "https://bagirapi.notblessy.com";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: inject auth token
apiClient.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // SecureStore not available (e.g., web)
  }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("Bagirata API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// ─── Recognition Types ───────────────────────────────────────────────────────

export interface RecognizeRequest {
  model: string;
}

export interface RecognizedItem {
  name: string;
  qty: number;
  price: number;
}

export interface RecognizedOtherPayment {
  name: string;
  type: "tax" | "addition" | "discount" | "deduction";
  amount: number;
  usePercentage: boolean;
}

export interface RecognizeResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    name: string;
    createdAt: string;
    items: RecognizedItem[];
    otherPayments: RecognizedOtherPayment[];
  };
}

// ─── Save Split Types ────────────────────────────────────────────────────────

export interface SaveSplitRequest {
  friends: {
    id: string;
    friendId: string;
    name: string;
    accentColor: string;
    total: number;
    subTotal: number;
    items: {
      id: string;
      name: string;
      qty: number;
      price: number;
      equal?: boolean;
      friendSubTotal: number;
      discount?: number;
      discountIsPercentage?: boolean;
    }[];
    others: {
      id: string;
      name: string;
      amount: number;
      price: number;
      type: string;
      usePercentage: boolean;
    }[];
    me: boolean;
    createdAt: string;
  }[];
  slug: string;
  id: string;
  name: string;
  bankName: string;
  bankAccount: string;
  bankNumber: string;
  createdAt: string;
  grandTotal: number;
  subTotal: number;
  currencyCode?: string;
  groupId?: string;
}

export interface SaveSplitResponse {
  success: boolean;
  message: string;
  data: string; // Returns the slug
}

// ─── Auth Types ──────────────────────────────────────────────────────────────

interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

interface MeResponse {
  success: boolean;
  message: string;
  data: User;
}

// ─── API Response Wrapper ────────────────────────────────────────────────────

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class BagirataApiService {
  // ── Auth ─────────────────────────────────────────────────────────────────

  static async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>("/auth/login", { email, password });
    return response.data;
  }

  static async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>("/auth/register", { email, password, name });
    return response.data;
  }

  static async getMe(): Promise<MeResponse> {
    const response = await apiClient.get<MeResponse>("/v1/auth/me");
    return response.data;
  }

  static async updateMe(updates: { name?: string; avatar?: string }): Promise<MeResponse> {
    const response = await apiClient.patch<MeResponse>("/v1/auth/me", updates);
    return response.data;
  }

  static async deleteMe(): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete("/v1/auth/me");
    return response.data;
  }

  // ── Recognition ──────────────────────────────────────────────────────────

  static async recognizeReceipt(scannedText: string): Promise<RecognizeResponse> {
    try {
      const response = await apiClient.post<RecognizeResponse>("/v1/recognize", {
        model: scannedText,
      });
      return response.data;
    } catch (error: any) {
      console.error("Recognize receipt error:", error);
      throw new Error("Failed to recognize receipt text");
    }
  }

  // ── Splits ───────────────────────────────────────────────────────────────

  static async saveSplit(splitData: SaveSplitRequest): Promise<SaveSplitResponse> {
    try {
      const response = await apiClient.post<SaveSplitResponse>("/v1/splits", splitData);
      return response.data;
    } catch (error: any) {
      console.error("Save split error:", error);
      throw new Error("Failed to save split to backend");
    }
  }

  static async deleteSplit(slug: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.delete(`/v1/splits/${slug}`);
      return response.data;
    } catch (error: any) {
      console.error("Delete split error:", error);
      throw new Error("Failed to delete split from backend");
    }
  }

  static async getHistory(
    page: number = 1,
    size: number = 10,
    search?: string
  ): Promise<ApiResponse<BagirataSummary[]>> {
    const params: Record<string, any> = { page, size };
    if (search) params.search = search;
    const response = await apiClient.get<ApiResponse<BagirataSummary[]>>("/v1/splits", { params });
    return response.data;
  }

  static async getSplitBySlug(slug: string): Promise<ApiResponse<Splitted>> {
    const response = await apiClient.get<ApiResponse<any>>(`/v1/splits/${slug}`);
    // Convert API response to app Splitted format
    const data = response.data.data;
    return {
      ...response.data,
      data: {
        ...data,
        createdAt: new Date(data.createdAt),
      },
    };
  }

  // ── Groups ───────────────────────────────────────────────────────────────

  static async getGroups(): Promise<ApiResponse<GroupListItem[]>> {
    const response = await apiClient.get<ApiResponse<GroupListItem[]>>("/v1/groups");
    return response.data;
  }

  static async createGroup(data: {
    name: string;
    bankName?: string;
    bankAccount?: string;
    bankNumber?: string;
    currencyCode?: string;
  }): Promise<ApiResponse<GroupListItem>> {
    const response = await apiClient.post<ApiResponse<GroupListItem>>("/v1/groups", data);
    return response.data;
  }

  static async getGroup(id: string): Promise<ApiResponse<GroupDetail>> {
    const response = await apiClient.get<ApiResponse<GroupDetail>>(`/v1/groups/${id}`);
    return response.data;
  }

  static async getGroupSummary(id: string): Promise<ApiResponse<GroupSummary>> {
    const response = await apiClient.get<ApiResponse<GroupSummary>>(`/v1/groups/${id}/summary`);
    return response.data;
  }

  static async updateGroup(
    id: string,
    data: {
      name?: string;
      bankName?: string;
      bankAccount?: string;
      bankNumber?: string;
      currencyCode?: string;
      generateShareSlug?: boolean;
    }
  ): Promise<ApiResponse<GroupDetail>> {
    const response = await apiClient.patch<ApiResponse<GroupDetail>>(`/v1/groups/${id}`, data);
    return response.data;
  }

  static async deleteGroup(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/v1/groups/${id}`);
    return response.data;
  }
}

// ─── Helper Functions ────────────────────────────────────────────────────────

// Helper to calculate item subtotal with discount
const calcItemSubTotal = (item: AssignedItem): number => {
  const base = item.qty * item.price;
  if (!item.discount || item.discount === 0) return base;
  const discountAmount = item.discountIsPercentage
    ? (base * item.discount) / 100
    : item.discount;
  return base - discountAmount;
};

const calcItemDiscountAmount = (item: AssignedItem): number => {
  if (!item.discount || item.discount === 0) return 0;
  const base = item.qty * item.price;
  return item.discountIsPercentage
    ? (base * item.discount) / 100
    : item.discount;
};

export const convertToBackendFormat = (
  splitData: {
    id: string;
    name: string;
    items: AssignedItem[];
    otherPayments: OtherItem[];
    createdAt: Date;
    currency?: CurrencyCode;
  },
  participants: Friend[],
  bankInfo?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  },
  groupId?: string
): SaveSplitRequest => {
  // Calculate totals for each friend
  const friendsData: SaveSplitRequest["friends"] = participants.map(
    (friend) => {
      const friendItems: SaveSplitRequest["friends"][0]["items"] = [];
      const friendOthers: SaveSplitRequest["friends"][0]["others"] = [];
      let subTotal = 0;
      let total = 0;

      // Calculate items for this friend
      splitData.items.forEach((item) => {
        const assignment = item.friends.find((f) => f.friendId === friend.id);
        if (assignment) {
          const itemTotal = calcItemSubTotal(item);
          const friendPortion = item.equal
            ? itemTotal / item.friends.length
            : (assignment.qty / item.qty) * itemTotal;
          subTotal += friendPortion;
          friendItems.push({
            id: item.id,
            name: item.name,
            qty: assignment.qty,
            price: item.price,
            equal: item.equal,
            friendSubTotal: friendPortion,
            discount: item.discount || 0,
            discountIsPercentage: item.discountIsPercentage || false,
          });
        }
      });

      // Calculate other payments for this friend
      const totalItemsValue = splitData.items.reduce(
        (sum, item) => sum + calcItemSubTotal(item),
        0
      );
      const participantCount = participants.length;

      splitData.otherPayments.forEach((other) => {
        let amount = other.amount;
        if (other.usePercentage) {
          amount = (totalItemsValue * other.amount) / 100;
        }

        let friendAmount = 0;
        if (other.type === "tax") {
          friendAmount = totalItemsValue > 0
            ? (subTotal * amount) / totalItemsValue
            : 0;
        } else {
          friendAmount = participantCount > 0 ? amount / participantCount : 0;
          if (other.type === "discount" || other.type === "deduction") {
            friendAmount = -friendAmount;
          }
        }

        friendOthers.push({
          id: other.id,
          name: other.name,
          amount: other.amount,
          price: friendAmount,
          type: other.type,
          usePercentage: other.usePercentage,
        });

        total += friendAmount;
      });

      total += subTotal;

      return {
        id: `${splitData.id}-${friend.id}`,
        friendId: friend.id,
        name: friend.name,
        accentColor: friend.accentColor,
        total,
        subTotal,
        items: friendItems,
        others: friendOthers,
        me: friend.me,
        createdAt: friend.createdAt.toISOString(),
      };
    }
  );

  const grandTotal = friendsData.reduce((sum, friend) => sum + friend.total, 0);
  const subTotalAmount = friendsData.reduce(
    (sum, friend) => sum + friend.subTotal,
    0
  );

  const slug = `${splitData.name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")}-${Date.now()}`;

  return {
    friends: friendsData,
    slug,
    id: splitData.id,
    name: splitData.name,
    bankName: bankInfo?.bankName || "",
    bankAccount: bankInfo?.accountName || "",
    bankNumber: bankInfo?.accountNumber || "",
    createdAt: splitData.createdAt.toISOString(),
    grandTotal,
    subTotal: subTotalAmount,
    currencyCode: splitData.currency || "IDR",
    groupId,
  };
};

export const convertRecognitionToAppFormat = (
  recognition: RecognizeResponse["data"]
): {
  items: Omit<AssignedItem, "id" | "createdAt" | "friends">[];
  otherPayments: Omit<OtherItem, "id" | "createdAt">[];
  splitName: string;
} => {
  return {
    items: recognition.items.map((item) => ({
      name: item.name,
      qty: item.qty,
      price: item.price,
      equal: false,
      friends: [],
      discount: 0,
      discountIsPercentage: false,
    })),
    otherPayments: recognition.otherPayments.map((other) => ({
      name: other.name,
      type: other.type,
      usePercentage: other.usePercentage,
      amount: other.amount,
    })),
    splitName: recognition.name,
  };
};
