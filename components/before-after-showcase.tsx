"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/button";

export function BeforeAfterShowcase() {
  const cards = [
    {
      title: "Lighting Enhancement",
      desc: "Brighten dark corners and adjust ambient lighting for balanced, realistic visuals.",
    },
    {
      title: "Color Grading",
      desc: "Apply warm or cool tones to align your renders with the project’s mood and brand.",
    },
    {
      title: "Time of Day",
      desc: "Transform daylight scenes into dusk or evening with natural transitions.",
    },
    {
      title: "Material Updates",
      desc: "Quickly change textures, finishes, or reflective surfaces with precision.",
    },
    {
      title: "Background Changes",
      desc: "Swap environments or skyline views without losing realism or lighting accuracy.",
    },
    {
      title: "Professional Polish",
      desc: "Add subtle shadows, reflections, and fine details to finalize your render.",
    },
  ];

  return (
    <section className="py-24 bg-white dark:bg-gray-900 text-center">
      <div className="max-w-6xl mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl md:text-5xl font-semibold mb-4"
        >
          See the transformation
        </motion.h2>

        <p className="text-gray-700 dark:text-gray-300 mb-12">
          From dull to professional. Click any example to see the template in action.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">
          {cards.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-transform transform hover:-translate-y-1"
            >
              {/* Placeholder */}
              <div className="w-full h-40 mb-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-gray-400 text-sm select-none">
                Image placeholder
              </div>

              <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-100">
                {card.title}
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4 text-sm leading-relaxed">
                {card.desc}
              </p>

              <Button variant="outline" className="w-full">
                Try This Template
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

