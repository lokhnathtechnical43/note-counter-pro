"use client";

import { useAppStore } from "@/lib/store";
import { getCurrency, DenominationDef } from "@/lib/currencies";
import { translations } from "@/lib/i18n";
import { motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";

export default function DenominationRow({ denom }: { denom: DenominationDef }) {
  const { currentCurrency, counts, incrementCount, decrementCount, setCount, settings } = useAppStore();
  const currency = getCurrency(currentCurrency);
  const count = counts[String(denom.value)] || 0;
  const subtotal = denom.value * count;
  const t = translations[settings.language];

  const vibrate = () => {
    if (settings.vibration && typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      try {
        navigator.vibrate(25);
      } catch {
        // Vibration not supported
      }
    }
  };

  const handleIncrement = () => {
    incrementCount(String(denom.value));
    vibrate();
  };

  const handleDecrement = () => {
    decrementCount(String(denom.value));
    vibrate();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 0;
    setCount(String(denom.value), val);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-2 px-2.5 py-2 glass rounded-xl"
    >
      {/* Color chip */}
      <div
        className="denom-chip shrink-0"
        style={{ backgroundColor: denom.color, color: denom.textColor }}
      >
        {settings.language === "bn" ? denom.labelBN : denom.label}
      </div>

      {/* Minus button */}
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={handleDecrement}
        className="shrink-0 w-9 h-9 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center active:bg-red-500/30 transition-colors"
        aria-label="Decrease count"
      >
        <Minus size={16} />
      </motion.button>

      {/* Input field */}
      <input
        type="number"
        min="0"
        inputMode="numeric"
        enterKeyHint="done"
        value={count || ""}
        onChange={handleInputChange}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); (e.target as HTMLInputElement).blur(); } }}
        placeholder="0"
        className="w-14 h-8 text-center bg-white/5 border border-white/10 rounded-lg text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50"
      />

      {/* Plus button */}
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={handleIncrement}
        className="shrink-0 w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center active:bg-emerald-500/30 transition-colors"
        aria-label="Increase count"
      >
        <Plus size={16} />
      </motion.button>

      {/* Subtotal */}
      <div className="ml-auto text-right shrink-0 min-w-[80px]">
        <div className="text-[10px] text-white/50">{currency.symbol}</div>
        <div className="text-sm font-bold text-amber-400">
          {subtotal.toLocaleString("en-IN")}
        </div>
      </div>
    </motion.div>
  );
}
