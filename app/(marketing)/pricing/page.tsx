import { PricingCard } from "@/components/pricing/PricingCard";
import { ArrowUp, Layers, Sparkles, Zap } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing - RenderLab",
  description:
    "RenderLab is an AI-powered image generation platform that helps creators, businesses, and developers bring their ideas to life. Generate stunning images, edit photos, and create visual content with advanced AI technology.",
  openGraph: {
    images: [],
  },
};

export default function PricingPage() {
  return (
    <div className="bg-grid min-h-screen w-full px-6 pt-28 pb-24">
      <div className="max-w-5xl mx-auto text-center mt-24">
        <h1 className="text-5xl md:text-6xl font-semibold text-white mb-4">
          Pay only for what you use
        </h1>

        <p className="text-xl text-[var(--rl-text-secondary)] max-w-2xl mx-auto mb-16">
          Transparent per-image pricing. No subscriptions. No commitments. You stay in control.
        </p>

        {/* === FAST & EFFICIENT === */}
        <div className="text-left">
          <h2 className="text-xl font-semibold text-white">Fast & Efficient</h2>
          <p className="text-[var(--rl-text-secondary)] text-sm mb-6">
            Balanced quality & speed
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PricingCard
              icon={<Zap size={18} className="text-orange-400" />}
              title="Nano Banana"
              subtitle="Fast, high quality"
              price="$0.04"
            />

            <PricingCard
              icon={<Sparkles size={18} className="text-orange-400" />}
              title="Seedream"
              subtitle="Creative styles"
              price="$0.03"
            />

            <PricingCard
              icon={<Layers size={18} className="text-orange-400" />}
              title="Flux Kontext"
              subtitle="Context-aware edits"
              price="$0.04"
            />

            <PricingCard
              icon={<ArrowUp size={18} className="text-orange-400" />}
              title="Upscale"
              subtitle="4× resolution"
              price="$0.02"
            />
          </div>
        </div>

        <div className="w-full h-0.5 bg-white/20 my-16" />

        {/* === UPSCALERS === */}
        <div className="text-left">
          <h2 className="text-xl font-semibold text-white">Upscalers</h2>
          <p className="text-[var(--rl-text-secondary)] text-sm mb-6">
            High-fidelity enhancement
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PricingCard
              icon={<ArrowUp size={18} className="text-orange-400" />}
              title="Real_ESRGAN"
              subtitle="4× resolution"
              price="$0.04"
            />

            <PricingCard
              icon={<ArrowUp size={18} className="text-orange-400" />}
              title="Google Upscale"
              subtitle="AI-guided enhancement"
              price="$0.04"
            />

            <PricingCard
              icon={<ArrowUp size={18} className="text-orange-400" />}
              title="Recraft Crisp"
              subtitle="Maximum sharpness"
              price="$0.06"
            />
          </div>
        </div>

        <div className="w-full h-0.5 bg-white/20 my-16" />

        {/* === PRO MODELS === */}
        <div className="text-left">
          <h2 className="text-xl font-semibold text-white">Pro Models</h2>
          <p className="text-[var(--rl-text-secondary)] text-sm mb-6">
            Best-in-class fidelity
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PricingCard
              icon={<Zap size={18} className="text-orange-400" />}
              title="Nano Banana Pro"
              subtitle="Premium quality"
              price="$0.30"
            />

            <PricingCard
              icon={<Layers size={18} className="text-orange-400" />}
              title="Flux Pro"
              subtitle="Best-in-class"
              price="$0.40"
            />
          </div>
        </div>

        {/* CTA */}
        <Link href="/signup">
          <button className="premium-generate-button px-6 py-3 mx-auto mt-20">
            Start Creating
          </button>
        </Link>
      </div>
    </div>
  );
}
