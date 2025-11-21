
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const days = 365; // Always fetch a full year

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  // 1. Calculate Start Date
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const since = startDate.toISOString().split("T")[0];

  // 2. Fetch Data
  const { data, error } = await supabase
    .from("transactions")
    .select("amount, date, type")
    .eq("user_id", userId)
    .eq("type", "expense") // Only track outflows
    .gte("date", since);

  if (error) {
    console.error("Heatmap API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 3. Aggregate (Sum amounts per day)
  const map: Record<string, number> = {};

  data?.forEach((t) => {
    const key = t.date; // YYYY-MM-DD
    // Ensure we are adding positive numbers even if stored as negative
    const val = Math.abs(Number(t.amount)); 
    map[key] = (map[key] || 0) + val;
  });

  return NextResponse.json({ data: map });
}