"use client";
import { motion } from "framer-motion";
import { Code2, Layers, Palette, Sparkles } from "lucide-react";

const features = [
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: "AI-Driven Creativity",
    desc: "Generate, remix, and refine visuals using adaptive AI tuned for illustrators and designers.",
  },
  {
    icon: <Layers className="w-6 h-6" />,
    title: "Unified Workspace",
    desc: "Manage prompts, collections, and history in one place with seamless editing.",
  },
  {
    icon: <Palette className="w-6 h-6" />,
    title: "Theme Consistency",
    desc: "Every component follows your color tokens for total visual harmony.",
  },
  {
    icon: <Code2 className="w-6 h-6" />,
    title: "Developer Friendly",
    desc: "Built with React + Tailwind + Framer Motion for clean extensibility.",
  },
];

export function FeatureGrid() {
  return (
    <section className="py-24 bg-[var(--rl-surface)] text-[var(--rl-text)] relative overflow-hidden">
      {/* Subtle background pattern */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle, var(--rl-accent) 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }}
      />
      
      <div className="max-w-6xl mx-auto px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-semibold mb-4">
            Why RenderLab
          </h2>
          <p className="text-[var(--rl-text-secondary)] text-lg max-w-2xl mx-auto">
            A complete creative platform designed for modern visual workflows
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group rounded-2xl p-6 border border-[var(--rl-border)] bg-[var(--rl-bg)] shadow-sm hover:shadow-lg hover:border-[var(--rl-accent)] transition-all duration-300"
            >
              <div className="mb-4 flex justify-center">
                <div className="p-3 rounded-xl bg-gradient-to-br from-[var(--rl-accent)] to-[var(--rl-accent)] opacity-10 group-hover:opacity-20 transition-opacity duration-300">
                  <div className="text-[var(--rl-accent)]">
                    {feature.icon}
                  </div>
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-[var(--rl-text)]">
                {feature.title}
              </h3>
              <p className="text-[var(--rl-text-secondary)] text-sm leading-relaxed">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
