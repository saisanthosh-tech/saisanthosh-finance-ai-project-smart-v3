import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { user_id, title, target_amount, deadline } = await req.json();

    const { error } = await supabase.from("goals").insert({
      user_id,
      title,
      target_amount,
      current_amount: 0, // FIXED: Supabase column name
      deadline,
    });

    if (error) {
      console.log(error);
      return NextResponse.json({ success: false });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", userId);

  return NextResponse.json({ goals: data || [] });
}
