"use client";

import { Toaster } from "../../components/ui/sonner";
import ThemeProvider from "../../components/providers/theme-provider";
import SupabaseAuthProvider from "../../components/providers/supabase-auth-provider";


import "../globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <SupabaseAuthProvider>
            {children}
            <Toaster position="top-right" richColors closeButton />
          </SupabaseAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

