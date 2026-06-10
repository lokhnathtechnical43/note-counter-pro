"use client";

import { useState, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { formatAmount, getCurrency } from "@/lib/currencies";
import { translations } from "@/lib/i18n";
import { CounterEntry, deleteEntry, saveEntry } from "@/lib/storage";
import { exportEntryPDF, exportAllEntriesPDF } from "@/lib/pdf";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Search,
  Filter,
  Trash2,
  Share2,
  FileDown,
  ArrowDownCircle,
  ArrowUpCircle,
  Eye,
  ClipboardList,
} from "lucide-react";
import { format } from "date-fns";

export default function HistoryPage() {
  const { entries, refreshEntries, currentCurrency, settings } = useAppStore();
  const t = translations[settings.language];

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "in" | "out">("all");
  const [selectedEntry, setSelectedEntry] = useState<CounterEntry | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (filterType !== "all" && entry.entryType !== filterType) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          (entry.personName && entry.personName.toLowerCase().includes(q)) ||
          (entry.category && entry.category.toLowerCase().includes(q)) ||
          (entry.remark && entry.remark.toLowerCase().includes(q)) ||
          entry.currency.toLowerCase().includes(q) ||
          String(entry.total).includes(q)
        );
      }
      return true;
    });
  }, [entries, filterType, searchQuery]);

  const handleDelete = (id: string) => {
    deleteEntry(id);
    refreshEntries();
    setDeleteConfirmId(null);
    toast.success(t.entryDeleted);
  };

  const handleShare = async (entry: CounterEntry) => {
    const currency = getCurrency(entry.currency);
    let text = `Note Counter Pro\n`;
    text += `${entry.entryType === "in" ? "CASH IN" : "CASH OUT"} - ${currency.name}\n`;
    text += `Date: ${format(new Date(entry.date), "dd MMM yyyy, hh:mm a")}\n`;
    text += `Total: ${formatAmount(entry.total, entry.currency)}\n\n`;
    currency.denominations.forEach((d) => {
      const count = entry.counts[String(d.value)] || 0;
      if (count > 0) {
        text += `${currency.symbol}${d.value} × ${count} = ${currency.symbol}${(d.value * count).toLocaleString("en-IN")}\n`;
      }
    });
    if (entry.personName) text += `\nPerson: ${entry.personName}`;
    if (entry.category) text += `\nCategory: ${entry.category}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "Note Counter Entry", text });
      } catch {
        await navigator.clipboard.writeText(text);
        toast.success(t.copied);
      }
    } else {
      await navigator.clipboard.writeText(text);
      toast.success(t.copied);
    }
  };

  const handleExportPDF = (entry: CounterEntry) => {
    exportEntryPDF(entry);
    toast.success(t.exportPDF);
  };

  const handleExportAll = () => {
    exportAllEntriesPDF(filteredEntries);
    toast.success(t.exportPDF);
  };

  const viewEntry = (entry: CounterEntry) => {
    setSelectedEntry(entry);
    setShowDetailDialog(true);
  };

  // Group by date
  const groupedEntries = useMemo(() => {
    const groups = new Map<string, CounterEntry[]>();
    filteredEntries.forEach((entry) => {
      const dateKey = format(new Date(entry.date), "yyyy-MM-dd");
      if (!groups.has(dateKey)) groups.set(dateKey, []);
      groups.get(dateKey)!.push(entry);
    });
    return Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredEntries]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-amber-400">{t.history}</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleExportAll}
          className="text-amber-400/70 hover:text-amber-400"
        >
          <FileDown size={16} className="mr-1" /> {t.exportPDF}
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.search}
            className="pl-9 bg-white/5 border-white/10 text-white text-sm h-9"
          />
        </div>
        <div className="flex gap-1">
          {(["all", "in", "out"] as const).map((type) => (
            <Button
              key={type}
              size="sm"
              variant={filterType === type ? "default" : "ghost"}
              onClick={() => setFilterType(type)}
              className={`text-xs h-9 ${
                filterType === type
                  ? type === "in"
                    ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                    : type === "out"
                    ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                    : "bg-amber-400/20 text-amber-400 hover:bg-amber-400/30"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              {type === "all" ? t.all : type === "in" ? t.in : t.out}
            </Button>
          ))}
        </div>
      </div>

      {/* Entries list */}
      <div className="max-h-[calc(100vh-280px)] overflow-y-auto custom-scrollbar space-y-4">
        {groupedEntries.length === 0 ? (
          <div className="text-center py-16 text-white/30">
            <ClipboardList size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">{t.noEntries}</p>
          </div>
        ) : (
          groupedEntries.map(([dateKey, dayEntries]) => (
            <div key={dateKey}>
              <div className="text-xs text-white/40 mb-2 px-1">
                {format(new Date(dateKey), "EEEE, dd MMMM yyyy")}
              </div>
              <div className="space-y-2">
                <AnimatePresence>
                  {dayEntries.map((entry) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="glass rounded-xl p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            entry.entryType === "in"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {entry.entryType === "in" ? (
                            <ArrowDownCircle size={18} />
                          ) : (
                            <ArrowUpCircle size={18} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">
                              {formatAmount(entry.total, entry.currency)}
                            </span>
                            <Badge
                              variant="secondary"
                              className={`text-[10px] px-1.5 py-0 ${
                                entry.entryType === "in"
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : "bg-red-500/10 text-red-400"
                              }`}
                            >
                              {entry.entryType === "in" ? t.in : t.out}
                            </Badge>
                          </div>
                          <div className="text-xs text-white/40 truncate">
                            {entry.personName && `${entry.personName} • `}
                            {entry.category && `${entry.category} • `}
                            {format(new Date(entry.date), "hh:mm a")}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => viewEntry(entry)}
                            className="w-7 h-7 rounded-lg text-white/30 hover:text-amber-400 hover:bg-amber-400/10 flex items-center justify-center transition-colors"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => handleShare(entry)}
                            className="w-7 h-7 rounded-lg text-white/30 hover:text-emerald-400 hover:bg-emerald-400/10 flex items-center justify-center transition-colors"
                          >
                            <Share2 size={14} />
                          </button>
                          <button
                            onClick={() =>
                              deleteConfirmId === entry.id
                                ? handleDelete(entry.id)
                                : setDeleteConfirmId(entry.id)
                            }
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                              deleteConfirmId === entry.id
                                ? "text-red-400 bg-red-500/20"
                                : "text-white/30 hover:text-red-400 hover:bg-red-400/10"
                            }`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Entry Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="glass-strong border-white/10 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-amber-400">{t.viewEntry}</DialogTitle>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
              <div className="text-center py-2">
                <div className="text-xs text-white/50">{selectedEntry.currency}</div>
                <div className="text-3xl font-bold text-amber-400">
                  {formatAmount(selectedEntry.total, selectedEntry.currency)}
                </div>
                <Badge
                  className={`mt-1 ${
                    selectedEntry.entryType === "in"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {selectedEntry.entryType === "in" ? t.saveIn : t.saveOut}
                </Badge>
                <div className="text-sm text-white/50 mt-1">
                  {format(new Date(selectedEntry.date), "dd MMM yyyy, hh:mm a")}
                </div>
              </div>
              {getCurrency(selectedEntry.currency).denominations.map((d) => {
                const count = selectedEntry.counts[String(d.value)] || 0;
                if (count === 0) return null;
                return (
                  <div key={d.value} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-10 h-6 rounded text-[10px] flex items-center justify-center font-bold"
                        style={{ backgroundColor: d.color, color: d.textColor }}
                      >
                        {selectedEntry.currency === "BDT" || selectedEntry.currency === "NPR"
                          ? d.labelBN
                          : d.label}
                      </div>
                      <span className="text-white/50">× {count}</span>
                    </div>
                    <span className="text-white font-semibold">
                      {formatAmount(d.value * count, selectedEntry.currency)}
                    </span>
                  </div>
                );
              })}
              {selectedEntry.personName && (
                <div className="text-sm text-white/50">
                  {t.personName}: <span className="text-white">{selectedEntry.personName}</span>
                </div>
              )}
              {selectedEntry.mobileNumber && (
                <div className="text-sm text-white/50">
                  {t.mobileNumber}: <span className="text-white">{selectedEntry.mobileNumber}</span>
                </div>
              )}
              {selectedEntry.category && (
                <div className="text-sm text-white/50">
                  {t.category}: <span className="text-white">{selectedEntry.category}</span>
                </div>
              )}
              {selectedEntry.remark && (
                <div className="text-sm text-white/50">
                  {t.remark}: <span className="text-white">{selectedEntry.remark}</span>
                </div>
              )}
              {selectedEntry.targetAmount && (
                <div className="text-sm text-white/50">
                  {selectedEntry.targetMode === "payable" ? t.payable : t.receivable}:{" "}
                  <span className="text-white">
                    {formatAmount(selectedEntry.targetAmount, selectedEntry.currency)}
                  </span>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleShare(selectedEntry)}
                  className="flex-1 text-emerald-400 hover:bg-emerald-500/10"
                >
                  <Share2 size={14} className="mr-1" /> {t.share}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleExportPDF(selectedEntry)}
                  className="flex-1 text-amber-400 hover:bg-amber-400/10"
                >
                  <FileDown size={14} className="mr-1" /> {t.exportPDF}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
