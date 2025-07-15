import axios from "axios";
import { AssignedItem, Friend, OtherItem } from "../types";

// Base API configuration for Bagirata backend
const API_BASE_URL = "https://bagirata.sepiksel.com"; // Using the same endpoint as iOS app

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased timeout for recognition
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("Bagirata API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Types for recognition API
export interface RecognizeRequest {
  model: string; // The scanned text
}

export interface RecognizedItem {
  name: string;
  qty: number;
  price: number;
}

export interface RecognizedOtherPayment {
  name: string;
  type: "tax" | "addition" | "discount";
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

// Types for save split API
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
      subTotal: number;
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
}

export interface SaveSplitResponse {
  success: boolean;
  message: string;
  data: string; // Returns the slug
}

export class BagirataApiService {
  /**
   * Recognize receipt text and extract items using GPT
   */
  static async recognizeReceipt(
    scannedText: string
  ): Promise<RecognizeResponse> {
    try {
      const response = await apiClient.post<RecognizeResponse>(
        "/v1/recognize",
        {
          model: scannedText,
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("Recognize receipt error:", error);
      throw new Error("Failed to recognize receipt text");
    }
  }

  /**
   * Save split bill to backend
   */
  static async saveSplit(
    splitData: SaveSplitRequest
  ): Promise<SaveSplitResponse> {
    try {
      const response = await apiClient.post<SaveSplitResponse>(
        "/v1/splits",
        splitData
      );
      return response.data;
    } catch (error: any) {
      console.error("Save split error:", error);
      throw new Error("Failed to save split to backend");
    }
  }

  /**
   * Delete split bill from backend
   */
  static async deleteSplit(slug: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.delete(`/v1/splits/${slug}`);
      return response.data;
    } catch (error: any) {
      console.error("Delete split error:", error);
      throw new Error("Failed to delete split from backend");
    }
  }
}

// Helper function to convert app data to backend format
export const convertToBackendFormat = (
  splitData: {
    id: string;
    name: string;
    items: AssignedItem[];
    otherPayments: OtherItem[];
    createdAt: Date;
  },
  participants: Friend[],
  bankInfo?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  }
): SaveSplitRequest => {
  // Calculate totals for each friend
  const friendsData: SaveSplitRequest["friends"] = participants.map(
    (friend) => {
      const friendItems: any[] = [];
      const friendOthers: any[] = [];
      let subTotal = 0;
      let total = 0;

      // Calculate items for this friend
      splitData.items.forEach((item) => {
        const assignment = item.friends.find((f) => f.friendId === friend.id);
        if (assignment) {
          const itemSubTotal = item.price * assignment.qty;
          subTotal += itemSubTotal;
          friendItems.push({
            id: item.id,
            name: item.name,
            qty: assignment.qty,
            price: item.price,
            subTotal: itemSubTotal,
          });
        }
      });

      // Calculate other payments for this friend
      const totalItemsValue = splitData.items.reduce(
        (sum, item) => sum + item.price * item.qty,
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
          // Tax is calculated proportionally based on participant's item total
          friendAmount = (subTotal * amount) / totalItemsValue;
        } else {
          // Additions and discounts are split equally among participants
          friendAmount = amount / participantCount;
          if (other.type === "discount") {
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

  // Calculate grand total and subtotal
  const grandTotal = friendsData.reduce((sum, friend) => sum + friend.total, 0);
  const subTotalAmount = friendsData.reduce(
    (sum, friend) => sum + friend.subTotal,
    0
  );

  // Generate a simple slug from name and timestamp
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
  };
};

// Helper function to convert backend recognition to app format
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
