import { cn } from "@/lib/utils";
import { GeistSans } from "geist/font/sans";
import { ThemeProvider } from "next-themes";
import { ViewTransitions } from "next-view-transitions";
import { headers } from "next/headers";
import "./components-primitives.css"; // 2. Base components
import "./design-tokens.css"; // 1. Tokens FIRST
import "./globals.css"; // 3. Global styles
import "./renderlab-theme.css"; // 4. Custom overrides

import { LayoutContent } from "@/components/layout/LayoutContent";
import { NavbarWrapper } from "@/components/navbar/NavbarWrapper";
import { SupabaseAuthProvider } from "@/components/providers/SupabaseAuthProvider";
import { Toaster } from "@/components/ui/sonner";
import { WorkspaceProvider } from "@/lib/context/WorkspaceContext";
import { toastConfig } from "@/lib/toast-config";



export const metadata = {
  title: "RenderLab",
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
  const pathname = headersList.get("x-pathname") ?? "/";

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={cn(
          GeistSans.className,
          "dark antialiased bg-grid"
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
              <WorkspaceProvider>
                <NavbarWrapper />
                <LayoutContent>
                  {children}
                </LayoutContent>
                <Toaster
                  position="bottom-right"
                  toastOptions={toastConfig}
                />
              </WorkspaceProvider>
            </SupabaseAuthProvider>
          </ViewTransitions>
        </ThemeProvider>
      </body>
    </html>
  );
}