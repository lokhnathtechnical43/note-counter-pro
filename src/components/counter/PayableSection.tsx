"use client";

import { useAppStore } from "@/lib/store";
import { translations } from "@/lib/i18n";
import { motion } from "framer-motion";

export default function PayableSection() {
  const {
    targetMode,
    setTargetMode,
    targetAmount,
    setTargetAmount,
    settings,
  } = useAppStore();

  const t = translations[settings.language];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl p-2.5 space-y-2"
    >
      {/* Toggle */}
      <div className="flex rounded-lg overflow-hidden border border-white/10">
        <button
          onClick={() => setTargetMode("payable")}
          className={`flex-1 py-2 text-sm font-bold transition-all ${
            targetMode === "payable"
              ? "bg-red-500/20 text-red-400 border-b-2 border-red-400"
              : "text-white/50 hover:text-white/70"
          }`}
        >
          {t.payable}
        </button>
        <button
          onClick={() => setTargetMode("receivable")}
          className={`flex-1 py-2 text-sm font-bold transition-all ${
            targetMode === "receivable"
              ? "bg-emerald-500/20 text-emerald-400 border-b-2 border-emerald-400"
              : "text-white/50 hover:text-white/70"
          }`}
        >
          {t.receivable}
        </button>
      </div>

      {/* Target Amount Input */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-white/60 shrink-0">{t.targetAmount}:</label>
        <input
          type="number"
          min="0"
          value={targetAmount || ""}
          onChange={(e) => setTargetAmount(parseInt(e.target.value) || 0)}
          placeholder="0"
          className="flex-1 h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-400/50"
        />
      </div>
    </motion.div>
  );
}
