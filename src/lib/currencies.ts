export interface CurrencyDef {
  code: string;
  symbol: string;
  name: string;
  nameBN: string;
  denominations: DenominationDef[];
}

export interface DenominationDef {
  value: number;
  color: string; // Tailwind bg class or hex
  textColor: string;
  label: string;
  labelBN: string;
}

export const currencies: CurrencyDef[] = [
  {
    code: "INR",
    symbol: "₹",
    name: "Indian Rupee",
    nameBN: "ভারতীয় টাকা",
    denominations: [
      { value: 500, color: "#7c3aed", textColor: "#ffffff", label: "500", labelBN: "৫০০" },
      { value: 200, color: "#f97316", textColor: "#ffffff", label: "200", labelBN: "২০০" },
      { value: 100, color: "#8b5cf6", textColor: "#ffffff", label: "100", labelBN: "১০০" },
      { value: 50, color: "#06b6d4", textColor: "#ffffff", label: "50", labelBN: "৫০" },
      { value: 20, color: "#84cc16", textColor: "#000000", label: "20", labelBN: "২০" },
      { value: 10, color: "#f59e0b", textColor: "#000000", label: "10", labelBN: "১০" },
      { value: 5, color: "#10b981", textColor: "#ffffff", label: "5", labelBN: "৫" },
      { value: 2, color: "#6366f1", textColor: "#ffffff", label: "2", labelBN: "২" },
      { value: 1, color: "#ec4899", textColor: "#ffffff", label: "1", labelBN: "১" },
    ],
  },
  {
    code: "BDT",
    symbol: "৳",
    name: "Bangladeshi Taka",
    nameBN: "বাংলাদেশি টাকা",
    denominations: [
      { value: 1000, color: "#dc2626", textColor: "#ffffff", label: "1000", labelBN: "১০০০" },
      { value: 500, color: "#7c3aed", textColor: "#ffffff", label: "500", labelBN: "৫০০" },
      { value: 100, color: "#8b5cf6", textColor: "#ffffff", label: "100", labelBN: "১০০" },
      { value: 50, color: "#06b6d4", textColor: "#ffffff", label: "50", labelBN: "৫০" },
      { value: 20, color: "#84cc16", textColor: "#000000", label: "20", labelBN: "২০" },
      { value: 10, color: "#f59e0b", textColor: "#000000", label: "10", labelBN: "১০" },
      { value: 5, color: "#10b981", textColor: "#ffffff", label: "5", labelBN: "৫" },
      { value: 2, color: "#6366f1", textColor: "#ffffff", label: "2", labelBN: "২" },
      { value: 1, color: "#ec4899", textColor: "#ffffff", label: "1", labelBN: "১" },
    ],
  },
  {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
    nameBN: "মার্কিন ডলার",
    denominations: [
      { value: 100, color: "#16a34a", textColor: "#ffffff", label: "100", labelBN: "১০০" },
      { value: 50, color: "#dc2626", textColor: "#ffffff", label: "50", labelBN: "৫০" },
      { value: 20, color: "#2563eb", textColor: "#ffffff", label: "20", labelBN: "২০" },
      { value: 10, color: "#f97316", textColor: "#ffffff", label: "10", labelBN: "১০" },
      { value: 5, color: "#7c3aed", textColor: "#ffffff", label: "5", labelBN: "৫" },
      { value: 1, color: "#6b7280", textColor: "#ffffff", label: "1", labelBN: "১" },
    ],
  },
  {
    code: "EUR",
    symbol: "€",
    name: "Euro",
    nameBN: "ইউরো",
    denominations: [
      { value: 500, color: "#7c3aed", textColor: "#ffffff", label: "500", labelBN: "৫০০" },
      { value: 200, color: "#f97316", textColor: "#ffffff", label: "200", labelBN: "২০০" },
      { value: 100, color: "#16a34a", textColor: "#ffffff", label: "100", labelBN: "১০০" },
      { value: 50, color: "#f59e0b", textColor: "#000000", label: "50", labelBN: "৫০" },
      { value: 20, color: "#2563eb", textColor: "#ffffff", label: "20", labelBN: "২০" },
      { value: 10, color: "#dc2626", textColor: "#ffffff", label: "10", labelBN: "১০" },
      { value: 5, color: "#6b7280", textColor: "#ffffff", label: "5", labelBN: "৫" },
    ],
  },
  {
    code: "NPR",
    symbol: "₨",
    name: "Nepalese Rupee",
    nameBN: "নেপালি টাকা",
    denominations: [
      { value: 1000, color: "#dc2626", textColor: "#ffffff", label: "1000", labelBN: "১০০০" },
      { value: 500, color: "#7c3aed", textColor: "#ffffff", label: "500", labelBN: "৫০০" },
      { value: 100, color: "#8b5cf6", textColor: "#ffffff", label: "100", labelBN: "১০০" },
      { value: 50, color: "#06b6d4", textColor: "#ffffff", label: "50", labelBN: "৫০" },
      { value: 20, color: "#84cc16", textColor: "#000000", label: "20", labelBN: "২০" },
      { value: 10, color: "#f59e0b", textColor: "#000000", label: "10", labelBN: "১০" },
      { value: 5, color: "#10b981", textColor: "#ffffff", label: "5", labelBN: "৫" },
      { value: 2, color: "#6366f1", textColor: "#ffffff", label: "2", labelBN: "২" },
      { value: 1, color: "#ec4899", textColor: "#ffffff", label: "1", labelBN: "১" },
    ],
  },
  {
    code: "GBP",
    symbol: "£",
    name: "British Pound",
    nameBN: "ব্রিটিশ পাউন্ড",
    denominations: [
      { value: 50, color: "#dc2626", textColor: "#ffffff", label: "50", labelBN: "৫০" },
      { value: 20, color: "#6366f1", textColor: "#ffffff", label: "20", labelBN: "২০" },
      { value: 10, color: "#f97316", textColor: "#ffffff", label: "10", labelBN: "১০" },
      { value: 5, color: "#16a34a", textColor: "#ffffff", label: "5", labelBN: "৫" },
      { value: 2, color: "#8b5cf6", textColor: "#ffffff", label: "2", labelBN: "২" },
      { value: 1, color: "#6b7280", textColor: "#ffffff", label: "1", labelBN: "১" },
    ],
  },
];

export function getCurrency(code: string): CurrencyDef {
  return currencies.find((c) => c.code === code) || currencies[0];
}

export function formatAmount(amount: number, currencyCode: string): string {
  const currency = getCurrency(currencyCode);
  return `${currency.symbol}${amount.toLocaleString("en-IN")}`;
}
