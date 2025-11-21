import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId, title, target_amount, deadline } = await req.json();

  const { data, error } = await supabase
    .from("goals")
    .insert({
      user_id: userId,
      title,
      target_amount,
      deadline,
      current_amount: 0
    })
    .select();

  if (error) return NextResponse.json({ success: false });

  return NextResponse.json({ success: true, goal: data[0] });
}
