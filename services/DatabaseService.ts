import * as SQLite from "expo-sqlite";
import { Friend, Splitted } from "../types";

export class DatabaseService {
  private static db: SQLite.SQLiteDatabase | null = null;
  private static isInitialized: boolean = false;
  private static initializationPromise: Promise<void> | null = null;

  // Initialize database
  static async initializeDatabase(): Promise<void> {
    // If already initialized, return immediately
    if (this.isInitialized && this.db) {
      return;
    }

    // If initialization is in progress, wait for it
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Start initialization
    this.initializationPromise = this._doInitialization();
    return this.initializationPromise;
  }

  private static async _doInitialization(): Promise<void> {
    try {
      if (!this.db) {
        // Use async database opening which is more reliable on Android
        this.db = await SQLite.openDatabaseAsync("splitbill.db");
      }
      await this.createTables();
      await this.seedInitialData();
      this.isInitialized = true;
    } catch (error) {
      console.error("Error initializing database:", error);
      this.db = null;
      this.isInitialized = false;
      this.initializationPromise = null;
      throw error;
    }
  }

  // Ensure database is initialized before any operation
  private static async ensureInitialized(): Promise<void> {
    if (!this.isInitialized || !this.db) {
      await this.initializeDatabase();
    }
  }

  // Create database tables
  private static async createTables(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    // Friends table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS friends (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        me INTEGER NOT NULL DEFAULT 0,
        accentColor TEXT NOT NULL,
        createdAt TEXT NOT NULL
      );
    `);

    // Split bills table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS split_bills (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        createdAt TEXT NOT NULL
      );
    `);

    // Split bill friends (junction table)
    await this.db.execAsync(`
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
    const friendsCount = await this.db.getFirstAsync(
      "SELECT COUNT(*) as count FROM friends"
    );
    if ((friendsCount as any)?.count > 0) return;

    // No initial seeding - users will create their own data
  }

  // Friends CRUD operations
  static async getAllFriends(): Promise<Friend[]> {
    await this.ensureInitialized();
    if (!this.db) throw new Error("Database not initialized");

    const result = await this.db.getAllAsync(
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

  static async addFriend(
    friend: Omit<Friend, "id" | "createdAt">
  ): Promise<Friend> {
    await this.ensureInitialized();
    if (!this.db) throw new Error("Database not initialized");

    const id = Date.now().toString();
    const createdAt = new Date().toISOString();

    await this.db.runAsync(
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

  static async updateFriend(
    id: string,
    updates: Partial<Friend>
  ): Promise<Friend | undefined> {
    await this.ensureInitialized();
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
    await this.db.runAsync(
      `UPDATE friends SET ${setParts.join(", ")} WHERE id = ?`,
      values
    );

    const result = await this.db.getFirstAsync(
      "SELECT * FROM friends WHERE id = ?",
      [id]
    );
    if (!result) return undefined;

    return {
      id: (result as any).id,
      name: (result as any).name,
      me: (result as any).me === 1,
      accentColor: (result as any).accentColor,
      createdAt: new Date((result as any).createdAt),
    };
  }

  static async deleteFriend(id: string): Promise<boolean> {
    await this.ensureInitialized();
    if (!this.db) throw new Error("Database not initialized");

    const result = await this.db.runAsync("DELETE FROM friends WHERE id = ?", [
      id,
    ]);
    return result.changes > 0;
  }

  // Split bills CRUD operations
  static async getAllSplittedBills(): Promise<Splitted[]> {
    await this.ensureInitialized();
    if (!this.db) throw new Error("Database not initialized");

    const bills = await this.db.getAllAsync(
      "SELECT * FROM split_bills ORDER BY createdAt DESC"
    );
    const result: Splitted[] = [];

    for (const bill of bills) {
      const friends = await this.db.getAllAsync(
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

  static async addSplittedBill(
    bill: Omit<Splitted, "id" | "createdAt">
  ): Promise<Splitted> {
    await this.ensureInitialized();
    if (!this.db) throw new Error("Database not initialized");

    const id = Date.now().toString();
    const createdAt = new Date().toISOString();

    // Insert split bill
    await this.db.runAsync(
      "INSERT INTO split_bills (id, name, createdAt) VALUES (?, ?, ?)",
      [id, bill.name, createdAt]
    );

    // Insert split bill friends
    for (const friend of bill.friends) {
      const friendId = `${id}-${friend.friendId}`;
      await this.db.runAsync(
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

  static async getFriendSplitCount(friendId: string): Promise<number> {
    await this.ensureInitialized();
    if (!this.db) throw new Error("Database not initialized");

    const result = await this.db.getFirstAsync(
      "SELECT COUNT(*) as count FROM split_bill_friends WHERE friendId = ?",
      [friendId]
    );

    return (result as any)?.count || 0;
  }

  // Check if user profile exists
  static async hasUserProfile(): Promise<boolean> {
    await this.ensureInitialized();
    if (!this.db) throw new Error("Database not initialized");

    const result = await this.db.getFirstAsync(
      "SELECT COUNT(*) as count FROM friends WHERE me = 1"
    );
    return (result as any)?.count > 0;
  }

  // Get user profile
  static async getUserProfile(): Promise<Friend | null> {
    await this.ensureInitialized();
    if (!this.db) throw new Error("Database not initialized");

    const result = await this.db.getFirstAsync(
      "SELECT * FROM friends WHERE me = 1"
    );

    if (!result) return null;

    return {
      id: (result as any).id,
      name: (result as any).name,
      me: (result as any).me === 1,
      accentColor: (result as any).accentColor,
      createdAt: new Date((result as any).createdAt),
    };
  }

  static async saveSplitToHistory(
    splitData: {
      id: string;
      name: string;
      items: any[];
      otherPayments: any[];
      createdAt: Date;
    },
    participants: Friend[],
    bankInfo?: {
      bankName: string;
      accountNumber: string;
      accountName: string;
    }
  ): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error("Database not initialized");

    const createdAtStr = splitData.createdAt.toISOString();

    // Insert split bill
    await this.db.runAsync(
      "INSERT OR REPLACE INTO split_bills (id, name, createdAt) VALUES (?, ?, ?)",
      [splitData.id, splitData.name, createdAtStr]
    );

    // Calculate totals for each participant
    for (const participant of participants) {
      let subTotal = 0;
      let total = 0;

      // Calculate items total for this participant
      splitData.items.forEach((item: any) => {
        const assignment = item.friends?.find(
          (f: any) => f.friendId === participant.id
        );
        if (assignment) {
          subTotal += item.price * assignment.qty;
        }
      });

      // Calculate other payments total for this participant
      const totalItemsValue = splitData.items.reduce(
        (sum: number, item: any) => sum + item.price * item.qty,
        0
      );
      const participantCount = participants.length;

      splitData.otherPayments?.forEach((other: any) => {
        let amount = other.amount;
        if (other.usePercentage) {
          amount = (totalItemsValue * other.amount) / 100;
        }

        let friendAmount = 0;
        if (other.type === "tax") {
          friendAmount = (subTotal * amount) / totalItemsValue;
        } else {
          friendAmount = amount / participantCount;
          if (other.type === "discount") {
            friendAmount = -friendAmount;
          }
        }

        total += friendAmount;
      });

      total += subTotal;

      // Insert split bill friend
      const friendId = `${splitData.id}-${participant.id}`;
      await this.db.runAsync(
        "INSERT OR REPLACE INTO split_bill_friends (id, splitBillId, friendId, name, accentColor, total, subTotal, me, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          friendId,
          splitData.id,
          participant.id,
          participant.name,
          participant.accentColor,
          total,
          subTotal,
          participant.me ? 1 : 0,
          participant.createdAt.toISOString(),
        ]
      );
    }
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
