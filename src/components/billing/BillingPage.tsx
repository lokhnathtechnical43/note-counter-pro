"use client";

import { useState, useMemo, useCallback } from "react";
import { useAppStore } from "@/lib/store";
import { getCurrency } from "@/lib/currencies";
import { translations } from "@/lib/i18n";
import { saveBill, getBills, deleteBill, Bill, BillItem } from "@/lib/storage";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import {
  Plus,
  Trash2,
  Eye,
  Share2,
  Save,
  Receipt,
  User,
  Phone,
  MapPin,
  Percent,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { format } from "date-fns";

export default function BillingPage() {
  const { settings, currentCurrency } = useAppStore();
  const t = translations[settings.language];
  const currencySymbol = getCurrency(currentCurrency).symbol;

  // ─── Item form state ───
  const [items, setItems] = useState<BillItem[]>([]);
  const [itemName, setItemName] = useState("");
  const [itemQty, setItemQty] = useState("");
  const [itemRate, setItemRate] = useState("");

  // ─── Customer info state ───
  const [customerName, setCustomerName] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");

  // ─── Dialog state ───
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [billToDelete, setBillToDelete] = useState<Bill | null>(null);
  const [expandedBillId, setExpandedBillId] = useState<string | null>(null);
  const [savedBills, setSavedBills] = useState<Bill[]>([]);

  // ─── Calculations ───
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.qty * item.rate, 0),
    [items]
  );

  const discountValue = useMemo(
    () => (discountPercent ? parseFloat(discountPercent) || 0 : 0),
    [discountPercent]
  );

  const discountAmount = useMemo(
    () => subtotal * (discountValue / 100),
    [subtotal, discountValue]
  );

  const totalAmount = useMemo(
    () => subtotal - discountAmount,
    [subtotal, discountAmount]
  );

  const totalUnits = useMemo(
    () => items.reduce((sum, item) => sum + item.qty, 0),
    [items]
  );

  // ─── Add item ───
  const handleAddItem = useCallback(() => {
    const name = itemName.trim();
    const qty = parseInt(itemQty, 10);
    const rate = parseFloat(itemRate);

    if (!name) {
      toast.error(t.itemName);
      return;
    }
    if (!qty || qty <= 0) {
      toast.error(t.quantity);
      return;
    }
    if (!rate || rate <= 0) {
      toast.error(t.rate);
      return;
    }

    setItems((prev) => [...prev, { name, qty, rate }]);
    setItemName("");
    setItemQty("");
    setItemRate("");
  }, [itemName, itemQty, itemRate, t]);

  // ─── Remove item ───
  const handleRemoveItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // ─── Save bill ───
  const handleSaveBill = useCallback(() => {
    if (items.length === 0) {
      toast.error(t.addItem);
      return;
    }

    const bill: Bill = {
      id: uuidv4(),
      date: new Date().toISOString(),
      items: [...items],
      customerName: customerName.trim(),
      customerMobile: customerMobile.trim(),
      customerAddress: customerAddress.trim(),
      discountPercent: discountValue,
      totalUnits,
      totalAmount,
    };

    saveBill(bill);
    toast.success(t.billSaved);

    // Reset form
    setItems([]);
    setCustomerName("");
    setCustomerMobile("");
    setCustomerAddress("");
    setDiscountPercent("");
  }, [items, customerName, customerMobile, customerAddress, discountValue, totalUnits, totalAmount, t]);

  // ─── View bills ───
  const handleViewBills = useCallback(() => {
    setSavedBills(getBills());
    setShowViewDialog(true);
  }, []);

  // ─── Delete bill ───
  const handleConfirmDelete = useCallback(() => {
    if (billToDelete) {
      deleteBill(billToDelete.id);
      setSavedBills(getBills());
      toast.success(t.billDeleted);
    }
    setShowDeleteDialog(false);
    setBillToDelete(null);
  }, [billToDelete, t]);

  const handleDeleteClick = useCallback((bill: Bill) => {
    setBillToDelete(bill);
    setShowDeleteDialog(true);
  }, []);

  // ─── Share bill ───
  const handleShareBill = useCallback(
    (bill: Bill) => {
      const currency = getCurrency(currentCurrency).symbol;

      let text = `Note Counter Pro - Bill\n`;
      text += `Date: ${format(new Date(bill.date), "dd MMM yyyy, hh:mm a")}\n`;
      if (bill.customerName) text += `Customer: ${bill.customerName}\n`;
      if (bill.customerMobile) text += `Mobile: ${bill.customerMobile}\n`;
      if (bill.customerAddress) text += `Address: ${bill.customerAddress}\n`;
      text += `---\n`;
      text += `Items:\n`;
      bill.items.forEach((item, i) => {
        const amt = item.qty * item.rate;
        text += `${i + 1}. ${item.name} × ${item.qty} @ ${currency}${item.rate} = ${currency}${amt}\n`;
      });
      text += `---\n`;
      const billSubtotal = bill.items.reduce((s, it) => s + it.qty * it.rate, 0);
      text += `Subtotal: ${currency}${billSubtotal}\n`;
      if (bill.discountPercent > 0) {
        text += `Discount: ${bill.discountPercent}%\n`;
      }
      text += `Total: ${currency}${bill.totalAmount}\n`;

      if (navigator.share) {
        navigator.share({ title: "Bill", text }).catch(() => {
          navigator.clipboard.writeText(text);
          toast.success(t.copied);
        });
      } else {
        navigator.clipboard.writeText(text);
        toast.success(t.copied);
      }
    },
    [currentCurrency, t]
  );

  // ─── Toggle bill expansion ───
  const toggleExpand = useCallback((id: string) => {
    setExpandedBillId((prev) => (prev === id ? null : id));
  }, []);

  // ─── Animation variants ───
  const itemVariants = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  };

  return (
    <div className="h-full flex flex-col">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2">
          <Receipt size={18} />
          {t.billing}
        </h2>
        <Button
          size="sm"
          onClick={handleViewBills}
          className="bg-amber-400/20 text-amber-400 hover:bg-amber-400/30 border border-amber-400/20"
        >
          <Eye size={14} className="mr-1" /> {t.viewBill}
        </Button>
      </div>

      {/* ─── Scrollable content ─── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 min-h-0">
        {/* ─── Add Item Section ─── */}
        <div className="glass rounded-xl p-3 space-y-2">
          <div className="text-xs font-semibold text-amber-400 flex items-center gap-1.5 mb-1">
            <Plus size={12} /> {t.addItem}
          </div>

          <div className="flex gap-2">
            <Input
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder={t.itemName}
              className="flex-1 bg-white/5 border-white/10 text-white text-xs h-9 placeholder:text-white/25"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddItem();
              }}
            />
          </div>

          <div className="flex gap-2">
            <Input
              type="number"
              min="1"
              value={itemQty}
              onChange={(e) => setItemQty(e.target.value)}
              placeholder={t.quantity}
              className="w-20 bg-white/5 border-white/10 text-white text-xs h-9 placeholder:text-white/25"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddItem();
              }}
            />
            <Input
              type="number"
              min="0"
              step="0.01"
              value={itemRate}
              onChange={(e) => setItemRate(e.target.value)}
              placeholder={t.rate}
              className="flex-1 bg-white/5 border-white/10 text-white text-xs h-9 placeholder:text-white/25"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddItem();
              }}
            />
            <Button
              size="sm"
              onClick={handleAddItem}
              className="bg-amber-400/20 text-amber-400 hover:bg-amber-400/30 border border-amber-400/20 h-9 px-3 shrink-0"
            >
              <Plus size={14} />
            </Button>
          </div>
        </div>

        {/* ─── Items List ─── */}
        <AnimatePresence mode="popLayout">
          {items.length > 0 && (
            <div className="space-y-1.5">
              {items.map((item, index) => {
                const amount = item.qty * item.rate;
                return (
                  <motion.div
                    key={`${item.name}-${index}`}
                    variants={itemVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.2 }}
                    className="glass rounded-xl p-3 flex items-center gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white truncate">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-white/40">
                        {item.qty} × {currencySymbol}
                        {item.rate} ={" "}
                        <span className="text-amber-400 font-medium">
                          {currencySymbol}
                          {amount.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(index)}
                      className="w-7 h-7 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/10 flex items-center justify-center transition-colors shrink-0"
                      aria-label={t.removeItem}
                    >
                      <Trash2 size={14} />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>

        {/* ─── Customer Info Section ─── */}
        <div className="glass rounded-xl p-3 space-y-2">
          <div className="text-xs font-semibold text-amber-400 flex items-center gap-1.5 mb-1">
            <User size={12} /> {t.customerInfo}
          </div>

          <div className="relative">
            <User
              size={12}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
            />
            <Input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder={t.customerName}
              className="pl-8 bg-white/5 border-white/10 text-white text-xs h-9 placeholder:text-white/25"
            />
          </div>

          <div className="relative">
            <Phone
              size={12}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
            />
            <Input
              value={customerMobile}
              onChange={(e) => setCustomerMobile(e.target.value)}
              placeholder={t.mobile}
              className="pl-8 bg-white/5 border-white/10 text-white text-xs h-9 placeholder:text-white/25"
            />
          </div>

          <div className="relative">
            <MapPin
              size={12}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
            />
            <Input
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              placeholder={t.address}
              className="pl-8 bg-white/5 border-white/10 text-white text-xs h-9 placeholder:text-white/25"
            />
          </div>

          <div className="relative">
            <Percent
              size={12}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
            />
            <Input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
              placeholder={t.discount}
              className="pl-8 bg-white/5 border-white/10 text-white text-xs h-9 placeholder:text-white/25"
            />
          </div>
        </div>
      </div>

      {/* ─── Sticky Bottom: Summary & Save ─── */}
      <div className="shrink-0 pt-3 border-t border-white/5 mt-3 space-y-2">
        {/* Summary row */}
        <div className="glass rounded-xl p-3">
          <div className="flex items-center justify-between text-xs text-white/50">
            <span>{t.totalUnits}</span>
            <span className="text-white font-semibold">{totalUnits}</span>
          </div>
          {discountValue > 0 && (
            <div className="flex items-center justify-between text-xs text-white/50 mt-1">
              <span>{t.discount}</span>
              <span className="text-red-400 font-semibold">
                -{currencySymbol}
                {discountAmount.toLocaleString("en-IN")} ({discountValue}%)
              </span>
            </div>
          )}
          <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-white/10">
            <span className="text-sm font-bold text-amber-400">
              {t.totalAmountBill}
            </span>
            <span className="text-lg font-bold text-amber-400">
              {currencySymbol}
              {totalAmount.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleSaveBill}
            disabled={items.length === 0}
            className="flex-1 bg-amber-400/20 text-amber-400 hover:bg-amber-400/30 border border-amber-400/20 disabled:opacity-30 disabled:cursor-not-allowed h-10"
          >
            <Save size={14} className="mr-1.5" /> {t.saveBill}
          </Button>
          <Button
            onClick={() => {
              if (items.length === 0) {
                toast.error(t.addItem);
                return;
              }
              const tempBill: Bill = {
                id: "temp",
                date: new Date().toISOString(),
                items: [...items],
                customerName: customerName.trim(),
                customerMobile: customerMobile.trim(),
                customerAddress: customerAddress.trim(),
                discountPercent: discountValue,
                totalUnits,
                totalAmount,
              };
              handleShareBill(tempBill);
            }}
            disabled={items.length === 0}
            className="bg-white/5 text-white/70 hover:bg-white/10 border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed h-10 px-4"
          >
            <Share2 size={14} className="mr-1.5" /> {t.shareBill}
          </Button>
        </div>
      </div>

      {/* ─── View Bills Dialog ─── */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="glass-strong border-white/10 max-w-sm max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="text-amber-400 flex items-center gap-2">
              <Receipt size={16} /> {t.viewBill}
            </DialogTitle>
          </DialogHeader>

          <div className="max-h-96 overflow-y-auto custom-scrollbar space-y-2 mt-2">
            {savedBills.length === 0 ? (
              <div className="text-center py-12 text-white/30">
                <Receipt size={36} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">{t.noBills}</p>
              </div>
            ) : (
              savedBills.map((bill) => {
                const isExpanded = expandedBillId === bill.id;
                return (
                  <motion.div
                    key={bill.id}
                    layout
                    className="glass rounded-xl overflow-hidden"
                  >
                    {/* Bill header - always visible */}
                    <button
                      onClick={() => toggleExpand(bill.id)}
                      className="w-full p-3 flex items-center gap-3 text-left hover:bg-white/5 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center shrink-0">
                        <Receipt size={14} className="text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-white truncate">
                          {bill.customerName || "—"}
                        </div>
                        <div className="text-[10px] text-white/40">
                          {format(new Date(bill.date), "dd MMM yyyy, hh:mm a")}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold text-amber-400">
                          {currencySymbol}
                          {bill.totalAmount.toLocaleString("en-IN")}
                        </div>
                        <div className="text-[10px] text-white/40">
                          {bill.items.length} {bill.items.length === 1 ? "item" : "items"}
                        </div>
                      </div>
                      <div className="text-white/30 shrink-0">
                        {isExpanded ? (
                          <ChevronUp size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        )}
                      </div>
                    </button>

                    {/* Expanded details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 pb-3 space-y-2 border-t border-white/5 pt-2">
                            {/* Customer info */}
                            {(bill.customerMobile || bill.customerAddress) && (
                              <div className="space-y-1 text-[11px] text-white/50">
                                {bill.customerMobile && (
                                  <div className="flex items-center gap-1.5">
                                    <Phone size={10} /> {bill.customerMobile}
                                  </div>
                                )}
                                {bill.customerAddress && (
                                  <div className="flex items-center gap-1.5">
                                    <MapPin size={10} /> {bill.customerAddress}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Items list */}
                            <div className="space-y-1">
                              {bill.items.map((item, i) => {
                                const amt = item.qty * item.rate;
                                return (
                                  <div
                                    key={i}
                                    className="flex items-center justify-between text-[11px]"
                                  >
                                    <span className="text-white/70 truncate flex-1 min-w-0">
                                      {i + 1}. {item.name}
                                    </span>
                                    <span className="text-white/40 ml-2 shrink-0">
                                      {item.qty} × {currencySymbol}
                                      {item.rate}
                                    </span>
                                    <span className="text-amber-400 font-medium ml-2 shrink-0">
                                      {currencySymbol}
                                      {amt.toLocaleString("en-IN")}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Summary */}
                            <div className="border-t border-white/5 pt-2 space-y-1">
                              <div className="flex justify-between text-[11px] text-white/40">
                                <span>{t.totalUnits}</span>
                                <span>{bill.totalUnits}</span>
                              </div>
                              {bill.discountPercent > 0 && (
                                <div className="flex justify-between text-[11px] text-red-400/70">
                                  <span>{t.discount}</span>
                                  <span>{bill.discountPercent}%</span>
                                </div>
                              )}
                              <div className="flex justify-between text-xs font-bold text-amber-400">
                                <span>{t.totalAmountBill}</span>
                                <span>
                                  {currencySymbol}
                                  {bill.totalAmount.toLocaleString("en-IN")}
                                </span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-1">
                              <Button
                                size="sm"
                                onClick={() => handleShareBill(bill)}
                                className="flex-1 bg-white/5 text-white/70 hover:bg-white/10 border border-white/10 h-8 text-xs"
                              >
                                <Share2 size={12} className="mr-1" /> {t.share}
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleDeleteClick(bill)}
                                className="flex-1 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 h-8 text-xs"
                              >
                                <Trash2 size={12} className="mr-1" /> {t.delete}
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation Dialog ─── */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="glass-strong border-white/10 max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-red-400">{t.deleteBill}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-white/60">{t.areYouSure}</p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setBillToDelete(null);
                }}
                className="flex-1 text-white/50"
              >
                {t.cancel}
              </Button>
              <Button
                onClick={handleConfirmDelete}
                className="flex-1 bg-red-500/20 text-red-400 hover:bg-red-500/30"
              >
                {t.confirm}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
