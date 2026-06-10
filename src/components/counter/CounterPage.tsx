"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { getCurrency, formatAmount } from "@/lib/currencies";
import { translations } from "@/lib/i18n";
import { saveEntry, CounterEntry, BANK_HOLIDAYS } from "@/lib/storage";
import { hapticFeedback } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";
import DenominationRow from "./DenominationRow";
import PayableSection from "./PayableSection";
import GrandTotalBar from "./GrandTotalBar";
import { motion, AnimatePresence } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Eye,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  User,
  Tag,
  MessageSquare,
  Phone,
  CreditCard,
  MoreVertical,
  Share2,
  Copy,
  Calendar,
  Banknote,
  Globe,
  Calculator,
} from "lucide-react";

export default function CounterPage() {
  const store = useAppStore();
  const {
    currentCurrency,
    setCurrentCurrency,
    counts,
    getTotal,
    getTotalNotes,
    otherAmount,
    setOtherAmount,
    onlineAmount,
    setOnlineAmount,
    getGrandTotal,
    targetMode,
    targetAmount,
    entryType,
    resetCounts,
    category,
    setCategory,
    remark,
    setRemark,
    personName,
    setPersonName,
    mobileNumber,
    setMobileNumber,
    accountNumber,
    setAccountNumber,
    refreshEntries,
    settings,
    setCalcInputAmount,
    setActiveTab,
  } = store;

  const currency = getCurrency(currentCurrency);
  const t = translations[settings.language];
  const total = getTotal();
  const totalNotes = getTotalNotes();
  const grandTotal = getGrandTotal();

  const [showDetails, setShowDetails] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [lastEntry, setLastEntry] = useState<CounterEntry | null>(null);
  const [showBankHolidaysDialog, setShowBankHolidaysDialog] = useState(false);
  // Track keyboard state - when keyboard is open, hide top section to give more space to notes
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const handleResize = () => {
      const offsetHeight = window.innerHeight - viewport.height;
      setKeyboardOpen(offsetHeight > 50);
    };
    viewport.addEventListener("resize", handleResize);
    viewport.addEventListener("scroll", handleResize);
    return () => {
      viewport.removeEventListener("resize", handleResize);
      viewport.removeEventListener("scroll", handleResize);
    };
  }, []);

  const handleSave = (type: "in" | "out") => {
    if (total === 0 && otherAmount === 0 && onlineAmount === 0 && targetAmount === 0) {
      toast.error("No amounts to save");
      return;
    }

    const entry: CounterEntry = {
      id: uuidv4(),
      date: new Date().toISOString(),
      currency: currentCurrency,
      counts: { ...counts },
      total,
      otherAmount: otherAmount > 0 ? otherAmount : undefined,
      onlineAmount: onlineAmount > 0 ? onlineAmount : undefined,
      entryType: type,
      category: category || undefined,
      remark: remark || undefined,
      personName: personName || undefined,
      mobileNumber: mobileNumber || undefined,
      accountNumber: accountNumber || undefined,
      targetAmount: targetAmount > 0 ? targetAmount : undefined,
      targetMode: targetAmount > 0 ? targetMode : undefined,
    };

    saveEntry(entry);
    refreshEntries();
    setLastEntry(entry);
    resetCounts();
    toast.success(t.entrySaved);

    if (settings.vibration) {
      hapticFeedback(50);
    }
  };

  const generateEntryText = (entry: CounterEntry): string => {
    const c = getCurrency(entry.currency);
    const lines: string[] = [];

    lines.push(`📝 ${t.appName}`);
    lines.push(`━━━━━━━━━━━━━━━━━━`);
    lines.push(
      `${entry.entryType === "in" ? "📥" : "📤"} ${entry.entryType === "in" ? t.saveIn : t.saveOut}`
    );
    lines.push(`📅 ${new Date(entry.date).toLocaleString("en-IN")}`);
    lines.push(`💱 ${c.name} (${c.symbol})`);
    lines.push("");

    lines.push(`💰 ${t.denomination} ${t.count}:`);
    c.denominations.forEach((d) => {
      const count = entry.counts[String(d.value)] || 0;
      if (count > 0) {
        lines.push(`  ${c.symbol}${d.label} × ${count} = ${c.symbol}${(d.value * count).toLocaleString("en-IN")}`);
      }
    });

    lines.push("");
    lines.push(`${t.cashTotal}: ${formatAmount(entry.total, entry.currency)}`);
    if (entry.otherAmount && entry.otherAmount > 0) {
      lines.push(`${t.otherAmount}: ${formatAmount(entry.otherAmount, entry.currency)}`);
    }
    if (entry.onlineAmount && entry.onlineAmount > 0) {
      lines.push(`${t.onlineAmount}: ${formatAmount(entry.onlineAmount, entry.currency)}`);
    }
    const entryGrand = entry.total + (entry.otherAmount || 0) + (entry.onlineAmount || 0);
    lines.push(`${t.grandTotal}: ${formatAmount(entryGrand, entry.currency)}`);

    if (entry.category) lines.push(`${t.category}: ${entry.category}`);
    if (entry.remark) lines.push(`${t.remark}: ${entry.remark}`);
    if (entry.personName) lines.push(`${t.personName}: ${entry.personName}`);
    if (entry.mobileNumber) lines.push(`${t.mobileNumber}: ${entry.mobileNumber}`);
    if (entry.accountNumber) lines.push(`${t.accountNumber}: ${entry.accountNumber}`);
    if (entry.targetAmount && entry.targetAmount > 0) {
      lines.push(`${t.targetAmount}: ${formatAmount(entry.targetAmount, entry.currency)}`);
    }

    return lines.join("\n");
  };

  const generateCurrentEntryText = (): string => {
    const entry: CounterEntry = {
      id: "current",
      date: new Date().toISOString(),
      currency: currentCurrency,
      counts: { ...counts },
      total,
      otherAmount: otherAmount > 0 ? otherAmount : undefined,
      onlineAmount: onlineAmount > 0 ? onlineAmount : undefined,
      entryType,
      category: category || undefined,
      remark: remark || undefined,
      personName: personName || undefined,
      mobileNumber: mobileNumber || undefined,
      accountNumber: accountNumber || undefined,
      targetAmount: targetAmount > 0 ? targetAmount : undefined,
      targetMode: targetAmount > 0 ? targetMode : undefined,
    };
    return generateEntryText(entry);
  };

  const handleShareEntry = async () => {
    const text = generateCurrentEntryText();
    if (navigator.share) {
      try {
        await navigator.share({
          title: t.appName,
          text,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      await navigator.clipboard.writeText(text);
      toast.success(t.copied);
    }
  };

  const handleCopyEntry = async () => {
    const text = generateCurrentEntryText();
    await navigator.clipboard.writeText(text);
    toast.success(t.copied);
  };

  // Filter bank holidays to show upcoming ones
  const today = new Date();
  const upcomingHolidays = BANK_HOLIDAYS.filter((h) => new Date(h.date) >= today).slice(0, 10);

  return (
    <div
      className="flex flex-col h-full overflow-y-auto custom-scrollbar"
    >
      {/* Top section - auto hides when keyboard is open to give more space to notes */}
      {!keyboardOpen && (
      <div className="shrink-0 space-y-3 pb-2">
        {/* Currency Selector + Summary */}
        <div className="flex items-center gap-3">
          <Select
            value={currentCurrency}
            onValueChange={(v) => {
              if (v) setCurrentCurrency(v);
            }}
          >
            <SelectTrigger className="w-[120px] glass border-white/10 bg-white/5 text-amber-400 font-bold text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[
                { code: "INR", symbol: "₹" },
                { code: "BDT", symbol: "৳" },
                { code: "USD", symbol: "$" },
                { code: "EUR", symbol: "€" },
                { code: "NPR", symbol: "₨" },
                { code: "GBP", symbol: "£" },
              ].map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.symbol} {c.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex-1 flex gap-3">
            <div className="flex-1 glass rounded-xl px-3 py-2 text-center">
              <div className="text-[10px] text-white/60">{t.totalNotes}</div>
              <div className="text-sm font-bold text-white">{totalNotes}</div>
            </div>
            <div className="flex-1 glass rounded-xl px-3 py-2 text-center">
              <div className="text-[10px] text-white/60">{t.grandTotal}</div>
              <div className="text-sm font-bold text-amber-400">
                {formatAmount(grandTotal, currentCurrency)}
              </div>
            </div>
          </div>
        </div>

        {/* Payable/Receivable (Tally) */}
        <PayableSection />

        {/* Other Amount & Online Amount fields */}
        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <Banknote
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400/50"
            />
            <Input
              type="number"
              min="0"
              inputMode="numeric"
              enterKeyHint="done"
              value={otherAmount || ""}
              onChange={(e) => setOtherAmount(parseFloat(e.target.value) || 0)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); (e.target as HTMLInputElement).blur(); } }}
              placeholder={t.otherAmount}
              className="pl-8 bg-white/5 border-white/10 text-cyan-400 text-sm h-9 placeholder:text-cyan-400/40 focus:ring-cyan-400/30 focus:border-cyan-400/30"
            />
          </div>
          <div className="relative">
            <Globe
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-400/50"
            />
            <Input
              type="number"
              min="0"
              inputMode="numeric"
              enterKeyHint="done"
              value={onlineAmount || ""}
              onChange={(e) => setOnlineAmount(parseFloat(e.target.value) || 0)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); (e.target as HTMLInputElement).blur(); } }}
              placeholder={t.onlineAmount}
              className="pl-8 bg-white/5 border-white/10 text-violet-400 text-sm h-9 placeholder:text-violet-400/40 focus:ring-violet-400/30 focus:border-violet-400/30"
            />
          </div>
        </div>

        {/* Extra fields toggle */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-center gap-1 text-[10px] text-white/50 py-0.5"
        >
          {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {showDetails ? t.close : t.details}
        </button>

        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 overflow-hidden"
            >
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Tag
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
                  />
                  <Input
                    value={category}
                    enterKeyHint="done"
                    onChange={(e) => setCategory(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); (e.target as HTMLInputElement).blur(); } }}
                    placeholder={t.category}
                    className="pl-8 bg-white/5 border-white/10 text-white text-sm h-9"
                  />
                </div>
                <div className="flex-1 relative">
                  <MessageSquare
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
                  />
                  <Input
                    value={remark}
                    enterKeyHint="done"
                    onChange={(e) => setRemark(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); (e.target as HTMLInputElement).blur(); } }}
                    placeholder={t.remark}
                    className="pl-8 bg-white/5 border-white/10 text-white text-sm h-9"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <User
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
                  />
                  <Input
                    value={personName}
                    enterKeyHint="done"
                    onChange={(e) => setPersonName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); (e.target as HTMLInputElement).blur(); } }}
                    placeholder={t.personName}
                    className="pl-8 bg-white/5 border-white/10 text-white text-sm h-9"
                  />
                </div>
                <div className="flex-1 relative">
                  <Phone
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
                  />
                  <Input
                    value={mobileNumber}
                    type="tel"
                    enterKeyHint="done"
                    onChange={(e) => setMobileNumber(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); (e.target as HTMLInputElement).blur(); } }}
                    placeholder={t.mobileNumber}
                    className="pl-8 bg-white/5 border-white/10 text-white text-sm h-9"
                  />
                </div>
              </div>
              <div className="relative">
                <CreditCard
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
                />
                <Input
                  value={accountNumber}
                  enterKeyHint="done"
                  onChange={(e) => setAccountNumber(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); (e.target as HTMLInputElement).blur(); } }}
                  placeholder={t.accountNumber}
                  className="pl-8 bg-white/5 border-white/10 text-white text-sm h-9"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      )}

      {/* Denomination rows - scrolls with page */}
      <div className="space-y-2 py-2">
        {currency.denominations.map((denom) => (
          <DenominationRow key={denom.value} denom={denom} />
        ))}
      </div>

      {/* Sticky bottom bar - buttons ABOVE GrandTotal */}
      <div
        className="shrink-0 pt-1 space-y-1 glass-strong rounded-t-2xl border-t border-white/10"
        style={{
          position: "sticky",
          bottom: 0,
          zIndex: 20,
        }}
      >
        {/* Action buttons row - ABOVE GrandTotal */}
        <div className="flex gap-1.5 px-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSave("in")}
            className="flex-1 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center gap-1 active:bg-emerald-500/30 transition-colors border border-emerald-500/20"
          >
            <ArrowDownCircle size={14} /> {t.saveIn}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (lastEntry) {
                setShowViewDialog(true);
              } else {
                toast.info("No recent entry to view");
              }
            }}
            className="py-2 px-3 rounded-xl glass text-amber-400 font-bold text-xs flex items-center justify-center gap-1 active:bg-white/10 transition-colors"
          >
            <Eye size={14} />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (grandTotal > 0) {
                setCalcInputAmount(grandTotal);
                setActiveTab("calc");
                toast.success(t.sentToCalc || "Sent to Calculator");
              } else {
                toast.info("No amount to send");
              }
            }}
            className="py-2 px-3 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 font-bold text-xs flex items-center justify-center gap-1 active:bg-amber-400/20 transition-colors"
          >
            <Calculator size={14} />
          </motion.button>

          <DropdownMenu>
            <DropdownMenuTrigger className="py-2 px-2 rounded-xl glass text-white/50 flex items-center justify-center active:bg-white/10 transition-colors outline-none">
              <MoreVertical size={14} />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="glass-strong border-white/10 bg-[#1a1a2e]/95 backdrop-blur-xl"
            >
              <DropdownMenuItem
                onClick={handleShareEntry}
                className="text-white/70 focus:text-amber-400 focus:bg-white/5 cursor-pointer"
              >
                <Share2 size={14} className="mr-2 text-amber-400/70" />
                {t.shareEntry}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleCopyEntry}
                className="text-white/70 focus:text-amber-400 focus:bg-white/5 cursor-pointer"
              >
                <Copy size={14} className="mr-2 text-cyan-400/70" />
                {t.copyEntry}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowBankHolidaysDialog(true)}
                className="text-white/70 focus:text-amber-400 focus:bg-white/5 cursor-pointer"
              >
                <Calendar size={14} className="mr-2 text-violet-400/70" />
                {t.bankHolidays}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSave("out")}
            className="flex-1 py-2 rounded-xl bg-red-500/20 text-red-400 font-bold text-xs flex items-center justify-center gap-1 active:bg-red-500/30 transition-colors border border-red-500/20"
          >
            <ArrowUpCircle size={14} /> {t.saveOut}
          </motion.button>
        </div>

        {/* Reset row */}
        <div className="flex px-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={resetCounts}
            className="flex-1 py-1 rounded-xl glass text-white/50 text-[10px] flex items-center justify-center gap-1 active:bg-white/10 transition-colors"
          >
            <RotateCcw size={10} /> {t.reset}
          </motion.button>
        </div>

        {/* GrandTotalBar - BELOW buttons */}
        <GrandTotalBar />
      </div>

      {/* View Entry Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="glass-strong border-white/10 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-amber-400">
              {lastEntry?.entryType === "in" ? t.saveIn : t.saveOut} - {t.viewEntry}
            </DialogTitle>
          </DialogHeader>
          {lastEntry && (
            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
              <div className="text-center py-2">
                <div className="text-xs text-white/50">{lastEntry.currency}</div>
                <div className="text-3xl font-bold text-amber-400">
                  {formatAmount(lastEntry.total, lastEntry.currency)}
                </div>
                {(lastEntry.otherAmount || 0) > 0 && (
                  <div className="text-sm text-cyan-400">
                    {t.otherAmount}: {formatAmount(lastEntry.otherAmount!, lastEntry.currency)}
                  </div>
                )}
                {(lastEntry.onlineAmount || 0) > 0 && (
                  <div className="text-sm text-violet-400">
                    {t.onlineAmount}: {formatAmount(lastEntry.onlineAmount!, lastEntry.currency)}
                  </div>
                )}
                {(lastEntry.otherAmount || 0) > 0 || (lastEntry.onlineAmount || 0) > 0 ? (
                  <div className="text-lg font-bold text-amber-400 mt-1">
                    {t.grandTotal}:{" "}
                    {formatAmount(
                      lastEntry.total + (lastEntry.otherAmount || 0) + (lastEntry.onlineAmount || 0),
                      lastEntry.currency
                    )}
                  </div>
                ) : null}
                <div className="text-sm text-white/50">
                  {new Date(lastEntry.date).toLocaleString("en-IN")}
                </div>
              </div>
              {getCurrency(lastEntry.currency).denominations.map((d) => {
                const count = lastEntry.counts[String(d.value)] || 0;
                if (count === 0) return null;
                return (
                  <div key={d.value} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-5 rounded text-[10px] flex items-center justify-center font-bold"
                        style={{ backgroundColor: d.color, color: d.textColor }}
                      >
                        {d.label}
                      </div>
                      <span className="text-white/50">× {count}</span>
                    </div>
                    <span className="text-white font-semibold">
                      {formatAmount(d.value * count, lastEntry.currency)}
                    </span>
                  </div>
                );
              })}
              {lastEntry.personName && (
                <div className="text-sm text-white/50">
                  {t.personName}: {lastEntry.personName}
                </div>
              )}
              {lastEntry.category && (
                <div className="text-sm text-white/50">
                  {t.category}: {lastEntry.category}
                </div>
              )}
              {lastEntry.remark && (
                <div className="text-sm text-white/50">
                  {t.remark}: {lastEntry.remark}
                </div>
              )}
              {lastEntry.mobileNumber && (
                <div className="text-sm text-white/50">
                  {t.mobileNumber}: {lastEntry.mobileNumber}
                </div>
              )}
              {lastEntry.accountNumber && (
                <div className="text-sm text-white/50">
                  {t.accountNumber}: {lastEntry.accountNumber}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bank Holidays Dialog */}
      <Dialog open={showBankHolidaysDialog} onOpenChange={setShowBankHolidaysDialog}>
        <DialogContent className="glass-strong border-white/10 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-amber-400 flex items-center gap-2">
              <Calendar size={18} />
              {t.bankHolidays}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto custom-scrollbar space-y-2">
            {upcomingHolidays.length > 0 ? (
              upcomingHolidays.map((holiday) => {
                const holidayDate = new Date(holiday.date);
                const dayName = holidayDate.toLocaleDateString("en-IN", {
                  weekday: "short",
                });
                const dateStr = holidayDate.toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                });
                const isToday =
                  holidayDate.toDateString() === today.toDateString();
                return (
                  <motion.div
                    key={holiday.date}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex items-center gap-3 p-3 rounded-xl ${
                      isToday
                        ? "bg-amber-400/15 border border-amber-400/30"
                        : "bg-white/5 border border-white/5"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 ${
                        isToday
                          ? "bg-amber-400/20 text-amber-400"
                          : "bg-violet-400/10 text-violet-400"
                      }`}
                    >
                      <div className="text-[9px] font-bold uppercase">{dayName}</div>
                      <div className="text-sm font-bold leading-none">
                        {holidayDate.getDate()}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-sm font-semibold truncate ${
                          isToday ? "text-amber-400" : "text-white/80"
                        }`}
                      >
                        {holiday.name}
                      </div>
                      <div className="text-[10px] text-white/40">{dateStr}</div>
                    </div>
                    {isToday && (
                      <span className="text-[9px] bg-amber-400/20 text-amber-400 px-2 py-0.5 rounded-full font-bold uppercase">
                        Today
                      </span>
                    )}
                  </motion.div>
                );
              })
            ) : (
              <div className="text-center py-8 text-white/30 text-sm">
                {t.noUpcomingHolidays}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
