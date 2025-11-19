import { Footer } from "@/components/footer";
import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "RenderLab - AI-Powered Architectural Visualization",
  description:
    "Transform your architectural renders with AI-powered templates. Professional visualization tools for architects and designers. Enhance your renders in seconds.",
  openGraph: {
    images: ["https://renderlab.app/banner.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main>
      {children}
      <Footer />
    </main>
  );
}