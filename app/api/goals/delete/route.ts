import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { goalId } = await req.json();

    const { error } = await supabase
      .from("goals")
      .delete()
      .eq("id", goalId);

    if (error) {
      console.error(error);
      return NextResponse.json({ success: false, message: "Failed to delete goal" });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: "Server error" });
  }
}
