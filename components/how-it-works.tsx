"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/button";

export function HowItWorks() {
  const steps = [
    {
      title: "Upload your render",
      desc: "Drag and drop your existing render. The platform automatically analyzes lighting, perspective, and depth.",
    },
    {
      title: "Choose transformation",
      desc: "Select what you want to enhance — lighting, time of day, materials, or overall polish.",
    },
    {
      title: "Generate and download",
      desc: "RenderLab applies AI corrections and delivers a ready-to-use image in seconds.",
    },
  ];

  return (
    <section className="py-24 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl md:text-5xl font-semibold mb-4"
        >
          How it works
        </motion.h2>

        <p className="text-gray-700 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
          Simple workflow. Instant results. No plugins or complex setup required.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="flex flex-col items-center text-center p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm"
            >
              <div className="w-full h-40 mb-6 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-gray-400 text-sm select-none">
                Step {i + 1} placeholder
              </div>

              <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-100">
                {step.title}
              </h3>

              <p className="text-gray-700 dark:text-gray-300 mb-4 text-sm leading-relaxed">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <Button
  variant="outline"
  size="lg"
  className="border-gray-900 text-gray-900 dark:text-white hover:bg-gray-900 dark:hover:bg-gray-800 transition-colors"
>
  Try RenderLab Now
</Button>
        </div>
      </div>
    </section>
  );
}
