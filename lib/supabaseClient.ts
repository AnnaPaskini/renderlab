import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";


// ---------- CLIENT SIDE ----------
export function createClient(): SupabaseClient {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ---------- SERVER SIDE ----------
export async function createServer(): Promise<SupabaseClient> {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: (name: string, value: string) => {
          try {
            cookieStore.set({ name, value });
          } catch {
            // безопасно игнорируем
          }
        },
        remove: (name: string) => {
          try {
            cookieStore.set({ name, value: "" });
          } catch {
            // безопасное удаление
          }
        },
      },
    }
  );
}
