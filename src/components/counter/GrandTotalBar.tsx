"use client";

import { useAppStore } from "@/lib/store";
import { formatAmount } from "@/lib/currencies";
import { translations } from "@/lib/i18n";
import { motion } from "framer-motion";
import { Wallet, Banknote, Globe, Plus, Target } from "lucide-react";

export default function GrandTotalBar() {
  const {
    getTotal,
    getTotalNotes,
    currentCurrency,
    otherAmount,
    onlineAmount,
    getGrandTotal,
    targetMode,
    targetAmount,
    settings,
  } = useAppStore();
  const t = translations[settings.language];
  const cashTotal = getTotal();
  const totalNotes = getTotalNotes();
  const grandTotal = getGrandTotal();
  const diff = targetAmount > 0 ? grandTotal - targetAmount : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-3 pt-2 pb-1 space-y-1.5"
    >
      {/* Breakdown row */}
      <div className="grid grid-cols-3 gap-1.5">
        {/* Cash Total */}
        <div className="rounded-lg bg-amber-400/15 p-1.5 text-center border border-amber-400/20">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Banknote size={10} className="text-amber-400" />
            <span className="text-[8px] text-amber-300/80 uppercase tracking-wide font-semibold">
              {t.cashTotal}
            </span>
          </div>
          <div className="text-xs font-bold text-amber-400">
            {formatAmount(cashTotal, currentCurrency)}
          </div>
        </div>

        {/* Other Amount */}
        <div className="rounded-lg bg-cyan-400/15 p-1.5 text-center border border-cyan-400/20">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Plus size={10} className="text-cyan-400" />
            <span className="text-[8px] text-cyan-300/80 uppercase tracking-wide font-semibold">
              {t.otherAmount}
            </span>
          </div>
          <div className="text-xs font-bold text-cyan-400">
            {formatAmount(otherAmount, currentCurrency)}
          </div>
        </div>

        {/* Online Amount */}
        <div className="rounded-lg bg-violet-400/15 p-1.5 text-center border border-violet-400/20">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Globe size={10} className="text-violet-400" />
            <span className="text-[8px] text-violet-300/80 uppercase tracking-wide font-semibold">
              {t.onlineAmount}
            </span>
          </div>
          <div className="text-xs font-bold text-violet-400">
            {formatAmount(onlineAmount, currentCurrency)}
          </div>
        </div>
      </div>

      {/* Grand Total + Payable/Receivable Result */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-amber-400/20 flex items-center justify-center">
          <Wallet size={14} className="text-amber-400" />
        </div>
        <div className="flex-1">
          <div className="text-[9px] text-amber-300/60 font-semibold">{t.grandTotal}</div>
          <div className="text-lg font-bold text-amber-400">
            {formatAmount(grandTotal, currentCurrency)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[9px] text-white/40 font-semibold">{t.totalNotes}</div>
          <div className="text-sm font-bold text-white/80">{totalNotes}</div>
        </div>
      </div>

      {/* Payable/Receivable Target Result - shown here */}
      {targetAmount > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-bold ${
            diff >= 0
              ? "bg-emerald-400/15 text-emerald-400 border border-emerald-400/20"
              : "bg-red-400/15 text-red-400 border border-red-400/20"
          }`}
        >
          <Target size={12} />
          <span>{targetMode === "payable" ? t.payable : t.receivable}:</span>
          {diff >= 0
            ? `${t.excess}: ${formatAmount(diff, currentCurrency)}`
            : `${t.shortfall}: ${formatAmount(Math.abs(diff), currentCurrency)}`}
        </motion.div>
      )}
    </motion.div>
  );
}
