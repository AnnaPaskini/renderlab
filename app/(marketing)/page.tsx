import { Container } from "@/components/container";
import { Hero } from "@/components/hero-renderlab";
import { BeforeAfterShowcase } from "@/components/before-after-showcase";
import { HowItWorks } from "@/components/how-it-works";
import { Background } from "@/components/background";
import { Features } from "@/components/features";
import { Companies } from "@/components/companies";
import { GridFeatures } from "@/components/grid-features";
import { Testimonials } from "@/components/testimonials";
import { CTA } from "@/components/cta";
import { PricingRenderLab } from "@/components/pricing-renderlab";



export default function Home() {
  return (
    <div className="relative bg-white dark:bg-gray-900 overflow-hidden">
      <Container className="flex min-h-screen flex-col items-center">
  <Hero />
  <BeforeAfterShowcase />
  <Companies />
  <HowItWorks />
  <PricingRenderLab />
  <Features />
  <GridFeatures />
  <Testimonials />
  <CTA />
</Container>
      <div className="relative">
        <div className="absolute inset-0 h-full w-full overflow-hidden">
          <Background />
        </div>
        <CTA />
      </div>
    </div>
  );
}
