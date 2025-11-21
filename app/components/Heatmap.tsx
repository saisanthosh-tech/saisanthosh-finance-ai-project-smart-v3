
"use client";

import { useMemo } from "react";

type Transaction = {
  id: string;
  amount: number;
  date: string;
  type: "income" | "expense";
};

export default function Heatmap({ transactions }: { transactions: Transaction[] }) {
  
  // 1. Prepare the Data (Group expenses by date)
  const { dataMap, maxExpense } = useMemo(() => {
    const map: Record<string, number> = {};
    let max = 0;

    transactions.forEach((t) => {
      if (t.type === "expense") {
        // Ensure date matches local timezone string YYYY-MM-DD
        const dateKey = new Date(t.date).toISOString().split("T")[0];
        const amount = Number(t.amount);
        map[dateKey] = (map[dateKey] || 0) + amount;
        if (map[dateKey] > max) max = map[dateKey];
      }
    });

    return { dataMap: map, maxExpense: max };
  }, [transactions]);

  // 2. YOUR REQUEST: Specific Price Ranges for Colors
  function getColor(amount: number) {
    if (amount === 0) return "bg-slate-800"; // Empty (Gray)
    
    // --- Customize these ranges as you like! ---
    if (amount <= 50) return "bg-emerald-900";    // Small: $1 - $50
    if (amount <= 200) return "bg-emerald-700";   // Medium: $51 - $200
    if (amount <= 1000) return "bg-emerald-500";  // High: $201 - $1000
    return "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"; // Extreme: > $1000 (Glowing)
  }

  // 3. Generate the Grid (Last 365 Days)
  const daysToRender = 365;
  const cells = Array.from({ length: daysToRender }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (daysToRender - 1 - i)); // Order: Oldest -> Newest
    const key = d.toISOString().split("T")[0];
    return {
      date: key,
      amount: dataMap[key] || 0,
    };
  });

  return (
    <div className="mt-10 border border-slate-800 bg-slate-900 p-6 rounded-xl shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          🔥 Expense Heatmap
        </h2>
        <div className="text-xs text-slate-400">
          Highest Day: <span className="text-emerald-400 font-mono">${maxExpense.toLocaleString()}</span>
        </div>
      </div>

      {/* The Grid */}
      <div className="flex flex-wrap gap-[2px]">
        {cells.map((cell) => (
          <div
            key={cell.date}
            title={`${cell.date}: $${cell.amount.toLocaleString()}`} // Hover to see price
            className={`w-3 h-3 sm:w-4 sm:h-4 rounded-[2px] transition-all hover:ring-1 hover:ring-white ${getColor(cell.amount)}`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-3 mt-3 text-xs text-slate-500">
        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-slate-800 rounded-[1px]"/> $0</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-emerald-900 rounded-[1px]"/> &lt;$50</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-emerald-700 rounded-[1px]"/> &lt;$200</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-emerald-500 rounded-[1px]"/> &lt;$1k</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-emerald-400 rounded-[1px]"/> $1k+</div>
      </div>
    </div>
  );
}