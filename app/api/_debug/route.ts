import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    hasServerUrl: !!process.env.SUPABASE_URL,
    hasServerAnon: !!process.env.SUPABASE_ANON_KEY,
    hasClientUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasClientAnon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasReplicate: !!process.env.REPLICATE_API_TOKEN,
  });
}
