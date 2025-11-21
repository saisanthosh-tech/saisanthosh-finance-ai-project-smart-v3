import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ forecast: [] });

  // Fetch all EXPENSES with date
  const { data: expenses } = await supabase
    .from("transactions")
    .select("date, amount")
    .eq("user_id", userId)
    .eq("type", "expense")
    .order("date", { ascending: true });

  if (!expenses || expenses.length === 0) {
    return NextResponse.json({ forecast: [] });
  }

  // Group by day
  const daily: Record<string, number> = {};
  for (const t of expenses) {
    const day = new Date(t.date).toISOString().split("T")[0];
    daily[day] = (daily[day] || 0) + t.amount;
  }

  // Convert to chart-friendly array
  const dailyData = Object.entries(daily).map(([date, amount]) => ({
    date,
    amount,
  }));

  return NextResponse.json({ forecast: dailyData });
}
