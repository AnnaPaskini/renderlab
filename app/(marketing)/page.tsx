"use client";

import { Companies } from "@/components/companies";
import { Container } from "@/components/container";
import { CTA } from "@/components/cta";
import { GridFeatures } from "@/components/grid-features";
import { Testimonials } from "@/components/testimonials";
import { AvatarCircles } from "@/components/ui/avatar-circles";
import { HeroParallax } from "@/components/ui/hero-parallax";
import { RenderLabButton } from "@/components/ui/RenderLabButton";
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
  const templates = [
    {
      id: 1,
      name: "Modern Minimalist",
      category: "Interior",
      image: "/renders/1.jpg",
      isPopular: true,
    },
    {
      id: 2,
      name: "Urban Exterior",
      category: "Exterior",
      image: "/renders/2.jpg",
      isPopular: true,
    },
    {
      id: 3,
      name: "Scandinavian Living",
      category: "Interior",
      image: "/renders/3.jpg",
      isPopular: false,
    },
    {
      id: 4,
      name: "Glass Facade",
      category: "Commercial",
      image: "/renders/4.jpg",
      isPopular: false,
    },
    {
      id: 5,
      name: "Cozy Bedroom",
      category: "Interior",
      image: "/renders/5.jpg",
      isPopular: true,
    },
    {
      id: 6,
      name: "Modern Villa",
      category: "Residential",
      image: "/renders/6.jpg",
      isPopular: false,
    },
  ];

  return (
    <div className="relative min-h-screen landing-grid">

      <div className="relative z-10">
        {/* Global Grid Pattern - REMOVED */}

        {/* Hero Parallax */}
        <section
          className="relative z-10"
          style={{ minHeight: '140vh' }}
        >
          <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="white" />
          <HeroParallax products={renderExamples} />
        </section>

        {/* Divider - REMOVED for smooth flow */}

        {/* Companies */}
        <section className="relative w-full py-32 -mt-24">
          {/* Smooth gradient backdrop */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent from-10% via-purple-900/5 via-50% to-transparent to-90% pointer-events-none" style={{ transform: 'translateZ(0)', WebkitBackfaceVisibility: 'hidden' }} />
          <div className="relative z-10">
            <Companies />
          </div>
        </section>

        {/* Divider - REMOVED for smooth flow */}

        {/* Features Grid */}
        <div className="relative">
          {/* Smooth gradient backdrop */}
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/4 from-0% via-purple-900/6 via-40% to-purple-900/4 to-100% pointer-events-none" style={{ transform: 'translateZ(0)', WebkitBackfaceVisibility: 'hidden' }} />
          <GridFeatures />
        </div>

        {/* Divider - REMOVED for smooth flow */}

        {/* Templates */}
        <section className="relative py-32">
          {/* Smooth gradient backdrop */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent from-0% via-purple-900/5 via-60% to-purple-900/4 to-100% pointer-events-none" style={{ transform: 'translateZ(0)', WebkitBackfaceVisibility: 'hidden' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-orange-500/5 rounded-full blur-[150px]" style={{ transform: 'translate(-50%, -50%) translateZ(0)', WebkitBackfaceVisibility: 'hidden' }} />

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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {templates.map(template => (
                <div
                  key={template.id}
                  className="group relative bg-gray-900/50 border border-white/10 rounded-2xl overflow-hidden hover:border-[var(--rl-accent)]/30 transition-all duration-300 hover:scale-105"
                >
                  {/* Image - BIGGER */}
                  <div className="aspect-[4/3] relative overflow-hidden">
                    <img
                      src={template.image}
                      alt={template.name}
                      className="w-full h-full object-cover"
                    />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-4 left-4 right-4">
                        <RenderLabButton variant="gradient" size="md" className="w-full">
                          Try This Style
                        </RenderLabButton>
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-white">{template.name}</h3>
                    <p className="text-sm text-gray-400 mt-1">{template.category}</p>

                    {/* Badge if popular */}
                    {template.isPopular && (
                      <span className="inline-block mt-2 px-2 py-1 bg-[var(--rl-accent)]/20 text-[var(--rl-accent)] text-xs rounded">
                        Most Popular
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* Divider - REMOVED for premium feel */}

        {/* Testimonials */}
        <section className="relative py-32">
          {/* Smooth gradient backdrop */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent from-10% via-purple-900/5 via-50% to-transparent to-90% pointer-events-none" style={{ transform: 'translateZ(0)', WebkitBackfaceVisibility: 'hidden' }} />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-orange-500/5 rounded-full blur-[120px]" style={{ transform: 'translateX(-50%) translateZ(0)', WebkitBackfaceVisibility: 'hidden' }} />

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

        {/* Divider - REMOVED for premium feel */}

        {/* CTA */}
        <section className="relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[800px] bg-orange-500/10 rounded-full blur-[200px]" style={{ transform: 'translate(-50%, -50%) translateZ(0)', WebkitBackfaceVisibility: 'hidden' }} />

          <div className="relative z-10">
            <CTA />
          </div>
        </section>

        <div className="h-20" />
      </div>
    </div>
  );
}
