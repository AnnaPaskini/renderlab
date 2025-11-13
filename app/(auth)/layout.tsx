import SupabaseAuthProvider from "@/components/providers/supabase-auth-provider";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "RenderLab",
  description: "AI image generation workspace",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${inter.variable} font-sans bg-background text-foreground antialiased min-h-screen dark`}>
      <SupabaseAuthProvider>{children}</SupabaseAuthProvider>
    </div>
  );
}
