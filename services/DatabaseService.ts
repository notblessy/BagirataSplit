import * as SQLite from "expo-sqlite";
import { CurrencyCode, Friend, Splitted } from "../types";

export class DatabaseService {
  private static db: SQLite.SQLiteDatabase | null = null;
  private static isInitialized: boolean = false;
  private static initializationPromise: Promise<void> | null = null;
  private static readonly DB_VERSION = 4; // Increment when schema changes

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
      await this.handleMigrations();
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
        createdAt TEXT NOT NULL,
        bankName TEXT,
        bankAccountName TEXT,
        bankAccountNumber TEXT
      );
    `);

    // Add bank columns to existing friends table if they don't exist
    try {
      await this.db.execAsync(`ALTER TABLE friends ADD COLUMN bankName TEXT;`);
    } catch {
      // Column already exists, ignore error
    }
    try {
      await this.db.execAsync(
        `ALTER TABLE friends ADD COLUMN bankAccountName TEXT;`
      );
    } catch {
      // Column already exists, ignore error
    }
    try {
      await this.db.execAsync(
        `ALTER TABLE friends ADD COLUMN bankAccountNumber TEXT;`
      );
    } catch {
      // Column already exists, ignore error
    }

    // Split bills table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS split_bills (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT,
        shareUrl TEXT,
        bankName TEXT,
        bankAccount TEXT,
        bankNumber TEXT,
        subTotal REAL,
        grandTotal REAL,
        currencyCode TEXT DEFAULT 'IDR',
        groupId TEXT,
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

    // Split bill items table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS split_bill_items (
        id TEXT PRIMARY KEY,
        splitBillId TEXT NOT NULL,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        qty INTEGER NOT NULL,
        discount REAL DEFAULT 0,
        discountIsPercentage INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (splitBillId) REFERENCES split_bills (id) ON DELETE CASCADE
      );
    `);

    // Split bill item assignments (which friends got which items)
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS split_bill_item_assignments (
        id TEXT PRIMARY KEY,
        splitBillId TEXT NOT NULL,
        itemId TEXT NOT NULL,
        friendId TEXT NOT NULL,
        qty INTEGER NOT NULL,
        subTotal REAL NOT NULL,
        FOREIGN KEY (splitBillId) REFERENCES split_bills (id) ON DELETE CASCADE,
        FOREIGN KEY (itemId) REFERENCES split_bill_items (id) ON DELETE CASCADE,
        FOREIGN KEY (friendId) REFERENCES friends (id) ON DELETE CASCADE
      );
    `);

    // Split bill other payments (taxes, tips, etc.)
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS split_bill_other_payments (
        id TEXT PRIMARY KEY,
        splitBillId TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        usePercentage INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (splitBillId) REFERENCES split_bills (id) ON DELETE CASCADE
      );
    `);

    // Split bill other payment assignments (how much each friend pays for other payments)
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS split_bill_other_assignments (
        id TEXT PRIMARY KEY,
        splitBillId TEXT NOT NULL,
        otherPaymentId TEXT NOT NULL,
        friendId TEXT NOT NULL,
        amount REAL NOT NULL,
        FOREIGN KEY (splitBillId) REFERENCES split_bills (id) ON DELETE CASCADE,
        FOREIGN KEY (otherPaymentId) REFERENCES split_bill_other_payments (id) ON DELETE CASCADE,
        FOREIGN KEY (friendId) REFERENCES friends (id) ON DELETE CASCADE
      );
    `);
  }

  // Handle database migrations
  private static async handleMigrations(): Promise<void> {
    if (!this.db) return;

    // Check current database version
    try {
      const result = await this.db.getFirstAsync("PRAGMA user_version");
      const currentVersion = (result as any)?.user_version || 0;

      if (currentVersion < this.DB_VERSION) {
        console.log(
          `Migrating database from version ${currentVersion} to ${this.DB_VERSION}`
        );

        // Migration logic for different versions
        if (currentVersion < 3) {
          // Add slug and shareUrl columns to split_bills table
          try {
            await this.db.execAsync(`ALTER TABLE split_bills ADD COLUMN slug TEXT;`);
          } catch { /* Column already exists */ }
          try {
            await this.db.execAsync(`ALTER TABLE split_bills ADD COLUMN shareUrl TEXT;`);
          } catch { /* Column already exists */ }
        }

        if (currentVersion < 4) {
          // Add bank, currency, and total columns to split_bills
          const splitBillColumns = [
            "ALTER TABLE split_bills ADD COLUMN bankName TEXT",
            "ALTER TABLE split_bills ADD COLUMN bankAccount TEXT",
            "ALTER TABLE split_bills ADD COLUMN bankNumber TEXT",
            "ALTER TABLE split_bills ADD COLUMN subTotal REAL",
            "ALTER TABLE split_bills ADD COLUMN grandTotal REAL",
            "ALTER TABLE split_bills ADD COLUMN currencyCode TEXT DEFAULT 'IDR'",
            "ALTER TABLE split_bills ADD COLUMN groupId TEXT",
          ];
          for (const sql of splitBillColumns) {
            try { await this.db.execAsync(sql); } catch { /* Column already exists */ }
          }
          // Add discount columns to split_bill_items
          try { await this.db.execAsync("ALTER TABLE split_bill_items ADD COLUMN discount REAL DEFAULT 0"); } catch { /* exists */ }
          try { await this.db.execAsync("ALTER TABLE split_bill_items ADD COLUMN discountIsPercentage INTEGER DEFAULT 0"); } catch { /* exists */ }
        }

        await this.db.execAsync(`PRAGMA user_version = ${this.DB_VERSION}`);

        console.log("Database migration completed");
      }
    } catch (error) {
      console.error("Error during database migration:", error);
    }
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
      bankName: row.bankName || undefined,
      bankAccountName: row.bankAccountName || undefined,
      bankAccountNumber: row.bankAccountNumber || undefined,
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
      "INSERT INTO friends (id, name, me, accentColor, createdAt, bankName, bankAccountName, bankAccountNumber) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        id,
        friend.name,
        friend.me ? 1 : 0,
        friend.accentColor,
        createdAt,
        friend.bankName || null,
        friend.bankAccountName || null,
        friend.bankAccountNumber || null,
      ]
    );

    return {
      id,
      name: friend.name,
      me: friend.me,
      accentColor: friend.accentColor,
      createdAt: new Date(createdAt),
      bankName: friend.bankName,
      bankAccountName: friend.bankAccountName,
      bankAccountNumber: friend.bankAccountNumber,
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
    if (updates.bankName !== undefined) {
      setParts.push("bankName = ?");
      values.push(updates.bankName || null);
    }
    if (updates.bankAccountName !== undefined) {
      setParts.push("bankAccountName = ?");
      values.push(updates.bankAccountName || null);
    }
    if (updates.bankAccountNumber !== undefined) {
      setParts.push("bankAccountNumber = ?");
      values.push(updates.bankAccountNumber || null);
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
      bankName: (result as any).bankName || undefined,
      bankAccountName: (result as any).bankAccountName || undefined,
      bankAccountNumber: (result as any).bankAccountNumber || undefined,
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

  static async deleteSplit(id: string): Promise<boolean> {
    await this.ensureInitialized();
    if (!this.db) throw new Error("Database not initialized");

    // Due to CASCADE delete constraints, deleting the split_bill will automatically
    // delete all related records in split_bill_friends, split_bill_items,
    // split_bill_item_assignments, split_bill_other_payments, and split_bill_other_payment_assignments
    const result = await this.db.runAsync(
      "DELETE FROM split_bills WHERE id = ?",
      [id]
    );
    return result.changes > 0;
  }

  static async updateSplitShareInfo(
    id: string,
    slug?: string,
    shareUrl?: string
  ): Promise<boolean> {
    await this.ensureInitialized();
    if (!this.db) throw new Error("Database not initialized");

    const result = await this.db.runAsync(
      "UPDATE split_bills SET slug = ?, shareUrl = ? WHERE id = ?",
      [slug || null, shareUrl || null, id]
    );
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

      // Load detailed items and other payments for each friend
      const friendsWithDetails = await Promise.all(
        friends.map(async (friend: any) => {
          if (!this.db) throw new Error("Database not initialized");

          // Load items for this friend
          const items = await this.db.getAllAsync(
            `
            SELECT 
              sbi.id, sbi.name, 
              sbia.qty, sbi.price, sbia.subTotal
            FROM split_bill_item_assignments sbia
            JOIN split_bill_items sbi ON sbia.itemId = sbi.id
            WHERE sbia.splitBillId = ? AND sbia.friendId = ?
          `,
            [(bill as any).id, friend.friendId]
          );

          // Load other payments for this friend
          const others = await this.db.getAllAsync(
            `
            SELECT 
              sbop.id, sbop.name, sbop.type, sbop.usePercentage,
              sbop.amount as originalAmount, sboa.amount
            FROM split_bill_other_assignments sboa
            JOIN split_bill_other_payments sbop ON sboa.otherPaymentId = sbop.id
            WHERE sboa.splitBillId = ? AND sboa.friendId = ?
          `,
            [(bill as any).id, friend.friendId]
          );

          return {
            id: friend.id,
            friendId: friend.friendId,
            name: friend.name,
            accentColor: friend.accentColor,
            total: friend.total,
            subTotal: friend.subTotal,
            items: items.map((item: any) => ({
              id: item.id,
              name: item.name,
              qty: item.qty,
              price: item.price,
              subTotal: item.subTotal,
            })),
            others: others.map((other: any) => ({
              id: other.id,
              name: other.name,
              amount: other.amount,
              price: other.originalAmount,
              type: other.type,
              usePercentage: other.usePercentage === 1,
            })),
            me: friend.me === 1,
            createdAt: friend.createdAt,
          };
        })
      );

      result.push({
        id: (bill as any).id,
        name: (bill as any).name,
        slug: (bill as any).slug,
        shareUrl: (bill as any).shareUrl,
        bankName: (bill as any).bankName || undefined,
        bankAccount: (bill as any).bankAccount || undefined,
        bankNumber: (bill as any).bankNumber || undefined,
        subTotal: (bill as any).subTotal || undefined,
        grandTotal: (bill as any).grandTotal || undefined,
        currencyCode: (bill as any).currencyCode || undefined,
        groupId: (bill as any).groupId || undefined,
        createdAt: new Date((bill as any).createdAt),
        friends: friendsWithDetails,
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
      bankName: (result as any).bankName || undefined,
      bankAccountName: (result as any).bankAccountName || undefined,
      bankAccountNumber: (result as any).bankAccountNumber || undefined,
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
    },
    shareInfo?: {
      shareUrl: string;
      slug: string;
    }
  ): Promise<void> {
    await this.ensureInitialized();
    if (!this.db) throw new Error("Database not initialized");

    const createdAtStr = splitData.createdAt.toISOString();

    // Insert split bill with share info and bank info
    await this.db.runAsync(
      "INSERT OR REPLACE INTO split_bills (id, name, slug, shareUrl, bankName, bankAccount, bankNumber, currencyCode, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        splitData.id,
        splitData.name,
        shareInfo?.slug || null,
        shareInfo?.shareUrl || null,
        bankInfo?.bankName || null,
        bankInfo?.accountName || null,
        bankInfo?.accountNumber || null,
        (splitData as any).currencyCode || "IDR",
        createdAtStr,
      ]
    );

    // Save items
    for (const item of splitData.items) {
      await this.db.runAsync(
        "INSERT OR REPLACE INTO split_bill_items (id, splitBillId, name, price, qty, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
        [item.id, splitData.id, item.name, item.price, item.qty, createdAtStr]
      );

      // Save item assignments
      for (const assignment of item.friends || []) {
        const assignmentId = `${splitData.id}-${item.id}-${assignment.friendId}`;
        await this.db.runAsync(
          "INSERT OR REPLACE INTO split_bill_item_assignments (id, splitBillId, itemId, friendId, qty, subTotal) VALUES (?, ?, ?, ?, ?, ?)",
          [
            assignmentId,
            splitData.id,
            item.id,
            assignment.friendId,
            assignment.qty,
            item.price * assignment.qty,
          ]
        );
      }
    }

    // Calculate totalItemsValue and participantCount once (used in multiple places)
    const totalItemsValue = splitData.items.reduce(
      (sum: number, item: any) => sum + item.price * item.qty,
      0
    );
    const participantCount = participants.length;

    // Save other payments
    for (const other of splitData.otherPayments || []) {
      await this.db.runAsync(
        "INSERT OR REPLACE INTO split_bill_other_payments (id, splitBillId, name, type, amount, usePercentage, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          other.id,
          splitData.id,
          other.name,
          other.type,
          other.amount,
          other.usePercentage ? 1 : 0,
          createdAtStr,
        ]
      );

      // Calculate and save other payment assignments
      for (const participant of participants) {
        let participantSubTotal = 0;

        // Calculate participant's items subtotal
        splitData.items.forEach((item: any) => {
          const assignment = item.friends?.find(
            (f: any) => f.friendId === participant.id
          );
          if (assignment) {
            participantSubTotal += item.price * assignment.qty;
          }
        });

        let amount = other.amount;
        if (other.usePercentage) {
          amount = (totalItemsValue * other.amount) / 100;
        }

        let friendAmount = 0;
        if (other.type === "tax") {
          // Prevent division by zero: if totalItemsValue is 0, tax should be 0
          friendAmount = totalItemsValue > 0 
            ? (participantSubTotal * amount) / totalItemsValue 
            : 0;
        } else {
          // Prevent division by zero: if participantCount is 0, amount should be 0
          friendAmount = participantCount > 0 
            ? amount / participantCount 
            : 0;
          if (other.type === "discount") {
            friendAmount = -friendAmount;
          }
        }

        const assignmentId = `${splitData.id}-${other.id}-${participant.id}`;
        await this.db.runAsync(
          "INSERT OR REPLACE INTO split_bill_other_assignments (id, splitBillId, otherPaymentId, friendId, amount) VALUES (?, ?, ?, ?, ?)",
          [assignmentId, splitData.id, other.id, participant.id, friendAmount]
        );
      }
    }

    // Calculate totals for each participant and save to split_bill_friends
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
      splitData.otherPayments?.forEach((other: any) => {
        let amount = other.amount;
        if (other.usePercentage) {
          amount = (totalItemsValue * other.amount) / 100;
        }

        let friendAmount = 0;
        if (other.type === "tax") {
          // Prevent division by zero: if totalItemsValue is 0, tax should be 0
          friendAmount = totalItemsValue > 0 
            ? (subTotal * amount) / totalItemsValue 
            : 0;
        } else {
          // Prevent division by zero: if participantCount is 0, amount should be 0
          friendAmount = participantCount > 0 
            ? amount / participantCount 
            : 0;
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
  private static readonly LOCALE_MAP: Record<CurrencyCode, string> = {
    IDR: "id-ID", JPY: "ja-JP", CNY: "zh-CN", KRW: "ko-KR",
    USD: "en-US", SGD: "en-SG", MYR: "ms-MY", THB: "th-TH",
    PHP: "en-PH", VND: "vi-VN", MMK: "my-MM", BND: "ms-BN",
    KHR: "km-KH", LAK: "lo-LA",
  };

  private static readonly DECIMALS_MAP: Record<CurrencyCode, number> = {
    IDR: 0, JPY: 0, KRW: 0, VND: 0, MMK: 0, KHR: 0, LAK: 0,
    CNY: 2, USD: 2, SGD: 2, MYR: 2, THB: 2, PHP: 2, BND: 2,
  };

  static formatCurrency(amount: number, currencyCode: CurrencyCode = "IDR"): string {
    const locale = this.LOCALE_MAP[currencyCode] || "id-ID";
    const decimals = this.DECIMALS_MAP[currencyCode] ?? 0;
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount);
  }

  static getCurrencyList(): { code: CurrencyCode; label: string }[] {
    return [
      { code: "IDR", label: "Indonesian Rupiah" },
      { code: "USD", label: "US Dollar" },
      { code: "SGD", label: "Singapore Dollar" },
      { code: "MYR", label: "Malaysian Ringgit" },
      { code: "JPY", label: "Japanese Yen" },
      { code: "KRW", label: "South Korean Won" },
      { code: "CNY", label: "Chinese Yuan" },
      { code: "THB", label: "Thai Baht" },
      { code: "PHP", label: "Philippine Peso" },
      { code: "VND", label: "Vietnamese Dong" },
      { code: "MMK", label: "Myanmar Kyat" },
      { code: "BND", label: "Brunei Dollar" },
      { code: "KHR", label: "Cambodian Riel" },
      { code: "LAK", label: "Lao Kip" },
    ];
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
    const colors = [
      "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
      "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}
