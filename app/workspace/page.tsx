import { createClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import { WorkspaceClientV2 } from "./WorkspaceClientV2";

interface HistoryImage {
  id: string;
  thumbnail_url: string | null;
  url: string;
  created_at: string;
  model?: string;
  type?: string;
}

export default async function WorkspaceV2Page() {
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("❌ Not authenticated");
    redirect("/login");
  }

  // Load history images (only generations, not upscale)
  const { data: historyImages } = await supabase
    .from("images")
    .select("id, thumbnail_url, url, created_at, model, type")
    .eq("user_id", user.id)
    .or("type.is.null,type.eq.generation")
    .order("created_at", { ascending: false })
    .limit(200);

  const images: HistoryImage[] = historyImages || [];

  return <WorkspaceClientV2 initialHistoryImages={images} />;
}
