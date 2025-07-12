// Types for Bagirata React Native Split Bill App

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

export interface AssignedItem {
  id: string;
  name: string;
  qty: number;
  price: number;
  equal: boolean;
  friends: AssignedFriend[];
  createdAt: Date;
}

export interface OtherItem {
  id: string;
  name: string;
  type: "addition" | "discount" | "tax";
  usePercentage: boolean;
  amount: number;
  createdAt: Date;
}

export interface SplitItem {
  id: string;
  name: string;
  status: "draft" | "completed";
  friends: AssignedFriend[];
  items: AssignedItem[];
  otherPayments: OtherItem[];
  createdAt: Date;
}

export interface FriendItem {
  id: string;
  name: string;
  qty: number;
  price: number;
  subTotal: number;
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
  friends: SplittedFriend[];
  createdAt: Date;
}

export type TabType = "history" | "scan" | "friends";
export type SubTabType = "review" | "assign" | "split";

export interface NavigationState {
  selectedTab: TabType;
  currentSubTab: SubTabType;
  scannerResultActive: boolean;
  isLoading: boolean;
  showScanner: boolean;
  showAlertRecognizer: boolean;
  errMessage: string;
}
