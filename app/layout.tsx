import "./globals.css";
import { GeistSans } from "geist/font/sans";
import { cn } from "@/lib/utils";
import { ViewTransitions } from "next-view-transitions";
import { headers } from "next/headers";

import { SupabaseAuthProvider } from "@/components/providers/SupabaseAuthProvider";
import { WorkspaceProvider } from "@/lib/context/WorkspaceContext";  // ← Добавили
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { NavBar } from "@/components/navbar";
import { MainNavbar } from '@/components/layout/MainNavbar';
import { toastConfig } from "@/lib/toast-config";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

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
    <ViewTransitions>
      <html lang="en" suppressHydrationWarning>
        <body
          className={cn(
            GeistSans.className,
            "bg-neutral-50 text-neutral-900 antialiased"
          )}
        >
          <ThemeProvider
            attribute="class"
            disableTransitionOnChange
            defaultTheme="light"
          >
            <SupabaseAuthProvider>
              <WorkspaceProvider>  {/* ← Добавили обёртку */}
                {showNavbar && <NavBar />}
                {showMainNavbar && <MainNavbar />}
                {children}
                <Toaster 
                  position="bottom-right"
                  toastOptions={toastConfig}
                />
              </WorkspaceProvider>  {/* ← Закрыли */}
            </SupabaseAuthProvider>
          </ThemeProvider>
        </body>
      </html>
    </ViewTransitions>
  );
}