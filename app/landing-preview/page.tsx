'use client';

import { CTASection } from "@/components/landing/CTASection";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { HeroParallax } from "@/components/landing/HeroParallax";
import { RenderLabPanel } from "@/components/panels/RenderLabPanel";
import { RenderLabButton } from "@/components/ui/RenderLabButton";

export default function LandingPreviewPage() {
  return (
    <div className="min-h-screen bg-[var(--rl-bg)] dot-grid">
      {/* Hero Parallax Section */}
      <HeroParallax />

      {/* Feature Grid Section */}
      <FeatureGrid />

      {/* CTA Section */}
      <CTASection />

      {/* Developer Documentation Section */}
      <div className="relative z-20 bg-[var(--rl-surface)] px-4 py-16 border-t border-[var(--rl-border)]">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[var(--rl-text)] mb-3">
              Component Documentation
            </h2>
            <p className="text-[var(--rl-text-secondary)]">
              Technical details about the landing page implementation
            </p>
          </div>

          <RenderLabPanel title="About the Hero Parallax">
            <div className="space-y-4 text-[var(--rl-text-secondary)]">
              <p>
                Scroll up to see the multi-layer parallax effect in action. The hero section features:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Background gradient layer moving at 40% speed</li>
                <li>Dot pattern overlay moving at 20% speed</li>
                <li>Foreground content moving at 10% speed</li>
                <li>Fade-out effect as you scroll down</li>
                <li>Light flare accent for visual depth</li>
                <li>Animated scroll indicator</li>
              </ul>
              <p className="mt-4">
                All colors adapt to the current theme (light/dark mode) using CSS custom properties.
              </p>
            </div>
          </RenderLabPanel>

          <RenderLabPanel title="Implementation Details">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-[var(--rl-text)] mb-2">
                  Performance Optimizations
                </h3>
                <ul className="text-sm text-[var(--rl-text-secondary)] space-y-1 ml-4 list-disc list-inside">
                  <li>GPU-accelerated transforms (translateY)</li>
                  <li>Framer Motion's optimized scroll tracking</li>
                  <li>CSS-based dot pattern (no external image)</li>
                  <li>Pointer-events-none on decorative layers</li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-medium text-[var(--rl-text)] mb-2">
                  Theme Integration
                </h3>
                <ul className="text-sm text-[var(--rl-text-secondary)] space-y-1 ml-4 list-disc list-inside">
                  <li>--rl-bg for background</li>
                  <li>--rl-surface for gradient start</li>
                  <li>--rl-text for heading text</li>
                  <li>--rl-text-secondary for description</li>
                  <li>--rl-accent for light flare and scroll indicator</li>
                  <li>--rl-border for dot pattern and scroll indicator outline</li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-medium text-[var(--rl-text)] mb-2">
                  Responsive Design
                </h3>
                <ul className="text-sm text-[var(--rl-text-secondary)] space-y-1 ml-4 list-disc list-inside">
                  <li>Text scales from 5xl to 7xl on larger screens</li>
                  <li>Horizontal padding on mobile (px-4)</li>
                  <li>Full viewport height (100vh)</li>
                  <li>Centered content at all breakpoints</li>
                </ul>
              </div>
            </div>
          </RenderLabPanel>

          <RenderLabPanel title="Scroll Back Up">
            <div className="text-center py-8">
              <p className="text-[var(--rl-text-secondary)] mb-4">
                Scroll back to the top to experience the parallax effect again
              </p>
              <RenderLabButton
                variant="outline"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                Back to Top
              </RenderLabButton>
            </div>
          </RenderLabPanel>

          {/* Extra content for more scroll */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <RenderLabPanel key={i} variant="floating">
                <h3 className="text-xl font-semibold text-[var(--rl-text)] mb-2">
                  Feature {i}
                </h3>
                <p className="text-[var(--rl-text-secondary)]">
                  Additional content to enable scrolling and demonstrate the parallax effect fully.
                </p>
              </RenderLabPanel>
            ))}
          </div>

          <RenderLabPanel>
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-[var(--rl-text)] mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-[var(--rl-text-secondary)] mb-6">
                Experience the power of RenderLab's unified component system
              </p>
              <div className="flex gap-4 justify-center">
                <RenderLabButton variant="gradient" size="lg">
                  Start Creating
                </RenderLabButton>
                <RenderLabButton variant="outline" size="lg">
                  Learn More
                </RenderLabButton>
              </div>
            </div>
          </RenderLabPanel>
        </div>
      </div>
    </div>
  );
}
