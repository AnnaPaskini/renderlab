"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: Profile | null;
};

type Profile = {
  full_name: string | null;
  avatar_url: string | null;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  profile: null,
});

function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const ensuredProfilesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let isMounted = true;

    const isAuthRoute = () =>
      pathname.startsWith("/auth/login") || pathname.startsWith("/auth/signup");

    const handleSession = (nextSession: Session | null) => {
      if (!isMounted) {
        return;
      }

      setSession(nextSession);

      if (nextSession && isAuthRoute()) {
        router.replace("/workspace");
      }
    };

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      handleSession(data.session);
      if (isMounted) {
        setLoading(false);
      }
    };

    void checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      handleSession(nextSession);
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, [pathname, router]);

  useEffect(() => {
    if (!session?.user) {
      ensuredProfilesRef.current.clear();
      setProfile(null);
      return;
    }

    const userId = session.user.id;
    const shouldEnsure = !ensuredProfilesRef.current.has(userId);

    if (shouldEnsure) {
      ensuredProfilesRef.current.add(userId);
    }

    let isMounted = true;

    const loadProfile = async () => {
      try {
        if (shouldEnsure) {
          await ensureProfileForUser(session.user);
        }
      } catch (error) {
        if (shouldEnsure) {
          ensuredProfilesRef.current.delete(userId);
        }
        console.error("Error ensuring profile", error);
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", userId)
          .maybeSingle();

        if (!isMounted) {
          return;
        }

        if (error) {
          console.error("Failed loading profile", error);
          setProfile(null);
          return;
        }

        setProfile((data as Profile) ?? null);
      } catch (error) {
        if (isMounted) {
          console.error("Unexpected error loading profile", error);
          setProfile(null);
        }
      }
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [session]);

  const value = useMemo<AuthContextValue>(
    () => ({ user: session?.user ?? null, session, loading, profile }),
    [session, loading, profile]
  );

  if (loading) {
    return null;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default SupabaseAuthProvider;
export const useAuth = () => useContext(AuthContext);
export type { AuthContextValue as AuthContextType, Profile };

async function ensureProfileForUser(user: User) {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      console.error("Failed checking profile existence", error);
      return;
    }

    if (data?.id) {
      return;
    }

    const { error: insertError } = await supabase.from("profiles").insert({
      id: user.id,
      full_name: user.email ?? "New RenderLab User",
      avatar_url: null,
    });

    if (insertError) {
      console.error("Failed creating profile", insertError);
    }
  } catch (unknownError) {
    console.error("Unexpected error ensuring profile", unknownError);
  }
}
