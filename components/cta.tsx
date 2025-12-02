"use client";
import { RenderLabButton } from "@/components/ui/RenderLabButton";
import Link from "next/link";
import { useState } from "react";

export const CTA = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setStatus("success");
        setMessage("Thank you! You're on the list. We'll reach out soon with early access.");
        setEmail("");
      } else {
        const data = await res.json();
        setStatus("error");
        setMessage(data.error?.includes("Already") ? "You're already registered. We'll be in touch soon!" : "Something went wrong. Please try again.");
      }
    } catch (err) {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="text-center max-w-2xl mx-auto space-y-6 py-20">
      <h2 className="text-4xl font-bold text-white">
        Ready to Transform Your Renders?
      </h2>
      <p className="text-xl text-gray-300">
        Join thousands of architects creating stunning visualizations in seconds.
      </p>

      {/* Email Signup Form */}
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:outline-none focus:border-orange-500 transition-colors"
          disabled={status === "loading"}
        />
        <RenderLabButton type="submit" variant="gradient" size="lg" disabled={status === "loading"}>
          {status === "loading" ? "..." : "Get Early Access"}
        </RenderLabButton>
      </form>

      {/* Status Message */}
      {message && (
        <p className="text-base font-medium text-white">
          {message}
        </p>
      )}

      {/* Or Try Now */}
      <div className="pt-4">
        <Link href="/workspace" className="text-gray-400 hover:text-white transition-colors">
          Or <span className="underline">try it now</span> with 5 free renders
        </Link>
      </div>
    </div>
  );
};
