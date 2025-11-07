import "./globals.css";
import { GeistSans } from "geist/font/sans";
import { cn } from "@/lib/utils";
import { ViewTransitions } from "next-view-transitions";
import { headers } from "next/headers";

import { SupabaseAuthProvider } from "@/components/providers/SupabaseAuthProvider";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { NavBar } from "@/components/navbar";

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

  return (
    <ViewTransitions>
      <html lang="en" suppressHydrationWarning>
        <body
          className={cn(
            GeistSans.className,
            "bg-white dark:bg-black antialiased min-h-screen"
          )}
        >
          <ThemeProvider
            attribute="class"
            enableSystem
            disableTransitionOnChange
            defaultTheme="dark"
          >
            <SupabaseAuthProvider>
              {showNavbar && <NavBar />}
              {children}
              <Toaster 
                position="bottom-right"
                toastOptions={{
                  style: {
                    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    borderRadius: '12px',
                    padding: '16px',
                  },
                }}
              />
            </SupabaseAuthProvider>
          </ThemeProvider>
        </body>
      </html>
    </ViewTransitions>
  );
}