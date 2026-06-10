"use client";

import { useMemo, useState } from "react";
import { useAppStore } from "@/lib/store";
import { formatAmount, getCurrency } from "@/lib/currencies";
import { translations } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
} from "lucide-react";
import { format, startOfDay, startOfWeek, startOfMonth, isWithinInterval, subDays, subWeeks, subMonths } from "date-fns";

export default function ReportsPage() {
  const { entries, currentCurrency, settings } = useAppStore();
  const t = translations[settings.language];
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => e.currency === currentCurrency);
  }, [entries, currentCurrency]);

  const chartData = useMemo(() => {
    const now = new Date();
    const dataMap = new Map<string, { in: number; out: number; label: string }>();

    let points: Date[] = [];
    if (period === "daily") {
      for (let i = 6; i >= 0; i--) points.push(subDays(now, i));
    } else if (period === "weekly") {
      for (let i = 3; i >= 0; i--) points.push(subWeeks(now, i));
    } else {
      for (let i = 5; i >= 0; i--) points.push(subMonths(now, i));
    }

    points.forEach((date) => {
      const key = format(date, period === "daily" ? "yyyy-MM-dd" : period === "weekly" ? "yyyy-ww" : "yyyy-MM");
      const label = period === "daily" ? format(date, "dd MMM") : period === "weekly" ? `W${format(date, "ww")}` : format(date, "MMM yy");
      dataMap.set(key, { in: 0, out: 0, label });
    });

    filteredEntries.forEach((entry) => {
      const key = format(new Date(entry.date), period === "daily" ? "yyyy-MM-dd" : period === "weekly" ? "yyyy-ww" : "yyyy-MM");
      const existing = dataMap.get(key);
      if (existing) {
        if (entry.entryType === "in") existing.in += entry.total;
        else existing.out += entry.total;
      }
    });

    return Array.from(dataMap.values());
  }, [filteredEntries, period]);

  const totals = useMemo(() => {
    const totalIn = filteredEntries.filter((e) => e.entryType === "in").reduce((sum, e) => sum + e.total, 0);
    const totalOut = filteredEntries.filter((e) => e.entryType === "out").reduce((sum, e) => sum + e.total, 0);
    return { totalIn, totalOut, netCash: totalIn - totalOut };
  }, [filteredEntries]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-amber-400">{t.reports}</h2>

      {/* Period Tabs */}
      <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
        <TabsList className="glass w-full border-white/10 bg-white/5">
          <TabsTrigger value="daily" className="text-xs data-[state=active]:bg-amber-400/20 data-[state=active]:text-amber-400">
            {t.daily}
          </TabsTrigger>
          <TabsTrigger value="weekly" className="text-xs data-[state=active]:bg-amber-400/20 data-[state=active]:text-amber-400">
            {t.weekly}
          </TabsTrigger>
          <TabsTrigger value="monthly" className="text-xs data-[state=active]:bg-amber-400/20 data-[state=active]:text-amber-400">
            {t.monthly}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card className="glass border-white/5 bg-emerald-500/5">
            <CardContent className="p-3 text-center">
              <TrendingUp size={16} className="mx-auto text-emerald-400 mb-1" />
              <div className="text-[10px] text-white/40">{t.totalIn}</div>
              <div className="text-sm font-bold text-emerald-400">
                {formatAmount(totals.totalIn, currentCurrency)}
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="glass border-white/5 bg-red-500/5">
            <CardContent className="p-3 text-center">
              <TrendingDown size={16} className="mx-auto text-red-400 mb-1" />
              <div className="text-[10px] text-white/40">{t.totalOut}</div>
              <div className="text-sm font-bold text-red-400">
                {formatAmount(totals.totalOut, currentCurrency)}
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="glass border-white/5 bg-amber-500/5">
            <CardContent className="p-3 text-center">
              <DollarSign size={16} className="mx-auto text-amber-400 mb-1" />
              <div className="text-[10px] text-white/40">{t.netCash}</div>
              <div className={`text-sm font-bold ${totals.netCash >= 0 ? "text-amber-400" : "text-red-400"}`}>
                {formatAmount(totals.netCash, currentCurrency)}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass rounded-2xl p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Calendar size={14} className="text-amber-400" />
          <span className="text-xs text-white/50">
            {period === "daily" ? t.daily : period === "weekly" ? t.weekly : t.monthly} {t.reports}
          </span>
        </div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }}
                axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }}
                axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                tickFormatter={(v) => `${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(26,26,46,0.95)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                  color: "#fff",
                  fontSize: "12px",
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: "10px", color: "rgba(255,255,255,0.5)" }}
              />
              <Bar dataKey="in" name={t.totalIn} fill="#34d399" radius={[4, 4, 0, 0]} />
              <Bar dataKey="out" name={t.totalOut} fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {filteredEntries.length === 0 && (
        <div className="text-center py-10 text-white/30">
          <Calendar size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">{t.noEntries}</p>
        </div>
      )}
    </div>
  );
}
