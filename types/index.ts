// Types for Bagirata React Native Split Bill App

// ─── Currency ────────────────────────────────────────────────────────────────

export type CurrencyCode =
  | "IDR" | "JPY" | "CNY" | "KRW" | "USD" | "SGD" | "MYR"
  | "THB" | "PHP" | "VND" | "MMK" | "BND" | "KHR" | "LAK";

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string; // base64 compressed image
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

// ─── Friends ─────────────────────────────────────────────────────────────────

export interface Friend {
  id: string;
  name: string;
  me: boolean;
  accentColor: string;
  createdAt: Date;
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
}

export interface AssignedFriend {
  id: string;
  friendId: string;
  name: string;
  me: boolean;
  accentColor: string;
  qty: number;
  subTotal: number;
  createdAt: Date;
}

// ─── Items ───────────────────────────────────────────────────────────────────

export interface AssignedItem {
  id: string;
  name: string;
  qty: number;
  price: number;
  equal: boolean;
  friends: AssignedFriend[];
  discount: number;
  discountIsPercentage: boolean;
  createdAt: Date;
}

export type PaymentType = "addition" | "discount" | "tax" | "deduction";

export interface OtherItem {
  id: string;
  name: string;
  type: PaymentType;
  usePercentage: boolean;
  amount: number;
  createdAt: Date;
}

// ─── Split (in-progress creation) ────────────────────────────────────────────

export interface SplitItem {
  id: string;
  name: string;
  status: "draft" | "completed";
  friends: AssignedFriend[];
  items: AssignedItem[];
  otherPayments: OtherItem[];
  currency: CurrencyCode;
  createdAt: Date;
}

// ─── Splitted (final result) ─────────────────────────────────────────────────

export interface FriendItem {
  id: string;
  name: string;
  qty: number;
  price: number;
  subTotal: number;
  equal?: boolean;
  discount?: number;
  discountIsPercentage?: boolean;
}

export interface FriendOther {
  id: string;
  name: string;
  amount: number;
  price: number;
  type: string;
  usePercentage: boolean;
}

export interface SplittedFriend {
  id: string;
  friendId: string;
  name: string;
  accentColor: string;
  total: number;
  subTotal: number;
  items: FriendItem[];
  others: FriendOther[];
  me: boolean;
  createdAt: string;
}

export interface Splitted {
  id: string;
  name: string;
  slug?: string;
  shareUrl?: string;
  bankName?: string;
  bankAccount?: string;
  bankNumber?: string;
  subTotal?: number;
  grandTotal?: number;
  currencyCode?: CurrencyCode;
  groupId?: string;
  friends: SplittedFriend[];
  createdAt: Date;
}

// ─── API History ─────────────────────────────────────────────────────────────

export interface BagirataSummary {
  id: string;
  name: string;
  slug?: string;
  grandTotal: number;
  createdAt: string;
  friendCount: number;
  currencyCode?: string;
}

// ─── Groups ──────────────────────────────────────────────────────────────────

export interface GroupListItem {
  id: string;
  name: string;
  bankName?: string;
  bankAccount?: string;
  bankNumber?: string;
  shareSlug?: string;
  createdAt: string;
  splitCount?: number;
  currencyCode?: string;
}

export interface GroupSummaryParticipant {
  friendId: string;
  name: string;
  accentColor?: string;
  me: boolean;
  total: number;
}

export interface GroupSummarySplit {
  id: string;
  slug: string;
  name: string;
  grandTotal: number;
  createdAt: string;
}

export interface GroupSummary {
  id: string;
  name: string;
  currencyCode?: string;
  bankName?: string;
  bankAccount?: string;
  bankNumber?: string;
  shareSlug?: string;
  participants: GroupSummaryParticipant[];
  splits: GroupSummarySplit[];
}

export interface GroupDetail {
  id: string;
  name: string;
  currencyCode?: string;
  bankName?: string;
  bankAccount?: string;
  bankNumber?: string;
  shareSlug?: string;
  createdAt: string;
  splits: GroupSummarySplit[];
}

// ─── Navigation ──────────────────────────────────────────────────────────────

export type MainTab = "home" | "bagirata" | "profile";
export type SubTabs = "review" | "assign" | "split";

export interface NavigationState {
  selectedTab: MainTab;
  currentSubTab: SubTabs;
  scannerResultActive: boolean;
  isLoading: boolean;
  showScanner: boolean;
  showAlertRecognizer: boolean;
  errMessage: string;
}
