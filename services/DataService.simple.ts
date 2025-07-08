import { Friend, SplitItem, Splitted } from "../types";

// Simple mock data service for split bill functionality
export class DataService {
  // Simple static methods with inline data
  static getAllSplittedBills(): Splitted[] {
    return [
      {
        id: "1",
        name: "Dinner at Warung Sari",
        friends: [
          {
            id: "1",
            friendId: "1",
            name: "John Doe",
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
            ],
            others: [],
            me: true,
            createdAt: new Date("2024-12-15").toISOString(),
          },
        ],
        createdAt: new Date("2024-12-15"),
      },
    ];
  }

  static getAllFriends(): Friend[] {
    return [
      {
        id: "1",
        name: "John Doe",
        me: true,
        accentColor: "#4A93CF",
        createdAt: new Date("2024-06-01"),
      },
      {
        id: "2",
        name: "Jenny Ruslan",
        me: false,
        accentColor: "#FF6B6B",
        createdAt: new Date("2024-06-02"),
      },
    ];
  }

  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  static formatDate(date: Date): string {
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  static getTotalSplitAmount(): number {
    return 150000; // Mock total
  }

  static getRandomAccentColor(): string {
    const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  static addFriend(friend: Omit<Friend, "id" | "createdAt">): Friend {
    return {
      ...friend,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
  }

  static updateFriend(
    id: string,
    updates: Partial<Friend>
  ): Friend | undefined {
    // Mock implementation
    return undefined;
  }

  static deleteFriend(id: string): boolean {
    // Mock implementation
    return true;
  }

  static getFriendSplitCount(friendId: string): number {
    return 2; // Mock count
  }

  static simulateSplitBillScan(): SplitItem {
    return {
      id: Date.now().toString(),
      name: "Dinner at Italian Restaurant",
      status: "draft",
      friends: [],
      items: [
        {
          id: "1",
          name: "Pizza",
          qty: 1,
          price: 85000,
          equal: true,
          friends: [],
          createdAt: new Date(),
        },
      ],
      otherPayments: [],
      createdAt: new Date(),
    };
  }
}
