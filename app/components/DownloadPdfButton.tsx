
"use client";
import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Download } from "lucide-react";

type Transaction = {
  id: string;
  amount: number;
  date: string;
  category: string;
  type: string;
  description: string;
};

export default function DownloadPdfButton({ transactions }: { transactions: Transaction[] }) {
  // Default: Last 30 days
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);

  function generatePDF() {
    setLoading(true);
    try {
      // 1. Filter Data based on selected dates
      const filteredData = transactions.filter((t) => {
        const tDate = t.date.slice(0, 10);
        return tDate >= from && tDate <= to;
      });

      if (filteredData.length === 0) {
        alert("No transactions found in this date range.");
        setLoading(false);
        return;
      }

      // 2. Initialize PDF
      const doc = new jsPDF();

      // 3. Add Title
      doc.setFontSize(18);
      doc.text("Financial Transaction Report", 14, 22);
      
      doc.setFontSize(11);
      doc.text(`Period: ${from} to ${to}`, 14, 30);

      // 4. Create Table
      const tableColumn = ["Date", "Category", "Description", "Type", "Amount"];
      const tableRows: any[] = [];

      filteredData.forEach((t) => {
        const transactionData = [
          t.date,
          t.category,
          t.description,
          t.type.toUpperCase(),
          `$${t.amount.toFixed(2)}`, // Format currency
        ];
        tableRows.push(transactionData);
      });

      // Use autoTable to generate the table
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [22, 163, 74] }, // Green header
      });

      // 5. Save File
      doc.save(`Finance_Report_${from}_to_${to}.pdf`);

    } catch (err) {
      console.error("PDF Generation Error:", err);
      alert("Failed to generate PDF.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800 mt-6 shadow-sm">
      <span className="text-sm font-medium text-slate-300">Export Report:</span>
      
      <div className="flex items-center gap-2">
        <input 
          type="date" 
          value={from} 
          onChange={(e) => setFrom(e.target.value)} 
          className="bg-slate-800 border border-slate-700 text-white p-2 rounded-lg text-sm outline-none focus:border-blue-500"
        />
        <span className="text-slate-500">-</span>
        <input 
          type="date" 
          value={to} 
          onChange={(e) => setTo(e.target.value)} 
          className="bg-slate-800 border border-slate-700 text-white p-2 rounded-lg text-sm outline-none focus:border-blue-500"
        />
      </div>

      <button
        onClick={generatePDF}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition disabled:opacity-50 ml-auto sm:ml-0"
      >
        <Download size={16} />
        {loading ? "Generating..." : "Download PDF"}
      </button>
    </div>
  );
}