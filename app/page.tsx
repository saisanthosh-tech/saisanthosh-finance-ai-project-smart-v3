"use client";
import Heatmap from "./components/Heatmap";
import DownloadPdfButton from "./components/DownloadPdfButton";

//import Heatmap from "./components/Heatmap";

import ForecastChart from "./components/ForecastChart";
import Goals from "./components/Goals"; // optional — keep if you have this component

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  Trash2,
  LogOut,
  Plus,
  Wallet,
  TrendingUp,
  TrendingDown,
  Bot,
  Sparkles,
  Loader2,
} from "lucide-react";

// TYPES
type Transaction = {
  id: string;
  amount: number;
  category: string;
  type: "income" | "expense";
  description: string;
  date: string;
};

type Goal = {
  id: string;
  title: string;
  amount_saved?: number; // match your DB column names
  target_amount: number;
  target_date?: string;
};



// CHART COLORS
const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#A855F7",
  "#EC4899",
];

// ----------------------------------------------------------
// MAIN PAGE
// ----------------------------------------------------------

export default function FinanceTracker() {
  const [user, setUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Goal states
  const [saveAmount, setSaveAmount] = useState("");
  const [selectedGoal, setSelectedGoal] = useState("");
  const [goals, setGoals] = useState<Goal[]>([]);

  // form (transactions)
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [desc, setDesc] = useState("");

  // auth
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  // check session on mount
  useEffect(() => {
    checkUser();
    // also listen to session changes (optional)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // when user changes, load transactions + goals
  useEffect(() => {
    if (user) {
      fetchTransactions();
      loadGoals();
    } else {
      setTransactions([]);
      setGoals([]);
    }
    setLoading(false);
  }, [user]);

  async function checkUser() {
    const { data } = await supabase.auth.getSession();
    setUser(data.session?.user || null);
    setLoading(false);
  }

  // ---------------- Goals APIs ----------------

  // async function loadGoals() {
  //   if (!user) return;
  //   try {
  //     // your backend endpoint appeared to accept GET with query param earlier
  //     const res = await fetch(`/api/goals?userId=${user.id}`);
  //     if (!res.ok) {
  //       console.warn("Failed to load goals", await res.text());
  //       setGoals([]);
  //       return;
  //     }
  //     const json = await res.json();
  //     // Expecting json.goals array
  //     setGoals(json.goals || []);
  //   } catch (err) {
  //     console.error("loadGoals error", err);
  //     setGoals([]);
  //   }
  // }
async function loadGoals() {
  if (!user) return;

  const res = await fetch(`/api/goals?userId=${user.id}`);
  const json = await res.json();

  setGoals(json.goals || []);
}

   useEffect(() => {
    loadGoals();   // runs when the user becomes available
  }, [user]); 

  async function addSavings() {
    if (!selectedGoal || !saveAmount) return alert("Fill all fields");

    try {
      const res = await fetch("/api/goals/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goalId: selectedGoal,
          amount: Number(saveAmount),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSaveAmount("");
        setSelectedGoal("");
        await loadGoals();
      } else {
        alert(data.message || "Failed to add savings");
      }
    } catch (err) {
      console.error(err);
      alert("Error adding savings");
    }
  }

  // ---------------- Auth + Transactions ----------------

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();

    if (authMode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) alert(error.message);
      else alert("Check your email to confirm!");
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) alert(error.message);
      else setUser(data.user);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    setTransactions([]);
    setGoals([]);
  }

  async function fetchTransactions() {
    if (!user) return;
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    if (error) console.error(error);
    else setTransactions((data as Transaction[]) || []);
  }

  async function addTransaction(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    const newTx = {
      user_id: user.id,
      amount: parseFloat(amount),
      category,
      type,
      description: desc,
      date: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("transactions")
      .insert([newTx])
      .select();

    if (error) {
      console.error(error);
      alert("Error adding transaction");
    } else {
      // supabase returns inserted row(s)
      const inserted = (data as any[])[0] as Transaction;
      setTransactions([inserted, ...transactions]);
      setAmount("");
      setDesc("");
    }
  }

  async function deleteTransaction(id: string) {
    const { error } = await supabase.from("transactions").delete().eq("id", id);

    if (!error) {
      setTransactions(transactions.filter((t) => t.id !== id));
    } else {
      console.error(error);
    }
  }

  // ---------------- Derived data for charts ----------------

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((a, t) => a + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((a, t) => a + t.amount, 0);

  const balance = totalIncome - totalExpense;

  const barData = [
    { name: "Income", amount: totalIncome },
    { name: "Expense", amount: totalExpense },
  ];

  const dataByCategory = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc: any, t) => {
      const existing = acc.find((i: any) => i.name === t.category);
      if (existing) existing.value += t.amount;
      else acc.push({ name: t.category, value: t.amount });
      return acc;
    }, []);

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-white">
        Loading...
      </div>
    );

  // --------------------------------------------------------
  // LOGIN SCREEN
  // --------------------------------------------------------

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-slate-100">
        <div className="w-full max-w-md space-y-6 rounded-xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
          <h1 className="text-center text-3xl font-bold text-blue-500">
            Finance Tracker
          </h1>

          <form onSubmit={handleAuth} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 p-3 text-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 p-3 text-white"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button className="w-full rounded-lg bg-blue-600 p-3 font-semibold text-white">
              {authMode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <button
            onClick={() =>
              setAuthMode(authMode === "login" ? "signup" : "login")
            }
            className="text-blue-400 hover:underline text-sm text-center block"
          >
            {authMode === "login"
              ? "New here? Create account"
              : "Have an account? Sign In"}
          </button>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------
  // DASHBOARD
  // --------------------------------------------------------

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* HEADER */}
        <header className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-slate-400">Welcome, {user.email}</p>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2 text-red-500 border border-red-500/20"
          >
            <LogOut size={18} />
            Logout
          </button>
        </header>

        {/* STAT CARDS */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* BALANCE */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-blue-500/20 p-3 text-blue-500">
                <Wallet />
              </div>
              <div>
                <p className="text-sm text-slate-400">Total Balance</p>
                <h3 className="text-2xl font-bold text-white">
                  ${balance.toFixed(2)}
                </h3>
              </div>
            </div>
          </div>

          {/* INCOME */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-green-500/20 p-3 text-green-500">
                <TrendingUp />
              </div>
              <div>
                <p className="text-sm text-slate-400">Income</p>
                <h3 className="text-2xl font-bold text-green-500">
                  +${totalIncome.toFixed(2)}
                </h3>
              </div>
            </div>
          </div>

          {/* EXPENSES */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-red-500/20 p-3 text-red-500">
                <TrendingDown />
              </div>
              <div>
                <p className="text-sm text-slate-400">Expenses</p>
                <h3 className="text-2xl font-bold text-red-500">
                  -${totalExpense.toFixed(2)}
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* AI ADVISOR */}
        <AIReport transactions={transactions} />

        {/* Forecast Chart */}
        <ForecastChart user={user} />

        {/* Goals list component (optional) */}
        {/* If you have a Goals component that renders the goal cards, keep it. */}

        {/* <Goals user={user} /> */}
        <Goals user={user} reloadGoals={loadGoals} />


        {/* <Goals user={user} goals={goals} /> */}


        {/* ADD SAVINGS */}
        {/* <section className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-md mt-6">
          <h2 className="mb-4 text-xl font-semibold flex items-center gap-2 text-white">
            💰 Add Savings
          </h2>

          <div className="grid gap-4 md:grid-cols-3">
            <input
              type="number"
              placeholder="Amount to save"
              value={saveAmount}
              onChange={(e) => setSaveAmount(e.target.value)}
              className="rounded-lg bg-slate-800 p-3 border border-slate-700 text-white"
            />

            <select
  value={selectedGoal}
  onChange={(e) => setSelectedGoal(e.target.value)}
  className="rounded-lg bg-slate-800 p-3 border border-slate-700 text-white"
>
  <option value="">Select Goal</option>

  {goals.map((g) => (
    <option key={g.id} value={g.id}>
      {g.title}
    </option>
  ))}
</select>


            <button
              onClick={addSavings}
              className="rounded-lg bg-green-600 px-4 py-3 text-white font-bold hover:bg-green-700 transition"
            >
              Add Savings
            </button>
          </div>
        </section> */}


<section className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-md mt-6">
  <h2 className="mb-4 text-xl font-semibold flex items-center gap-2 text-white">
    💰 Add Savings
  </h2>

  <div className="grid gap-4 md:grid-cols-3">
    <input
      type="number"
      placeholder="Amount to save"
      value={saveAmount}
      onChange={(e) => setSaveAmount(e.target.value)}
      className="rounded-lg bg-slate-800 p-3 border border-slate-700 text-white"
    />

    <select
      value={selectedGoal}
      onChange={(e) => setSelectedGoal(e.target.value)}
      className="rounded-lg bg-slate-800 p-3 border border-slate-700 text-white"
    >
      <option value="">Select Goal</option>

      {goals.map((g: any) => (
        <option key={g.id} value={g.id}>
          {g.title}
        </option>
      ))}
    </select>

    <button
      onClick={addSavings}
      className="rounded-lg bg-green-600 px-4 py-3 text-white font-bold hover:bg-green-700 transition"
    >
      Add Savings
    </button>
  </div>
</section>

{/* //<Heatmap user={user} /> */}
{/* <Heatmap userId={user.id} days={300} /> */}
{/* <Heatmap user={user} /> */}



<Heatmap transactions={transactions} />

{/* <DownloadPdfButton user={user} /> */}



<DownloadPdfButton transactions={transactions} />




        {/* MAIN CONTENT: FORM + HISTORY + CHARTS */}
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            {/* ADD TRANSACTION */}
            <section className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-md">
              <h2 className="mb-4 text-xl font-semibold flex items-center gap-2 text-white">
                <Plus size={20} /> Add Transaction
              </h2>

              <form onSubmit={addTransaction} className="grid gap-4 md:grid-cols-2">
                <div className="col-span-2">
                  <label className="text-xs text-slate-400 uppercase">
                    Description
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Groceries"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    className="w-full rounded-lg bg-slate-800 p-3 border border-slate-700 text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 uppercase">
                    Amount
                  </label>
                  <input
                    required
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-lg bg-slate-800 p-3 border border-slate-700 text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 uppercase">
                    Category
                  </label>

                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-lg bg-slate-800 p-3 border border-slate-700 text-white"
                  >
                    <option>Food</option>
                    <option>Rent</option>
                    <option>Salary</option>
                    <option>Entertainment</option>
                    <option>Transport</option>
                    <option>Other</option>
                  </select>
                </div>

                {/* TYPE SWITCH */}
                <div>
                  <label className="text-xs text-slate-400 uppercase">
                    Type
                  </label>
                  <div className="flex gap-2 bg-slate-800 p-1 rounded-lg border border-slate-700">
                    <button
                      type="button"
                      onClick={() => setType("income")}
                      className={`flex-1 py-2 rounded text-sm ${
                        type === "income"
                          ? "bg-green-600 text-white"
                          : "text-slate-400"
                      }`}
                    >
                      Income
                    </button>
                    <button
                      type="button"
                      onClick={() => setType("expense")}
                      className={`flex-1 py-2 rounded text-sm ${
                        type === "expense"
                          ? "bg-red-600 text-white"
                          : "text-slate-400"
                      }`}
                    >
                      Expense
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="col-span-2 mt-2 bg-blue-600 py-3 rounded-lg font-semibold text-white"
                >
                  Add Transaction
                </button>
              </form>
            </section>

            {/* TRANSACTION HISTORY */}
            <section className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-md">
              <h2 className="mb-4 text-xl font-semibold text-white">
                Recent History
              </h2>

              <div className="max-h-[400px] space-y-3 overflow-y-auto pr-2">
                {transactions.length === 0 ? (
                  <p className="text-slate-500">No transactions yet.</p>
                ) : (
                  transactions.map((t) => (
                    <div
                      key={t.id}
                      className="group flex items-center justify-between rounded-lg bg-slate-800/40 p-4 border border-transparent hover:border-slate-700 hover:bg-slate-800 transition"
                    >
                      <div className="flex gap-4">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full ${
                            t.type === "income"
                              ? "bg-green-500/20 text-green-500"
                              : "bg-red-500/20 text-red-500"
                          }`}
                        >
                          {t.type === "income" ? (
                            <TrendingUp size={18} />
                          ) : (
                            <TrendingDown size={18} />
                          )}
                        </div>

                        <div>
                          <p className="font-medium text-slate-200">
                            {t.description}
                          </p>
                          <p className="text-xs text-slate-400">
                            {t.category} • {new Date(t.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span
                          className={`font-bold ${
                            t.type === "income" ? "text-green-500" : "text-red-500"
                          }`}
                        >
                          {t.type === "income" ? "+" : "-"}${t.amount}
                        </span>

                        <button
                          onClick={() => deleteTransaction(t.id)}
                          className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-500"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN — CHARTS */}
          <div className="space-y-6 lg:col-span-1">
            {/* BAR CHART */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-md">
              <h2 className="mb-6 text-xl font-semibold text-white">Cash Flow</h2>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip />
                    <Bar dataKey="amount">
                      <Cell fill="#22c55e" />
                      <Cell fill="#ef4444" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* PIE CHART */}
            <div className="sticky top-6 rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-md">
              <h2 className="mb-6 text-xl font-semibold text-white">
                Expense Breakdown
              </h2>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dataByCategory}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={60}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {dataByCategory.map((entry: any, index: number) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>

                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------
// AI Advisor Component
// ----------------------------------------------------------

function AIReport({ transactions }: { transactions: any[] }) {
  const [insight, setInsight] = useState("");
  const [loading, setLoading] = useState(false);

  async function generateInsight() {
    setLoading(true);
    setInsight("");

    const summary = transactions
      .map((t) => `${t.type}: $${t.amount} on ${t.category}`)
      .join("\n");

    const prompt = `
      Act as a financial advisor.
      Analyze these transactions in 2–3 sentences.
      Give one compliment and one warning.
      No markdown.
      Data:
      ${summary}
    `;

    const res = await fetch("/api/ai", {
      method: "POST",
      body: JSON.stringify({ prompt }),
    });

    const data = await res.json();
    setInsight(data.text || "No insight returned.");
    setLoading(false);
  }

  return (
    <div className="rounded-xl border border-purple-500/30 bg-gradient-to-br from-slate-900 to-purple-900/20 p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-purple-400 flex items-center gap-2">
          <Bot /> AI Financial Advisor
        </h2>

        <button
          onClick={generateInsight}
          disabled={loading || transactions.length === 0}
          className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50 hover:bg-purple-700 transition"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {loading ? "Analyzing..." : "Analyze My Finances"}
        </button>
      </div>

      {insight ? (
        <div className="rounded-lg border border-purple-500/20 bg-slate-950/50 p-4 text-slate-200">"{insight}"</div>
      ) : (
        <p className="text-sm text-slate-500 italic">Click the button to let AI find patterns in your spending...</p>
      )}
    </div>
  );
}
