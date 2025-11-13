"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabaseBrowser";
import type { Session } from "@supabase/supabase-js";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const persistSessionCookies = (session: Session | null) => {
    if (!session) return;
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    const accessTokenMaxAge = session.expires_in ?? 3600;
    const refreshTokenMaxAge = 60 * 60 * 24 * 30; // 30 days

    document.cookie = `renderlab-access-token=${session.access_token}; Path=/; Max-Age=${accessTokenMaxAge}; SameSite=Lax${secure}`;

    if (session.refresh_token) {
      document.cookie = `renderlab-refresh-token=${session.refresh_token}; Path=/; Max-Age=${refreshTokenMaxAge}; SameSite=Lax${secure}`;
    }
  };
  const supabase = createClient();

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error(error.message || "Invalid credentials");
    } else {
      toast.success("Welcome back!");
      persistSessionCookies(data.session);
      router.push("/workspace");
    }

    setLoading(false);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-neutral-950 text-neutral-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(255,107,53,0.18),transparent_42%),radial-gradient(circle_at_88%_25%,rgba(250,204,21,0.16),transparent_40%),radial-gradient(circle_at_50%_88%,rgba(255,138,85,0.15),transparent_45%)]" />
      <form
        onSubmit={handleLogin}
        className="relative z-10 flex w-full max-w-md flex-col gap-5 rounded-3xl border border-white/10 bg-[#1a1a1a] p-10 shadow-[0_8px_32px_rgba(0,0,0,0.8)]"
      >
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-white">Welcome back</h1>
          <p className="text-sm text-neutral-300">Log in to continue crafting with RenderLab.</p>
        </div>

        <div className="space-y-4">
          <Input
            type="email"
            autoComplete="email"
            placeholder="Email address"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-11 rounded-xl border-white/20 bg-white/10 text-white placeholder:text-neutral-400 focus-visible:ring-[#ff6b35] focus:border-[#ff6b35]"
            required
          />
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-11 rounded-xl border-white/20 bg-white/10 text-white placeholder:text-neutral-400 focus-visible:ring-[#ff6b35] focus:border-[#ff6b35] pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-white transition-colors duration-200"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-white/20 bg-white/10 text-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35] focus:ring-offset-0 transition-colors"
            />
            <span className="text-neutral-300 group-hover:text-white transition-colors">Remember me</span>
          </label>
          <Link
            href="/forgot-password"
            className="text-[#ff6b35] hover:text-[#ff8555] transition-colors font-medium"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="rl-btn-primary h-11 text-sm"
        >
          {loading ? "Signing in..." : "Sign in"}
        </Button>

        <p className="text-center text-sm text-neutral-300">
          Don’t have an account?{" "}
          <Link href="/signup" className="font-medium text-[#ff6b35] hover:text-[#ff8555]">
            Create one
          </Link>
        </p>
      </form>
    </div>
  );
}
