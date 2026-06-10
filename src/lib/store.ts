import { create } from "zustand";
import { CounterEntry, Customer, AppSettings, defaultSettings, getEntries, getCustomers, getSettings } from "./storage";
import { getCurrency } from "./currencies";

interface AppState {
  // Tab
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Counter
  currentCurrency: string;
  setCurrentCurrency: (code: string) => void;
  counts: Record<string, number>;
  setCount: (denom: string, count: number) => void;
  incrementCount: (denom: string) => void;
  decrementCount: (denom: string) => void;
  resetCounts: () => void;
  getTotal: () => number;
  getTotalNotes: () => number;
  otherAmount: number;
  setOtherAmount: (amount: number) => void;
  onlineAmount: number;
  setOnlineAmount: (amount: number) => void;
  getGrandTotal: () => number;

  // Payable/Receivable
  targetMode: "payable" | "receivable";
  setTargetMode: (mode: "payable" | "receivable") => void;
  targetAmount: number;
  setTargetAmount: (amount: number) => void;

  // Entry type
  entryType: "in" | "out";
  setEntryType: (type: "in" | "out") => void;

  // Entries
  entries: CounterEntry[];
  refreshEntries: () => void;

  // Customers
  customers: Customer[];
  refreshCustomers: () => void;

  // Settings
  settings: AppSettings;
  refreshSettings: () => void;

  // Entry form fields
  category: string;
  setCategory: (cat: string) => void;
  remark: string;
  setRemark: (r: string) => void;
  personName: string;
  setPersonName: (name: string) => void;
  mobileNumber: string;
  setMobileNumber: (num: string) => void;
  accountNumber: string;
  setAccountNumber: (num: string) => void;

  // Selected customer for quick entry
  selectedCustomerId: string | null;
  setSelectedCustomerId: (id: string | null) => void;

  // Counter → Calc amount transfer
  calcInputAmount: number;
  setCalcInputAmount: (amount: number) => void;
}

export const useAppStore = create<AppState>((set, get) => {
  const initialSettings = typeof window !== "undefined" ? getSettings() : defaultSettings;
  const initialCurrency = initialSettings.defaultCurrency;
  const currency = getCurrency(initialCurrency);
  const initialCounts: Record<string, number> = {};
  currency.denominations.forEach((d) => {
    initialCounts[String(d.value)] = 0;
  });

  return {
    // Tab
    activeTab: "counter",
    setActiveTab: (tab) => set({ activeTab: tab }),

    // Counter
    currentCurrency: initialCurrency,
    setCurrentCurrency: (code) => {
      const currency = getCurrency(code);
      const newCounts: Record<string, number> = {};
      currency.denominations.forEach((d) => {
        newCounts[String(d.value)] = 0;
      });
      set({ currentCurrency: code, counts: newCounts });
    },
    counts: initialCounts,
    setCount: (denom, count) =>
      set((state) => ({ counts: { ...state.counts, [denom]: Math.max(0, count) } })),
    incrementCount: (denom) =>
      set((state) => ({ counts: { ...state.counts, [denom]: (state.counts[denom] || 0) + 1 } })),
    decrementCount: (denom) =>
      set((state) => ({ counts: { ...state.counts, [denom]: Math.max(0, (state.counts[denom] || 0) - 1) } })),
    resetCounts: () => {
      const currency = getCurrency(get().currentCurrency);
      const newCounts: Record<string, number> = {};
      currency.denominations.forEach((d) => {
        newCounts[String(d.value)] = 0;
      });
      set({ counts: newCounts, otherAmount: 0, onlineAmount: 0, targetAmount: 0, category: "", remark: "", personName: "", mobileNumber: "", accountNumber: "" });
    },
    getTotal: () => {
      const { counts, currentCurrency } = get();
      const currency = getCurrency(currentCurrency);
      let total = 0;
      currency.denominations.forEach((d) => {
        total += d.value * (counts[String(d.value)] || 0);
      });
      return total;
    },
    getTotalNotes: () => {
      const { counts } = get();
      return Object.values(counts).reduce((sum, c) => sum + c, 0);
    },
    otherAmount: 0,
    setOtherAmount: (amount) => set({ otherAmount: Math.max(0, amount) }),
    onlineAmount: 0,
    setOnlineAmount: (amount) => set({ onlineAmount: Math.max(0, amount) }),
    getGrandTotal: () => {
      const cashTotal = get().getTotal();
      return cashTotal + get().otherAmount + get().onlineAmount;
    },

    // Payable/Receivable
    targetMode: "receivable",
    setTargetMode: (mode) => set({ targetMode: mode }),
    targetAmount: 0,
    setTargetAmount: (amount) => set({ targetAmount: amount }),

    // Entry type
    entryType: "in",
    setEntryType: (type) => set({ entryType: type }),

    // Entries
    entries: typeof window !== "undefined" ? getEntries() : [],
    refreshEntries: () => set({ entries: getEntries() }),

    // Customers
    customers: typeof window !== "undefined" ? getCustomers() : [],
    refreshCustomers: () => set({ customers: getCustomers() }),

    // Settings
    settings: initialSettings,
    refreshSettings: () => set({ settings: getSettings() }),

    // Entry form fields
    category: "",
    setCategory: (cat) => set({ category: cat }),
    remark: "",
    setRemark: (r) => set({ remark: r }),
    personName: "",
    setPersonName: (name) => set({ personName: name }),
    mobileNumber: "",
    setMobileNumber: (num) => set({ mobileNumber: num }),
    accountNumber: "",
    setAccountNumber: (num) => set({ accountNumber: num }),

    // Selected customer
    selectedCustomerId: null,
    setSelectedCustomerId: (id) => set({ selectedCustomerId: id }),

    // Counter → Calc amount transfer
    calcInputAmount: 0,
    setCalcInputAmount: (amount) => set({ calcInputAmount: amount }),
  };
});
