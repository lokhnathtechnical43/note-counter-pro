"use client";

import { useState, useCallback, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { translations } from "@/lib/i18n";
import {
  saveCalcHistory,
  getCalcHistory,
  clearCalcHistory,
  CalcHistoryEntry,
} from "@/lib/storage";
import { v4 as uuidv4 } from "uuid";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Plus,
  Minus,
  Copy,
  History,
  Save,
  Edit3,
  Percent,
  Delete,
  RotateCcw,
} from "lucide-react";

interface GSTBreakdown {
  rate: number;
  type: "plus" | "minus";
  original: number;
  gstAmount: number;
  total: number;
}

const GST_RATES = [3, 5, 12, 18, 28];

export default function CalcPage() {
  const { settings, calcInputAmount, setCalcInputAmount } = useAppStore();
  const t = translations[settings.language];
  const isDark = settings.darkMode;

  // Calculator state
  const [display, setDisplay] = useState("0");
  const [expression, setExpression] = useState("");
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [operator, setOperator] = useState<string | null>(null);
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [justCalculated, setJustCalculated] = useState(false);

  // GST state
  const [gstBreakdown, setGstBreakdown] = useState<GSTBreakdown | null>(null);
  const [customGstRate, setCustomGstRate] = useState("");
  const [showEditGst, setShowEditGst] = useState(false);

  // History state
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<CalcHistoryEntry[]>(() =>
    typeof window !== "undefined" ? getCalcHistory() : []
  );

  // Receive amount from Counter tab
  useEffect(() => {
    if (calcInputAmount > 0) {
      setDisplay(String(calcInputAmount));
      setGstBreakdown(null);
      setExpression("");
      setPrevValue(null);
      setOperator(null);
      setJustCalculated(true);
      setWaitingForOperand(false);
      setCalcInputAmount(0); // reset after use
    }
  }, [calcInputAmount, setCalcInputAmount]);

  const getCurrentValue = useCallback((): number => {
    return parseFloat(display) || 0;
  }, [display]);

  // Digit input
  const inputDigit = useCallback(
    (digit: string) => {
      setGstBreakdown(null);
      if (justCalculated && !waitingForOperand) {
        setDisplay(digit);
        setExpression("");
        setPrevValue(null);
        setOperator(null);
        setJustCalculated(false);
        setWaitingForOperand(false);
        return;
      }
      if (waitingForOperand) {
        setDisplay(digit);
        setWaitingForOperand(false);
      } else {
        setDisplay(display === "0" ? digit : display + digit);
      }
      setJustCalculated(false);
    },
    [display, waitingForOperand, justCalculated]
  );

  // Decimal input
  const inputDecimal = useCallback(() => {
    setGstBreakdown(null);
    if (justCalculated && !waitingForOperand) {
      setDisplay("0.");
      setExpression("");
      setPrevValue(null);
      setOperator(null);
      setJustCalculated(false);
      setWaitingForOperand(false);
      return;
    }
    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes(".")) {
      setDisplay(display + ".");
    }
    setJustCalculated(false);
  }, [display, waitingForOperand, justCalculated]);

  // Clear
  const clear = useCallback(() => {
    setDisplay("0");
    setExpression("");
    setOperator(null);
    setPrevValue(null);
    setWaitingForOperand(false);
    setJustCalculated(false);
    setGstBreakdown(null);
  }, []);

  // Backspace
  const backspace = useCallback(() => {
    if (waitingForOperand || justCalculated) return;
    setGstBreakdown(null);
    const newDisplay = display.length > 1 ? display.slice(0, -1) : "0";
    setDisplay(newDisplay);
  }, [display, waitingForOperand, justCalculated]);

  // Calculate
  const calculate = useCallback(
    (nextOperator: string | null) => {
      setGstBreakdown(null);
      const inputValue = parseFloat(display);

      if (prevValue === null) {
        setPrevValue(inputValue);
      } else if (operator) {
        const currentValue = prevValue;
        let newValue: number;

        switch (operator) {
          case "+":
            newValue = currentValue + inputValue;
            break;
          case "-":
            newValue = currentValue - inputValue;
            break;
          case "×":
            newValue = currentValue * inputValue;
            break;
          case "÷":
            newValue = inputValue !== 0 ? currentValue / inputValue : 0;
            break;
          default:
            newValue = inputValue;
        }

        // Round to avoid floating point issues
        newValue = Math.round(newValue * 1e10) / 1e10;
        setPrevValue(newValue);
        setDisplay(String(newValue));
      }

      setWaitingForOperand(true);
      setJustCalculated(nextOperator === "=");

      if (nextOperator && nextOperator !== "=") {
        setOperator(nextOperator);
        const operandValue = prevValue !== null && operator ? display : display;
        setExpression(`${operandValue} ${nextOperator}`);
      } else {
        setOperator(null);
        if (nextOperator === "=") {
          setExpression("");
        }
      }
    },
    [display, prevValue, operator]
  );

  // Percentage
  const handlePercent = useCallback(() => {
    const value = getCurrentValue();
    const result = value / 100;
    setDisplay(String(Math.round(result * 1e10) / 1e10));
    setGstBreakdown(null);
  }, [getCurrentValue]);

  // GST+ : adds GST to the current amount
  const applyGstPlus = useCallback(
    (rate: number) => {
      const amount = getCurrentValue();
      if (amount === 0) return;
      const gstAmount = amount * (rate / 100);
      const total = amount + gstAmount;
      const breakdown: GSTBreakdown = {
        rate,
        type: "plus",
        original: amount,
        gstAmount: Math.round(gstAmount * 100) / 100,
        total: Math.round(total * 100) / 100,
      };
      setGstBreakdown(breakdown);
      setDisplay(String(Math.round(total * 100) / 100));
      setPrevValue(null);
      setOperator(null);
      setExpression("");
      setWaitingForOperand(true);
      setJustCalculated(true);
    },
    [getCurrentValue]
  );

  // GST- : removes GST from the current amount (reverse calculation)
  const applyGstMinus = useCallback(
    (rate: number) => {
      const amount = getCurrentValue();
      if (amount === 0) return;
      const original = amount / (1 + rate / 100);
      const gstAmount = amount - original;
      const breakdown: GSTBreakdown = {
        rate,
        type: "minus",
        original: Math.round(original * 100) / 100,
        gstAmount: Math.round(gstAmount * 100) / 100,
        total: Math.round(amount * 100) / 100,
      };
      setGstBreakdown(breakdown);
      setDisplay(String(Math.round(original * 100) / 100));
      setPrevValue(null);
      setOperator(null);
      setExpression("");
      setWaitingForOperand(true);
      setJustCalculated(true);
    },
    [getCurrentValue]
  );

  // Custom GST from edit dialog
  const applyCustomGst = useCallback(
    (type: "plus" | "minus") => {
      const rate = parseFloat(customGstRate);
      if (isNaN(rate) || rate <= 0 || rate > 100) {
        toast.error("Enter a valid GST rate (1-100)");
        return;
      }
      setShowEditGst(false);
      if (type === "plus") {
        applyGstPlus(rate);
      } else {
        applyGstMinus(rate);
      }
    },
    [customGstRate, applyGstPlus, applyGstMinus]
  );

  // Copy result
  const copyResult = useCallback(async () => {
    const value = display;
    try {
      await navigator.clipboard.writeText(value);
      toast.success(t.copied);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = value;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      toast.success(t.copied);
    }
  }, [display, t.copied]);

  // Save calculation to history
  const saveCalc = useCallback(() => {
    const entry: CalcHistoryEntry = {
      id: uuidv4(),
      date: new Date().toISOString(),
      expression: gstBreakdown
        ? `GST${gstBreakdown.type === "plus" ? "+" : "-"}${gstBreakdown.rate}% on ${gstBreakdown.type === "plus" ? gstBreakdown.original : gstBreakdown.total}`
        : expression || display,
      result: display,
    };
    saveCalcHistory(entry);
    setHistory(getCalcHistory());
    toast.success(t.saved);
  }, [display, expression, gstBreakdown, t.saved]);

  // Clear history
  const handleClearHistory = useCallback(() => {
    clearCalcHistory();
    setHistory([]);
    toast.success(t.deleted);
  }, [t.deleted]);

  // Format display for large numbers
  const formatDisplay = (value: string): string => {
    if (value === "Error") return value;
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    if (value.includes(".")) {
      const parts = value.split(".");
      const intPart = parseFloat(parts[0]).toLocaleString("en-IN");
      return `${intPart}.${parts[1]}`;
    }
    return num.toLocaleString("en-IN");
  };

  // Button press helper for haptic-like feel
  const handleButtonPress = (action: () => void) => {
    action();
  };

  // Theme-aware class helpers
  const bg = isDark ? "bg-[#0a0a1a]" : "bg-slate-50";
  const cardBg = isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-sm";
  const textMain = isDark ? "text-white" : "text-slate-900";
  const textMuted = isDark ? "text-white/30" : "text-slate-400";
  const textSub = isDark ? "text-white/40" : "text-slate-500";
  const textSub2 = isDark ? "text-white/60" : "text-slate-600";
  const textSub3 = isDark ? "text-white/70" : "text-slate-700";
  const btnBg = isDark ? "bg-white/5 hover:bg-white/10" : "bg-slate-100 hover:bg-slate-200";
  const btnBorder = isDark ? "border-white/10" : "border-slate-200";
  const btnText = isDark ? "text-white" : "text-slate-900";
  const dividerBorder = isDark ? "border-white/10" : "border-slate-200";

  return (
    <div className={`h-full flex flex-col ${bg}`}>
      {/* Display Area - EXPANDS to fill available space */}
      <div className="flex-1 min-h-0 px-4 pt-2 pb-1 flex flex-col">
        <div className={`rounded-2xl border p-3 flex-1 flex flex-col justify-center space-y-1 ${cardBg}`}>
          {/* Expression line */}
          <div className={`text-right text-sm font-mono h-5 truncate ${textMuted}`}>
            {expression || "\u00A0"}
          </div>
          {/* Result line - BIGGER */}
          <div className={`text-right text-4xl font-bold font-mono truncate ${textMain}`}>
            {formatDisplay(display)}
          </div>

          {/* GST Breakdown */}
          <AnimatePresence>
            {gstBreakdown && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className={`mt-2 pt-2 border-t space-y-1.5 ${dividerBorder}`}>
                  <div className="flex justify-between text-xs">
                    <span className={textSub}>
                      {t.gstRate} ({gstBreakdown.rate}%)
                    </span>
                    <span
                      className={
                        gstBreakdown.type === "plus"
                          ? "text-green-500 font-semibold"
                          : "text-red-500 font-semibold"
                      }
                    >
                      {gstBreakdown.type === "plus" ? t.gstPlus : t.gstMinus}{" "}
                      {gstBreakdown.rate}%
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className={textSub}>{t.originalAmount}</span>
                    <span className={`font-mono text-sm ${textSub3}`}>
                      {gstBreakdown.original.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className={textSub}>{t.gstAmount}</span>
                    <span
                      className={`font-mono text-sm font-semibold ${
                        gstBreakdown.type === "plus"
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {gstBreakdown.type === "plus" ? "+" : "-"}
                      {gstBreakdown.gstAmount.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className={`flex justify-between text-base pt-1 border-t ${dividerBorder}`}>
                    <span className={`${textSub2} font-semibold`}>
                      {t.totalWithGST}
                    </span>
                    <span className="text-amber-500 font-bold font-mono text-lg">
                      {gstBreakdown.total.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action buttons row - compact */}
        <div className="shrink-0 flex gap-2 mt-1">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleButtonPress(copyResult)}
            className={`flex-1 py-1.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition-colors ${btnBg} ${btnBorder} ${textSub2}`}
          >
            <Copy size={11} /> {t.copyResult}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setHistory(getCalcHistory());
              setShowHistory(true);
            }}
            className={`flex-1 py-1.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition-colors ${btnBg} ${btnBorder} ${textSub2}`}
          >
            <History size={11} /> {t.viewHistory}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleButtonPress(saveCalc)}
            className={`flex-1 py-1.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition-colors ${
              isDark ? "bg-amber-400/10 border-amber-400/20 text-amber-400 hover:bg-amber-400/20" : "bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100"
            }`}
          >
            <Save size={11} /> {t.saveCalc}
          </motion.button>
        </div>
      </div>

      {/* GST Buttons Section - compact */}
      <div className="shrink-0 px-4 py-1 space-y-1">
        {/* GST+ row */}
        <div className="flex gap-1.5">
          <div className={`flex-1 text-[10px] font-bold flex items-center pl-1 ${isDark ? "text-green-400/70" : "text-green-600"}`}>
            {t.gstPlus}
          </div>
          {GST_RATES.map((rate) => (
            <motion.button
              key={`plus-${rate}`}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleButtonPress(() => applyGstPlus(rate))}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                isDark
                  ? "bg-green-400/10 border border-green-400/20 text-green-400 hover:bg-green-400/20"
                  : "bg-green-50 border border-green-200 text-green-600 hover:bg-green-100"
              }`}
            >
              <Plus size={10} className="inline mr-0.5" />
              {rate}%
            </motion.button>
          ))}
        </div>
        {/* GST- row */}
        <div className="flex gap-1.5">
          <div className={`flex-1 text-[10px] font-bold flex items-center pl-1 ${isDark ? "text-red-400/70" : "text-red-600"}`}>
            {t.gstMinus}
          </div>
          {GST_RATES.map((rate) => (
            <motion.button
              key={`minus-${rate}`}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleButtonPress(() => applyGstMinus(rate))}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                isDark
                  ? "bg-red-400/10 border border-red-400/20 text-red-400 hover:bg-red-400/20"
                  : "bg-red-50 border border-red-200 text-red-600 hover:bg-red-100"
              }`}
            >
              <Minus size={10} className="inline mr-0.5" />
              {rate}%
            </motion.button>
          ))}
        </div>
        {/* Edit GST button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            setCustomGstRate("");
            setShowEditGst(true);
          }}
          className={`w-full py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors ${btnBg} ${btnBorder} ${
            isDark ? "text-amber-400" : "text-amber-600"
          }`}
        >
          <Edit3 size={11} /> {t.editGST}
        </motion.button>
      </div>

      {/* Calculator Keypad - FIXED at bottom, no empty space */}
      <div className="shrink-0 px-4 pb-1">
        <div className="grid grid-cols-4 gap-1.5">
          {/* Row 1: AC, ⌫, %, ÷ */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleButtonPress(clear)}
            className={`h-12 rounded-xl font-bold text-sm flex items-center justify-center transition-colors ${btnBg} ${btnBorder} ${isDark ? "text-red-400" : "text-red-500"}`}
          >
            <RotateCcw size={20} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleButtonPress(backspace)}
            className={`h-12 rounded-xl font-bold text-sm flex items-center justify-center transition-colors ${btnBg} ${btnBorder} ${isDark ? "text-red-400" : "text-red-500"}`}
          >
            <Delete size={20} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleButtonPress(handlePercent)}
            className={`h-12 rounded-xl font-bold text-sm flex items-center justify-center transition-colors ${btnBg} ${btnBorder} ${isDark ? "text-amber-400" : "text-amber-600"}`}
          >
            <Percent size={20} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleButtonPress(() => calculate("÷"))}
            className={`h-12 rounded-xl font-bold text-xl flex items-center justify-center transition-colors ${btnBg} ${btnBorder} ${isDark ? "text-amber-400" : "text-amber-600"}`}
          >
            ÷
          </motion.button>

          {/* Row 2: 7, 8, 9, × */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleButtonPress(() => inputDigit("7"))}
            className={`h-12 rounded-xl font-bold text-lg flex items-center justify-center transition-colors ${btnBg} ${btnBorder} ${btnText}`}
          >
            7
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleButtonPress(() => inputDigit("8"))}
            className={`h-12 rounded-xl font-bold text-lg flex items-center justify-center transition-colors ${btnBg} ${btnBorder} ${btnText}`}
          >
            8
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleButtonPress(() => inputDigit("9"))}
            className={`h-12 rounded-xl font-bold text-lg flex items-center justify-center transition-colors ${btnBg} ${btnBorder} ${btnText}`}
          >
            9
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleButtonPress(() => calculate("×"))}
            className={`h-12 rounded-xl font-bold text-xl flex items-center justify-center transition-colors ${btnBg} ${btnBorder} ${isDark ? "text-amber-400" : "text-amber-600"}`}
          >
            ×
          </motion.button>

          {/* Row 3: 4, 5, 6, - */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleButtonPress(() => inputDigit("4"))}
            className={`h-12 rounded-xl font-bold text-lg flex items-center justify-center transition-colors ${btnBg} ${btnBorder} ${btnText}`}
          >
            4
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleButtonPress(() => inputDigit("5"))}
            className={`h-12 rounded-xl font-bold text-lg flex items-center justify-center transition-colors ${btnBg} ${btnBorder} ${btnText}`}
          >
            5
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleButtonPress(() => inputDigit("6"))}
            className={`h-12 rounded-xl font-bold text-lg flex items-center justify-center transition-colors ${btnBg} ${btnBorder} ${btnText}`}
          >
            6
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleButtonPress(() => calculate("-"))}
            className={`h-12 rounded-xl font-bold text-xl flex items-center justify-center transition-colors ${btnBg} ${btnBorder} ${isDark ? "text-amber-400" : "text-amber-600"}`}
          >
            -
          </motion.button>

          {/* Row 4: 1, 2, 3, + */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleButtonPress(() => inputDigit("1"))}
            className={`h-12 rounded-xl font-bold text-lg flex items-center justify-center transition-colors ${btnBg} ${btnBorder} ${btnText}`}
          >
            1
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleButtonPress(() => inputDigit("2"))}
            className={`h-12 rounded-xl font-bold text-lg flex items-center justify-center transition-colors ${btnBg} ${btnBorder} ${btnText}`}
          >
            2
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleButtonPress(() => inputDigit("3"))}
            className={`h-12 rounded-xl font-bold text-lg flex items-center justify-center transition-colors ${btnBg} ${btnBorder} ${btnText}`}
          >
            3
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleButtonPress(() => calculate("+"))}
            className={`h-12 rounded-xl font-bold text-xl flex items-center justify-center transition-colors ${btnBg} ${btnBorder} ${isDark ? "text-amber-400" : "text-amber-600"}`}
          >
            +
          </motion.button>

          {/* Row 5: 00, 0, ., = */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleButtonPress(() => inputDigit("00"))}
            className={`h-12 rounded-xl font-bold text-lg flex items-center justify-center transition-colors ${btnBg} ${btnBorder} ${btnText}`}
          >
            00
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleButtonPress(() => inputDigit("0"))}
            className={`h-12 rounded-xl font-bold text-lg flex items-center justify-center transition-colors ${btnBg} ${btnBorder} ${btnText}`}
          >
            0
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleButtonPress(inputDecimal)}
            className={`h-12 rounded-xl font-bold text-lg flex items-center justify-center transition-colors ${btnBg} ${btnBorder} ${btnText}`}
          >
            .
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleButtonPress(() => calculate("="))}
            className={`h-12 rounded-xl font-bold text-xl flex items-center justify-center transition-colors ${
              isDark
                ? "bg-amber-400/20 text-amber-400 border border-amber-400/20 hover:bg-amber-400/30"
                : "bg-amber-500 text-white border border-amber-500 hover:bg-amber-600"
            }`}
          >
            =
          </motion.button>
        </div>
      </div>

      {/* Edit GST Dialog */}
      <Dialog open={showEditGst} onOpenChange={setShowEditGst}>
        <DialogContent className={`border max-w-sm ${isDark ? "glass-strong border-white/10" : "bg-white border-slate-200"}`}>
          <DialogHeader>
            <DialogTitle className={isDark ? "text-amber-400" : "text-amber-600"}>{t.editGST}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className={`text-xs mb-1 block ${textSub}`}>
                {t.gstRate}
              </label>
              <Input
                type="number"
                value={customGstRate}
                onChange={(e) => setCustomGstRate(e.target.value)}
                placeholder="Enter GST % (e.g. 15)"
                className={`${isDark ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-900"} text-sm`}
                min="0.1"
                max="100"
                step="0.1"
                autoFocus
              />
            </div>
            <div className="flex gap-1.5">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => applyCustomGst("plus")}
                className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
                  isDark
                    ? "bg-green-400/10 border border-green-400/20 text-green-400 hover:bg-green-400/20"
                    : "bg-green-50 border border-green-200 text-green-600 hover:bg-green-100"
                }`}
              >
                <Plus size={16} /> {t.gstPlus}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => applyCustomGst("minus")}
                className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
                  isDark
                    ? "bg-red-400/10 border border-red-400/20 text-red-400 hover:bg-red-400/20"
                    : "bg-red-50 border border-red-200 text-red-600 hover:bg-red-100"
                }`}
              >
                <Minus size={16} /> {t.gstMinus}
              </motion.button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className={`border max-w-sm ${isDark ? "glass-strong border-white/10" : "bg-white border-slate-200"}`}>
          <DialogHeader>
            <DialogTitle className={isDark ? "text-amber-400" : "text-amber-600"}>
              {t.viewHistory}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            {history.length === 0 ? (
              <div className={`text-center py-8 text-sm ${textMuted}`}>
                No history yet
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((entry) => (
                  <div
                    key={entry.id}
                    className={`p-3 rounded-xl border ${isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"}`}
                  >
                    <div className={`text-xs font-mono ${textSub}`}>
                      {entry.expression}
                    </div>
                    <div className={`text-lg font-bold font-mono ${isDark ? "text-amber-400" : "text-amber-600"}`}>
                      = {entry.result}
                    </div>
                    <div className={`text-[10px] mt-1 ${textMuted}`}>
                      {new Date(entry.date).toLocaleString("en-IN")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {history.length > 0 && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleClearHistory}
              className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                isDark
                  ? "bg-red-400/10 border border-red-400/20 text-red-400 hover:bg-red-400/20"
                  : "bg-red-50 border border-red-200 text-red-600 hover:bg-red-100"
              }`}
            >
              <Delete size={12} /> {t.clearHistory}
            </motion.button>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
