import { Friend, Splitted } from "../types";
import { DatabaseService } from "./DatabaseService";

export class DataService {
  // Initialize database
  static async initializeDatabase(): Promise<void> {
    await DatabaseService.initializeDatabase();
  }

  // Friends operations
  static async getAllFriends(): Promise<Friend[]> {
    return await DatabaseService.getAllFriends();
  }

  static async addFriend(
    friend: Omit<Friend, "id" | "createdAt">
  ): Promise<Friend> {
    return await DatabaseService.addFriend(friend);
  }

  static async updateFriend(
    id: string,
    updates: Partial<Friend>
  ): Promise<Friend | undefined> {
    return await DatabaseService.updateFriend(id, updates);
  }

  static async deleteFriend(id: string): Promise<boolean> {
    return await DatabaseService.deleteFriend(id);
  }

  static async deleteSplit(id: string): Promise<boolean> {
    return await DatabaseService.deleteSplit(id);
  }

  static async updateSplitShareInfo(
    id: string,
    slug?: string,
    shareUrl?: string
  ): Promise<boolean> {
    return await DatabaseService.updateSplitShareInfo(id, slug, shareUrl);
  }

  // Split bills operations
  static async getAllSplittedBills(): Promise<Splitted[]> {
    return await DatabaseService.getAllSplittedBills();
  }

  static async addSplittedBill(
    bill: Omit<Splitted, "id" | "createdAt">
  ): Promise<Splitted> {
    return await DatabaseService.addSplittedBill(bill);
  }

  static async getFriendSplitCount(friendId: string): Promise<number> {
    return await DatabaseService.getFriendSplitCount(friendId);
  }

  // User profile operations
  static async hasUserProfile(): Promise<boolean> {
    return await DatabaseService.hasUserProfile();
  }

  static async getUserProfile(): Promise<Friend | null> {
    return await DatabaseService.getUserProfile();
  }

  // Utility methods
  static formatCurrency(amount: number): string {
    return DatabaseService.formatCurrency(amount);
  }

  static formatDate(date: Date): string {
    return DatabaseService.formatDate(date);
  }

  static getRandomAccentColor(): string {
    return DatabaseService.getRandomAccentColor();
  }

  // Simulation method for scan functionality
  static simulateSplitBillScan(): Splitted {
    const mockFriends = [
      {
        id: "1",
        friendId: "1",
        name: "You",
        accentColor: "#4A93CF",
        total: 75000,
        subTotal: 65000,
        items: [
          {
            id: "1",
            name: "Nasi Gudeg",
            qty: 1,
            price: 15000,
            subTotal: 15000,
          },
          {
            id: "2",
            name: "Es Teh Manis",
            qty: 2,
            price: 5000,
            subTotal: 10000,
          },
        ],
        others: [],
        me: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: "2",
        friendId: "2",
        name: "Jenny Ruslan",
        accentColor: "#E35D75",
        total: 45000,
        subTotal: 40000,
        items: [
          {
            id: "3",
            name: "Ayam Bakar",
            qty: 1,
            price: 25000,
            subTotal: 25000,
          },
          {
            id: "4",
            name: "Es Jeruk",
            qty: 1,
            price: 8000,
            subTotal: 8000,
          },
        ],
        others: [],
        me: false,
        createdAt: new Date().toISOString(),
      },
    ];

    return {
      id: Date.now().toString(),
      name: "Scanned Receipt - " + new Date().toLocaleDateString(),
      friends: mockFriends,
      createdAt: new Date(),
    };
  }
}
