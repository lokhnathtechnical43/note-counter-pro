import { jsPDF } from "jspdf";
import { CounterEntry } from "./storage";
import { getCurrency } from "./currencies";

export function exportEntryPDF(entry: CounterEntry): void {
  const doc = new jsPDF();
  const currency = getCurrency(entry.currency);
  const pageWidth = doc.internal.pageSize.getWidth();

  // Title
  doc.setFontSize(18);
  doc.setTextColor(251, 191, 36);
  doc.text("Note Counter Pro", pageWidth / 2, 20, { align: "center" });

  // Entry details
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  const entryType = entry.entryType === "in" ? "CASH IN" : "CASH OUT";
  doc.text(`${entryType} - ${currency.name}`, pageWidth / 2, 30, { align: "center" });

  doc.setTextColor(50, 50, 50);
  doc.setFontSize(10);
  doc.text(`Date: ${new Date(entry.date).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}`, 20, 42);

  if (entry.personName) doc.text(`Person: ${entry.personName}`, 20, 50);
  if (entry.category) doc.text(`Category: ${entry.category}`, 20, 58);
  if (entry.remark) doc.text(`Remark: ${entry.remark}`, 20, 66);

  // Table header
  let y = 80;
  doc.setFillColor(10, 10, 26);
  doc.rect(15, y - 6, pageWidth - 30, 10, "F");
  doc.setTextColor(251, 191, 36);
  doc.setFontSize(10);
  doc.text("Denomination", 25, y);
  doc.text("Count", 100, y);
  doc.text("Subtotal", 150, y);

  // Table rows
  doc.setTextColor(50, 50, 50);
  currency.denominations.forEach((d) => {
    const count = entry.counts[String(d.value)] || 0;
    if (count > 0) {
      y += 10;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(`${currency.symbol}${d.value}`, 25, y);
      doc.text(`${count}`, 100, y);
      doc.text(`${currency.symbol}${(d.value * count).toLocaleString("en-IN")}`, 150, y);
    }
  });

  // Total
  y += 15;
  doc.setFillColor(10, 10, 26);
  doc.rect(15, y - 6, pageWidth - 30, 12, "F");
  doc.setTextColor(251, 191, 36);
  doc.setFontSize(13);
  doc.text("GRAND TOTAL", 25, y + 1);
  doc.text(`${currency.symbol}${entry.total.toLocaleString("en-IN")}`, 150, y + 1);

  // Target info
  if (entry.targetAmount && entry.targetMode) {
    y += 18;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const diff = entry.total - entry.targetAmount;
    const mode = entry.targetMode === "payable" ? "Payable" : "Receivable";
    doc.text(`${mode} Target: ${currency.symbol}${entry.targetAmount.toLocaleString("en-IN")}`, 25, y);
    y += 8;
    const diffLabel = diff >= 0 ? "Excess" : "Shortfall";
    doc.text(`${diffLabel}: ${currency.symbol}${Math.abs(diff).toLocaleString("en-IN")}`, 25, y);
  }

  doc.save(`note-counter-${entry.id}.pdf`);
}

export function exportAllEntriesPDF(entries: CounterEntry[]): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(18);
  doc.setTextColor(251, 191, 36);
  doc.text("Note Counter Pro - All Entries", pageWidth / 2, 20, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, pageWidth / 2, 28, { align: "center" });

  let y = 40;
  entries.forEach((entry, index) => {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    const currency = getCurrency(entry.currency);
    const entryType = entry.entryType === "in" ? "IN" : "OUT";
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(11);
    doc.text(`${index + 1}. [${entryType}] ${currency.symbol}${entry.total.toLocaleString("en-IN")}`, 20, y);
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`${new Date(entry.date).toLocaleDateString("en-IN")}${entry.personName ? ` - ${entry.personName}` : ""}${entry.category ? ` - ${entry.category}` : ""}`, 20, y + 6);
    y += 16;
  });

  doc.save(`note-counter-all-entries.pdf`);
}
