"use client";

import { useState, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { formatAmount } from "@/lib/currencies";
import { translations } from "@/lib/i18n";
import { Customer, saveCustomer, deleteCustomer, getEntries, CounterEntry, saveEntry } from "@/lib/storage";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import {
  UserPlus,
  Search,
  Phone,
  CreditCard,
  ArrowDownCircle,
  ArrowUpCircle,
  Trash2,
  Edit2,
  Eye,
  Users,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";

export default function BusinessPage() {
  const { customers, refreshCustomers, entries, refreshEntries, currentCurrency, settings, setActiveTab, setPersonName, setMobileNumber, setAccountNumber } = useAppStore();
  const t = translations[settings.language];

  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formMobile, setFormMobile] = useState("");
  const [formAccount, setFormAccount] = useState("");

  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return customers;
    const q = searchQuery.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.mobile.toLowerCase().includes(q) ||
        c.account.toLowerCase().includes(q)
    );
  }, [customers, searchQuery]);

  const openAddDialog = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormName(customer.name);
      setFormMobile(customer.mobile);
      setFormAccount(customer.account);
    } else {
      setEditingCustomer(null);
      setFormName("");
      setFormMobile("");
      setFormAccount("");
    }
    setShowAddDialog(true);
  };

  const handleSaveCustomer = () => {
    if (!formName.trim()) {
      toast.error("Name is required");
      return;
    }

    if (editingCustomer) {
      const updated: Customer = {
        ...editingCustomer,
        name: formName.trim(),
        mobile: formMobile.trim(),
        account: formAccount.trim(),
      };
      saveCustomer(updated);
    } else {
      const newCustomer: Customer = {
        id: uuidv4(),
        name: formName.trim(),
        mobile: formMobile.trim(),
        account: formAccount.trim(),
        balance: 0,
        entries: [],
      };
      saveCustomer(newCustomer);
    }

    refreshCustomers();
    setShowAddDialog(false);
    toast.success(t.saved);
  };

  const handleDeleteCustomer = (id: string) => {
    deleteCustomer(id);
    refreshCustomers();
    toast.success(t.deleted);
  };

  const viewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDetailDialog(true);
  };

  const handleQuickEntry = (customer: Customer) => {
    setPersonName(customer.name);
    setMobileNumber(customer.mobile);
    setAccountNumber(customer.account);
    setShowDetailDialog(false);
    setActiveTab("home");
    toast.success("Customer info loaded to counter");
  };

  const customerEntries = useMemo(() => {
    if (!selectedCustomer) return [];
    return entries.filter((e) => e.personName === selectedCustomer.name);
  }, [entries, selectedCustomer]);

  const customerBalance = useMemo(() => {
    if (!selectedCustomer) return 0;
    return customerEntries.reduce((bal, e) => {
      return e.entryType === "in" ? bal + e.total : bal - e.total;
    }, 0);
  }, [customerEntries, selectedCustomer]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-amber-400">{t.business}</h2>
        <Button
          size="sm"
          onClick={() => openAddDialog()}
          className="bg-amber-400/20 text-amber-400 hover:bg-amber-400/30 border border-amber-400/20"
        >
          <UserPlus size={14} className="mr-1" /> {t.addCustomer}
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t.search}
          className="pl-9 bg-white/5 border-white/10 text-white text-sm h-9"
        />
      </div>

      {/* Customer List */}
      <div className="max-h-[calc(100vh-260px)] overflow-y-auto custom-scrollbar space-y-2">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-16 text-white/30">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">{t.noCustomers}</p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredCustomers.map((customer) => (
              <motion.div
                key={customer.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="glass rounded-xl p-3"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 border border-amber-400/20">
                    <AvatarFallback className="bg-amber-400/10 text-amber-400 text-sm font-bold">
                      {customer.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white truncate">{customer.name}</div>
                    <div className="text-xs text-white/40 flex items-center gap-2">
                      {customer.mobile && (
                        <span className="flex items-center gap-1">
                          <Phone size={10} /> {customer.mobile}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs text-white/40">{t.balance}</div>
                    <div
                      className={`text-sm font-bold ${
                        customer.balance >= 0 ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {formatAmount(Math.abs(customer.balance), currentCurrency)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => viewCustomer(customer)}
                      className="w-7 h-7 rounded-lg text-white/30 hover:text-amber-400 hover:bg-amber-400/10 flex items-center justify-center transition-colors"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={() => openAddDialog(customer)}
                      className="w-7 h-7 rounded-lg text-white/30 hover:text-emerald-400 hover:bg-emerald-400/10 flex items-center justify-center transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteCustomer(customer.id)}
                      className="w-7 h-7 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/10 flex items-center justify-center transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Add/Edit Customer Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="glass-strong border-white/10 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-amber-400">
              {editingCustomer ? t.editCustomer : t.addCustomer}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={t.customerName}
                className="pl-9 bg-white/5 border-white/10 text-white text-sm h-10"
              />
            </div>
            <div className="relative">
              <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <Input
                value={formMobile}
                onChange={(e) => setFormMobile(e.target.value)}
                placeholder={t.mobile}
                className="pl-9 bg-white/5 border-white/10 text-white text-sm h-10"
              />
            </div>
            <div className="relative">
              <CreditCard size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <Input
                value={formAccount}
                onChange={(e) => setFormAccount(e.target.value)}
                placeholder={t.account}
                className="pl-9 bg-white/5 border-white/10 text-white text-sm h-10"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={() => setShowAddDialog(false)}
                className="flex-1 text-white/50"
              >
                {t.cancel}
              </Button>
              <Button
                onClick={handleSaveCustomer}
                className="flex-1 bg-amber-400/20 text-amber-400 hover:bg-amber-400/30"
              >
                {t.save}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Customer Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="glass-strong border-white/10 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-amber-400">{selectedCustomer?.name}</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
              <div className="text-center py-2">
                <Avatar className="w-16 h-16 mx-auto border-2 border-amber-400/30">
                  <AvatarFallback className="bg-amber-400/10 text-amber-400 text-xl font-bold">
                    {selectedCustomer.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="mt-2 text-sm text-white/50">
                  {selectedCustomer.mobile && (
                    <span className="flex items-center justify-center gap-1">
                      <Phone size={12} /> {selectedCustomer.mobile}
                    </span>
                  )}
                  {selectedCustomer.account && (
                    <span className="flex items-center justify-center gap-1 mt-1">
                      <CreditCard size={12} /> {selectedCustomer.account}
                    </span>
                  )}
                </div>
                <div className="mt-2">
                  <div className="text-xs text-white/40">{t.balance}</div>
                  <div
                    className={`text-2xl font-bold ${
                      customerBalance >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {formatAmount(Math.abs(customerBalance), currentCurrency)}
                  </div>
                </div>
              </div>

              <Button
                onClick={() => handleQuickEntry(selectedCustomer)}
                className="w-full bg-amber-400/20 text-amber-400 hover:bg-amber-400/30"
              >
                <ArrowDownCircle size={14} className="mr-1" /> {t.quickEntry}
              </Button>

              <div className="text-xs text-white/40 font-semibold mt-2">{t.paymentHistory}</div>
              {customerEntries.length === 0 ? (
                <div className="text-center text-white/20 text-xs py-4">{t.noEntries}</div>
              ) : (
                customerEntries.slice(0, 10).map((entry) => (
                  <div key={entry.id} className="glass rounded-lg p-2 flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded flex items-center justify-center ${
                        entry.entryType === "in"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {entry.entryType === "in" ? (
                        <ArrowDownCircle size={12} />
                      ) : (
                        <ArrowUpCircle size={12} />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-white">
                        {formatAmount(entry.total, entry.currency)}
                      </div>
                      <div className="text-[10px] text-white/40">
                        {format(new Date(entry.date), "dd MMM, hh:mm a")}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
