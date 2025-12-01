"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[#0a0a0a] relative">
      {/* Purple glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-md">
        {/* Logo */}
        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-8 text-2xl font-bold text-white mx-auto shadow-lg shadow-orange-500/20">
          R
        </div>

        <h1 className="text-3xl font-semibold text-white mb-3">
          Something went wrong
        </h1>

        <p className="text-neutral-400 mb-8 leading-relaxed">
          Your request cannot be completed. This might be a temporary issue.
        </p>

        {/* Links */}
        <div className="flex flex-col gap-4">
          <button
            onClick={() => reset()}
            className="text-white hover:text-orange-400 transition-colors font-medium"
          >
            Try again
          </button>

          <Link
            href="/workspace"
            className="text-neutral-400 hover:text-white transition-colors"
          >
            Back to Workspace
          </Link>
        </div>
      </div>
    </div>
  );
}
