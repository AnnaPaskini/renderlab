"use client";

import { Companies } from "@/components/companies";
import { Container } from "@/components/container";
import { CTA } from "@/components/cta";
import { GridFeatures } from "@/components/grid-features";
import { Testimonials } from "@/components/testimonials";
import { AvatarCircles } from "@/components/ui/avatar-circles";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { HeroParallax } from "@/components/ui/hero-parallax";
import { ParallaxScroll } from "@/components/ui/parallax-scroll";
import { Spotlight } from "@/components/ui/spotlight";

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
    <div className="relative bg-transparent">
      {/* Global Grid Pattern - REMOVED */}

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
        className="relative w-full py-18 -mt-18"
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

      {/* Features Grid */}
      <GridFeatures />

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
              Professional Templates & Prompts
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

          <div className="flex flex-col items-center gap-3 mb-12">
            <AvatarCircles
              avatarUrls={[
                "https://i.pravatar.cc/150?img=1",
                "https://i.pravatar.cc/150?img=2",
                "https://i.pravatar.cc/150?img=3",
                "https://i.pravatar.cc/150?img=4",
                "https://i.pravatar.cc/150?img=5",
                "https://i.pravatar.cc/150?img=6",
                "https://i.pravatar.cc/150?img=7",
                "https://i.pravatar.cc/150?img=8",
              ]}
            />
            <p className="text-sm text-neutral-400">
              Trusted by Founders and Entrepreneurs from all over the world
            </p>
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
