"use client";

import { useEffect, useState } from "react";

export default function Goals({ user, reloadGoals }: { user: any; reloadGoals: any }) {
  const [goals, setGoals] = useState([]);
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState("");


  // Load goals
  async function loadGoals() {
    if (!user) return;

    const res = await fetch(`/api/goals?userId=${user.id}`);
    const json = await res.json();

    setGoals(json.goals || []);
  }

  // Add a goal
  async function addGoal(e: any) {
    e.preventDefault();

    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user.id,
        title,
        target_amount: Number(targetAmount),
        deadline,
      }),
    });

    const data = await res.json();

    if (!data.success) {
      alert("Failed to add goal");
      return;
    }

    setTitle("");
    setTargetAmount("");
    setDeadline("");

    loadGoals();
    reloadGoals();  

  }

  // Delete a goal
  async function deleteGoal(id: string) {
    if (!confirm("Delete this goal?")) return;

    await fetch("/api/goals/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goalId: id }),
    });

    loadGoals();
  }

  useEffect(() => {
    loadGoals();
  }, [user]);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 mt-8 shadow">
      <h2 className="text-xl font-semibold text-white mb-4">🎯 Savings Goals</h2>

      {/* Add Goal Form */}
      <form className="grid gap-4 md:grid-cols-3 mb-6" onSubmit={addGoal}>
        <input
          type="text"
          placeholder="Goal Title (MacBook)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-slate-800 border border-slate-700 p-3 rounded text-white"
          required
        />

        <input
          type="number"
          placeholder="Target Amount"
          value={targetAmount}
          onChange={(e) => setTargetAmount(e.target.value)}
          className="bg-slate-800 border border-slate-700 p-3 rounded text-white"
          required
        />

        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="bg-slate-800 border border-slate-700 p-3 rounded text-white"
        />

        <button className="bg-blue-600 hover:bg-blue-700 p-3 rounded text-white mt-2 md:mt-0">
          Add Goal
        </button>
      </form>

      {/* Display Goals */}
      <div className="space-y-4">
        {goals.map((goal: any) => {
          const progress = (goal.current_amount / goal.target_amount) * 100;

          return (
            <div
              key={goal.id}
              className="border border-slate-700 p-4 rounded-xl text-white relative"
            >
              {/* Delete Button */}
              <button
                onClick={() => deleteGoal(goal.id)}
                className="absolute right-4 top-4 text-red-400 hover:text-red-600 text-sm"
              >
                ✖
              </button>

              <div className="flex justify-between">
                <h3 className="text-lg font-semibold">{goal.title}</h3>
                <p>
                  ${goal.current_amount} / ${goal.target_amount}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 rounded h-3 mt-2">
                <div
                  className="bg-purple-500 h-3 rounded"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>

              {goal.deadline && (
                <p className="text-slate-400 text-sm mt-1">
                  Deadline: {goal.deadline}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
