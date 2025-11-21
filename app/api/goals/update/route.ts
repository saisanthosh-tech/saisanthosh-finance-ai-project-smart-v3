import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  const { goalId, amount } = await req.json();

  const { data: goal } = await supabase
    .from("goals")
    .select("current_amount")
    .eq("id", goalId)
    .single();

  if (!goal) return NextResponse.json({ success: false, message: "not found" });

  const newAmount = Number(goal.current_amount) + Number(amount);

  const { error } = await supabase
    .from("goals")
    .update({ current_amount: newAmount })
    .eq("id", goalId);

  if (error) return NextResponse.json({ success: false });

  return NextResponse.json({ success: true });
}
