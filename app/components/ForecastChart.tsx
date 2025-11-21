"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function ForecastChart({ user }: { user: any }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadForecast() {
    if (!user) return;

    setLoading(true);

    const res = await fetch("/api/forecast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });

    const json = await res.json();
    setData(json.forecast || []);
    setLoading(false);
  }

  useEffect(() => {
    loadForecast();
  }, [user]);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-md mt-6">
      <h2 className="text-xl font-semibold text-white mb-4">
        📅 30-Day Daily Expense Forecast
      </h2>

      {loading ? (
        <p className="text-slate-400">Loading forecast...</p>
      ) : data.length === 0 ? (
        <p className="text-slate-500">Not enough data to forecast yet.</p>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="4 4" stroke="#4B5563" opacity={0.3} />

              <XAxis
                dataKey="date"
                stroke="#CBD5E1"
                tick={{ fill: "#CBD5E1", fontSize: 12 }}
                tickLine={false}
              />

              <YAxis
                stroke="#CBD5E1"
                tick={{ fill: "#CBD5E1", fontSize: 12 }}
                tickLine={false}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  border: "none",
                  borderRadius: "8px",
                  color: "white",
                }}
              />

              <Line
                type="monotone"
                dataKey="amount"
                stroke="#A78BFA"
                strokeWidth={4}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
