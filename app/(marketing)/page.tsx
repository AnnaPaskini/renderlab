"use client";

import { Companies } from "@/components/companies";
import { Container } from "@/components/container";
import { CTA } from "@/components/cta";
import { Testimonials } from "@/components/testimonials";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { HeroParallax } from "@/components/ui/hero-parallax";
import { ParallaxScroll } from "@/components/ui/parallax-scroll";
import { Spotlight } from "@/components/ui/spotlight";
import { IconDownload, IconPalette, IconUpload } from "@tabler/icons-react";

export default function Home() {
  // Hero Parallax - NUMBERED system (easy to swap!)
  const renderExamples = [
    {
      title: "Architectural Render 1",
      link: "/workspace",
      thumbnail: "/renders/1.jpg",
    },
    {
      title: "Architectural Render 2",
      link: "/workspace",
      thumbnail: "/renders/2.jpg",
    },
    {
      title: "Architectural Render 3",
      link: "/workspace",
      thumbnail: "/renders/3.jpg",
    },
    {
      title: "Architectural Render 4",
      link: "/workspace",
      thumbnail: "/renders/4.jpg",
    },
    {
      title: "Architectural Render 5",
      link: "/workspace",
      thumbnail: "/renders/5.jpg",
    },
    {
      title: "Architectural Render 6",
      link: "/workspace",
      thumbnail: "/renders/6.jpg",
    },
    {
      title: "Architectural Render 7",
      link: "/workspace",
      thumbnail: "/renders/7.jpg",
    },
    {
      title: "Architectural Render 8",
      link: "/workspace",
      thumbnail: "/renders/8.jpg",
    },
    {
      title: "Architectural Render 9",
      link: "/workspace",
      thumbnail: "/renders/9.jpg",
    },
    {
      title: "Architectural Render 10",
      link: "/workspace",
      thumbnail: "/renders/10.jpg",
    },
    {
      title: "Architectural Render 11",
      link: "/workspace",
      thumbnail: "/renders/11.jpg",
    },
    {
      title: "Architectural Render 12",
      link: "/workspace",
      thumbnail: "/renders/12.jpg",
    },
    {
      title: "Architectural Render 13",
      link: "/workspace",
      thumbnail: "/renders/13.jpg",
    },
    {
      title: "Architectural Render 14",
      link: "/workspace",
      thumbnail: "/renders/14.jpg",
    },
    {
      title: "Architectural Render 15",
      link: "/workspace",
      thumbnail: "/renders/15.jpg",
    },
    {
      title: "Architectural Render 16",
      link: "/workspace",
      thumbnail: "/renders/16.jpg",
    },
    {
      title: "Architectural Render 17",
      link: "/workspace",
      thumbnail: "/renders/17.jpg",
    },
    {
      title: "Architectural Render 18",
      link: "/workspace",
      thumbnail: "/renders/18.jpg",
    },
    {
      title: "Architectural Render 19",
      link: "/workspace",
      thumbnail: "/renders/19.jpg",
    },
  ];

  // How It Works Steps
  const howItWorksSteps = [
    {
      icon: IconUpload,
      title: "Upload Your Render",
      description: "Start by uploading your architectural render or 3D visualization. Supports all major formats including JPG, PNG, and high-resolution files up to 8K."
    },
    {
      icon: IconPalette,
      title: "Choose Your Template",
      description: "Select from professional presets designed specifically for architectural visualization. Adjust lighting, materials, mood, and atmosphere with a single click."
    },
    {
      icon: IconDownload,
      title: "Download & Share",
      description: "Get your enhanced render in seconds. Download in original quality or optimized for web. Share directly with clients or on social media."
    }
  ];

  // Template Gallery - numbered system
  const templateGallery = [
    "/renders/1.jpg",
    "/renders/2.jpg",
    "/renders/3.jpg",
    "/renders/4.jpg",
    "/renders/5.jpg",
    "/renders/6.jpg",
    "/renders/7.jpg",
    "/renders/8.jpg",
    "/renders/9.jpg",
    "/renders/10.jpg",
    "/renders/11.jpg",
    "/renders/12.jpg",
    "/renders/13.jpg",
    "/renders/14.jpg",
    "/renders/15.jpg",
    "/renders/16.jpg",
    "/renders/17.jpg",
    "/renders/18.jpg",
    "/renders/19.jpg",
  ];

  return (
    <div className="relative bg-black">
      {/* Global Grid Pattern */}
      <div className="fixed inset-0 bg-grid-white/[0.02] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,black_100%)] pointer-events-none" />

      {/* Hero Parallax */}
      <section
        className="relative"
        style={{
          minHeight: '160vh',
          background: 'radial-gradient(circle at 50% 20%, rgba(0,80,80,0.25) 0%, rgba(0,0,0,0.95) 60%), linear-gradient(180deg, #050505 0%, #0a0a0a 40%, #000 100%)',
          maskImage: 'linear-gradient(180deg, black 0%, black 85%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(180deg, black 0%, black 85%, transparent 100%)'
        }}
      >
        <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="white" />
        <HeroParallax products={renderExamples} />
      </section>

      {/* Divider */}
      <div className="relative">
        <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-neutral-800 to-transparent" />
      </div>

      {/* Companies */}
      <section
        className="relative w-full py-12 -mt-20"
        style={{
          background: 'radial-gradient(circle at 50% 0%, rgba(0,80,80,0.15) 0%, rgba(0,0,0,1) 70%)'
        }}
      >
        <Companies />
      </section>

      {/* Divider */}
      <div className="relative">
        <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-neutral-800 to-transparent" />
      </div>

      {/* How It Works */}
      <section className="relative py-32">
        <div className="absolute inset-0 overflow-hidden opacity-40">
          <BackgroundBeams />
        </div>
        <div className="absolute inset-0 bg-grid-white/[0.02]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />

        <Container className="relative z-10">
          <div className="text-center mb-20 space-y-6">
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="w-12 h-px bg-gradient-to-r from-transparent to-orange-500" />
              <span className="text-orange-500 text-sm tracking-widest uppercase">Simple Process</span>
              <div className="w-12 h-px bg-gradient-to-l from-transparent to-orange-500" />
            </div>

            <h2 className="text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 via-neutral-200 to-neutral-400">
              How It Works
            </h2>

            <p className="text-neutral-400 text-lg md:text-xl max-w-2xl mx-auto">
              Three simple steps to transform your architectural renders into stunning visualizations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {howItWorksSteps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <div
                  key={index}
                  className="relative bg-[#101014]/80 border border-white/5 rounded-2xl p-10 lg:p-14 shadow-[0_0_40px_rgba(0,0,0,0.35)]"
                >
                  <div className="flex flex-col items-center text-center space-y-6">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md w-fit">
                      <IconComponent size={48} className="text-white" />
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-white font-semibold text-2xl">
                        {step.title}
                      </h3>
                      <p className="text-neutral-300 leading-relaxed text-base max-w-[480px]">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Divider */}
      <div className="relative">
        <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-neutral-800 to-transparent" />
      </div>

      {/* Templates */}
      <section className="relative py-32 bg-gradient-to-b from-black via-neutral-950 to-black">
        <div className="absolute inset-0 bg-dot-white/[0.03]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-orange-500/5 rounded-full blur-[150px]" />

        <Container className="relative z-10">
          <div className="text-center mb-20 space-y-6">
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="w-12 h-px bg-gradient-to-r from-transparent to-orange-500" />
              <span className="text-orange-500 text-sm tracking-widest uppercase">Ready to Use</span>
              <div className="w-12 h-px bg-gradient-to-l from-transparent to-orange-500" />
            </div>

            <h2 className="text-4xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 via-neutral-200 to-neutral-400">
              Professional Templates
            </h2>

            <p className="text-neutral-400 text-lg md:text-xl max-w-2xl mx-auto">
              Choose from dozens of presets designed specifically for architectural visualization professionals
            </p>
          </div>

          <ParallaxScroll images={templateGallery} />
        </Container>
      </section>

      {/* Divider */}
      <div className="relative">
        <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-neutral-800 to-transparent" />
      </div>

      {/* Testimonials */}
      <section className="relative py-32">
        <div className="absolute inset-0 bg-grid-white/[0.02]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-orange-500/5 rounded-full blur-[120px]" />

        <Container className="relative z-10">
          <div className="text-center mb-20 space-y-6">
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="w-12 h-px bg-gradient-to-r from-transparent to-orange-500" />
              <span className="text-orange-500 text-sm tracking-widest uppercase">Testimonials</span>
              <div className="w-12 h-px bg-gradient-to-l from-transparent to-orange-500" />
            </div>

            <h2 className="text-4xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 via-neutral-200 to-neutral-400">
              Loved by Architects
            </h2>
          </div>

          <Testimonials />
        </Container>
      </section>

      {/* Divider */}
      <div className="relative">
        <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-neutral-800 to-transparent" />
      </div>

      {/* CTA */}
      <section className="relative">
        <div className="absolute inset-0 h-full w-full overflow-hidden opacity-50">
          <BackgroundBeams />
        </div>
        <div className="absolute inset-0 bg-dot-white/[0.03]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[800px] bg-orange-500/10 rounded-full blur-[200px]" />

        <div className="relative z-10">
          <CTA />
        </div>
      </section>

      <div className="h-20 bg-gradient-to-t from-black to-transparent" />
    </div>
  );
}
