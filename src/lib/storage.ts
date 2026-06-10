export interface CounterEntry {
  id: string;
  date: string;
  currency: string;
  counts: Record<string, number>;
  total: number;
  otherAmount?: number;
  onlineAmount?: number;
  entryType: "in" | "out";
  category?: string;
  remark?: string;
  personName?: string;
  mobileNumber?: string;
  accountNumber?: string;
  targetAmount?: number;
  targetMode?: "payable" | "receivable";
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  account: string;
  balance: number;
  entries: string[];
}

export interface BillItem {
  name: string;
  qty: number;
  rate: number;
}

export interface Bill {
  id: string;
  date: string;
  items: BillItem[];
  customerName: string;
  customerMobile: string;
  customerAddress: string;
  discountPercent: number;
  totalUnits: number;
  totalAmount: number;
}

export interface KhataPerson {
  id: string;
  name: string;
  mobile: string;
  balance: number; // positive = credit (they owe us), negative = debit (we owe them)
  transactions: KhataTransaction[];
}

export interface KhataTransaction {
  id: string;
  date: string;
  type: "credit" | "debit";
  amount: number;
  remark: string;
}

export interface CalcHistoryEntry {
  id: string;
  date: string;
  expression: string;
  result: string;
}

const ENTRIES_KEY = "ncp_entries";
const CUSTOMERS_KEY = "ncp_customers";
const SETTINGS_KEY = "ncp_settings";
const BILLS_KEY = "ncp_bills";
const KHATA_KEY = "ncp_khata";
const CALC_HISTORY_KEY = "ncp_calc_history";

export interface AppSettings {
  defaultCurrency: string;
  vibration: boolean;
  darkMode: boolean;
  language: "en" | "bn";
  hideKhataTotal: boolean;
}

export const defaultSettings: AppSettings = {
  defaultCurrency: "INR",
  vibration: true,
  darkMode: false,
  language: "en",
  hideKhataTotal: false,
};

export function getEntries(): CounterEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(ENTRIES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveEntry(entry: CounterEntry): void {
  const entries = getEntries();
  const index = entries.findIndex((e) => e.id === entry.id);
  if (index >= 0) {
    entries[index] = entry;
  } else {
    entries.unshift(entry);
  }
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
}

export function deleteEntry(id: string): void {
  const entries = getEntries().filter((e) => e.id !== id);
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
}

export function getCustomers(): Customer[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(CUSTOMERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveCustomer(customer: Customer): void {
  const customers = getCustomers();
  const index = customers.findIndex((c) => c.id === customer.id);
  if (index >= 0) {
    customers[index] = customer;
  } else {
    customers.unshift(customer);
  }
  localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
}

export function deleteCustomer(id: string): void {
  const customers = getCustomers().filter((c) => c.id !== id);
  localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
}

export function getBills(): Bill[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(BILLS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveBill(bill: Bill): void {
  const bills = getBills();
  const index = bills.findIndex((b) => b.id === bill.id);
  if (index >= 0) {
    bills[index] = bill;
  } else {
    bills.unshift(bill);
  }
  localStorage.setItem(BILLS_KEY, JSON.stringify(bills));
}

export function deleteBill(id: string): void {
  const bills = getBills().filter((b) => b.id !== id);
  localStorage.setItem(BILLS_KEY, JSON.stringify(bills));
}

export function getKhataPersons(): KhataPerson[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(KHATA_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveKhataPerson(person: KhataPerson): void {
  const persons = getKhataPersons();
  const index = persons.findIndex((p) => p.id === person.id);
  if (index >= 0) {
    persons[index] = person;
  } else {
    persons.unshift(person);
  }
  localStorage.setItem(KHATA_KEY, JSON.stringify(persons));
}

export function deleteKhataPerson(id: string): void {
  const persons = getKhataPersons().filter((p) => p.id !== id);
  localStorage.setItem(KHATA_KEY, JSON.stringify(persons));
}

export function getCalcHistory(): CalcHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(CALC_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveCalcHistory(entry: CalcHistoryEntry): void {
  const history = getCalcHistory();
  history.unshift(entry);
  if (history.length > 50) history.pop();
  localStorage.setItem(CALC_HISTORY_KEY, JSON.stringify(history));
}

export function clearCalcHistory(): void {
  localStorage.removeItem(CALC_HISTORY_KEY);
}

export function getSettings(): AppSettings {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    return data ? { ...defaultSettings, ...JSON.parse(data) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function exportAllData(): string {
  const data = {
    entries: getEntries(),
    customers: getCustomers(),
    bills: getBills(),
    khata: getKhataPersons(),
    settings: getSettings(),
    exportDate: new Date().toISOString(),
  };
  return JSON.stringify(data, null, 2);
}

export function importData(json: string): boolean {
  try {
    const data = JSON.parse(json);
    if (data.entries) localStorage.setItem(ENTRIES_KEY, JSON.stringify(data.entries));
    if (data.customers) localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(data.customers));
    if (data.bills) localStorage.setItem(BILLS_KEY, JSON.stringify(data.bills));
    if (data.khata) localStorage.setItem(KHATA_KEY, JSON.stringify(data.khata));
    if (data.settings) localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.settings));
    return true;
  } catch {
    return false;
  }
}

export function clearAllData(): void {
  localStorage.removeItem(ENTRIES_KEY);
  localStorage.removeItem(CUSTOMERS_KEY);
  localStorage.removeItem(BILLS_KEY);
  localStorage.removeItem(KHATA_KEY);
  localStorage.removeItem(CALC_HISTORY_KEY);
  localStorage.removeItem(SETTINGS_KEY);
}

// Bank Holidays (Indian banking holidays 2025-2026)
export const BANK_HOLIDAYS = [
  { date: "2025-01-26", name: "Republic Day" },
  { date: "2025-03-14", name: "Holi" },
  { date: "2025-03-31", name: "Id-ul-Fitr" },
  { date: "2025-04-10", name: "Mahavir Jayanti" },
  { date: "2025-04-14", name: "Dr. Ambedkar Jayanti" },
  { date: "2025-04-18", name: "Good Friday" },
  { date: "2025-05-12", name: "Buddha Purnima" },
  { date: "2025-06-07", name: "Bakri Id" },
  { date: "2025-07-06", name: "Muharram" },
  { date: "2025-08-15", name: "Independence Day" },
  { date: "2025-08-16", name: "Janmashtami" },
  { date: "2025-09-05", name: "Milad-un-Nabi" },
  { date: "2025-10-02", name: "Gandhi Jayanti" },
  { date: "2025-10-12", name: "Dussehra" },
  { date: "2025-10-20", name: "Diwali (Deepavali)" },
  { date: "2025-11-01", name: "Guru Nanak Jayanti" },
  { date: "2025-12-25", name: "Christmas" },
  { date: "2026-01-26", name: "Republic Day" },
  { date: "2026-03-04", name: "Holi" },
  { date: "2026-03-20", name: "Id-ul-Fitr" },
  { date: "2026-04-02", name: "Mahavir Jayanti" },
  { date: "2026-04-14", name: "Dr. Ambedkar Jayanti" },
  { date: "2026-04-03", name: "Good Friday" },
  { date: "2026-05-01", name: "Buddha Purnima" },
  { date: "2026-06-27", name: "Bakri Id" },
  { date: "2026-08-15", name: "Independence Day" },
  { date: "2026-10-02", name: "Gandhi Jayanti" },
  { date: "2026-10-20", name: "Diwali" },
  { date: "2026-12-25", name: "Christmas" },
];
