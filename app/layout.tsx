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
    "bg-neutral-50 text-neutral-900 antialiased"
  )}
>
          <ThemeProvider
            attribute="class"
      
            disableTransitionOnChange
            defaultTheme="light"
          >
            <SupabaseAuthProvider>
              {showNavbar && <NavBar />}
              {children}
              <Toaster 
                position="bottom-right"
                toastOptions={{
                  style: {
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
                    border: '2px solid rgba(168, 85, 247, 0.6)',
                    color: 'white',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    fontSize: '15px',
                    fontWeight: '600',
                    filter: 'drop-shadow(0 0 20px rgba(168, 85, 247, 0.4))',
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