import "../globals.css";
import { Inter } from "next/font/google";
import ThemeProvider from "@/components/providers/theme-provider";
import SupabaseAuthProvider from "@/components/providers/supabase-auth-provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "RenderLab",
  description: "AI-powered creative workspace",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans bg-background text-foreground antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SupabaseAuthProvider>{children}</SupabaseAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
