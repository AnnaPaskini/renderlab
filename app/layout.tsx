import { cn } from "@/lib/utils";
import { GeistSans } from "geist/font/sans";
import { ThemeProvider } from "next-themes";
import { ViewTransitions } from "next-view-transitions";
import { headers } from "next/headers";
import "./globals.css";

import { HistoryErrorBoundary } from "@/app/providers/HistoryErrorBoundary";
import { MainNavbar } from '@/components/layout/MainNavbar';
import { NavBar } from "@/components/navbar";
import { SupabaseAuthProvider } from "@/components/providers/SupabaseAuthProvider";
import { Toaster } from "@/components/ui/sonner";
import { HistoryProvider } from "@/lib/context/HistoryContext";
import { WorkspaceProvider } from "@/lib/context/WorkspaceContext";
import { toastConfig } from "@/lib/toast-config";



export const metadata = {
  title: "Everything AI",
  description: "Everything AI platform built on RenderLab template",
  openGraph: {
    images: ["https://ai-saas-template-aceternity.vercel.app/banner.png"],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const showNavbar =
    pathname === "/" ||
    pathname.startsWith("/pricing") ||
    pathname.startsWith("/blog") ||
    pathname.startsWith("/contact");

  const showMainNavbar =
    pathname.startsWith("/workspace") ||
    pathname.startsWith("/custom") ||
    pathname.startsWith("/prompts") ||
    pathname.startsWith("/history") ||
    pathname.startsWith("/account");

  console.log('🔍 [Layout Debug] Current pathname:', pathname);
  console.log('🔍 [Layout Debug] showMainNavbar:', showMainNavbar);
  console.log('🔍 [Layout Debug] showNavbar:', showNavbar);

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={cn(
          GeistSans.className,
          "dark antialiased"
        )}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
          forcedTheme="dark"
        >
          <ViewTransitions>
            <SupabaseAuthProvider>
              <HistoryErrorBoundary>
                <HistoryProvider>
                  <WorkspaceProvider>
                    {showNavbar && <NavBar />}
                    {showMainNavbar && <MainNavbar />}
                    {children}
                    <Toaster
                      position="bottom-right"
                      toastOptions={toastConfig}
                    />
                  </WorkspaceProvider>
                </HistoryProvider>
              </HistoryErrorBoundary>
            </SupabaseAuthProvider>
          </ViewTransitions>
        </ThemeProvider>
      </body>
    </html>
  );
}