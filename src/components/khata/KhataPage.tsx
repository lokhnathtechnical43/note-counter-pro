"use client";

import { useState, useMemo, useCallback } from "react";
import { useAppStore } from "@/lib/store";
import { formatAmount } from "@/lib/currencies";
import { translations } from "@/lib/i18n";
import {
  saveKhataPerson,
  getKhataPersons,
  deleteKhataPerson,
  KhataPerson,
  KhataTransaction,
  saveSettings,
} from "@/lib/storage";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import {
  Plus,
  Search,
  Eye,
  EyeOff,
  MoreVertical,
  User,
  Phone,
  TrendingUp,
  TrendingDown,
  Trash2,
  Edit3,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";
import { format } from "date-fns";

export default function KhataPage() {
  const { settings, refreshSettings, currentCurrency } = useAppStore();
  const t = translations[settings.language];

  // Data state
  const [persons, setPersons] = useState<KhataPerson[]>(() =>
    typeof window !== "undefined" ? getKhataPersons() : []
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [hideTotal, setHideTotal] = useState(settings.hideKhataTotal);

  // Dialog states
  const [showAddPersonDialog, setShowAddPersonDialog] = useState(false);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);

  // Editing states
  const [editingPerson, setEditingPerson] = useState<KhataPerson | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<KhataPerson | null>(
    null
  );
  const [personToDelete, setPersonToDelete] = useState<KhataPerson | null>(
    null
  );

  // Add/Edit Person form
  const [formName, setFormName] = useState("");
  const [formMobile, setFormMobile] = useState("");
  const [formOpeningBalance, setFormOpeningBalance] = useState("");

  // Add Transaction form
  const [formTxType, setFormTxType] = useState<"credit" | "debit">("credit");
  const [formTxAmount, setFormTxAmount] = useState("");
  const [formTxRemark, setFormTxRemark] = useState("");

  // Refresh persons from storage
  const refreshPersons = useCallback(() => {
    setPersons(getKhataPersons());
  }, []);

  // Filtered persons
  const filteredPersons = useMemo(() => {
    if (!searchQuery) return persons;
    const q = searchQuery.toLowerCase();
    return persons.filter(
      (p) =>
        p.name.toLowerCase().includes(q) || p.mobile.toLowerCase().includes(q)
    );
  }, [persons, searchQuery]);

  // Summary calculations
  const totalCredit = useMemo(
    () => persons.filter((p) => p.balance > 0).reduce((s, p) => s + p.balance, 0),
    [persons]
  );
  const totalDebit = useMemo(
    () =>
      persons
        .filter((p) => p.balance < 0)
        .reduce((s, p) => s + Math.abs(p.balance), 0),
    [persons]
  );
  const netTotal = useMemo(() => totalCredit - totalDebit, [totalCredit, totalDebit]);

  // Toggle hide total
  const handleToggleHideTotal = (checked: boolean) => {
    setHideTotal(checked);
    const updatedSettings = { ...settings, hideKhataTotal: checked };
    saveSettings(updatedSettings);
    refreshSettings();
  };

  // Open Add Person dialog
  const openAddPersonDialog = (person?: KhataPerson) => {
    if (person) {
      setEditingPerson(person);
      setFormName(person.name);
      setFormMobile(person.mobile);
      setFormOpeningBalance(String(person.balance));
    } else {
      setEditingPerson(null);
      setFormName("");
      setFormMobile("");
      setFormOpeningBalance("");
    }
    setShowAddPersonDialog(true);
  };

  // Save person
  const handleSavePerson = () => {
    if (!formName.trim()) {
      toast.error("Name is required");
      return;
    }
    const balance = parseFloat(formOpeningBalance) || 0;

    if (editingPerson) {
      const updated: KhataPerson = {
        ...editingPerson,
        name: formName.trim(),
        mobile: formMobile.trim(),
        balance,
      };
      saveKhataPerson(updated);
    } else {
      const newPerson: KhataPerson = {
        id: uuidv4(),
        name: formName.trim(),
        mobile: formMobile.trim(),
        balance,
        transactions: balance !== 0
          ? [
              {
                id: uuidv4(),
                date: new Date().toISOString(),
                type: balance > 0 ? "credit" : "debit",
                amount: Math.abs(balance),
                remark: "Opening Balance",
              },
            ]
          : [],
      };
      saveKhataPerson(newPerson);
    }

    refreshPersons();
    setShowAddPersonDialog(false);
    toast.success(t.personSaved);
  };

  // Delete person
  const handleDeletePerson = () => {
    if (personToDelete) {
      deleteKhataPerson(personToDelete.id);
      refreshPersons();
      setShowDeleteConfirmDialog(false);
      setPersonToDelete(null);
      toast.success(t.personDeleted);
    }
  };

  // Open Add Transaction dialog
  const openTransactionDialog = (person: KhataPerson) => {
    setSelectedPerson(person);
    setFormTxType("credit");
    setFormTxAmount("");
    setFormTxRemark("");
    setShowTransactionDialog(true);
  };

  // Save transaction
  const handleSaveTransaction = () => {
    if (!selectedPerson) return;
    const amount = parseFloat(formTxAmount);
    if (!amount || amount <= 0) {
      toast.error("Amount is required");
      return;
    }

    const transaction: KhataTransaction = {
      id: uuidv4(),
      date: new Date().toISOString(),
      type: formTxType,
      amount,
      remark: formTxRemark.trim(),
    };

    const updatedBalance =
      formTxType === "credit"
        ? selectedPerson.balance + amount
        : selectedPerson.balance - amount;

    const updatedPerson: KhataPerson = {
      ...selectedPerson,
      balance: updatedBalance,
      transactions: [transaction, ...selectedPerson.transactions],
    };

    saveKhataPerson(updatedPerson);
    refreshPersons();
    setShowTransactionDialog(false);
    toast.success(t.transactionSaved);
  };

  // Open transaction history
  const openHistoryDialog = (person: KhataPerson) => {
    setSelectedPerson(person);
    setShowHistoryDialog(true);
  };

  // Get sorted transactions for selected person
  const sortedTransactions = useMemo(() => {
    if (!selectedPerson) return [];
    return [...selectedPerson.transactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [selectedPerson]);

  return (
    <div className="h-full flex flex-col">
      {/* Summary Section */}
      <AnimatePresence>
        {!hideTotal && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="glass rounded-xl p-4 mb-3">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">
                    {t.totalCredit}
                  </div>
                  <div className="text-lg font-bold text-green-400">
                    {formatAmount(totalCredit, currentCurrency)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">
                    {t.totalDebit}
                  </div>
                  <div className="text-lg font-bold text-red-400">
                    {formatAmount(totalDebit, currentCurrency)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">
                    Net
                  </div>
                  <div
                    className={`text-lg font-bold ${
                      netTotal >= 0 ? "text-amber-400" : "text-red-400"
                    }`}
                  >
                    {formatAmount(Math.abs(netTotal), currentCurrency)}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search + Controls */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
          />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPerson}
            className="pl-9 bg-white/5 border-white/10 text-white text-sm h-9"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            {hideTotal ? (
              <EyeOff size={14} className="text-white/40" />
            ) : (
              <Eye size={14} className="text-amber-400" />
            )}
            <Switch
              checked={hideTotal}
              onCheckedChange={handleToggleHideTotal}
              className="data-[state=checked]:bg-amber-400/30 data-[state=unchecked]:bg-white/10"
            />
          </div>
          <Button
            size="sm"
            onClick={() => openAddPersonDialog()}
            className="bg-amber-400/20 text-amber-400 hover:bg-amber-400/30 border border-amber-400/20 h-9 px-3"
          >
            <Plus size={14} className="mr-1" /> {t.addPerson}
          </Button>
        </div>
      </div>

      {/* Person List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 min-h-0">
        {filteredPersons.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 text-white/30"
          >
            <User size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">{t.noPersons}</p>
          </motion.div>
        ) : (
          <AnimatePresence>
            {filteredPersons.map((person, index) => (
              <motion.div
                key={person.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.03 }}
                className="glass rounded-xl p-3 hover:bg-white/[0.07] transition-colors cursor-pointer"
                onClick={() => openHistoryDialog(person)}
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center shrink-0">
                    <span className="text-amber-400 text-sm font-bold">
                      {person.name.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Name & Mobile */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white truncate">
                      {person.name}
                    </div>
                    {person.mobile && (
                      <div className="text-[11px] text-white/40 flex items-center gap-1">
                        <Phone size={9} />
                        {person.mobile}
                      </div>
                    )}
                  </div>

                  {/* Balance */}
                  <div className="text-right shrink-0">
                    {person.balance > 0 ? (
                      <div className="flex items-center gap-1">
                        <TrendingUp size={12} className="text-green-400" />
                        <span className="text-sm font-bold text-green-400">
                          {formatAmount(person.balance, currentCurrency)}
                        </span>
                      </div>
                    ) : person.balance < 0 ? (
                      <div className="flex items-center gap-1">
                        <TrendingDown size={12} className="text-red-400" />
                        <span className="text-sm font-bold text-red-400">
                          {formatAmount(Math.abs(person.balance), currentCurrency)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm font-bold text-white/40">
                        {formatAmount(0, currentCurrency)}
                      </span>
                    )}
                    <div className="text-[10px] text-white/30">
                      {person.balance > 0
                        ? t.credit
                        : person.balance < 0
                          ? t.debit
                          : "—"}
                    </div>
                  </div>

                  {/* Dropdown Menu */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0"
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger className="w-7 h-7 rounded-lg text-white/30 hover:text-amber-400 hover:bg-amber-400/10 flex items-center justify-center transition-colors outline-none">
                          <MoreVertical size={14} />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="glass-strong border-white/10 bg-neutral-900/95"
                      >
                        <DropdownMenuItem
                          onClick={() => openAddPersonDialog(person)}
                          className="text-white/70 focus:text-amber-400 focus:bg-amber-400/10 cursor-pointer"
                        >
                          <Edit3 size={14} className="mr-2" />
                          {t.save}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openTransactionDialog(person)}
                          className="text-white/70 focus:text-green-400 focus:bg-green-400/10 cursor-pointer"
                        >
                          <Plus size={14} className="mr-2" />
                          {t.addTransaction}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setPersonToDelete(person);
                            setShowDeleteConfirmDialog(true);
                          }}
                          className="text-white/70 focus:text-red-400 focus:bg-red-400/10 cursor-pointer"
                        >
                          <Trash2 size={14} className="mr-2" />
                          {t.delete}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Add/Edit Person Dialog */}
      <Dialog open={showAddPersonDialog} onOpenChange={setShowAddPersonDialog}>
        <DialogContent className="glass-strong border-white/10 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-amber-400">
              {editingPerson ? t.save : t.addPerson}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <User
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
              />
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={t.personNameKhata}
                className="pl-9 bg-white/5 border-white/10 text-white text-sm h-10"
              />
            </div>
            <div className="relative">
              <Phone
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
              />
              <Input
                value={formMobile}
                onChange={(e) => setFormMobile(e.target.value)}
                placeholder={t.mobileKhata}
                className="pl-9 bg-white/5 border-white/10 text-white text-sm h-10"
              />
            </div>
            <div className="relative">
              <TrendingUp
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
              />
              <Input
                type="number"
                value={formOpeningBalance}
                onChange={(e) => setFormOpeningBalance(e.target.value)}
                placeholder={`${t.openingBalance} (+ ${t.credit} / - ${t.debit})`}
                className="pl-9 bg-white/5 border-white/10 text-white text-sm h-10"
              />
            </div>
            <p className="text-[10px] text-white/30 px-1">
              {t.credit}: +{formatAmount(0, currentCurrency)} → {t.debit}: -{formatAmount(0, currentCurrency)}
            </p>
            <div className="flex gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={() => setShowAddPersonDialog(false)}
                className="flex-1 text-white/50"
              >
                {t.cancel}
              </Button>
              <Button
                onClick={handleSavePerson}
                className="flex-1 bg-amber-400/20 text-amber-400 hover:bg-amber-400/30"
              >
                {t.save}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Transaction Dialog */}
      <Dialog
        open={showTransactionDialog}
        onOpenChange={setShowTransactionDialog}
      >
        <DialogContent className="glass-strong border-white/10 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-amber-400">
              {t.addTransaction}
            </DialogTitle>
          </DialogHeader>
          {selectedPerson && (
            <div className="space-y-3">
              <div className="text-center text-sm text-white/50 mb-1">
                {selectedPerson.name}
              </div>

              {/* Credit/Debit Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFormTxType("credit")}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    formTxType === "credit"
                      ? "bg-green-400/20 text-green-400 border border-green-400/30"
                      : "bg-white/5 text-white/40 border border-white/10"
                  }`}
                >
                  <ArrowUpCircle size={14} />
                  {t.credit}
                </button>
                <button
                  onClick={() => setFormTxType("debit")}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    formTxType === "debit"
                      ? "bg-red-400/20 text-red-400 border border-red-400/30"
                      : "bg-white/5 text-white/40 border border-white/10"
                  }`}
                >
                  <ArrowDownCircle size={14} />
                  {t.debit}
                </button>
              </div>

              {/* Amount */}
              <Input
                type="number"
                value={formTxAmount}
                onChange={(e) => setFormTxAmount(e.target.value)}
                placeholder={t.transactionAmount}
                className="bg-white/5 border-white/10 text-white text-sm h-10"
              />

              {/* Remark */}
              <Input
                value={formTxRemark}
                onChange={(e) => setFormTxRemark(e.target.value)}
                placeholder={t.transactionRemark}
                className="bg-white/5 border-white/10 text-white text-sm h-10"
              />

              <div className="flex gap-2 pt-2">
                <Button
                  variant="ghost"
                  onClick={() => setShowTransactionDialog(false)}
                  className="flex-1 text-white/50"
                >
                  {t.cancel}
                </Button>
                <Button
                  onClick={handleSaveTransaction}
                  className={`flex-1 ${
                    formTxType === "credit"
                      ? "bg-green-400/20 text-green-400 hover:bg-green-400/30"
                      : "bg-red-400/20 text-red-400 hover:bg-red-400/30"
                  }`}
                >
                  {t.save}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Transaction History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="glass-strong border-white/10 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-amber-400 flex items-center gap-2">
              <User size={16} />
              {selectedPerson?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedPerson && (
            <div className="space-y-3">
              {/* Balance Summary */}
              <div className="text-center py-3 glass rounded-xl">
                <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">
                  {t.openingBalance}
                </div>
                <div
                  className={`text-2xl font-bold ${
                    selectedPerson.balance > 0
                      ? "text-green-400"
                      : selectedPerson.balance < 0
                        ? "text-red-400"
                        : "text-white/50"
                  }`}
                >
                  {selectedPerson.balance > 0
                    ? `+${formatAmount(selectedPerson.balance, currentCurrency)}`
                    : selectedPerson.balance < 0
                      ? `-${formatAmount(Math.abs(selectedPerson.balance), currentCurrency)}`
                      : formatAmount(0, currentCurrency)}
                </div>
                <div className="text-[10px] text-white/30 mt-1">
                  {selectedPerson.balance > 0
                    ? t.credit
                    : selectedPerson.balance < 0
                      ? t.debit
                      : "—"}
                </div>
              </div>

              {selectedPerson.mobile && (
                <div className="flex items-center gap-2 text-xs text-white/40 px-1">
                  <Phone size={10} />
                  {selectedPerson.mobile}
                </div>
              )}

              {/* Transaction List */}
              <div className="text-xs text-white/40 font-semibold">
                {t.noTransactions.replace("yet", `(${selectedPerson.transactions.length})`)}
              </div>
              <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-2">
                {sortedTransactions.length === 0 ? (
                  <div className="text-center text-white/20 text-xs py-6">
                    {t.noTransactions}
                  </div>
                ) : (
                  sortedTransactions.map((tx) => (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="glass rounded-lg p-2.5 flex items-center gap-2.5"
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          tx.type === "credit"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {tx.type === "credit" ? (
                          <ArrowUpCircle size={14} />
                        ) : (
                          <ArrowDownCircle size={14} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-sm font-bold ${
                              tx.type === "credit"
                                ? "text-green-400"
                                : "text-red-400"
                            }`}
                          >
                            {tx.type === "credit" ? "+" : "-"}
                            {formatAmount(tx.amount, currentCurrency)}
                          </span>
                          <span className="text-[10px] text-white/30">
                            {format(new Date(tx.date), "dd MMM, hh:mm a")}
                          </span>
                        </div>
                        {tx.remark && (
                          <div className="text-[11px] text-white/40 truncate mt-0.5">
                            {tx.remark}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Quick Add Transaction Button */}
              <Button
                onClick={() => {
                  setShowHistoryDialog(false);
                  setTimeout(() => openTransactionDialog(selectedPerson), 200);
                }}
                className="w-full bg-amber-400/20 text-amber-400 hover:bg-amber-400/30"
              >
                <Plus size={14} className="mr-1" /> {t.addTransaction}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteConfirmDialog}
        onOpenChange={setShowDeleteConfirmDialog}
      >
        <DialogContent className="glass-strong border-white/10 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-400">{t.delete}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-white/70">
              {t.areYouSure} {personToDelete && `"${personToDelete.name}"`}?
            </p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => setShowDeleteConfirmDialog(false)}
                className="flex-1 text-white/50"
              >
                {t.cancel}
              </Button>
              <Button
                onClick={handleDeletePerson}
                className="flex-1 bg-red-400/20 text-red-400 hover:bg-red-400/30"
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
