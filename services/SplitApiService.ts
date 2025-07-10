import axios from "axios";
import { SplitItem, Friend, AssignedItem, OtherItem } from "../types";

// Base API configuration
const API_BASE_URL = "https://api.bagirata.com"; // Replace with your actual API endpoint

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor for authentication
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = null; // Get from secure storage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export interface RecognizeReceiptRequest {
  image_base64: string;
  language?: string;
}

export interface RecognizeReceiptResponse {
  success: boolean;
  data: {
    merchant_name: string;
    total_amount: number;
    items: {
      name: string;
      price: number;
      quantity: number;
    }[];
    tax?: number;
    service_charge?: number;
    discount?: number;
  };
  message?: string;
}

export interface CreateSplitRequest {
  name: string;
  total_amount: number;
  items: AssignedItem[];
  other_payments: OtherItem[];
  friends: Friend[];
  bank_info?: {
    bank_name: string;
    account_number: string;
    account_name: string;
  };
}

export interface CreateSplitResponse {
  success: boolean;
  data: {
    split_id: string;
    share_url: string;
    qr_code?: string;
  };
  message?: string;
}

export interface ShareSplitRequest {
  split_id: string;
  message?: string;
  include_qr?: boolean;
}

export interface ShareSplitResponse {
  success: boolean;
  data: {
    share_url: string;
    share_text: string;
    qr_code?: string;
  };
  message?: string;
}

export class SplitApiService {
  /**
   * Recognize receipt text and extract items
   */
  static async recognizeReceipt(
    imageBase64: string
  ): Promise<RecognizeReceiptResponse> {
    try {
      const response = await apiClient.post<RecognizeReceiptResponse>(
        "/receipts/recognize",
        {
          image_base64: imageBase64,
          language: "id", // Indonesian
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("Recognize receipt error:", error);
      throw new Error("Failed to recognize receipt");
    }
  }

  /**
   * Create a new split bill
   */
  static async createSplit(
    splitData: CreateSplitRequest
  ): Promise<CreateSplitResponse> {
    try {
      const response = await apiClient.post<CreateSplitResponse>(
        "/splits",
        splitData
      );
      return response.data;
    } catch (error: any) {
      console.error("Create split error:", error);
      throw new Error("Failed to create split");
    }
  }

  /**
   * Update an existing split
   */
  static async updateSplit(
    splitId: string,
    splitData: Partial<CreateSplitRequest>
  ): Promise<CreateSplitResponse> {
    try {
      const response = await apiClient.put<CreateSplitResponse>(
        `/splits/${splitId}`,
        splitData
      );
      return response.data;
    } catch (error: any) {
      console.error("Update split error:", error);
      throw new Error("Failed to update split");
    }
  }

  /**
   * Get split details
   */
  static async getSplit(splitId: string): Promise<SplitItem> {
    try {
      const response = await apiClient.get<{ data: SplitItem }>(
        `/splits/${splitId}`
      );
      return response.data.data;
    } catch (error: any) {
      console.error("Get split error:", error);
      throw new Error("Failed to get split details");
    }
  }

  /**
   * Generate share data for split
   */
  static async generateShare(
    splitId: string,
    includeQr = true
  ): Promise<ShareSplitResponse> {
    try {
      const response = await apiClient.post<ShareSplitResponse>(
        `/splits/${splitId}/share`,
        {
          include_qr: includeQr,
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("Generate share error:", error);
      throw new Error("Failed to generate share data");
    }
  }

  /**
   * Get user profile (for bank info)
   */
  static async getUserProfile(): Promise<any> {
    try {
      const response = await apiClient.get("/profile");
      return response.data;
    } catch (error: any) {
      console.error("Get profile error:", error);
      throw new Error("Failed to get user profile");
    }
  }

  /**
   * Update user bank info
   */
  static async updateBankInfo(bankInfo: {
    bank_name: string;
    account_number: string;
    account_name: string;
  }): Promise<any> {
    try {
      const response = await apiClient.put("/profile/bank-info", bankInfo);
      return response.data;
    } catch (error: any) {
      console.error("Update bank info error:", error);
      throw new Error("Failed to update bank info");
    }
  }
}
