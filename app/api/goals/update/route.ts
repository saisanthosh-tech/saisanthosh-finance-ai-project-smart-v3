import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { goalId, amount } = await req.json();

    // Fetch goal
    const { data: goal, error: fetchErr } = await supabase
      .from("goals")
      .select("current_amount")
      .eq("id", goalId)
      .single();

    if (fetchErr || !goal) {
      return NextResponse.json({ success: false, message: "Goal not found" });
    }

    const newAmount = Number(goal.current_amount || 0) + Number(amount);

    const { error: updateErr } = await supabase
      .from("goals")
      .update({ current_amount: newAmount })
      .eq("id", goalId);

    if (updateErr) {
      return NextResponse.json({ success: false, message: "Failed to update goal" });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, message: "Server error" });
  }
}
