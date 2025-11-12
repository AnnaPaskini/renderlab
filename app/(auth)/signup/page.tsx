"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Session } from "@supabase/supabase-js";
import { Eye, EyeOff } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const persistSessionCookies = (session: Session | null) => {
    if (!session) return;
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    const accessTokenMaxAge = session.expires_in ?? 3600;
    const refreshTokenMaxAge = 60 * 60 * 24 * 30;

    document.cookie = `renderlab-access-token=${session.access_token}; Path=/; Max-Age=${accessTokenMaxAge}; SameSite=Lax${secure}`;

    if (session.refresh_token) {
      document.cookie = `renderlab-refresh-token=${session.refresh_token}; Path=/; Max-Age=${refreshTokenMaxAge}; SameSite=Lax${secure}`;
    }
  };

  const handleSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      toast.error(error.message || "Unable to sign up");
    } else {
      toast.success("Account created! Redirecting…");
      persistSessionCookies(data.session);
      router.push(data.session ? "/workspace" : "/login");
    }

    setLoading(false);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-neutral-950 text-neutral-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_22%,rgba(251,191,36,0.18),transparent_44%),radial-gradient(circle_at_82%_18%,rgba(244,114,182,0.22),transparent_40%),radial-gradient(circle_at_50%_86%,rgba(129,140,248,0.2),transparent_45%)]" />
      <form
        onSubmit={handleSignup}
        className="relative z-10 flex w-full max-w-md flex-col gap-5 rounded-3xl border border-white/10 bg-white/5 p-10 shadow-[0_30px_75px_-20px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
      >
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-white">Create your account</h1>
          <p className="text-sm text-neutral-300">Join RenderLab and start building with AI.</p>
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
              autoComplete="new-password"
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

        <Button
          type="submit"
          disabled={loading}
          className="h-11 rounded-xl bg-[#ff6b35] hover:bg-[#ff8555] text-sm font-medium text-white transition-all duration-200 focus-visible:ring-[#ff6b35] focus:border-[#ff6b35]"
        >
          {loading ? "Creating account..." : "Create account"}
        </Button>

        <p className="text-center text-sm text-neutral-300">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[#ff6b35] hover:text-[#ff8555]">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
