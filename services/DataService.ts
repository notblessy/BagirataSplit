import { Friend, SplitItem, Splitted } from "../types";

// In-memory storage for friends data (in a real app, use AsyncStorage or a database)
let friendsStore: Friend[] = [];
let nextFriendId = 1;

// Data service with proper CRUD functionality
export class DataService {
  // Simple static methods with inline data
  static getAllSplittedBills(): Splitted[] {
    return [
      {
        id: "1",
        name: "Dinner at Local Restaurant",
        friends: [
          {
            id: "1",
            friendId: "2",
            name: "Jenny Russell",
            accentColor: "#FF6B6B",
            total: 25000,
            subTotal: 25000,
            items: [],
            others: [],
            me: false,
            createdAt: new Date("2024-12-15").toISOString(),
          },
          {
            id: "2",
            friendId: "3",
            name: "Alex Chen",
            accentColor: "#4ECDC4",
            total: 25000,
            subTotal: 25000,
            items: [],
            others: [],
            me: false,
            createdAt: new Date("2024-12-15").toISOString(),
          },
        ],
        createdAt: new Date("2024-12-15"),
      },
      {
        id: "2",
        name: "Coffee Morning with Team",
        friends: [
          {
            id: "1",
            friendId: "2",
            name: "Jenny Russell",
            accentColor: "#FF6B6B",
            total: 15000,
            subTotal: 15000,
            items: [],
            others: [],
            me: false,
            createdAt: new Date("2024-12-14").toISOString(),
          },
        ],
        createdAt: new Date("2024-12-14"),
      },
      {
        id: "3",
        name: "Pizza Night",
        friends: [
          {
            id: "1",
            friendId: "2",
            name: "Jenny Russell",
            accentColor: "#FF6B6B",
            total: 30000,
            subTotal: 30000,
            items: [],
            others: [],
            me: false,
            createdAt: new Date("2024-12-13").toISOString(),
          },
          {
            id: "2",
            friendId: "3",
            name: "Alex Chen",
            accentColor: "#4ECDC4",
            total: 30000,
            subTotal: 30000,
            items: [],
            others: [],
            me: false,
            createdAt: new Date("2024-12-13").toISOString(),
          },
          {
            id: "3",
            friendId: "4",
            name: "Sarah Wilson",
            accentColor: "#45B7D1",
            total: 30000,
            subTotal: 30000,
            items: [],
            others: [],
            me: false,
            createdAt: new Date("2024-12-13").toISOString(),
          },
        ],
        createdAt: new Date("2024-12-13"),
      },
      {
        id: "4",
        name: "Spotify Premium Subscription",
        friends: [
          {
            id: "1",
            friendId: "2",
            name: "Jenny Russell",
            accentColor: "#FF6B6B",
            total: 16500,
            subTotal: 16500,
            items: [],
            others: [],
            me: false,
            createdAt: new Date("2024-12-12").toISOString(),
          },
          {
            id: "3",
            friendId: "3",
            name: "Alex Chen",
            accentColor: "#4ECDC4",
            total: 16500,
            subTotal: 16500,
            items: [],
            others: [],
            me: false,
            createdAt: new Date("2024-12-12").toISOString(),
          },
          {
            id: "4",
            friendId: "4",
            name: "Sarah Wilson",
            accentColor: "#45B7D1",
            total: 16500,
            subTotal: 16500,
            items: [],
            others: [],
            me: false,
            createdAt: new Date("2024-12-12").toISOString(),
          },
        ],
        createdAt: new Date("2024-12-12"),
      },
      {
        id: "5",
        name: "Weekend BBQ Party",
        friends: [
          {
            id: "1",
            friendId: "2",
            name: "Jenny Russell",
            accentColor: "#FF6B6B",
            total: 40000,
            subTotal: 40000,
            items: [],
            others: [],
            me: false,
            createdAt: new Date("2024-12-11").toISOString(),
          },
          {
            id: "2",
            friendId: "3",
            name: "Alex Chen",
            accentColor: "#4ECDC4",
            total: 40000,
            subTotal: 40000,
            items: [],
            others: [],
            me: false,
            createdAt: new Date("2024-12-11").toISOString(),
          },
        ],
        createdAt: new Date("2024-12-11"),
      },
      {
        id: "6",
        name: "Lunch at Sushi Restaurant",
        friends: [
          {
            id: "1",
            friendId: "2",
            name: "Jenny Russell",
            accentColor: "#FF6B6B",
            total: 55000,
            subTotal: 55000,
            items: [],
            others: [],
            me: false,
            createdAt: new Date("2024-12-10").toISOString(),
          },
        ],
        createdAt: new Date("2024-12-10"),
      },
      {
        id: "7",
        name: "Movie Night Snacks",
        friends: [
          {
            id: "1",
            friendId: "2",
            name: "Jenny Russell",
            accentColor: "#FF6B6B",
            total: 12000,
            subTotal: 12000,
            items: [],
            others: [],
            me: false,
            createdAt: new Date("2024-12-09").toISOString(),
          },
          {
            id: "3",
            friendId: "3",
            name: "Alex Chen",
            accentColor: "#4ECDC4",
            total: 12000,
            subTotal: 12000,
            items: [],
            others: [],
            me: false,
            createdAt: new Date("2024-12-09").toISOString(),
          },
          {
            id: "4",
            friendId: "4",
            name: "Sarah Wilson",
            accentColor: "#45B7D1",
            total: 12000,
            subTotal: 12000,
            items: [],
            others: [],
            me: false,
            createdAt: new Date("2024-12-09").toISOString(),
          },
          {
            id: "5",
            friendId: "5",
            name: "Mike Johnson",
            accentColor: "#96CEB4",
            total: 12000,
            subTotal: 12000,
            items: [],
            others: [],
            me: false,
            createdAt: new Date("2024-12-09").toISOString(),
          },
        ],
        createdAt: new Date("2024-12-09"),
      },
      {
        id: "8",
        name: "Office Birthday Cake",
        friends: [
          {
            id: "1",
            friendId: "2",
            name: "Jenny Russell",
            accentColor: "#FF6B6B",
            total: 8000,
            subTotal: 8000,
            items: [],
            others: [],
            me: false,
            createdAt: new Date("2024-12-08").toISOString(),
          },
          {
            id: "3",
            friendId: "3",
            name: "Alex Chen",
            accentColor: "#4ECDC4",
            total: 8000,
            subTotal: 8000,
            items: [],
            others: [],
            me: false,
            createdAt: new Date("2024-12-08").toISOString(),
          },
        ],
        createdAt: new Date("2024-12-08"),
      },
      {
        id: "9",
        name: "Gaming Tournament Drinks",
        friends: [
          {
            id: "1",
            friendId: "2",
            name: "Jenny Russell",
            accentColor: "#FF6B6B",
            total: 18000,
            subTotal: 18000,
            items: [],
            others: [],
            me: false,
            createdAt: new Date("2024-12-07").toISOString(),
          },
          {
            id: "3",
            friendId: "3",
            name: "Alex Chen",
            accentColor: "#4ECDC4",
            total: 18000,
            subTotal: 18000,
            items: [],
            others: [],
            me: false,
            createdAt: new Date("2024-12-07").toISOString(),
          },
          {
            id: "4",
            friendId: "4",
            name: "Sarah Wilson",
            accentColor: "#45B7D1",
            total: 18000,
            subTotal: 18000,
            items: [],
            others: [],
            me: false,
            createdAt: new Date("2024-12-07").toISOString(),
          },
        ],
        createdAt: new Date("2024-12-07"),
      },
      {
        id: "10",
        name: "Breakfast Meeting",
        friends: [
          {
            id: "1",
            friendId: "2",
            name: "Jenny Russell",
            accentColor: "#FF6B6B",
            total: 22500,
            subTotal: 22500,
            items: [],
            others: [],
            me: false,
            createdAt: new Date("2024-12-06").toISOString(),
          },
        ],
        createdAt: new Date("2024-12-06"),
      },
    ];
  }

  // Friends CRUD operations
  static getAllFriends(): Friend[] {
    return [...friendsStore];
  }

  static getMyProfile(): Friend | null {
    return friendsStore.find((friend) => friend.me) || null;
  }

  static addFriend(friend: Omit<Friend, "id" | "createdAt">): Friend {
    const newFriend: Friend = {
      ...friend,
      id: nextFriendId.toString(),
      createdAt: new Date(),
    };
    friendsStore.push(newFriend);
    nextFriendId++;
    return newFriend;
  }

  static updateFriend(
    id: string,
    updates: Partial<Omit<Friend, "id" | "createdAt">>
  ): Friend | null {
    const friendIndex = friendsStore.findIndex((friend) => friend.id === id);
    if (friendIndex === -1) {
      return null;
    }

    friendsStore[friendIndex] = {
      ...friendsStore[friendIndex],
      ...updates,
    };

    return friendsStore[friendIndex];
  }

  static deleteFriend(id: string): boolean {
    const friendIndex = friendsStore.findIndex((friend) => friend.id === id);
    if (friendIndex === -1) {
      return false;
    }

    // Don't allow deleting "me" profile
    if (friendsStore[friendIndex].me) {
      return false;
    }

    friendsStore.splice(friendIndex, 1);
    return true;
  }

  static getFriendSplitCount(friendId: string): number {
    // In a real implementation, this would count from split bills
    return Math.floor(Math.random() * 10) + 1;
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

  // Utility methods
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  static formatDate(date: Date): string {
    return date.toLocaleDateString("en-US", {
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
}
