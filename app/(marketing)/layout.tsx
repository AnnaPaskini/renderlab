import type { Metadata } from "next";
import "../globals.css";
import { GeistSans } from "geist/font/sans";
import { NavBar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "RenderLab",
  description:
    "RenderLab — AI workspace and marketing platform for architects. Generate, edit, and visualize ideas instantly.",
  openGraph: {
    images: ["https://ai-saas-template-aceternity.vercel.app/banner.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div
      className={cn(
        GeistSans.className,
        "bg-neutral-950 text-white overflow-x-hidden"
      )}
    >
      <NavBar />
      <main className="overflow-hidden">{children}</main>
      <Footer />
    </div>
  );
}
