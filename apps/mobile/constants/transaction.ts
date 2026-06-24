import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Transaction {
  id: string;
  title: string;
  amount: string;
  type: "sale" | "debt" | "expense";
  date: string;
  timestamp: string;
  customerName?: string;
  description?: string;
  photoUri?: string;
  status: "completed" | "owed" | "paid";
}

const STORAGE_KEY = "Transactions";

// Your provided mock database
const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: "tx-1",
    title: "Wholesale Supply",
    amount: "85000",
    type: "sale",
    date: "2 hours ago",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    customerName: "Alhaji Musa Provisions",
    description: "Bulk sales of detergents, oil, and flour bags.",
    status: "completed",
  },
  {
    id: "tx-2",
    title: "Ibrahim K.",
    amount: "24500",
    type: "debt",
    date: "Yesterday",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    customerName: "Ibrahim K.",
    description: "Credit purchase of 2 packs of beverages and soft drinks.",
    status: "owed",
  },
  {
    id: "tx-3",
    title: "Store Rent",
    amount: "150000",
    type: "expense",
    date: "Oct 24",
    timestamp: new Date("2025-10-24T12:00:00.000Z").toISOString(),
    description:
      "Annual store rental payment contribution for Victoria Island location.",
    status: "paid",
  },
  {
    id: "tx-4",
    title: "Supermarket Restock",
    amount: "343500",
    type: "sale",
    date: "4 hours ago",
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    customerName: "Walk-in Customer",
    description: "Daily retail cash purchases from multiple walk-in buyers.",
    status: "completed",
  },
  {
    id: "tx-5",
    title: "Funmi A. Credit",
    amount: "59700",
    type: "debt",
    date: "3 days ago",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    customerName: "Funmi A.",
    description: "Credit supply for catering event items.",
    status: "owed",
  },
  {
    id: "tx-6",
    title: "Chidi N. Credit",
    amount: "100000",
    type: "debt",
    date: "5 days ago",
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    customerName: "Chidi N.",
    description: "Credit supply of cosmetics inventory items.",
    status: "owed",
  },
];

export const TransactionStorage = {
  // 1. GET ALL: Loads from memory. If memory is empty, initializes it with your mock list!
  getAll: async (): Promise<Transaction[]> => {
    try {
      const savedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedData !== null) {
        console.log("Data from memory: ", JSON.parse(savedData));
        return JSON.parse(savedData);
      } else {
        // First boot: Hydrate phone with your mock array instantly
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(INITIAL_TRANSACTIONS),
        );
        return INITIAL_TRANSACTIONS;
      }
    } catch (e) {
      console.error("Failed to read transactions", e);
      return [];
    }
  },

  // 2. ADD ONE: Pulls current list, appends new transaction, and saves back down
  add: async (
    newTx: Omit<Transaction, "id" | "timestamp">,
  ): Promise<Transaction[]> => {
    try {
      const currentList = await TransactionStorage.getAll();

      const fullTx: Transaction = {
        ...newTx,
        id: `tx-${Math.random().toString(36).substring(2, 9)}`, // Automated unique ID
        timestamp: new Date().toISOString(),
      };

      const updatedList = [fullTx, ...currentList]; // Adds new item to the top of the list
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
      return updatedList;
    } catch (e) {
      console.error("Failed to add transaction", e);
      return [];
    }
  },

  // 3. DELETE BY ID: Filters out the target item using its ID and updates memory
  deleteById: async (id: string): Promise<Transaction[]> => {
    try {
      const currentList = await TransactionStorage.getAll();
      // 👑 Key Change: Keeps everything EXCEPT the one matching the target ID
      const filteredList = currentList.filter((tx) => tx.id !== id);

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filteredList));
      return filteredList;
    } catch (e) {
      console.error("Failed to delete transaction", e);
      return [];
    }
  },
};
