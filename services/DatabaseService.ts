import * as SQLite from "expo-sqlite";
import { Friend, Splitted } from "../types";

export class DatabaseService {
  private static db: SQLite.SQLiteDatabase | null = null;

  // Initialize database
  static async initializeDatabase(): Promise<void> {
    try {
      this.db = SQLite.openDatabaseSync("splitbill.db");
      await this.createTables();
      await this.seedInitialData();
    } catch (error) {
      console.error("Error initializing database:", error);
      throw error;
    }
  }

  // Create database tables
  private static async createTables(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    // Friends table
    this.db.execSync(`
      CREATE TABLE IF NOT EXISTS friends (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        me INTEGER NOT NULL DEFAULT 0,
        accentColor TEXT NOT NULL,
        createdAt TEXT NOT NULL
      );
    `);

    // Split bills table
    this.db.execSync(`
      CREATE TABLE IF NOT EXISTS split_bills (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        createdAt TEXT NOT NULL
      );
    `);

    // Split bill friends (junction table)
    this.db.execSync(`
      CREATE TABLE IF NOT EXISTS split_bill_friends (
        id TEXT PRIMARY KEY,
        splitBillId TEXT NOT NULL,
        friendId TEXT NOT NULL,
        name TEXT NOT NULL,
        accentColor TEXT NOT NULL,
        total REAL NOT NULL DEFAULT 0,
        subTotal REAL NOT NULL DEFAULT 0,
        me INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (splitBillId) REFERENCES split_bills (id) ON DELETE CASCADE,
        FOREIGN KEY (friendId) REFERENCES friends (id) ON DELETE CASCADE
      );
    `);
  }

  // Seed initial data
  private static async seedInitialData(): Promise<void> {
    if (!this.db) return;

    // Check if data already exists
    const friendsCount = this.db.getFirstSync(
      "SELECT COUNT(*) as count FROM friends"
    );
    if ((friendsCount as any)?.count > 0) return;

    // Insert initial friends (no "me" profile - user will create their own)
    const friends = [
      {
        id: "2",
        name: "Jenny Russell",
        me: 0,
        accentColor: "#FF6B6B",
        createdAt: new Date("2024-06-02").toISOString(),
      },
      {
        id: "3",
        name: "Alex Chen",
        me: 0,
        accentColor: "#4ECDC4",
        createdAt: new Date("2024-06-03").toISOString(),
      },
      {
        id: "4",
        name: "Sarah Wilson",
        me: 0,
        accentColor: "#45B7D1",
        createdAt: new Date("2024-06-04").toISOString(),
      },
      {
        id: "5",
        name: "Mike Johnson",
        me: 0,
        accentColor: "#96CEB4",
        createdAt: new Date("2024-06-05").toISOString(),
      },
    ];

    for (const friend of friends) {
      this.db.runSync(
        "INSERT INTO friends (id, name, me, accentColor, createdAt) VALUES (?, ?, ?, ?, ?)",
        [
          friend.id,
          friend.name,
          friend.me,
          friend.accentColor,
          friend.createdAt,
        ]
      );
    }

    // Insert split bills data
    const splitBills = [
      {
        id: "1",
        name: "Dinner at Local Restaurant",
        createdAt: new Date("2024-12-15").toISOString(),
      },
      {
        id: "2",
        name: "Coffee Morning with Team",
        createdAt: new Date("2024-12-14").toISOString(),
      },
      {
        id: "3",
        name: "Pizza Night",
        createdAt: new Date("2024-12-13").toISOString(),
      },
      {
        id: "4",
        name: "Spotify Premium Subscription",
        createdAt: new Date("2024-12-12").toISOString(),
      },
      {
        id: "5",
        name: "Weekend BBQ Party",
        createdAt: new Date("2024-12-11").toISOString(),
      },
      {
        id: "6",
        name: "Lunch at Sushi Restaurant",
        createdAt: new Date("2024-12-10").toISOString(),
      },
      {
        id: "7",
        name: "Movie Night Snacks",
        createdAt: new Date("2024-12-09").toISOString(),
      },
      {
        id: "8",
        name: "Office Birthday Cake",
        createdAt: new Date("2024-12-08").toISOString(),
      },
      {
        id: "9",
        name: "Gaming Tournament Drinks",
        createdAt: new Date("2024-12-07").toISOString(),
      },
      {
        id: "10",
        name: "Breakfast Meeting",
        createdAt: new Date("2024-12-06").toISOString(),
      },
    ];

    for (const bill of splitBills) {
      this.db.runSync(
        "INSERT INTO split_bills (id, name, createdAt) VALUES (?, ?, ?)",
        [bill.id, bill.name, bill.createdAt]
      );
    }

    // Insert split bill friends data
    const splitBillFriends = [
      // Dinner at Local Restaurant (3 friends)
      {
        id: "1-1",
        splitBillId: "1",
        friendId: "2",
        name: "Jenny Russell",
        accentColor: "#FF6B6B",
        total: 25000,
        subTotal: 65000,
        me: 0,
        createdAt: new Date("2024-12-15").toISOString(),
      },
      {
        id: "1-2",
        splitBillId: "1",
        friendId: "3",
        name: "Alex Chen",
        accentColor: "#4ECDC4",
        total: 25000,
        subTotal: 25000,
        me: 0,
        createdAt: new Date("2024-12-15").toISOString(),
      },
      {
        id: "1-3",
        splitBillId: "1",
        friendId: "4",
        name: "Sarah Wilson",
        accentColor: "#45B7D1",
        total: 25000,
        subTotal: 25000,
        me: 0,
        createdAt: new Date("2024-12-15").toISOString(),
      },

      // Coffee Morning with Team (2 friends)
      {
        id: "2-1",
        splitBillId: "2",
        friendId: "2",
        name: "Jenny Russell",
        accentColor: "#FF6B6B",
        total: 15000,
        subTotal: 15000,
        me: 0,
        createdAt: new Date("2024-12-14").toISOString(),
      },
      {
        id: "2-2",
        splitBillId: "2",
        friendId: "3",
        name: "Alex Chen",
        accentColor: "#4ECDC4",
        total: 15000,
        subTotal: 15000,
        me: 0,
        createdAt: new Date("2024-12-14").toISOString(),
      },

      // Pizza Night (4 friends)
      {
        id: "3-1",
        splitBillId: "3",
        friendId: "2",
        name: "Jenny Russell",
        accentColor: "#FF6B6B",
        total: 30000,
        subTotal: 30000,
        me: 0,
        createdAt: new Date("2024-12-13").toISOString(),
      },
      {
        id: "3-2",
        splitBillId: "3",
        friendId: "3",
        name: "Alex Chen",
        accentColor: "#4ECDC4",
        total: 30000,
        subTotal: 30000,
        me: 0,
        createdAt: new Date("2024-12-13").toISOString(),
      },
      {
        id: "3-3",
        splitBillId: "3",
        friendId: "4",
        name: "Sarah Wilson",
        accentColor: "#45B7D1",
        total: 30000,
        subTotal: 30000,
        me: 0,
        createdAt: new Date("2024-12-13").toISOString(),
      },
      {
        id: "3-4",
        splitBillId: "3",
        friendId: "4",
        name: "Sarah Wilson",
        accentColor: "#45B7D1",
        total: 30000,
        subTotal: 30000,
        me: 0,
        createdAt: new Date("2024-12-13").toISOString(),
      },

      // Spotify Premium Subscription (4 friends)
      {
        id: "4-1",
        splitBillId: "4",
        friendId: "2",
        name: "Jenny Russell",
        accentColor: "#FF6B6B",
        total: 16500,
        subTotal: 16500,
        me: 0,
        createdAt: new Date("2024-12-12").toISOString(),
      },
      {
        id: "4-2",
        splitBillId: "4",
        friendId: "3",
        name: "Alex Chen",
        accentColor: "#4ECDC4",
        total: 16500,
        subTotal: 16500,
        me: 0,
        createdAt: new Date("2024-12-12").toISOString(),
      },
      {
        id: "4-3",
        splitBillId: "4",
        friendId: "4",
        name: "Sarah Wilson",
        accentColor: "#45B7D1",
        total: 16500,
        subTotal: 16500,
        me: 0,
        createdAt: new Date("2024-12-12").toISOString(),
      },

      // Weekend BBQ Party (3 friends)
      {
        id: "5-1",
        splitBillId: "5",
        friendId: "2",
        name: "Jenny Russell",
        accentColor: "#FF6B6B",
        total: 40000,
        subTotal: 40000,
        me: 0,
        createdAt: new Date("2024-12-11").toISOString(),
      },
      {
        id: "5-2",
        splitBillId: "5",
        friendId: "3",
        name: "Alex Chen",
        accentColor: "#4ECDC4",
        total: 40000,
        subTotal: 40000,
        me: 0,
        createdAt: new Date("2024-12-11").toISOString(),
      },

      // Lunch at Sushi Restaurant (1 friend)
      {
        id: "6-1",
        splitBillId: "6",
        friendId: "2",
        name: "Jenny Russell",
        accentColor: "#FF6B6B",
        total: 55000,
        subTotal: 55000,
        me: 0,
        createdAt: new Date("2024-12-10").toISOString(),
      },

      // Movie Night Snacks (4 friends)
      {
        id: "7-1",
        splitBillId: "7",
        friendId: "2",
        name: "Jenny Russell",
        accentColor: "#FF6B6B",
        total: 12000,
        subTotal: 12000,
        me: 0,
        createdAt: new Date("2024-12-09").toISOString(),
      },
      {
        id: "7-2",
        splitBillId: "7",
        friendId: "3",
        name: "Alex Chen",
        accentColor: "#4ECDC4",
        total: 12000,
        subTotal: 12000,
        me: 0,
        createdAt: new Date("2024-12-09").toISOString(),
      },
      {
        id: "7-3",
        splitBillId: "7",
        friendId: "4",
        name: "Sarah Wilson",
        accentColor: "#45B7D1",
        total: 12000,
        subTotal: 12000,
        me: 0,
        createdAt: new Date("2024-12-09").toISOString(),
      },
      {
        id: "7-4",
        splitBillId: "7",
        friendId: "5",
        name: "Mike Johnson",
        accentColor: "#96CEB4",
        total: 12000,
        subTotal: 12000,
        me: 0,
        createdAt: new Date("2024-12-09").toISOString(),
      },

      // Office Birthday Cake (2 friends)
      {
        id: "8-1",
        splitBillId: "8",
        friendId: "2",
        name: "Jenny Russell",
        accentColor: "#FF6B6B",
        total: 8000,
        subTotal: 8000,
        me: 0,
        createdAt: new Date("2024-12-08").toISOString(),
      },
      {
        id: "8-2",
        splitBillId: "8",
        friendId: "3",
        name: "Alex Chen",
        accentColor: "#4ECDC4",
        total: 8000,
        subTotal: 8000,
        me: 0,
        createdAt: new Date("2024-12-08").toISOString(),
      },

      // Gaming Tournament Drinks (3 friends)
      {
        id: "9-1",
        splitBillId: "9",
        friendId: "2",
        name: "Jenny Russell",
        accentColor: "#FF6B6B",
        total: 18000,
        subTotal: 18000,
        me: 0,
        createdAt: new Date("2024-12-07").toISOString(),
      },
      {
        id: "9-2",
        splitBillId: "9",
        friendId: "3",
        name: "Alex Chen",
        accentColor: "#4ECDC4",
        total: 18000,
        subTotal: 18000,
        me: 0,
        createdAt: new Date("2024-12-07").toISOString(),
      },
      {
        id: "9-3",
        splitBillId: "9",
        friendId: "4",
        name: "Sarah Wilson",
        accentColor: "#45B7D1",
        total: 18000,
        subTotal: 18000,
        me: 0,
        createdAt: new Date("2024-12-07").toISOString(),
      },

      // Breakfast Meeting (1 friend)
      {
        id: "10-1",
        splitBillId: "10",
        friendId: "2",
        name: "Jenny Russell",
        accentColor: "#FF6B6B",
        total: 22500,
        subTotal: 22500,
        me: 0,
        createdAt: new Date("2024-12-06").toISOString(),
      },
    ];

    for (const splitFriend of splitBillFriends) {
      this.db.runSync(
        "INSERT INTO split_bill_friends (id, splitBillId, friendId, name, accentColor, total, subTotal, me, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          splitFriend.id,
          splitFriend.splitBillId,
          splitFriend.friendId,
          splitFriend.name,
          splitFriend.accentColor,
          splitFriend.total,
          splitFriend.subTotal,
          splitFriend.me,
          splitFriend.createdAt,
        ]
      );
    }
  }

  // Friends CRUD operations
  static getAllFriends(): Friend[] {
    if (!this.db) throw new Error("Database not initialized");

    const result = this.db.getAllSync(
      "SELECT * FROM friends ORDER BY createdAt DESC"
    );
    return result.map((row: any) => ({
      id: row.id,
      name: row.name,
      me: row.me === 1,
      accentColor: row.accentColor,
      createdAt: new Date(row.createdAt),
    }));
  }

  static addFriend(friend: Omit<Friend, "id" | "createdAt">): Friend {
    if (!this.db) throw new Error("Database not initialized");

    const id = Date.now().toString();
    const createdAt = new Date().toISOString();

    this.db.runSync(
      "INSERT INTO friends (id, name, me, accentColor, createdAt) VALUES (?, ?, ?, ?, ?)",
      [id, friend.name, friend.me ? 1 : 0, friend.accentColor, createdAt]
    );

    return {
      id,
      name: friend.name,
      me: friend.me,
      accentColor: friend.accentColor,
      createdAt: new Date(createdAt),
    };
  }

  static updateFriend(
    id: string,
    updates: Partial<Friend>
  ): Friend | undefined {
    if (!this.db) throw new Error("Database not initialized");

    const setParts = [];
    const values = [];

    if (updates.name !== undefined) {
      setParts.push("name = ?");
      values.push(updates.name);
    }
    if (updates.me !== undefined) {
      setParts.push("me = ?");
      values.push(updates.me ? 1 : 0);
    }
    if (updates.accentColor !== undefined) {
      setParts.push("accentColor = ?");
      values.push(updates.accentColor);
    }

    if (setParts.length === 0) return undefined;

    values.push(id);
    this.db.runSync(
      `UPDATE friends SET ${setParts.join(", ")} WHERE id = ?`,
      values
    );

    const result = this.db.getFirstSync("SELECT * FROM friends WHERE id = ?", [
      id,
    ]);
    if (!result) return undefined;

    return {
      id: (result as any).id,
      name: (result as any).name,
      me: (result as any).me === 1,
      accentColor: (result as any).accentColor,
      createdAt: new Date((result as any).createdAt),
    };
  }

  static deleteFriend(id: string): boolean {
    if (!this.db) throw new Error("Database not initialized");

    const result = this.db.runSync("DELETE FROM friends WHERE id = ?", [id]);
    return result.changes > 0;
  }

  // Split bills CRUD operations
  static getAllSplittedBills(): Splitted[] {
    if (!this.db) throw new Error("Database not initialized");

    const bills = this.db.getAllSync(
      "SELECT * FROM split_bills ORDER BY createdAt DESC"
    );
    const result: Splitted[] = [];

    for (const bill of bills) {
      const friends = this.db.getAllSync(
        "SELECT * FROM split_bill_friends WHERE splitBillId = ? ORDER BY createdAt",
        [(bill as any).id]
      );

      result.push({
        id: (bill as any).id,
        name: (bill as any).name,
        createdAt: new Date((bill as any).createdAt),
        friends: friends.map((friend: any) => ({
          id: friend.id,
          friendId: friend.friendId,
          name: friend.name,
          accentColor: friend.accentColor,
          total: friend.total,
          subTotal: friend.subTotal,
          items: [], // Empty for now
          others: [], // Empty for now
          me: friend.me === 1,
          createdAt: friend.createdAt,
        })),
      });
    }

    return result;
  }

  static addSplittedBill(bill: Omit<Splitted, "id" | "createdAt">): Splitted {
    if (!this.db) throw new Error("Database not initialized");

    const id = Date.now().toString();
    const createdAt = new Date().toISOString();

    // Insert split bill
    this.db.runSync(
      "INSERT INTO split_bills (id, name, createdAt) VALUES (?, ?, ?)",
      [id, bill.name, createdAt]
    );

    // Insert split bill friends
    for (const friend of bill.friends) {
      const friendId = `${id}-${friend.friendId}`;
      this.db.runSync(
        "INSERT INTO split_bill_friends (id, splitBillId, friendId, name, accentColor, total, subTotal, me, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          friendId,
          id,
          friend.friendId,
          friend.name,
          friend.accentColor,
          friend.total,
          friend.subTotal,
          friend.me ? 1 : 0,
          friend.createdAt,
        ]
      );
    }

    return {
      id,
      name: bill.name,
      createdAt: new Date(createdAt),
      friends: bill.friends,
    };
  }

  static getFriendSplitCount(friendId: string): number {
    if (!this.db) throw new Error("Database not initialized");

    const result = this.db.getFirstSync(
      "SELECT COUNT(*) as count FROM split_bill_friends WHERE friendId = ?",
      [friendId]
    );

    return (result as any)?.count || 0;
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

  static getRandomAccentColor(): string {
    const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}
