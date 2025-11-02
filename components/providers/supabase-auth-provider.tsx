"use client";

import {
  useState,
  useEffect,
  createContext,
  useContext,
  useRef,
  type ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
});

function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const ensuredProfilesRef = useRef<Set<string>>(new Set());
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let ignore = false;

    const fetchSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!ignore) {
        setSession(data.session);
        setUser(data.session?.user ?? null);
        setLoading(false);
      }
    };

    fetchSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!ignore) {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.user) {
      return;
    }

    const userId = session.user.id;

    if (ensuredProfilesRef.current.has(userId)) {
      return;
    }

    ensuredProfilesRef.current.add(userId);

    ensureProfileForUser(session.user).catch((error) => {
      ensuredProfilesRef.current.delete(userId);
      console.error("Error ensuring profile", error);
    });
  }, [session]);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (session?.user) {
      if (pathname === "/login" || pathname === "/signup") {
        router.replace("/workspace");
      }
    }
  }, [session, loading, pathname, router]);

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export default SupabaseAuthProvider;
export const useAuth = () => useContext(AuthContext);
export type { AuthContextType };

async function ensureProfileForUser(user: User) {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      if (error.code === "PGRST116") {
        // no row found, create one below
      } else {
        console.error("Failed checking profile existence", error);
        return;
      }
    }

    if (data?.id) {
      console.log(`[profiles] Existing profile found for ${user.id}`);
      return;
    }

    const { error: insertError } = await supabase.from("profiles").insert({
      id: user.id,
      full_name: user.email ?? "New RenderLab User",
      avatar_url: null,
    });

    if (insertError) {
      console.error("Failed creating profile", insertError);
    } else {
      console.log(`[profiles] Created profile for ${user.id}`);
    }
  } catch (unknownError) {
    console.error("Unexpected error ensuring profile", unknownError);
  }
}
