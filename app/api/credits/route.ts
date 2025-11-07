import { NextResponse } from "next/server";
import { createServer } from "@/lib/supabaseClient";

export async function GET() {
  const supabase = await createServer();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("credits")
    .select("balance")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle(); // безопасная альтернатива single()

  if (error) {
    console.error("CREDITS ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ balance: data?.balance ?? 0 });
}
