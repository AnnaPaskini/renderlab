import {
  IconAdjustmentsBolt,
  IconCloud,
  IconCurrencyDollar,
  IconEaseInOut,
  IconHeart,
  IconHelp,
  IconRouteAltLeft,
  IconTerminal2,
} from "@tabler/icons-react";

export const GridFeatures = () => {
  const features = [
    {
      title: "AI-Powered Rendering",
      description:
        "Transform architectural renders with intelligent AI that understands design principles and spatial relationships.",
      icon: <IconTerminal2 className="w-6 h-6 text-white" />,
    },
    {
      title: "Template Collections",
      description:
        "Access professionally curated template libraries designed specifically for architectural visualization workflows.",
      icon: <IconEaseInOut className="w-6 h-6 text-white" />,
    },
    {
      title: "Batch Processing",
      description:
        "Process multiple renders simultaneously with automated quality optimization and consistent styling.",
      icon: <IconCurrencyDollar className="w-6 h-6 text-white" />,
    },
    {
      title: "Cloud Integration",
      description:
        "Seamlessly integrate with your existing cloud storage and project management tools for streamlined workflows.",
      icon: <IconCloud className="w-6 h-6 text-white" />,
    },
    {
      title: "Real-time Collaboration",
      description:
        "Work together with your team in real-time, sharing feedback and iterations instantly across projects.",
      icon: <IconRouteAltLeft className="w-6 h-6 text-white" />,
    },
    {
      title: "Expert Support",
      description:
        "Get dedicated support from architectural visualization specialists who understand your unique challenges.",
      icon: <IconHelp className="w-6 h-6 text-white" />,
    },
    {
      title: "Quality Assurance",
      description:
        "Automated quality checks ensure every render meets professional standards before final delivery.",
      icon: <IconAdjustmentsBolt className="w-6 h-6 text-white" />,
    },
    {
      title: "Version Control",
      description:
        "Track changes, maintain revision history, and easily rollback to previous versions of your renders.",
      icon: <IconHeart className="w-6 h-6 text-white" />,
    },
  ];
  return (
    <section className="relative py-20">
      <div className="absolute inset-0 overflow-hidden opacity-40">
        <div className="absolute inset-0 bg-grid-white/[0.02]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
      </div>

      <div className="relative z-10">
        <div className="text-center mb-20 space-y-6">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="w-12 h-px bg-gradient-to-r from-transparent to-orange-500" />
            <span className="text-orange-500 text-sm tracking-widest uppercase">Features</span>
            <div className="w-12 h-px bg-gradient-to-l from-transparent to-orange-500" />
          </div>

          <h2 className="text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 via-neutral-200 to-neutral-400">
            Everything You Need
          </h2>

          <p className="text-neutral-400 text-lg md:text-xl max-w-2xl mx-auto">
            Powerful tools and features designed specifically for architectural visualization professionals
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Feature key={feature.title} {...feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

const Feature = ({
  title,
  description,
  icon,
  index,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
}) => {
  return (
    <div className="relative bg-[#0c0c0c]/50 border border-white/10 rounded-xl p-6 transition-all duration-300 hover:bg-white/5 group">
      <div className="mb-4 flex justify-center">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2 text-center">
        {title}
      </h3>
      <p className="text-sm text-neutral-400 leading-relaxed text-center">
        {description}
      </p>
    </div>
  );
};
