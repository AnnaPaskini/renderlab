
import "../globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ThemeProvider from "@/components/providers/theme-provider";
import SupabaseAuthProvider from "@/components/providers/supabase-auth-provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "RenderLab",
  description: "AI image generation workspace",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${inter.variable} font-sans bg-background text-foreground antialiased min-h-screen`}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <SupabaseAuthProvider>{children}</SupabaseAuthProvider>
      </ThemeProvider>
    </div>
  );
}
